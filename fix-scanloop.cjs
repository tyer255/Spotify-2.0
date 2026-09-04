const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

const oldLoop = `    if (videoRef.current && canvasRef.current && scanState === 'SCANNING') {
      const result = frameAnalyzerRef.current.analyze(videoRef.current, canvasRef.current);
      if (result && result.success) {
        sc.transitionTo('CANDIDATE_FOUND');
        setTimeout(() => sc.transitionTo('DECODING'), 100);
        setTimeout(() => sc.transitionTo('VALIDATING'), 300);
        
        // Grab current frame for OCR fallback if needed
        const ctx = canvasRef.current.getContext('2d');
        const frameData = ctx ? canvasRef.current : null;

        setTimeout(() => {
          sc.transitionTo('SUCCESS', { tag: result, frame: frameData });
        }, 600);
      }
    }

    if (!sc.isLocked()) {
      requestAnimationFrame(scanLoop);
    }`;

const newLoop = `    if (videoRef.current && canvasRef.current && sc.getState() === 'SCANNING') {
      const result = frameAnalyzerRef.current.analyze(videoRef.current, canvasRef.current);
      if (result && result.success) {
        sc.transitionTo('CANDIDATE_FOUND');
        setTimeout(() => sc.transitionTo('DECODING'), 100);
        setTimeout(() => sc.transitionTo('VALIDATING'), 300);
        
        // Grab current frame for OCR fallback if needed
        const ctx = canvasRef.current.getContext('2d');
        let frameData = null;
        if (ctx) {
           const tempCanvas = document.createElement('canvas');
           tempCanvas.width = canvasRef.current.width;
           tempCanvas.height = canvasRef.current.height;
           const tempCtx = tempCanvas.getContext('2d');
           if (tempCtx) {
             tempCtx.drawImage(canvasRef.current, 0, 0);
             frameData = tempCanvas;
           }
        }

        setTimeout(() => {
          sc.transitionTo('SUCCESS', { tag: result, frame: frameData });
        }, 600);
      }
    }

    if (!sc.isLocked()) {
      requestAnimationFrame(scanLoop);
    }`;

file = file.replace(oldLoop, newLoop);
fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
