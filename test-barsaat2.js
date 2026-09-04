fetch("http://localhost:3000/api/search?q=Barsaat")
  .then(r => r.json())
  .then(data => {
    console.log("Top result:", data.data.topResult?.id, data.data.topResult?.title, data.data.topResult?.artist);
  });
