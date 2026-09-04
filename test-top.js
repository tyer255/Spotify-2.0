fetch("http://localhost:3000/api/search?q=Barsaat")
  .then(r => r.json())
  .then(data => {
    console.log("topResult:", JSON.stringify(data.data.topResult, null, 2));
  });
