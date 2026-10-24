'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Church,
  Cross,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ContactPageProps {
  params: { locale: string };
}

export default function ContactPage({ params: { locale } }: ContactPageProps) {
  const t = useTranslations('Website');
  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.emailOrPhone || !formData.message) {
      setErrorMessage(locale === 'am' ? 'እባክዎ አስፈላጊ መስኮችን ይሙሉ' : 'Please fill all required fields');
      return;
    }
    setErrorMessage(null);
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader locale={locale} />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-10 md:py-16 max-w-5xl space-y-12" tabIndex={-1}>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 text-xs uppercase font-semibold">
            {t('navContact')}
          </Badge>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {locale === 'am' ? 'ያግኙንና አስተያየትዎን ያካፍሉን' : 'Get in Touch with Us'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'ለማንኛውም ጥያቄ፣ አስተያየት ወይም የምዝገባ መረጃ በአካል ወይም በስልክ ያግኙን'
              : 'Reach out for inquiries, spiritual course registrations, or feedback.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
          {/* Contact Details Card */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-secondary shadow-xs">
                <Cross className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {t('contactInfo')}
                </h2>
                <p className="text-xs text-secondary font-medium">
                  {locale === 'am' ? 'ደብረ ሰላም ቅዱስ እስጢፋኖስ' : 'Debre Selam St. Stephen'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-foreground">{locale === 'am' ? 'አድራሻ' : 'Address'}</strong>
                  <span>{t('contactAddress')}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-foreground">{locale === 'am' ? 'ስልክ' : 'Phone'}</strong>
                  <span>+251 91 123 4567 / +251 11 551 2345</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-foreground">{locale === 'am' ? 'ኢሜይል' : 'Email'}</strong>
                  <span>info@aemadeselam.org</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-foreground">{locale === 'am' ? 'የአገልግሎት ሰዓት' : 'Office Hours'}</strong>
                  <span>{locale === 'am' ? 'ሰኞ - እሑድ ከጠዋቱ 2:30 - 11:30' : 'Monday - Sunday: 8:30 AM - 5:30 PM'}</span>
                </div>
              </div>
            </div>

            {/* Spiritual Notice */}
            <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
              <p className="text-xs text-foreground font-semibold leading-relaxed">
                {locale === 'am'
                  ? 'የሰንበት ትምህርት ቤታችን ጽሕፈት ቤት በደብረ ሰላም ቅዱስ እስጢፋኖስ ቅጥር ግቢ ውስጥ ይገኛል።'
                  : 'The Sunday School office is located within the sacred grounds of Debre Selam St. Stephen Church.'}
              </p>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-lg font-bold text-foreground">
                  {locale === 'am' ? 'መልእክትዎ ደርሶናል!' : 'Thank you for your message!'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  {t('messageSent')}
                </p>
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', emailOrPhone: '', subject: '', message: '' });
                  }}
                  className="rounded-xl min-h-[44px]"
                >
                  {locale === 'am' ? 'ሌላ መልእክት ይላኩ' : 'Send another message'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  {t('sendMessage')}
                </h3>

                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="text-xs font-semibold text-foreground">
                    {t('fullName')} *
                  </label>
                  <Input
                    id="contact-name"
                    name="fullName"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={locale === 'am' ? 'ሙሉ ስምዎን ያስገቡ' : 'Enter your full name'}
                    className="min-h-[44px] rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="text-xs font-semibold text-foreground">
                    {locale === 'am' ? 'ስልክ ወይም ኢሜይል' : 'Phone or Email'} *
                  </label>
                  <Input
                    id="contact-email"
                    name="phone"
                    required
                    value={formData.emailOrPhone}
                    onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
                    placeholder="+251 9... / user@example.com"
                    className="min-h-[44px] rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-subject" className="text-xs font-semibold text-foreground">
                    {locale === 'am' ? 'ጉዳይ' : 'Subject'}
                  </label>
                  <Input
                    id="contact-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={locale === 'am' ? 'የመልእክቱ ርዕስ' : 'Inquiry topic'}
                    className="min-h-[44px] rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-semibold text-foreground">
                    {t('message')} *
                  </label>
                  <Textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={locale === 'am' ? 'መልእክትዎን እዚህ ይጻፉ...' : 'Write your message here...'}
                    className="rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold min-h-[48px] rounded-xl gap-2 text-base shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  <span>{t('send')}</span>
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
