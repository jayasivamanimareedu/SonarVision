"""Side-scan-sonar geolocation utilities integrated from the location prototype.

The calculation follows the uploaded location prototype:
1. ship position + layback -> towfish position,
2. detection center pixel -> across-track distance,
3. towfish position + port/starboard offset -> target GPS point.

For a conventional towfish layback, the towfish is placed behind the vessel
track, so the layback bearing is heading + 180 degrees. The vertical image
coordinate is not converted to along-track distance because the supplied
metadata does not include ping spacing, vessel speed, or per-ping navigation.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from numbers import Real

EARTH_RADIUS_M = 6_371_008.8

REQUIRED_METADATA = {
    "ship_latitude",
    "ship_longitude",
    "towfish_heading",
    "layback_m",
    "towfish_altitude_m",
    "sonar_range_m",
    "image_width",
    "image_height",
    "starboard_is_right",
}


@dataclass(frozen=True)
class GeotagResult:
    latitude: float
    longitude: float
    bbox_width_px: float
    bbox_height_px: float


def _number(metadata: dict, key: str) -> float:
    value = metadata[key]
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"Metadata field '{key}' must be numeric.")
    value = float(value)
    if not math.isfinite(value):
        raise ValueError(f"Metadata field '{key}' must be finite.")
    return value


def validate_metadata(metadata: object) -> dict:
    """Validate the metadata contract used by the integrated location module."""
    if not isinstance(metadata, dict):
        raise ValueError("Metadata JSON must contain an object.")

    missing = sorted(REQUIRED_METADATA - set(metadata))
    if missing:
        raise ValueError(
            "Metadata JSON missing required fields: " + ", ".join(missing)
        )

    for key in REQUIRED_METADATA - {"starboard_is_right"}:
        _number(metadata, key)

    if not isinstance(metadata["starboard_is_right"], bool):
        raise ValueError("Metadata field 'starboard_is_right' must be true or false.")

    latitude = _number(metadata, "ship_latitude")
    longitude = _number(metadata, "ship_longitude")
    if not -90 <= latitude <= 90:
        raise ValueError("ship_latitude must be between -90 and 90.")
    if not -180 <= longitude <= 180:
        raise ValueError("ship_longitude must be between -180 and 180.")

    if _number(metadata, "layback_m") < 0:
        raise ValueError("layback_m cannot be negative.")
    if _number(metadata, "towfish_altitude_m") < 0:
        raise ValueError("towfish_altitude_m cannot be negative.")
    if _number(metadata, "sonar_range_m") < 0:
        raise ValueError("sonar_range_m cannot be negative.")
    if _number(metadata, "image_width") <= 0 or _number(metadata, "image_height") <= 0:
        raise ValueError("image_width and image_height must be greater than zero.")

    return metadata


# ---------------------------------------------------------------------------
# Integrated from location/geospatial/coordinates.py
# ---------------------------------------------------------------------------

def destination_point(
    latitude: float,
    longitude: float,
    distance_m: float,
    bearing_deg: float,
) -> tuple[float, float]:
    """Calculate a destination GPS point on a spherical Earth."""
    if distance_m == 0:
        return latitude, longitude

    lat1 = math.radians(latitude)
    lon1 = math.radians(longitude)
    bearing = math.radians(bearing_deg % 360.0)
    angular_distance = distance_m / EARTH_RADIUS_M

    lat2 = math.asin(
        math.sin(lat1) * math.cos(angular_distance)
        + math.cos(lat1)
        * math.sin(angular_distance)
        * math.cos(bearing)
    )

    lon2 = lon1 + math.atan2(
        math.sin(bearing) * math.sin(angular_distance) * math.cos(lat1),
        math.cos(angular_distance) - math.sin(lat1) * math.sin(lat2),
    )

    return math.degrees(lat2), ((math.degrees(lon2) + 540.0) % 360.0) - 180.0


def calculate_towfish_position(
    ship_lat: float,
    ship_lon: float,
    towfish_heading: float,
    layback_m: float,
) -> tuple[float, float]:
    """Calculate towfish position behind the vessel along the survey track."""
    return destination_point(
        ship_lat,
        ship_lon,
        max(0.0, layback_m),
        towfish_heading + 180.0,
    )


def calculate_target_position(
    towfish_lat: float,
    towfish_lon: float,
    towfish_heading: float,
    cross_track_distance_m: float,
) -> tuple[float, float, float]:
    """Calculate target GPS position to port or starboard of the towfish."""
    target_bearing = (
        towfish_heading + 90.0
        if cross_track_distance_m >= 0
        else towfish_heading - 90.0
    ) % 360.0

    target_lat, target_lon = destination_point(
        towfish_lat,
        towfish_lon,
        abs(cross_track_distance_m),
        target_bearing,
    )
    return target_lat, target_lon, target_bearing


def pixel_to_cross_track(
    pixel_x: float,
    image_width: float,
    sonar_range_m: float,
    starboard_is_right: bool = True,
) -> float:
    """Convert a sonar-image x coordinate to signed across-track distance."""
    image_center = image_width / 2.0
    pixel_offset = pixel_x - image_center
    metres_per_pixel = sonar_range_m / image_center

    cross_track_distance = pixel_offset * metres_per_pixel
    if not starboard_is_right:
        cross_track_distance *= -1.0

    return cross_track_distance


def calculate_from_pixel(
    ship_lat: float,
    ship_lon: float,
    towfish_heading: float,
    layback_m: float,
    pixel_x: float,
    image_width: float,
    sonar_range_m: float,
    starboard_is_right: bool = True,
) -> dict[str, float]:
    """Run the location prototype's complete pixel-to-GPS calculation."""
    towfish_lat, towfish_lon = calculate_towfish_position(
        ship_lat,
        ship_lon,
        towfish_heading,
        layback_m,
    )

    cross_track_distance = pixel_to_cross_track(
        pixel_x,
        image_width,
        sonar_range_m,
        starboard_is_right,
    )

    target_lat, target_lon, target_bearing = calculate_target_position(
        towfish_lat,
        towfish_lon,
        towfish_heading,
        cross_track_distance,
    )

    return {
        "towfish_latitude": towfish_lat,
        "towfish_longitude": towfish_lon,
        "target_latitude": target_lat,
        "target_longitude": target_lon,
        "cross_track_distance_m": cross_track_distance,
        "target_bearing": target_bearing,
    }


def geotag_detection(
    metadata: dict,
    *,
    bbox_x: float,
    bbox_y: float,
    bbox_w: float,
    bbox_h: float,
) -> GeotagResult:
    """Geotag one normalized detector bounding box.

    bbox_x/y/w/h remain internal implementation data and are never exposed as
    user-facing coordinates. Width and height are returned in image pixels for
    the JSON/CSV report.
    """
    validate_metadata(metadata)

    bbox_values = (bbox_x, bbox_y, bbox_w, bbox_h)
    if any(isinstance(v, bool) or not isinstance(v, Real) for v in bbox_values):
        raise ValueError("Detection bounding-box values must be numeric.")
    if not all(math.isfinite(float(v)) for v in bbox_values):
        raise ValueError("Detection bounding-box values must be finite.")

    image_width = _number(metadata, "image_width")
    image_height = _number(metadata, "image_height")
    center_x = min(1.0, max(0.0, float(bbox_x) + float(bbox_w) / 2.0))

    geo = calculate_from_pixel(
        ship_lat=_number(metadata, "ship_latitude"),
        ship_lon=_number(metadata, "ship_longitude"),
        towfish_heading=_number(metadata, "towfish_heading"),
        layback_m=_number(metadata, "layback_m"),
        pixel_x=center_x * image_width,
        image_width=image_width,
        sonar_range_m=_number(metadata, "sonar_range_m"),
        starboard_is_right=metadata["starboard_is_right"],
    )

    # Optional towfish altitude correction: sonar_range_m is treated as slant
    # range, so the horizontal ground range is reduced by towfish altitude.
    altitude_m = _number(metadata, "towfish_altitude_m")
    slant = abs(geo["cross_track_distance_m"])
    ground_range = math.sqrt(max(0.0, slant * slant - altitude_m * altitude_m))

    target_lat, target_lon, _ = calculate_target_position(
        geo["towfish_latitude"],
        geo["towfish_longitude"],
        _number(metadata, "towfish_heading"),
        math.copysign(ground_range, geo["cross_track_distance_m"]),
    )

    return GeotagResult(
        latitude=round(target_lat, 7),
        longitude=round(target_lon, 7),
        bbox_width_px=round(max(0.0, float(bbox_w)) * image_width, 2),
        bbox_height_px=round(max(0.0, float(bbox_h)) * image_height, 2),
    )
