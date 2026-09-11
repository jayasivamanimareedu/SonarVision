from app.services.geotagging import calculate_from_pixel, geotag_detection

METADATA = {
    "ship_latitude": 16.4150,
    "ship_longitude": 81.3700,
    "towfish_heading": 120.0,
    "layback_m": 50.0,
    "towfish_altitude_m": 20.0,
    "sonar_range_m": 100.0,
    "image_width": 1365,
    "image_height": 1024,
    "starboard_is_right": True,
}


def test_location_pipeline_sample():
    geo = calculate_from_pixel(
        ship_lat=METADATA["ship_latitude"],
        ship_lon=METADATA["ship_longitude"],
        towfish_heading=METADATA["towfish_heading"],
        layback_m=METADATA["layback_m"],
        pixel_x=680,
        image_width=METADATA["image_width"],
        sonar_range_m=METADATA["sonar_range_m"],
        starboard_is_right=METADATA["starboard_is_right"],
    )
    assert geo["towfish_latitude"] != METADATA["ship_latitude"]
    assert geo["towfish_longitude"] != METADATA["ship_longitude"]


def test_detection_geotag():
    result = geotag_detection(
        METADATA,
        bbox_x=600 / 1365,
        bbox_y=450 / 1024,
        bbox_w=160 / 1365,
        bbox_h=120 / 1024,
    )
    assert isinstance(result.latitude, float)
    assert isinstance(result.longitude, float)
    assert result.bbox_width_px == 160.0
    assert result.bbox_height_px == 120.0
