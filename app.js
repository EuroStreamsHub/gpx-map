const API_KEY = 'bab71613-334e-47a1-8d70-135070dabc0e';

map.on('click', async (e) => {
  const newPoint = e.latlng;
  const lastLeg = legs[legs.length - 1];
  const lastPoint = lastLeg ? lastLeg[lastLeg.length - 1] : null;

  if (lastPoint) {
    // We use the POST /route endpoint for Custom Model control
    const url = `https://graphhopper.com/api/1/route?key=${API_KEY}`;
    
    const body = {
      "points": [
        [lastPoint[1], lastPoint[0]], // [lng, lat]
        [newPoint.lng, newPoint.lat]
      ],
      "profile": "hike", // Essential for footpath priority
      "elevation": true,
      "points_encoded": false,
      "snap_preventions": ["motorway", "trunk", "tunnel"],
      "custom_model": {
        "priority": [
          // This logic forces the line to "magnetize" to footpaths/tracks
          { "if": "road_class == FOOTWAY || road_class == PATH || road_class == TRACK", "multiply_by": "2.0" }
        ]
      }
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.paths && data.paths.length > 0) {
        // Successful snap: Convert [lng, lat] to Leaflet [lat, lng]
        const pathCoords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);
        legs.push(pathCoords);
      } else {
        throw new Error("No path found");
      }
    } catch (err) {
      // Fallback: Straight line if the trail isn't in the database
      legs.push([[lastPoint[0], lastPoint[1]], [newPoint.lat, newPoint.lng]]);
    }
  } else {
    // Start of the route
    legs.push([[newPoint.lat, newPoint.lng]]);
  }
  updateUI();
});
