import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';

interface LinkButtonItem {
  text: string;
  link: string;
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  icon?: string;
  target?: '_self' | '_blank';
}

interface LinkButtonsSectionProps {
  content: {
    title?: string;
    buttons?: LinkButtonItem[];
  };
  config?: {
    alignment?: 'left' | 'center' | 'right';
    size?: 'sm' | 'md' | 'lg';
  };
  locale: string;
}

export const LinkButtonsSection: React.FC<LinkButtonsSectionProps> = ({
  content,
  config = {},
  locale,
}) => {
  const { title, buttons = [] } = content;
  const { alignment = 'center', size = 'md' } = config;

  const alignClass =
    alignment === 'left'
      ? 'justify-start'
      : alignment === 'right'
        ? 'justify-end'
        : 'justify-center';

  let sizeClass = 'px-6 py-3 text-sm';
  if (size === 'sm') sizeClass = 'px-4 py-2 text-xs';
  else if (size === 'lg') sizeClass = 'px-8 py-4 text-base font-semibold';

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-xl font-bold text-center mb-6 text-foreground">
          {title}
        </h3>
      )}

      <div className={`flex flex-wrap items-center ${alignClass} gap-4`}>
        {buttons.map((btn, idx) => {
          const iconName = btn.icon;
          const IconComponent = iconName ? (Icons as any)[iconName] : null;

          let variantClass = 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md';
          if (btn.variant === 'accent') {
            variantClass = 'bg-accent text-slate-950 hover:bg-accent/90 shadow-md';
          } else if (btn.variant === 'outline') {
            variantClass = 'border-2 border-primary text-primary hover:bg-primary/10';
          } else if (btn.variant === 'ghost') {
            variantClass = 'text-foreground hover:bg-muted';
          }

          const isExternal = btn.link.startsWith('http') || btn.target === '_blank';
          const href = isExternal
            ? btn.link
            : `/${locale}${btn.link.startsWith('/') ? btn.link : `/${btn.link}`}`;

          return (
            <Link
              key={idx}
              href={href}
              target={btn.target || (isExternal ? '_blank' : '_self')}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className={`inline-flex items-center gap-2 rounded-xl font-medium transition-all transform hover:-translate-y-0.5 ${sizeClass} ${variantClass}`}
            >
              {IconComponent && <IconComponent className="w-4 h-4" />}
              <span>{btn.text}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
