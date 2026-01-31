const API_KEY = 'bab71613-334e-47a1-8d70-135070dabc0e';
const map = L.map('map').setView([53.3807, -1.4702], 13);

L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap'
}).addTo(map);

let legs = []; 
let polyline = L.polyline([], { color: '#e67e22', weight: 5 }).addTo(map);

map.on('click', async (e) => {
  const newPoint = e.latlng;
  
  if (legs.length > 0) {
    const lastLeg = legs[legs.length - 1];
    const lastPoint = lastLeg[lastLeg.length - 1];

    // UPDATED URL: Using 'foot' as primary, with 'ch.disable' to allow snapping logic
    const url = `https://graphhopper.com/api/1/route?` + 
                `point=${lastPoint[0]},${lastPoint[1]}&` + 
                `point=${newPoint.lat},${newPoint.lng}&` + 
                `profile=foot&` + 
                `points_encoded=false&` +
                `ch.disable=true&` + 
                `key=${API_KEY}`;

    try {
      console.log("Fetching route...");
      const res = await fetch(url);
      const data = await res.json();

      if (data.paths && data.paths.length > 0) {
        // GraphHopper sends [lng, lat] -> We map to [lat, lng]
        const pathCoords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);
        legs.push(pathCoords);
        console.log("Success: Snapped to path");
      } else {
        console.warn("API returned no path. Is the point too far from a road?");
        throw new Error("No path");
      }
    } catch (err) {
      console.error("Routing failed, drawing straight line:", err);
      // This is the "Crow Flies" fallback
      legs.push([[lastPoint[0], lastPoint[1]], [newPoint.lat, newPoint.lng]]);
    }
  } else {
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
