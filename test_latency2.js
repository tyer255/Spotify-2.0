const start = Date.now();
fetch("http://localhost:3000/api/canvas?title=Angaaron&artist=")
  .then(r => r.json())
  .then(d => {
     console.log("Time:", Date.now() - start, "ms");
     console.log("Status:", d.data.status);
  });
