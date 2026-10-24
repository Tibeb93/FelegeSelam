'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, X, File as FileIcon, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeBytes?: number; // default 2MB
  value?: any;
  onChange: (file: File | null) => void;
  error?: string;
  helperText?: string;
  previewType?: 'image' | 'file';
  disabled?: boolean;
}

export function FileUpload({
  label,
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  maxSizeBytes = 2 * 1024 * 1024, // 2MB
  value,
  onChange,
  error,
  helperText,
  previewType: _previewType = 'image',
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    if (typeof value === 'string') return value;
    return null;
  });

  const handleFile = (file: File | null) => {
    setInternalError(null);
    if (!file) {
      setPreviewUrl(null);
      onChange(null);
      return;
    }

    if (file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      setInternalError(`የፋይሉ መጠን ከ ${maxMb}MB መብለጥ የለበትም (File exceeds ${maxMb}MB limit)`);
      return;
    }

    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }

    onChange(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    handleFile(null);
  };

  const displayError = error || internalError;

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-foreground">
          {label}
        </label>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all ${
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30'
        } ${disabled ? 'pointer-events-none opacity-50' : ''} ${
          displayError ? 'border-destructive/80 bg-destructive/5' : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            handleFile(file);
          }}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="File Preview"
              className="h-24 w-24 rounded-lg object-cover border border-border shadow-sm"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:bg-destructive/90 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-muted-foreground">ፋይል ለመቀየር ጠቅ ያድርጉ</span>
          </div>
        ) : (value && typeof value === 'object' && 'name' in value && 'size' in value) ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileIcon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{value.name}</p>
              <p className="text-xs text-muted-foreground">
                {(value.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
            >
              <X className="h-3 w-3" /> አስወግድ (Remove)
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              ፋይል እዚህ ይጎትቱ ወይም <span className="text-primary underline">ይፈልጉ</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {helperText || 'PNG, JPG, WebP እስከ 2MB'}
            </p>
          </div>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
