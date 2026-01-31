// =====================
// MAP
// =====================
const map = L.map('map').setView([51.505, -0.09], 13);

// OpenTopoMap – excellent for footpaths / PROWs
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap (CC-BY-SA)'
}).addTo(map);

// =====================
// ROUTING (GraphHopper – FOOT)
// =====================
const GRAPH_HOPPER_KEY = "bab71613-334e-47a1-8d70-135070dabc0e";

let waypoints = [];

const router = L.Routing.control({
  waypoints: [],
  addWaypoints: false,
  draggableWaypoints: false,
  routeWhileDragging: false,
  show: false,

  router: L.Routing.graphHopper(GRAPH_HOPPER_KEY, {
    urlParameters: {
      vehicle: "hike"
    }
  }),

  lineOptions: {
    styles: [{ color: "#c00000", weight: 4 }]
  }
}).addTo(map);

// =====================
// ADD WAYPOINT (TAP)
// =====================
map.on('click', e => {
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
  if (!routes || routes.length === 0) return;

  const coords = routes[0].coordinates;

  let gpx =
`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX-Footpath-Planner"
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
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "route.gpx";
  a.click();

  URL.revokeObjectURL(url);
}
