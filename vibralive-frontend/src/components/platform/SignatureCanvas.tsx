import React, { useRef, useEffect, useState } from 'react';
import { MdRefresh, MdDone } from 'react-icons/md';

interface SignatureCanvasProps {
  onSignatureCapture?: (signature: string) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  signatureData?: string;
  height?: number;
}

export function SignatureCanvas({
  onSignatureCapture,
  onCancel,
  readOnly = false,
  signatureData,
  height = 200,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!signatureData);

  const canvas = canvasRef.current;

  useEffect(() => {
    if (canvas && !readOnly) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1e293b'; // slate-900
      }
    }
  }, [canvas, readOnly]);

  // Load existing signature if provided
  useEffect(() => {
    if (canvas && signatureData && readOnly) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = signatureData;
      }
    }
  }, [canvas, signatureData, readOnly]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    setIsDrawing(true);

    const rect = canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas!.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;

    const rect = canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas!.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    if (!hasSignature) {
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    if (!readOnly) {
      setIsDrawing(false);
      const ctx = canvas!.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
  };

  const handleClear = () => {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasSignature(false);
    }
  };

  const handleConfirm = () => {
    if (canvas && onSignatureCapture) {
      const signatureImageData = canvas.toDataURL('image/png');
      onSignatureCapture(signatureImageData);
    }
  };

  return (
    <div className="space-y-3">
      {/* Info */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-700">
          <p className="font-semibold">✍️ Signature Capture</p>
          <p className="text-xs text-blue-600 mt-1">
            {readOnly
              ? 'Signature verified and locked'
              : 'Draw your signature in the box below. This will legally bind this medical record.'}
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`w-full block ${!readOnly && 'cursor-crosshair'} ${
            readOnly && 'cursor-default'
          }`}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleClear}
            disabled={!hasSignature}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <MdRefresh className="text-lg" />
            Clear
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasSignature}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <MdDone className="text-lg" />
            Confirm Signature
          </button>
        </div>
      )}

      {/* Status badge for read-only */}
      {readOnly && (
        <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
          <div className="w-2 h-2 rounded-full bg-green-600" />
          <span className="text-xs font-semibold text-green-700">Signature verified and locked</span>
        </div>
      )}
    </div>
  );
}
