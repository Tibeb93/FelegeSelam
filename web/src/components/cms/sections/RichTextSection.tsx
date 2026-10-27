import React from 'react';

interface RichTextSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    html?: string;
  };
  config?: {
    proseWidth?: 'narrow' | 'normal' | 'full';
    dropCap?: boolean;
  };
}

export const RichTextSection: React.FC<RichTextSectionProps> = ({ content, config = {} }) => {
  const { title, subtitle, html = '' } = content;
  const { proseWidth = 'normal', dropCap = false } = config;

  let maxWidthClass = 'max-w-3xl';
  if (proseWidth === 'narrow') maxWidthClass = 'max-w-2xl';
  else if (proseWidth === 'full') maxWidthClass = 'max-w-none';

  return (
    <div className={`mx-auto ${maxWidthClass}`}>
      {(title || subtitle) && (
        <div className="mb-8 text-center sm:text-left">
          {subtitle && (
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent mb-2 block">
              {subtitle}
            </span>
          )}
          {title && (
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
          )}
        </div>
      )}

      {html && (
        <div
          className={`prose prose-slate dark:prose-invert max-w-none leading-relaxed text-base text-muted-foreground ${
            dropCap ? 'first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
};
