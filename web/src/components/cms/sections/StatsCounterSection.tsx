import React from 'react';
import * as Icons from 'lucide-react';

interface StatItem {
  number: string;
  label: string;
  suffix?: string;
  icon?: string;
}

interface StatsCounterSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    stats?: StatItem[];
  };
  config?: {
    columns?: 2 | 3 | 4;
    animated?: boolean;
  };
}

export const StatsCounterSection: React.FC<StatsCounterSectionProps> = ({
  content,
  config = {},
}) => {
  const { title = '', subtitle = '', stats = [] } = content;
  const { columns = 4 } = config;

  let gridColsClass = 'grid-cols-2 md:grid-cols-4';
  if (columns === 2) gridColsClass = 'grid-cols-1 sm:grid-cols-2';
  else if (columns === 3) gridColsClass = 'grid-cols-1 sm:grid-cols-3';

  return (
    <div>
      {(title || subtitle) && (
        <div className="text-center max-w-2xl mx-auto mb-10">
          {subtitle && (
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent mb-2 block">
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

      <div className={`grid ${gridColsClass} gap-6 text-center`}>
        {stats.map((st, idx) => {
          const iconName = st.icon || 'TrendingUp';
          const IconComponent = (Icons as any)[iconName] || Icons.TrendingUp;

          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-1">
                {st.number}
                {st.suffix && <span className="text-accent ml-0.5">{st.suffix}</span>}
              </div>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                {st.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
