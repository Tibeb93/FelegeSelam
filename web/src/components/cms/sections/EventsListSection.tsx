import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, MapPin } from 'lucide-react';

interface EventsListSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    viewAllText?: string;
  };
  config?: {
    limit?: number;
    showRsvpButton?: boolean;
  };
  locale: string;
}

export const EventsListSection: React.FC<EventsListSectionProps> = ({
  content,
  config = {},
  locale,
}) => {
  const {
    title = 'Upcoming Events',
    subtitle = '',
    viewAllText = 'Full Events Calendar',
  } = content;

  const { showRsvpButton = true } = config;

  const sampleEvents = [
    {
      id: '1',
      title: 'የቅዱስ ጊዮርጊስ ዓመታዊ ክብረ በዓል',
      date: 'ጥቅምት 23',
      time: 'ከጠዋቱ 12:00 ጀምሮ',
      location: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል',
      slug: 'st-george-feast',
    },
    {
      id: '2',
      title: 'የወጣቶች መንፈሳዊ ጉባኤ',
      date: 'ኅዳር 5',
      time: 'ከቀኑ 8:00 - 11:30',
      location: 'ዋናው አዳራሽ',
      slug: 'youth-spiritual-assembly',
    },
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
            href={`/${locale}/calendar`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/85 transition-colors self-start sm:self-auto"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sampleEvents.map((ev) => (
          <div
            key={ev.id}
            className="group p-6 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-center flex-shrink-0">
                <Calendar className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <span className="text-xs font-bold block">{ev.date}</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {ev.title}
                </h3>
                <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                  <span>{ev.time}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{ev.location}</span>
                  </span>
                </div>
              </div>
            </div>

            {showRsvpButton && (
              <Link
                href={`/${locale}/calendar`}
                className="px-4 py-2 rounded-xl bg-accent text-slate-950 font-semibold text-xs hover:bg-accent/90 transition-colors self-end sm:self-auto flex-shrink-0 shadow-sm"
              >
                ይሳተፉ (RSVP)
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
