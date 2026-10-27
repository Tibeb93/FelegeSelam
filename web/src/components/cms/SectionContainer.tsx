import React from 'react';
import { SectionStyle } from '@felegeselam/cms-registry';

interface SectionContainerProps {
  style?: Partial<SectionStyle>;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  style = {},
  children,
  id,
  className = '',
}) => {
  const {
    background = 'transparent',
    customBackground,
    overlay,
    padding = 'md',
    width = 'default',
    align = 'left',
    rounded = false,
  } = style;

  // Background style
  let bgClasses = '';
  let inlineBg: React.CSSProperties = {};

  switch (background) {
    case 'primary':
      bgClasses = 'bg-primary text-primary-foreground';
      break;
    case 'secondary':
      bgClasses = 'bg-secondary text-secondary-foreground';
      break;
    case 'muted':
      bgClasses = 'bg-muted/50 text-foreground';
      break;
    case 'card':
      bgClasses = 'bg-card text-card-foreground border border-border';
      break;
    case 'custom':
      if (customBackground) {
        inlineBg.background = customBackground;
      }
      break;
    case 'transparent':
    default:
      bgClasses = 'bg-transparent text-foreground';
      break;
  }

  // Padding
  let paddingClasses = '';
  switch (padding) {
    case 'none':
      paddingClasses = 'py-0';
      break;
    case 'sm':
      paddingClasses = 'py-4 md:py-6';
      break;
    case 'md':
      paddingClasses = 'py-8 md:py-14';
      break;
    case 'lg':
      paddingClasses = 'py-14 md:py-24';
      break;
    case 'xl':
      paddingClasses = 'py-20 md:py-32';
      break;
  }

  // Width
  let widthClasses = '';
  switch (width) {
    case 'narrow':
      widthClasses = 'max-w-4xl mx-auto px-4 sm:px-6';
      break;
    case 'default':
      widthClasses = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
      break;
    case 'wide':
      widthClasses = 'max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8';
      break;
    case 'full':
      widthClasses = 'w-full px-0';
      break;
  }

  // Alignment
  let alignClasses = '';
  switch (align) {
    case 'center':
      alignClasses = 'text-center';
      break;
    case 'right':
      alignClasses = 'text-right';
      break;
    case 'left':
    default:
      alignClasses = 'text-left';
      break;
  }

  const roundedClasses = rounded ? 'rounded-2xl overflow-hidden' : '';

  return (
    <section
      id={id}
      className={`relative w-full ${bgClasses} ${paddingClasses} ${roundedClasses} ${className}`}
      style={inlineBg}
    >
      {overlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: overlay }}
          aria-hidden="true"
        />
      )}
      <div className={`relative z-10 ${widthClasses} ${alignClasses}`}>
        {children}
      </div>
    </section>
  );
};
