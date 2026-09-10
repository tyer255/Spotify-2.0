import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import jsQR from 'jsqr';
import { parseSongIdFromQr } from '../../utils/qrUtils';
import {
  X,
  Camera,
  Flashlight,
  SwitchCamera,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (songId: string) => void;
}

type CameraStatus = 'requesting' | 'active' | 'denied' | 'unavailable' | 'stopped';

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [scanSuccessId, setScanSuccessId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScanningActiveRef = useRef<boolean>(false);
  const warningTimerRef = useRef<any>(null);

  // Stop media stream tracks cleanly
  const stopCameraStream = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            // ignore
          }
        });
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
  }, []);

  // Show non-blocking warning banner
  const triggerWarning = useCallback((msg: string) => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setWarningMessage(msg);
    warningTimerRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 3500);
  }, []);

  // Process decoded string
  const handleDecodedData = useCallback(
    (decodedString: string) => {
      const songId = parseSongIdFromQr(decodedString);
      if (songId) {
        // Successful valid Spotiz song QR code!
        isScanningActiveRef.current = false;
        setScanSuccessId(songId);
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 60, 40]);
          }
        } catch {}

        setTimeout(() => {
          stopCameraStream();
          onScanSuccess(songId);
        }, 500);
      } else {
        // Invalid or third-party QR code
        triggerWarning("This image doesn't contain a valid Spotiz song code.");
      }
    },
    [onScanSuccess, stopCameraStream, triggerWarning]
  );

  // Frame scanner loop
  const startScanLoop = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let lastScanTime = 0;

    const scanFrame = (timestamp: number) => {
      if (!isScanningActiveRef.current) return;

      const video = videoRef.current;
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        // Throttle to every ~80ms (approx 12 FPS) for high accuracy and CPU efficiency
        if (timestamp - lastScanTime > 80) {
          lastScanTime = timestamp;

          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (qrResult && qrResult.data) {
                handleDecodedData(qrResult.data);
              }
            } catch (err) {
              // Frame decoding error non-fatal
            }
          }
        }
      }

      if (isScanningActiveRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleDecodedData]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setCameraStatus('requesting');
    setErrorMessage(null);
    setScanSuccessId(null);

    // Check device availability
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unavailable');
      setErrorMessage('Camera access is not supported on this browser or environment.');
      return;
    }

    try {
      // Check for available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {}

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check torch / flash support
      try {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) as any;
          if (capabilities && capabilities.torch) {
            setTorchSupported(true);
          } else {
            setTorchSupported(false);
          }
        }
      } catch {
        setTorchSupported(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
      }

      setCameraStatus('active');
      isScanningActiveRef.current = true;
      startScanLoop();
    } catch (err: any) {
      console.warn('[QrScannerModal] Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setErrorMessage('Camera permission was denied. Please allow camera access or select from photos.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('unavailable');
        setErrorMessage('No camera device was detected on your system.');
      } else {
        setCameraStatus('unavailable');
        setErrorMessage(
          'Unable to access camera. You can still scan by selecting a photo.'
        );
      }
    }
  }, [facingMode, startScanLoop, stopCameraStream]);

  // Torch toggle handler
  const handleToggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      }
    } catch (e) {
      console.warn('Could not toggle flashlight:', e);
    }
  };

  // Flip front/back camera handler
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Fallback: Read QR from uploaded image file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setWarningMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            setIsProcessingImage(false);
            triggerWarning('Could not process image.');
            return;
          }

          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            setIsProcessingImage(false);

            if (qrResult && qrResult.data) {
              handleDecodedData(qrResult.data);
            } else {
              triggerWarning("This image doesn't contain a valid Spotiz song code.");
            }
          } catch (decodeErr) {
            setIsProcessingImage(false);
            triggerWarning('Failed to decode image data.');
          }
        };

        img.onerror = () => {
          setIsProcessingImage(false);
          triggerWarning('Could not load selected image.');
        };

        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setIsProcessingImage(false);
      triggerWarning('Error reading image file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Effect to manage camera lifecycle with modal visibility
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCameraStream();
      setWarningMessage(null);
      setScanSuccessId(null);
    }

    return () => {
      stopCameraStream();
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isOpen, startCamera, stopCameraStream]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden animate-in fade-in duration-200">
      {/* Video Background */}
      <video
        ref={videoRef}
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          cameraStatus === 'active' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Success Overlay */}
      {scanSuccessId && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200 z-50">
          <div className="w-20 h-20 rounded-full bg-white/10 text-white flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 animate-pulse" />
          </div>
        </div>
      )}

      {/* Camera Requesting / Starting State */}
      {cameraStatus === 'requesting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-50">
          <div className="w-10 h-10 border-2 border-white/50 border-t-white rounded-full animate-spin mb-4" />
        </div>
      )}

      {/* Camera Denied or Unavailable State */}
      {(cameraStatus === 'denied' || cameraStatus === 'unavailable') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-50 bg-neutral-900/90 pointer-events-auto">
          <div className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {cameraStatus === 'denied' ? 'Camera Access Needed' : 'Camera Unavailable'}
          </h3>
          <p className="text-sm text-neutral-300 max-w-xs mb-8">
            {errorMessage || 'Camera could not be started.'}
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-6 rounded-full bg-white/10 text-white font-bold mb-4 active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center gap-2 py-3 px-6 rounded-full bg-white text-black font-bold mb-4 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Full UI Overlay combining Frame, Text, and Top Bar */}
      <div className="absolute inset-0 flex flex-col z-40">
        
        {/* Top bar (relative to keep it above the shadow mask) */}
        <div className="flex items-center justify-between p-4 sm:p-6 mt-safe pointer-events-auto z-50">
          <button
            type="button"
            onClick={onClose}
            className="p-3 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="Close scanner"
          >
            <X className="w-7 h-7" />
          </button>
          
          <div className="flex items-center gap-2">
            {torchSupported && cameraStatus === 'active' && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-3 rounded-full transition-colors cursor-pointer ${
                  isTorchOn ? 'text-black bg-white' : 'text-white hover:bg-white/20'
                }`}
                title={isTorchOn ? 'Turn off light' : 'Turn on light'}
              >
                <Flashlight className="w-5 h-5" />
              </button>
            )}

            {hasMultipleCameras && cameraStatus === 'active' && (
              <button
                type="button"
                onClick={handleToggleCamera}
                className="p-3 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                title="Switch camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Warning Notification Banner */}
        {warningMessage && (
          <div className="absolute top-20 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:min-w-[300px] z-50 bg-rose-600 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 shadow-xl animate-in slide-in-from-top-4 duration-200 pointer-events-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{warningMessage}</span>
          </div>
        )}

        {/* Center Area: Mask & Frame */}
        {cameraStatus === 'active' && !scanSuccessId && (
          <div className="flex-1 flex flex-col items-center w-full h-full pointer-events-none relative z-30">
            
            {/* Top spacer to push frame up relative to center */}
            <div className="flex-[2] min-h-[4vh]" />
            
            {/* Scanning Frame with massive shadow */}
            <div className="relative flex-shrink-0 w-[280px] h-[360px] sm:w-[320px] sm:h-[420px] border-[1.5px] border-white/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] z-0" />
            
            {/* Content below the frame (Soundwave + Text) */}
            <div className="relative flex flex-col items-center justify-start pointer-events-auto z-10 pt-6 sm:pt-8 w-full shrink-0">
              
              {/* Subtle Scanning Animation (Soundwave style) */}
              <div className="flex items-center justify-center gap-1.5 opacity-80 h-8 mb-4 sm:mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-white rounded-full animate-pulse" 
                    style={{ 
                      height: i % 2 === 0 ? '16px' : '24px', 
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
              
              <h2 className="text-[20px] sm:text-[22px] font-bold text-white mb-6 text-center px-4 drop-shadow-md">
                Point your camera at a Spotiz Code
              </h2>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="text-[15px] font-semibold text-white/90 hover:text-white transition-colors py-2 px-4 active:scale-95"
              >
                {isProcessingImage ? 'Processing...' : 'Select from photos'}
              </button>

            </div>
            
            {/* Bottom spacer (larger than top spacer) to shift content upwards */}
            <div className="flex-[3] min-h-[6vh]" />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
