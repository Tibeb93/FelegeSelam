import React from 'react';
import Link from 'next/link';
import { ArrowRight, Music, Play } from 'lucide-react';

interface MezmurListSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    viewAllText?: string;
  };
  config?: {
    limit?: number;
    category?: string;
    layout?: 'compact' | 'cards' | 'player';
  };
  locale: string;
}

export const MezmurListSection: React.FC<MezmurListSectionProps> = ({
  content,
  config: _config = {},
  locale,
}) => {
  const {
    title = 'Featured Mezmur Hymns',
    subtitle = '',
    viewAllText = 'Listen to All Hymns',
  } = content;

  const sampleHymns = [
    { id: '1', title: 'አምላክ ሆይ ወደ አንተ እገሰግሳለሁ', singer: 'የአዕማደ ሰላም ዝማሬ ክፍል', duration: '5:24', category: 'የዘወትር' },
    { id: '2', title: 'ቅዱስ ጊዮርጊስ ኃያል', singer: 'የአዕማደ ሰላም ዝማሬ ክፍል', duration: '6:12', category: 'የበዓላት' },
    { id: '3', title: 'ማርያም ደስ ይበልሽ', singer: 'የአዕማደ ሰላም ዝማሬ ክፍል', duration: '4:45', category: 'የእመቤታችን' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          {subtitle && (
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent mb-2 block">
              {subtitle}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {title}
          </h2>
        </div>

        {viewAllText && (
          <Link
            href={`/${locale}/mezmur`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/85 transition-colors self-start sm:self-auto"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleHymns.map((hymn) => (
          <div
            key={hymn.id}
            className="group p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-sm flex items-center justify-between gap-4 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {hymn.title}
                </h3>
                <p className="text-xs text-muted-foreground">{hymn.singer}</p>
              </div>
            </div>

            <Link
              href={`/${locale}/mezmur`}
              className="w-9 h-9 rounded-full bg-accent/20 hover:bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0 transition-colors"
              aria-label="Play"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
