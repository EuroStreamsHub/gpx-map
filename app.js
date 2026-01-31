const API_KEY = 'bab71613-334e-47a1-8d70-135070dabc0e';

// 1. Setup Map - centered on Sheffield/Peak District
const map = L.map('map').setView([53.345, -1.63], 12); 

L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap'
}).addTo(map);

let legs = []; 
let polyline = L.polyline([], { 
    color: '#005f73', 
    weight: 5, 
    opacity: 0.9,
    lineJoin: 'round'
}).addTo(map);

// =====================
// CORE SNAPPING LOGIC
// =====================
map.on('click', async (e) => {
  const newPoint = e.latlng;
  const lastLeg = legs[legs.length - 1];
  const lastPoint = lastLeg ? lastLeg[lastLeg.length - 1] : null;

  if (lastPoint) {
    // OS Maps style URL parameters
    // We add 'snap_prevention' to keep it off motorways
    // We use 'foot' or 'hike' for the woods
    const url = `https://graphhopper.com/api/1/route?` + 
                `point=${lastPoint[0]},${lastPoint[1]}&` + 
                `point=${newPoint.lat},${newPoint.lng}&` + 
                `profile=hike&` + 
                `points_encoded=false&` +
                `ch.disable=true&` + // Critical for flexible snapping
                `snap_prevention=motorway;trunk;primary&` +
                `key=${API_KEY}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.paths && data.paths.length > 0) {
        // GraphHopper [lng, lat] -> Leaflet [lat, lng]
        const pathCoords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);
        legs.push(pathCoords);
      } else {
        // No path found in the network - draw straight line (OS Maps also does this if off-grid)
        legs.push([[lastPoint[0], lastPoint[1]], [newPoint.lat, newPoint.lng]]);
      }
    } catch (err) {
      legs.push([[lastPoint[0], lastPoint[1]], [newPoint.lat, newPoint.lng]]);
    }
  } else {
    // Starting point of the whole route
    legs.push([[newPoint.lat, newPoint.lng]]);
  }

  updateUI();
});

function updateUI() {
  const allCoords = legs.flat();
  polyline.setLatLngs(allCoords);
  
  let totalM = 0;
  for (let i = 1; i < allCoords.length; i++) {
    totalM += L.latLng(allCoords[i-1]).distanceTo(L.latLng(allCoords[i]));
  }
  document.getElementById("distance").innerText = `${(totalM / 1000).toFixed(2)} km`;
}

// =====================
// GPX EXPORT (OS COMPATIBLE)
// =====================
function exportGPX() {
  const allCoords = legs.flat();
  if (allCoords.length < 2) return;

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MyOSPlanner" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Snapped Hike</name><trkseg>`;

  allCoords.forEach(c => {
    gpx += `\n    <trkpt lat="${c[0]}" lon="${c[1]}"></trkpt>`;
  });

  gpx += `\n  </trkseg></trk></gpx>`;

  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "route.gpx";
  a.click();
}

function undo() { legs.pop(); updateUI(); }
function clearRoute() { legs = []; updateUI(); }
