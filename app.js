// --- MAP ---
const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// --- ROUTING ---
let waypoints = [];

const router = L.Routing.control({
  waypoints: [],
  router: L.Routing.osrmv1({
    serviceUrl: "https://router.project-osrm.org/route/v1"
  }),
  addWaypoints: false,
  draggableWaypoints: false,
  routeWhileDragging: false,
  show: false,
  lineOptions: {
    styles: [{ color: 'red', weight: 4 }]
  }
}).addTo(map);

// --- ADD WAYPOINT BY TAP ---
map.on('click', e => {
  waypoints.push(L.latLng(e.latlng.lat, e.latlng.lng));
  router.setWaypoints(waypoints);
});

// --- DISTANCE UPDATE ---
router.on('routesfound', e => {
  const route = e.routes[0];
  const km = route.summary.totalDistance / 1000;
  document.getElementById("distance").innerText =
    `Distance: ${km.toFixed(2)} km`;
});

// --- UNDO ---
function undo() {
  if (waypoints.length === 0) return;
  waypoints.pop();
  router.setWaypoints(waypoints);
}

// --- CLEAR ---
function clearRoute() {
  waypoints = [];
  router.setWaypoints([]);
  document.getElementById("distance").innerText =
    "Distance: 0.00 km";
}

// --- GPX EXPORT ---
function exportGPX() {
  const routes = router.getRoutes();
  if (!routes || routes.length === 0) return;

  const coords = routes[0].coordinates;

  let gpx =
`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX-Web-App"
xmlns="http://www.topografix.com/GPX/1/1">
<trk>
  <name>Route</name>
  <trkseg>
`;

  coords.forEach(c => {
    gpx += `    <trkpt lat="${c.lat}" lon="${c.lng}"></trkpt>\n`;
  });

  gpx +=
`  </trkseg>
</trk>
</gpx>`;

  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "route.gpx";
  a.click();

  URL.revokeObjectURL(url);
}
