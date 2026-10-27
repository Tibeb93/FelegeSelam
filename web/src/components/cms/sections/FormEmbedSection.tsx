'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

interface FormEmbedSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    successMessage?: string;
  };
  config?: {
    formId?: string;
    formKey?: string;
    layout?: 'card' | 'inline';
  };
}

export const FormEmbedSection: React.FC<FormEmbedSectionProps> = ({
  content,
}) => {
  const {
    title = 'Submit Information',
    subtitle = '',
    successMessage = 'Thank you! Your submission has been received.',
  } = content;

  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-card border border-border/80 shadow-md">
      <div className="text-center mb-8">
        {subtitle && (
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent mb-1 block">
            {subtitle}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
      </div>

      {submitted ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center flex flex-col items-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
          <h4 className="text-base font-bold text-foreground">እናመሰግናለን!</h4>
          <p className="text-sm text-muted-foreground mt-1">{successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              ስም (Full Name)
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="ሙሉ ስም ያስገቡ..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              ስልክ ቁጥር (Phone)
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="09..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              መልእክት (Message)
            </label>
            <textarea
              rows={4}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="መልእክትዎን እዚህ ይጻፉ..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>መልእክት ይላኩ</span>
          </button>
        </form>
      )}
    </div>
  );
};
