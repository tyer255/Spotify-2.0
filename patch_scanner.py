import sys

with open("server.ts", "r") as f:
    server_content = f.read()

server_content = server_content.replace('model: "gemini-3.7-flash"', 'model: "gemini-2.5-flash"')

with open("server.ts", "w") as f:
    f.write(server_content)


with open("src/components/Scanner/SpotifyCodeScanner.tsx", "r") as f:
    scanner_content = f.read()

target = """    let scanInterval: ReturnType<typeof setInterval>;

    const captureAndScan = async () => {
      if (!isActive || scanComplete) return;
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        if (canvas) {
          // Scale down to max 800px on the longest side to save bandwidth and latency
          const MAX_SIZE = 800;
          let width = videoRef.current.videoWidth;
          let height = videoRef.current.videoHeight;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG

            try {
              const res = await fetch('/api/scan-spotify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64 })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.ok && data.text && data.text !== 'NOT_FOUND') {
                  setScanComplete(true);
                  setIsScanning(false);
                  isActive = false;
                  
                  setTimeout(() => {
                    onCodeScanned(data.text);
                  }, 1000);
                  return; // Stop polling on success
                }
              }
            } catch (err) {
              console.error("Scanning error:", err);
            }
          }
        }
      }
    };"""

replacement = """    let scanTimeout: ReturnType<typeof setTimeout>;

    const captureAndScan = async () => {
      if (!isActive || scanComplete) return;
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        if (canvas) {
          // Scale down to max 800px on the longest side to save bandwidth and latency
          const MAX_SIZE = 800;
          let width = videoRef.current.videoWidth;
          let height = videoRef.current.videoHeight;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG

            try {
              const res = await fetch('/api/scan-spotify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64 })
              });
              
              if (res.status === 429) {
                 console.warn("Rate limited by API, slowing down...");
                 if (isActive) scanTimeout = setTimeout(captureAndScan, 10000); // Backoff 10 seconds
                 return;
              }
              
              if (res.ok) {
                const data = await res.json();
                if (data.ok && data.text && data.text !== 'NOT_FOUND') {
                  setScanComplete(true);
                  setIsScanning(false);
                  isActive = false;
                  
                  setTimeout(() => {
                    onCodeScanned(data.text);
                  }, 1000);
                  return; // Success! Stop polling.
                }
              }
            } catch (err) {
              console.error("Scanning error:", err);
            }
          }
        }
      }
      
      // Continue polling only if active, waiting 6 seconds between requests to avoid limits
      if (isActive && !scanComplete) {
         scanTimeout = setTimeout(captureAndScan, 6000);
      }
    };"""

scanner_content = scanner_content.replace(target, replacement)

target2 = """            videoRef.current.play().then(() => {
              // Send a frame to Gemini every 3 seconds
              scanInterval = setInterval(captureAndScan, 3000);
              // Trigger first scan immediately after 1 second
              setTimeout(captureAndScan, 1000);
            }).catch(e => console.error("Video play error:", e));"""

replacement2 = """            videoRef.current.play().then(() => {
              // Use recursive timeout starting 1.5 seconds after video starts
              scanTimeout = setTimeout(captureAndScan, 1500);
            }).catch(e => console.error("Video play error:", e));"""

scanner_content = scanner_content.replace(target2, replacement2)

target3 = """    return () => {
      isActive = false;
      if (scanInterval) clearInterval(scanInterval);
      if (streamRef.current) {"""

replacement3 = """    return () => {
      isActive = false;
      if (scanTimeout) clearTimeout(scanTimeout);
      if (streamRef.current) {"""

scanner_content = scanner_content.replace(target3, replacement3)

with open("src/components/Scanner/SpotifyCodeScanner.tsx", "w") as f:
    f.write(scanner_content)
