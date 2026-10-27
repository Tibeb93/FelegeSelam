import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';

interface FeatureCardItem {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  link?: string;
  badge?: string;
}

interface FeatureCardsSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    cards?: FeatureCardItem[];
  };
  config?: {
    columns?: 2 | 3 | 4;
    cardStyle?: 'bordered' | 'flat' | 'elevated';
  };
  locale: string;
}

export const FeatureCardsSection: React.FC<FeatureCardsSectionProps> = ({
  content,
  config = {},
  locale,
}) => {
  const { title = '', subtitle = '', cards = [] } = content;
  const { columns = 3, cardStyle = 'bordered' } = config;

  let gridColsClass = 'grid-cols-1 md:grid-cols-3';
  if (columns === 2) gridColsClass = 'grid-cols-1 md:grid-cols-2';
  else if (columns === 4) gridColsClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  let cardStyleClasses = 'border border-border/80 bg-card hover:border-primary/50 shadow-sm';
  if (cardStyle === 'flat') cardStyleClasses = 'bg-muted/40 hover:bg-muted/70 border-transparent';
  else if (cardStyle === 'elevated') cardStyleClasses = 'bg-card shadow-lg hover:shadow-xl border border-border/40';

  return (
    <div>
      {(title || subtitle) && (
        <div className="text-center max-w-2xl mx-auto mb-12">
          {subtitle && (
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent mb-2 block">
              {subtitle}
            </span>
          )}
          {title && (
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
          )}
        </div>
      )}

      <div className={`grid ${gridColsClass} gap-6`}>
        {cards.map((card, idx) => {
          // Dynamic icon resolve
          const iconName = card.icon || 'Star';
          const IconComponent = (Icons as any)[iconName] || Icons.Star;

          const cardContent = (
            <div
              className={`group relative p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 ${cardStyleClasses}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  {card.badge && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                      {card.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>

              {card.link && (
                <div className="mt-5 pt-4 border-t border-border/50 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                  <span>ተጨማሪ ይመልከቱ</span>
                  <Icons.ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );

          if (card.link) {
            return (
              <Link
                key={card.id || idx}
                href={`/${locale}${card.link.startsWith('/') ? card.link : `/${card.link}`}`}
                className="block h-full"
              >
                {cardContent}
              </Link>
            );
          }

          return <div key={card.id || idx}>{cardContent}</div>;
        })}
      </div>
    </div>
  );
};
