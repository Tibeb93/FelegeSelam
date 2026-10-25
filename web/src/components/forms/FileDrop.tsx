'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FileDropProps {
  label?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  maxSizeBytes?: number; // default 2MB (2 * 1024 * 1024)
  accept?: string;
  currentFile?: File | null;
  currentPreviewUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export function FileDrop({
  label,
  helperText = 'PNG, JPG ወይም WEBP እስከ 2MB (Drag & drop or click to upload)',
  required,
  disabled = false,
  error: manualError,
  maxSizeBytes = 2 * 1024 * 1024,
  accept = 'image/png, image/jpeg, image/webp',
  currentFile,
  currentPreviewUrl,
  onFileSelect,
  className,
  containerClassName,
  id = 'file-drop-input',
}: FileDropProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPreviewUrl || null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(
    currentFile
      ? {
          name: currentFile.name,
          size: `${(currentFile.size / (1024 * 1024)).toFixed(2)} MB`,
        }
      : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const error = manualError || validationError;

  const handleProcessFile = (file: File) => {
    setValidationError(null);

    // Validate size
    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      setValidationError(`የፋይሉ መጠን ከ ${maxMb}MB መብለጥ የለበትም (File exceeds ${maxMb}MB)`);
      return;
    }

    setFileDetails({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    });

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setFileDetails(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  const isImage = previewUrl || (currentFile && currentFile.type.startsWith('image/'));

  return (
    <div className={cn('w-full space-y-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-foreground tracking-tight select-none"
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl || fileDetails ? (
        /* Preview Card */
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all flex flex-col sm:flex-row items-center gap-4',
            error ? 'border-destructive' : 'border-border'
          )}
        >
          {isImage ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl!}
                alt="File preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <FileText className="h-8 w-8" />
            </div>
          )}

          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-success font-semibold text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>ፋይል ተመርጧል (File selected)</span>
            </div>
            <p className="font-medium text-foreground text-sm truncate max-w-xs">
              {fileDetails?.name || 'የተመረጠ ፋይል'}
            </p>
            {fileDetails?.size && (
              <p className="text-xs text-muted-foreground">{fileDetails.size}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              ቀይር (Change)
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={handleClear}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            disabled && 'cursor-not-allowed opacity-50',
            isDragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : error
              ? 'border-destructive bg-destructive/5'
              : 'border-border/80 bg-card hover:border-primary/60 hover:bg-muted/30',
            className
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 group-hover:scale-110 transition-transform mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>

          <p className="text-sm font-semibold text-foreground">
            ፋይል እዚህ ይጎትቱ ወይም{' '}
            <span className="text-primary underline decoration-primary underline-offset-4">
              ለመምረጥ ይጫኑ
            </span>
          </p>

          <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
        </div>
      )}

      {error && (
        <div
          className="flex items-center gap-1.5 text-xs text-destructive font-medium leading-normal animate-fadeIn pt-1"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
