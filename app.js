// =====================
// MAP SETUP
// =====================
const map = L.map('map').setView([51.505, -0.09], 13);

// OpenTopoMap tiles
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap (CC-BY-SA)'
}).addTo(map);

// =====================
// DATA
// =====================
let waypoints = [];      // user clicked points
let routeCoords = [];    // actual coordinates drawn (OSRM or straight)
let polyline = L.polyline([], { color: '#d00000', weight: 4 }).addTo(map);
let totalDistance = 0;

// =====================
// HELPER: distance between two latlngs (meters)
function distanceMeters(latlng1, latlng2) {
  return latlng1.distanceTo(latlng2);
}

// =====================
// CLICK HANDLER
// =====================
map.on('click', async e => {
  const newPoint = e.latlng;
  
  if (waypoints.length > 0) {
    // Try OSRM routing between last point and new point
    const lastPoint = waypoints[waypoints.length - 1];
    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${lastPoint.lng},${lastPoint.lat};${newPoint.lng},${newPoint.lat}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(osrmUrl);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        routeCoords.push(...coords);
        polyline.setLatLngs(routeCoords);
        totalDistance += data.routes[0].distance;
      } else {
        // OSRM failed → straight line
        routeCoords.push(lastPoint, newPoint);
        polyline.setLatLngs(routeCoords);
        totalDistance += distanceMeters(lastPoint, newPoint);
      }
    } catch (err) {
      // Network error → straight line
      routeCoords.push(lastPoint, newPoint);
      polyline.setLatLngs(routeCoords);
      totalDistance += distanceMeters(lastPoint, newPoint);
      console.error("OSRM routing failed, using straight line.", err);
    }
  }

  // Add new point
  waypoints.push(newPoint);

  // Update distance display
  document.getElementById("distance").innerText = `Distance: ${(totalDistance/1000).toFixed(2)} km`;
});

// =====================
// UNDO
// =====================
function undo() {
  if (waypoints.length === 0) return;

  // Remove last segment
  waypoints.pop();

  if (routeCoords.length >= 2) {
    // Remove last segment coordinates
    routeCoords = routeCoords.slice(0, routeCoords.length - 2);
  }

  polyline.setLatLngs(routeCoords);

  // Recalculate total distance
  totalDistance = 0;
  for (let i=1; i<routeCoords.length; i++) {
    totalDistance += distanceMeters(L.latLng(routeCoords[i-1]), L.latLng(routeCoords[i]));
  }

  document.getElementById("distance").innerText = `Distance: ${(totalDistance/1000).toFixed(2)} km`;
}

// =====================
// CLEAR
// =====================
function clearRoute() {
  waypoints = [];
  routeCoords = [];
  polyline.setLatLngs([]);
  totalDistance = 0;
  document.getElementById("distance").innerText = "Distance: 0.00 km";
}

// =====================
// GPX EXPORT
// =====================
function exportGPX() {
  if (routeCoords.length === 0) {
    alert("No route to export");
    return;
  }

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Hybrid-GPX-Planner"
xmlns="http://www.topografix.com/GPX/1/1">
<trk>
  <name>Hybrid Route</name>
  <trkseg>
`;

  routeCoords.forEach(c => {
    gpx += `    <trkpt lat="${c[0]}" lon="${c[1]}"></trkpt>\n`;
  });

  gpx += `  </trkseg>
</trk>
</gpx>`;

  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "route.gpx";
  a.click();
}
