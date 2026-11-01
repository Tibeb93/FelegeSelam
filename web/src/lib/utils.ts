import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves a media file URL (uploads, images, audio).
 * Converts relative paths (/uploads/...) to absolute URLs targeting the backend API origin if available.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If already absolute or blob/data URI, return directly
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // If NEXT_PUBLIC_API_URL is configured with an origin (e.g. Render backend in production), prepend it
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '');
  if (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
    return `${apiBase}${cleanPath}`;
  }

  return cleanPath;
}
