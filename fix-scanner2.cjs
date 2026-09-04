const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    if (!isOpen) return;
    const sc = scanControllerRef.current;
    sc.subscribe((state, data: any) => {
      setScanState(state);
      if (state === 'SUCCESS' && data?.tag) {
        setTag(data.tag);
        // Automatically resolve music
        resolveMusic(data.tag, data.frame);
      } else if (state === 'ERROR' && data?.message) {
        setErrorMsg(data.message);
      }
    });

    const initCamera = async () => {
      if (videoRef.current) {
        cameraControllerRef.current = new CameraController(videoRef.current);
        const success = await cameraControllerRef.current.start();
        if (!success) {
          sc.transitionTo('ERROR', { message: 'No camera permission' });
        } else {
          sc.transitionTo('SCANNING');
          requestAnimationFrame(scanLoop);
        }
      }
    };
    initCamera();

    return () => {
      cameraControllerRef.current?.stop();
    };
  }, []);`;

const newEffect = `  useEffect(() => {
    if (!isOpen) {
      // Clean up if it was running
      cameraControllerRef.current?.stop();
      scanControllerRef.current.reset();
      return;
    }
    const sc = scanControllerRef.current;
    
    const handler = (state: ScanState, data: any) => {
      setScanState(state);
      if (state === 'SUCCESS' && data?.tag) {
        setTag(data.tag);
        // Automatically resolve music
        resolveMusic(data.tag, data.frame);
      } else if (state === 'ERROR' && data?.message) {
        setErrorMsg(data.message);
      }
    };
    
    sc.subscribe(handler);

    const initCamera = async () => {
      if (videoRef.current) {
        cameraControllerRef.current = new CameraController(videoRef.current);
        const success = await cameraControllerRef.current.start();
        if (!success) {
          sc.transitionTo('ERROR', { message: 'No camera permission' });
        } else {
          sc.transitionTo('SCANNING');
          requestAnimationFrame(scanLoop);
        }
      }
    };
    initCamera();

    return () => {
      sc.unsubscribe(handler);
      cameraControllerRef.current?.stop();
    };
  }, [isOpen]);`;

file = file.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
