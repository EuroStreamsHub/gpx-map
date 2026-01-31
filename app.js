// =====================
// MAP
// =====================
const map = L.map('map').setView([51.505, -0.09], 13);

// OpenTopoMap – clear footpaths
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap (CC-BY-SA)'
}).addTo(map);

// =====================
// ROUTING (OSRM public server, walking)
// =====================
let waypoints = [];

const router = L.Routing.control({
  waypoints: [],
  router: L.Routing.osrmv1({
    serviceUrl: "https://router.project-osrm.org/route/v1",
    profile: "foot"  // walking mode
  }),
  addWaypoints: false,
  draggableWaypoints: false,
  routeWhileDragging: false,
  show: false,
  lineOptions: {
    styles: [{ color: "#d00000", weight: 4 }]
  }
}).addTo(map);

// =====================
// CLICK TO ADD WAYPOINT
// =====================
map.on('click', e => {
  console.log("Clicked:", e.latlng); // debug
  waypoints.push(L.latLng(e.latlng.lat, e.latlng.lng));
  router.setWaypoints(waypoints);
});

// =====================
// DISTANCE UPDATE
// =====================
router.on('routesfound', e => {
  const route = e.routes[0];
  const km = route.summary.totalDistance / 1000;
  document.getElementById("distance").innerText =
    `Distance: ${km.toFixed(2)} km`;
});

// =====================
// ROUTING ERROR HANDLER
// =====================
router.on('routingerror', e => {
  alert("Routing failed. Path may not exist in OSM.");
  console.error(e);
});

// =====================
// UNDO
// =====================
function undo() {
  if (waypoints.length === 0) return;
  waypoints.pop();
  router.setWaypoints(waypoints);
}

// =====================
// CLEAR
// =====================
function clearRoute() {
  waypoints = [];
  router.setWaypoints([]);
  document.getElementById("distance").innerText =
    "Distance: 0.00 km";
}

// =====================
// GPX EXPORT
// =====================
function exportGPX() {
  const routes = router.getRoutes();
  if (!routes || routes.length === 0) {
    alert("No route to export");
    return;
  }

  const coords = routes[0].coordinates;

  let gpx =
`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX-OSRM-Planner"
xmlns="http://www.topografix.com/GPX/1/1">
<trk>
  <name>Walking Route</name>
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
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "route.gpx";
  a.click();
}
