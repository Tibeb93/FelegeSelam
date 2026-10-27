'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answerHtml: string;
}

interface FaqAccordionSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    items?: FaqItem[];
  };
  config?: {
    allowMultipleOpen?: boolean;
  };
}

export const FaqAccordionSection: React.FC<FaqAccordionSectionProps> = ({
  content,
  config = {},
}) => {
  const { title = 'Frequently Asked Questions', subtitle = '', items = [] } = content;
  const { allowMultipleOpen = false } = config;
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const toggle = (idx: number) => {
    if (allowMultipleOpen) {
      setOpenIndexes((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(idx) ? [] : [idx]));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
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

      <div className="space-y-4">
        {items.map((item, idx) => {
          const isOpen = openIndexes.includes(idx);
          return (
            <div
              key={idx}
              className="border border-border/70 rounded-2xl bg-card overflow-hidden transition-colors shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-foreground hover:text-primary transition-colors focus:outline-none"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                  <div dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
