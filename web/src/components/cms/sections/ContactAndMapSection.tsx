import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

interface ContactAndMapSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    churchName?: string;
    address?: string;
    phone?: string;
    email?: string;
    mapUrl?: string;
    scheduleTitle?: string;
    scheduleText?: string;
  };
  config?: {
    showForm?: boolean;
    showMap?: boolean;
    mapHeight?: number;
  };
}

export const ContactAndMapSection: React.FC<ContactAndMapSectionProps> = ({
  content,
  config: _config = {},
}) => {
  const {
    title = 'Contact Us',
    subtitle = '',
    churchName,
    address,
    phone,
    email,
    scheduleTitle,
    scheduleText,
  } = content;

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {churchName && (
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1">አድራሻ</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">{churchName}</p>
            {address && <p className="text-xs text-muted-foreground mt-0.5">{address}</p>}
          </div>
        )}

        {phone && (
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Phone className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1">ስልክ ቁጥር</h4>
            <a href={`tel:${phone}`} className="text-xs sm:text-sm text-primary hover:underline font-medium">
              {phone}
            </a>
          </div>
        )}

        {email && (
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1">ኢሜይል</h4>
            <a href={`mailto:${email}`} className="text-xs sm:text-sm text-primary hover:underline font-medium">
              {email}
            </a>
          </div>
        )}

        {scheduleTitle && (
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1">{scheduleTitle}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">{scheduleText}</p>
          </div>
        )}
      </div>
    </div>
  );
};
