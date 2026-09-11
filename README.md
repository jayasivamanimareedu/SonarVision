# DRISHTI — Marine Debris & Anomaly Detection

AI-powered automated underwater marine debris and anomaly detection from
**Side-Scan Sonar (SSS)** imagery. SIH 2026 prototype — Problem Statement **260057**.

> **Prototype scope:** No trained ML model is included. All detections shown are
> **simulated placeholders** produced by a mock detector so the full pipeline
> (upload → detect → store → visualize → analyze) can be demonstrated. The
> backend is designed so a real YOLO model plugs in by implementing a single
> class — no frontend or API changes required. This prototype makes **no claims
> about real-world detection accuracy**.

## Architecture

Frontend and backend are fully separate and communicate over a documented REST API.

```
.
├── app/                       # Next.js frontend (React + Tailwind) — the v0 preview target
│   ├── layout.tsx             # Root layout, fonts, theme, app shell
│   ├── page.tsx               # Dashboard
│   ├── analysis/page.tsx      # Sonar Image Analysis (upload + bounding-box overlay)
│   ├── detections/page.tsx    # Detection Results (filter by class / confidence)
│   ├── history/page.tsx       # Scan History (list)
│   ├── history/[id]/page.tsx  # Scan detail with overlay
│   ├── analytics/page.tsx     # Analytics (charts)
│   └── settings/page.tsx      # Settings / configuration
│
├── components/                # Reusable UI (app shell, cards, overlay, charts, badges)
├── lib/
│   ├── types.ts               # Shared types mirroring the backend contract
│   ├── api-client.ts          # Backend-first client with mock fallback
│   ├── mock-data.ts           # Simulated dataset (preview fallback)
│   └── nav.ts                 # Sidebar navigation config
│
└── backend/                   # FastAPI backend (runs locally; not in the v0 preview)
    ├── requirements.txt
    ├── .env.example
    └── app/
        ├── main.py            # FastAPI app entry point
        ├── config.py          # Settings + the detector_backend switch
        ├── database.py        # SQLAlchemy engine/session (SQLite)
        ├── models.py          # ORM models: Scan, Detection
        ├── schemas.py         # Pydantic API contract
        ├── seed.py            # Seed simulated scans/detections
        ├── routers/           # health, scans, detections, analytics
        └── services/
            ├── detector.py        # AbstractDetector + get_detector() factory
            ├── mock_detector.py   # MockDetector (active)
            └── yolo_detector.py   # YoloDetector (documented stub — plug in here)
```

### The pluggable detector (key design)

`services/detector.py` defines `AbstractDetector`, and `get_detector()` returns
either the mock or the YOLO detector based on one config flag. Every detector
returns the same `list[DetectionResult]`, so nothing downstream changes when you
swap implementations.

### Survey metadata + geolocation pipeline

The backend accepts the sonar image and a survey metadata `.json` file in the
same `POST /api/scans` multipart request. The supplied location prototype is
integrated into `backend/app/services/geotagging.py`.

For every detector result, the backend:
1. takes the detector's internal normalized bounding box,
2. calculates the detection center pixel,
3. calculates towfish position from ship position + layback,
4. converts the center pixel to port/starboard across-track distance,
5. calculates the target latitude/longitude,
6. stores latitude, longitude, and bounding-box width/height in pixels.

Numeric `x/y` bounding-box coordinates remain internal. The frontend uses them
only to draw the annotated image; the Detection Brief cards show classification,
confidence, latitude, and longitude. JSON/CSV exports also include bounding-box
width and height.

Because the supplied metadata does not include ping spacing, vessel speed, or
per-ping navigation, the current calculation does not claim an along-track
position from the image's vertical coordinate.

## Running the frontend (v0 preview)

The Next.js app runs on its own and, when no backend is configured, falls back
to a built-in simulated dataset so every page renders. This is what you see in
the v0 preview. Nothing to configure.

## Running the full stack locally

### 1. Backend (FastAPI + SQLite)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed          # optional: seed simulated scans
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend (point it at the backend)

Set the API base URL so the frontend calls FastAPI instead of using mock data:

```bash
# .env.local at the project root
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Then run the Next.js dev server. The Dashboard, Analytics, History, and
Detection pages now show a **Live API** badge instead of **Simulated Data**.

## API contract

| Method | Endpoint                  | Purpose                                        |
| ------ | ------------------------- | ---------------------------------------------- |
| GET    | `/health`                 | Service + active detector status               |
| POST   | `/api/scans`              | Upload an SSS image, run detection, persist    |
| GET    | `/api/scans`              | List scans with detection counts               |
| GET    | `/api/scans/{id}`         | Scan detail incl. detections + image URL       |
| GET    | `/api/detections`         | List/filter detections (`label`, `min_confidence`) |
| GET    | `/api/analytics/summary`  | Aggregate stats for the Analytics page         |

Bounding boxes are **normalized** (`x, y, w, h` in `0-1`) so the frontend scales
them to any rendered image size.

## Plugging in a real YOLO model (later)

1. Add to `backend/requirements.txt`:
   ```
   ultralytics
   opencv-python-headless
   numpy
   ```
2. Implement `detect()` in `backend/app/services/yolo_detector.py` (a full
   reference implementation is included as comments) and place your trained
   weights at the path in `YOLO_WEIGHTS_PATH`.
3. Set the switch:
   ```
   # backend/.env
   DETECTOR_BACKEND=yolo
   YOLO_WEIGHTS_PATH=weights/drishti_sss.pt
   ```

That's it — routers, schemas, database, and the entire frontend stay unchanged.
Make sure your model's class IDs match `CLASS_MAP` in `services/detector.py`
(`debris`, `anomaly`, `geological`, `unknown`), or update the map to match.

## Tech stack

- **Frontend:** Next.js (React), Tailwind CSS, SWR, Recharts, lucide-react
- **Backend:** FastAPI, SQLAlchemy, SQLite, Pydantic
- **Planned model:** YOLO (Ultralytics) for SSS object detection

## Final detection reporting update

The Detection Output and Detection Results views now use compact per-object
Detection Brief cards. Each card shows detection number, classification,
confidence, and calculated latitude/longitude when survey metadata is present.

JSON and CSV exports include, for every detected hazard:
- classification and class ID
- confidence percentage
- latitude and longitude
- bounding-box width and height in pixels
- normalized bounding-box width and height

The backend geotagging prototype estimates towfish position from ship position,
heading, and layback, then projects the horizontal side-scan detection offset to
port/starboard. Coordinate decimal precision must not be confused with survey
accuracy; real-world accuracy depends on navigation and sonar calibration.

## Real YOLO + Geolocation Backend

This project now includes the supplied trained model at `backend/weights/drishti_sss.pt`.
The backend uses the Ultralytics YOLO11s model, then sends each model bounding box through the integrated side-scan-sonar geolocation calculation.

### Backend setup

From the `backend` directory:

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The default detector is now `yolo`. To use the UI mock detector temporarily, set `DETECTOR_BACKEND=mock` in `backend/.env`.

### Frontend setup

In the project root, create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Then run:

```bash
npm.cmd install
npm.cmd run dev
```

### Upload contract

The Analysis page sends both the sonar image and survey metadata JSON to `POST /api/scans`.
The metadata JSON must contain:

- `ship_latitude`
- `ship_longitude`
- `towfish_heading`
- `layback_m`
- `towfish_altitude_m`
- `sonar_range_m`
- `image_width`
- `image_height`
- `starboard_is_right`

The trained model's classes are read directly from the model. The supplied checkpoint contains: `Crab-Pot`, `Piper`, `Shipwreck`, and `Mine/Cylinder`.
