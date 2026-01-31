const API_KEY = 'bab71613-334e-47a1-8d70-135070dabc0e';
const map = L.map('map').setView([53.3807, -1.4702], 13);

L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap'
}).addTo(map);

let legs = []; 
let polyline = L.polyline([], { color: '#ff4400', weight: 5 }).addTo(map);

map.on('click', async (e) => {
  const newPoint = e.latlng; // This is {lat, lng}
  
  if (legs.length > 0) {
    const lastLeg = legs[legs.length - 1];
    const lastPoint = lastLeg[lastLeg.length - 1]; // [lat, lng]

    // Construct URL: Ensure it is lat,lng
    const url = `https://graphhopper.com/api/1/route?` + 
                `point=${lastPoint[0]},${lastPoint[1]}&` + 
                `point=${newPoint.lat},${newPoint.lng}&` + 
                `profile=hike&` + 
                `points_encoded=false&` +
                `snap_prevention=motorway;trunk&` + // Stay off big roads
                `key=${API_KEY}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.paths && data.paths.length > 0) {
        // IMPORTANT: GraphHopper returns [lng, lat]. We must swap to [lat, lng] for Leaflet.
        const pathCoords = data.paths[0].points.coordinates.map(coord => [coord[1], coord[0]]);
        legs.push(pathCoords);
      } else {
        // If API returns OK but no path found, do a straight line
        legs.push([[lastPoint[0], lastPoint[1]], [newPoint.lat, newPoint.lng]]);
      }
    } catch (err) {
      console.error("Routing error:", err);
      legs.push([[lastPoint[0], lastPoint[1]], [newPoint.lat, newPoint.lng]]);
    }
  } else {
    // First point
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

// ... include your Undo, Clear, and ExportGPX functions from before ...
