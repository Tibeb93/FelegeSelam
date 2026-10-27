import React from 'react';

interface VideoEmbedSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    videoUrl?: string;
    caption?: string;
  };
  config?: {
    aspectRatio?: '16:9' | '4:3';
    autoplay?: boolean;
    controls?: boolean;
  };
}

export const VideoEmbedSection: React.FC<VideoEmbedSectionProps> = ({
  content,
  config = {},
}) => {
  const { title, subtitle, videoUrl = '', caption } = content;
  const { aspectRatio = '16:9' } = config;

  let embedUrl = videoUrl;
  if (videoUrl.includes('youtube.com/watch?v=')) {
    const videoId = videoUrl.split('v=')[1]?.split('&')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (videoUrl.includes('youtu.be/')) {
    const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  const ratioClass = aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-video';

  return (
    <div className="max-w-4xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {subtitle && (
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent mb-1 block">
              {subtitle}
            </span>
          )}
          {title && (
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
          )}
        </div>
      )}

      <div className={`relative w-full ${ratioClass} rounded-2xl overflow-hidden shadow-2xl bg-black border border-border/40`}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title || 'Embedded Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No video URL provided
          </div>
        )}
      </div>

      {caption && (
        <p className="mt-3 text-center text-xs sm:text-sm text-muted-foreground">
          {caption}
        </p>
      )}
    </div>
  );
};
