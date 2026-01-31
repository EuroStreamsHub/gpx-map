const API_KEY = 'bab71613-334e-47a1-8d70-135070dabc0e';

// Initialize Map
const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap'
}).addTo(map);

// Data structure: Each "leg" is an array of coords from one click to the next
let legs = []; 
let polyline = L.polyline([], { color: '#ff4400', weight: 5, opacity: 0.8 }).addTo(map);

map.on('click', async (e) => {
  const newPoint = e.latlng;
  const lastLeg = legs[legs.length - 1];
  const lastPoint = lastLeg ? lastLeg[lastLeg.length - 1] : null;

  if (lastPoint) {
    // Using 'hike' profile for superior forest path snapping
    const url = `https://graphhopper.com/api/1/route?point=${lastPoint[0]},${lastPoint[1]}&point=${newPoint.lat},${newPoint.lng}&profile=hike&locale=en&points_encoded=false&key=${API_KEY}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.paths && data.paths.length > 0) {
        // Map GeoJSON [lng, lat] to Leaflet [lat, lng]
        const pathCoords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);
        legs.push(pathCoords);
      } else {
        throw new Error("No path");
      }
    } catch (err) {
      // Fallback to straight line if API fails or no path found
      legs.push([[lastPoint[0], lastPoint[1]], [newPoint.lat, newPoint.lng]]);
    }
  } else {
    // First point clicked
    legs.push([[newPoint.lat, newPoint.lng]]);
  }

  updateUI();
});

function updateUI() {
  const allCoords = legs.flat();
  polyline.setLatLngs(allCoords);
  
  // Calculate total distance from coordinates
  let totalMeters = 0;
  for (let i = 1; i < allCoords.length; i++) {
    totalMeters += L.latLng(allCoords[i-1]).distanceTo(L.latLng(allCoords[i]));
  }
  document.getElementById("distance").innerText = `${(totalMeters / 1000).toFixed(2)} km`;
}

function undo() {
  legs.pop();
  updateUI();
}

function clearRoute() {
  legs = [];
  updateUI();
}

function exportGPX() {
  const allCoords = legs.flat();
  if (allCoords.length < 2) return alert("Plot a route first!");

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="HikePlanner" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Planned Hike</name>
    <trkseg>`;

  allCoords.forEach(c => {
    gpx += `\n      <trkpt lat="${c[0].toFixed(6)}" lon="${c[1].toFixed(6)}"></trkpt>`;
  });

  gpx += `\n    </trkseg>
  </trk>
</gpx>`;

  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my-hike.gpx";
  a.click();
}
