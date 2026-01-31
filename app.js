// =====================
// CONFIGURATION
// =====================
const API_KEY = 'bab71613-334e-47a1-8d70-135070dabc0e';
const map = L.map('map').setView([53.3807, -1.4702], 13); // Centered on Sheffield

// High-quality Topo Map for seeing footpaths
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap'
}).addTo(map);

// =====================
// DATA STORAGE
// =====================
let legs = []; // Each click creates a "leg" (array of coordinates)
let polyline = L.polyline([], { 
    color: '#3498db', 
    weight: 6, 
    opacity: 0.8,
    lineJoin: 'round' 
}).addTo(map);

// =====================
// CLICK HANDLER (THE SNAPPING MAGIC)
// =====================
map.on('click', async (e) => {
  const newPoint = e.latlng;
  const lastLeg = legs[legs.length - 1];
  const lastPoint = lastLeg ? lastLeg[lastLeg.length - 1] : null;

  if (lastPoint) {
    // Construct the GraphHopper Routing API URL
    // We use points_encoded=false to get the actual Lat/Lng trail coordinates
    const url = `https://graphhopper.com/api/1/route?` + 
                `point=${lastPoint[0]},${lastPoint[1]}&` + 
                `point=${newPoint.lat},${newPoint.lng}&` + 
                `profile=hike&` +  // 'hike' prefers footpaths/woods over roads
                `points_encoded=false&` + 
                `key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.paths && data.paths.length > 0) {
        // This 'points' object contains every tiny twist and turn of the trail
        const pathCoords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);
        legs.push(pathCoords);
        console.log("Snapped to path!");
      } else {
        throw new Error("No trail found");
      }
    } catch (err) {
      // Fallback: If no path exists, draw a straight line
      console.warn("Could not find path, drawing straight line.");
      legs.push([[lastPoint[0], lastPoint[1]], [newPoint.lat, newPoint.lng]]);
    }
  } else {
    // Starting point
    legs.push([[newPoint.lat, newPoint.lng]]);
  }

  render();
});

// =====================
// UI & EXPORT
// =====================
function render() {
  const allPoints = legs.flat();
  polyline.setLatLngs(allPoints);

  // Calculate Distance
  let totalM = 0;
  for (let i = 1; i < allPoints.length; i++) {
    totalM += L.latLng(allPoints[i-1]).distanceTo(L.latLng(allPoints[i]));
  }
  document.getElementById("distance").innerText = `${(totalM / 1000).toFixed(2)} km`;
}

function undo() {
  legs.pop();
  render();
}

function clearRoute() {
  legs = [];
  render();
}

function exportGPX() {
  const allPoints = legs.flat();
  if (allPoints.length < 2) return alert("Add some points first!");

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrailPlanner" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>My Snapped Hike</name>
    <trkseg>`;

  allPoints.forEach(p => {
    gpx += `\n      <trkpt lat="${p[0].toFixed(6)}" lon="${p[1].toFixed(6)}"></trkpt>`;
  });

  gpx += `\n    </trkseg>
  </trk>
</gpx>`;

  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "woods-walk.gpx";
  a.click();
}
