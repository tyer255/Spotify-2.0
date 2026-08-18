/**
 * Compresses an image file to a lightweight Data URL suitable for localStorage and avatar display.
 * Scales down large camera/gallery photos (e.g. 5-15MB) to max 512px at 85% JPEG quality (~40-80KB).
 */
export const compressImageToDataUrl = (
  file: File,
  maxSize: number = 512,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if valid image type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read image file'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Draw and export as compressed JPEG
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          // Fallback to original data URL if canvas fails
          resolve(result);
        }
      };

      img.onerror = () => {
        resolve(result);
      };

      img.src = result;
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsDataURL(file);
  });
};
