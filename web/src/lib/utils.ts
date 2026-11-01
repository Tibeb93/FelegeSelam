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

  // If on client side (in browser)
  if (typeof window !== 'undefined') {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '');
    if (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
      try {
        const apiUrl = new URL(apiBase);
        if (apiUrl.origin !== window.location.origin) {
          return `${apiUrl.origin}${cleanPath}`;
        }
      } catch {}
    }
  }

  return cleanPath;
}
