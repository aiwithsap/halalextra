import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScanSuccess: (result: string) => void;
  onCancel: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onCancel }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
          
          // After video plays, start detecting QR code
          videoRef.current.onloadedmetadata = () => {
            requestAnimationFrame(scanQRCode);
          };
        }
      } catch (err) {
        console.error('Error starting camera', err);
        setError('Could not access camera. Please ensure camera permissions are allowed.');
        toast({
          title: t('qrScanner.error'),
          description: t('qrScanner.cameraAccessError'),
          variant: 'destructive',
        });
      }
    };

    // Load QR code detection script dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.async = true;
    
    script.onload = () => {
      startScanner();
    };
    
    script.onerror = () => {
      setError('Could not load QR scanning library.');
      toast({
        title: t('qrScanner.error'),
        description: t('qrScanner.libraryError'),
        variant: 'destructive',
      });
    };
    
    document.body.appendChild(script);

    const scanQRCode = () => {
      if (!videoRef.current || !videoRef.current.videoWidth) {
        requestAnimationFrame(scanQRCode);
        return;
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // @ts-ignore - jsQR is loaded dynamically
      const code = window.jsQR?.(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      
      if (code) {
        if (code.data) {
          onScanSuccess(code.data);
        }
      } else {
        requestAnimationFrame(scanQRCode);
      }
    };

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScanSuccess, toast, t]);

  return (
    <div className="bg-black rounded-lg overflow-hidden relative">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 border-2 border-white border-opacity-50 rounded-lg"></div>
          </div>
        </>
      )}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <Button
          onClick={onCancel}
          variant="secondary"
          className="bg-white text-primary hover:bg-gray-100"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
};

export default QRScanner;
