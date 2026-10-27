import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

interface EthiopianCalendarSectionProps {
  content: {
    title?: string;
    subtitle?: string;
  };
  config?: {
    showUpcomingEvents?: boolean;
    initialView?: 'month' | 'year';
  };
  locale: string;
}

export const EthiopianCalendarSection: React.FC<EthiopianCalendarSectionProps> = ({
  content,
  locale,
}) => {
  const {
    title = 'Ethiopian Orthodox Calendar',
    subtitle = 'Daily saints commemorations, fasts, and feast days',
  } = content;

  return (
    <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          {subtitle && (
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent mb-1 block">
              {subtitle}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Calendar className="w-7 h-7 text-primary" />
            <span>{title}</span>
          </h2>
        </div>

        <Link
          href={`/${locale}/calendar`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <span>ሙሉ የቀን መቁጠሪያ ይመልከቱ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <span className="text-xs font-semibold text-accent uppercase">የዕለቱ በዓል</span>
          <h4 className="text-sm font-bold text-foreground mt-1">ጥቅምት 17 - ቅዱስ እስጢፋኖስ</h4>
          <p className="text-xs text-muted-foreground mt-1">የቀዳሜ ሰማዕት ቅዱስ እስጢፋኖስ ዕረፍት</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <span className="text-xs font-semibold text-accent uppercase">ቀጣይ ጾም</span>
          <h4 className="text-sm font-bold text-foreground mt-1">የነቢያት ጾም (ገና ጾም)</h4>
          <p className="text-xs text-muted-foreground mt-1">ከኅዳር 15 እስከ ታኅሣሥ 28</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <span className="text-xs font-semibold text-accent uppercase">የሳምንቱ አጽዋማት</span>
          <h4 className="text-sm font-bold text-foreground mt-1">ረቡዕ እና ዓርብ</h4>
          <p className="text-xs text-muted-foreground mt-1">የሰሙነ ሕማማት እና የመከራው መታሰቢያ</p>
        </div>
      </div>
    </div>
  );
};
