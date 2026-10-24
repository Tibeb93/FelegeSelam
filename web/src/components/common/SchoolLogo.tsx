import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'full' | 'icon' | 'badge';
}

export function SchoolLogo({
  className = '',
  size = 48,
  showText = false,
  variant: _variant = 'icon',
}: SchoolLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm select-none"
        aria-label="አዕማደ ሰላም ሰንበት ትምህርት ቤት አርማ"
        role="img"
      >
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F4C81" />
            <stop offset="50%" stopColor="#0A2E52" />
            <stop offset="100%" stopColor="#061B30" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAD872" />
            <stop offset="50%" stopColor="#F2B233" />
            <stop offset="100%" stopColor="#C98914" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Gold Ring */}
        <circle cx="60" cy="60" r="57" fill="url(#goldGradient)" />
        {/* Navy Ring */}
        <circle cx="60" cy="60" r="53" fill="url(#blueGradient)" />
        {/* Inner Gold Inset Circle */}
        <circle cx="60" cy="60" r="44" stroke="url(#goldGradient)" strokeWidth="1.8" fill="#0A2E52" />

        {/* Decorative Stars / Cross Accents */}
        <circle cx="60" cy="11" r="2.5" fill="#F2B233" />
        <circle cx="60" cy="109" r="2.5" fill="#F2B233" />
        <circle cx="11" cy="60" r="2.5" fill="#F2B233" />
        <circle cx="109" cy="60" r="2.5" fill="#F2B233" />

        {/* Amharic Circular Text Inscription Path representation */}
        <path
          id="textArcTop"
          d="M 22,60 A 38,38 0 0,1 98,60"
          fill="none"
        />
        <text fill="#FFFFFF" fontSize="6.2" fontWeight="bold" letterSpacing="0.8">
          <textPath href="#textArcTop" startOffset="50%" textAnchor="middle">
            አዕማደ ሰላም ሰንበት ት/ቤት
          </textPath>
        </text>

        <path
          id="textArcBottom"
          d="M 98,60 A 38,38 0 0,1 22,60"
          fill="none"
        />
        <text fill="#F2B233" fontSize="5.5" fontWeight="600" letterSpacing="0.5">
          <textPath href="#textArcBottom" startOffset="50%" textAnchor="middle">
            ደብረ ሰላም ቅ/እስጢፋኖስ
          </textPath>
        </text>

        {/* Center Emblem: Sacred Orthodox Cross + Open Book */}
        {/* Cross Vertical Beam */}
        <rect x="57" y="27" width="6" height="34" rx="2" fill="url(#goldGradient)" filter="url(#shadow)" />
        {/* Cross Horizontal Beam */}
        <rect x="47" y="34" width="26" height="5.5" rx="2" fill="url(#goldGradient)" filter="url(#shadow)" />
        {/* Cross Upper Bar */}
        <rect x="52" y="29.5" width="16" height="3" rx="1" fill="url(#goldGradient)" />
        {/* Cross Finials */}
        <circle cx="60" cy="25" r="2.5" fill="#FAD872" />
        <circle cx="45" cy="36.75" r="2" fill="#FAD872" />
        <circle cx="75" cy="36.75" r="2" fill="#FAD872" />

        {/* Open Bible at the Base of the Cross */}
        <path
          d="M 38 68 C 48 64, 58 66, 60 70 C 62 66, 72 64, 82 68 L 81 83 C 71 79, 62 81, 60 84 C 58 81, 49 79, 39 83 Z"
          fill="#FFFFFF"
          stroke="#0F4C81"
          strokeWidth="1.2"
        />
        <path
          d="M 60 70 L 60 84"
          stroke="#0F4C81"
          strokeWidth="1.2"
        />
        {/* Scripture Text Lines */}
        <line x1="43" y1="72" x2="55" y2="72" stroke="#0F4C81" strokeWidth="1" strokeLinecap="round" />
        <line x1="43" y1="75.5" x2="56" y2="75.5" stroke="#0F4C81" strokeWidth="1" strokeLinecap="round" />
        <line x1="44" y1="79" x2="54" y2="79" stroke="#0F4C81" strokeWidth="1" strokeLinecap="round" />

        <line x1="65" y1="72" x2="77" y2="72" stroke="#0F4C81" strokeWidth="1" strokeLinecap="round" />
        <line x1="64" y1="75.5" x2="77" y2="75.5" stroke="#0F4C81" strokeWidth="1" strokeLinecap="round" />
        <line x1="66" y1="79" x2="76" y2="79" stroke="#0F4C81" strokeWidth="1" strokeLinecap="round" />

        {/* Foundation Rays */}
        <path
          d="M 46 88 L 60 85 L 74 88"
          stroke="#F2B233"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            ደብረ ሰላም ቅ/እስጢፋኖስ
          </span>
          <span className="text-base font-bold text-foreground leading-tight">
            አዕማደ ሰላም ሰንበት ት/ቤት
          </span>
        </div>
      )}
    </div>
  );
}

export default SchoolLogo;
