'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or searchParams change, the navigation has completed
  useEffect(() => {
    setIsNavigating(false);
    setProgress(100);
    const timer = setTimeout(() => {
      setProgress(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Global click interceptor on internal links to provide instant visual feedback
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const isInternal = href && (href.startsWith('/') || href.startsWith('#'));
      const isTargetBlank = target.getAttribute('target') === '_blank';
      const isDownload = target.hasAttribute('download');
      const isModifier = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

      if (isInternal && !isTargetBlank && !isDownload && !isModifier) {
        // If it's a section anchor jump on the same page, don't start the full page progress
        if (href.startsWith('#') || href.includes('#')) {
          const [pathPart] = href.split('#');
          if (pathPart === '' || pathPart === pathname) {
            return;
          }
        }

        setIsNavigating(true);
        setProgress(30);

        // Progress simulation
        const p1 = setTimeout(() => setProgress(65), 150);
        const p2 = setTimeout(() => setProgress(85), 400);

        return () => {
          clearTimeout(p1);
          clearTimeout(p2);
        };
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, [pathname]);

  if (progress === 0 && !isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-label="Page navigation progress"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-[#0F4C81] via-[#1E78C8] to-[#F2B233] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(242,178,51,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'width 0.2s ease-out, opacity 0.3s 0.2s ease-in' : 'width 0.3s ease-out',
        }}
      />
    </div>
  );
}
