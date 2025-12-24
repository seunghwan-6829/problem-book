import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number | null; // null = 자유 비율
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  maxSize: number = 800, // 최대 크기 제한
  quality: number = 0.7, // 압축 품질 (0.7 = 70%)
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // 원본 크롭 크기
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  // 최대 크기로 리사이즈 (비율 유지)
  if (targetWidth > maxSize || targetHeight > maxSize) {
    const ratio = Math.min(maxSize / targetWidth, maxSize / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // 부드러운 리사이징을 위한 설정
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      quality, // 압축 품질
    );
  });
}

function ImageCropper({ imageSrc, aspectRatio, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteHandler = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setSaving(true);
    try {
      // 썸네일(1:1)은 400px, 본문 이미지는 800px 최대
      const maxSize = aspectRatio === 1 ? 400 : 800;
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, maxSize, 0.7);
      
      // 용량 체크 (300KB 초과 시 추가 압축)
      if (croppedImageBlob.size > 300 * 1024) {
        const moreCompressed = await getCroppedImg(imageSrc, croppedAreaPixels, maxSize, 0.5);
        onCropComplete(moreCompressed);
      } else {
        onCropComplete(croppedImageBlob);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {aspectRatio === 1 ? '🖼️ 썸네일 자르기 (1:1)' : '📸 이미지 자르기'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            드래그하여 위치를 조정하고, 휠로 확대/축소하세요
          </p>
        </div>

        {/* Cropper */}
        <div className="relative h-96 bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio || undefined}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
          />
        </div>

        {/* Zoom Slider */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">확대:</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-sm text-gray-500 w-12">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                처리 중...
              </>
            ) : (
              '적용하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropper;
