'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import {
  SettingItem,
} from '../../../../types/api';
import {
  Save,
  Upload,
  Globe,
  Phone,
  Building,
  Image as ImageIcon,
  CheckCircle,
  Eye,
  Cross,
  Smartphone,
  Monitor,
} from 'lucide-react';

export default function SettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const queryClient = useQueryClient();

  // Settings form states
  const [nameAm, setNameAm] = useState('አዕማደ ሰላም ሰንበት ትምህርት ቤት');
  const [nameEn, setNameEn] = useState('Aemade Selam Sunday School');
  const [parish, setParish] = useState('ደብረ ሰላም ቅዱስ እስጢፋኖስ');
  const [mottoAm, setMottoAm] = useState('በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ');
  const [mottoEn, setMottoEn] = useState('Firm in Faith, Shining in Good Deeds');
  const [logoUrl, setLogoUrl] = useState('/uploads/branding/logo.png');

  const [phone, setPhone] = useState('+251 91 123 4567');
  const [alternatePhone, setAlternatePhone] = useState('+251 11 551 2345');
  const [email, setEmail] = useState('info@aemadeselam.org');
  const [address, setAddress] = useState('አዲስ አበባ, ኢትዮጵያ');
  const [poBox, setPoBox] = useState('1234');

  const [defaultLanguage, setDefaultLanguage] = useState<'am' | 'en'>('am');
  const [calendar, setCalendar] = useState<'ethiopian' | 'gregorian'>('ethiopian');

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Query existing settings
  const { data: settingsData } = useQuery<SettingItem[]>({
    queryKey: ['admin-settings'],
    queryFn: () => apiClient.get<SettingItem[]>('/settings'),
  });

  // Populate state once fetched
  useEffect(() => {
    if (!settingsData) return;
    const profile = settingsData.find((s) => s.settingKey === 'school_profile')?.settingValue;
    const contact = settingsData.find((s) => s.settingKey === 'contact_details')?.settingValue;
    const loc = settingsData.find((s) => s.settingKey === 'localization')?.settingValue;

    if (profile) {
      if (profile.nameAm) setNameAm(profile.nameAm);
      if (profile.nameEn) setNameEn(profile.nameEn);
      if (profile.parish) setParish(profile.parish);
      if (profile.mottoAm) setMottoAm(profile.mottoAm);
      if (profile.mottoEn) setMottoEn(profile.mottoEn);
      if (profile.logoUrl) setLogoUrl(profile.logoUrl);
    }

    if (contact) {
      if (contact.phone) setPhone(contact.phone);
      if (contact.alternatePhone) setAlternatePhone(contact.alternatePhone);
      if (contact.email) setEmail(contact.email);
      if (contact.address) setAddress(contact.address);
      if (contact.poBox) setPoBox(contact.poBox);
    }

    if (loc) {
      if (loc.defaultLanguage) setDefaultLanguage(loc.defaultLanguage);
      if (loc.calendar) setCalendar(loc.calendar);
    }
  }, [settingsData]);

  // Batch update mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (payload: { settings: Record<string, any> }) =>
      apiClient.patch('/settings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setSaveSuccessMessage(true);
      setTimeout(() => setSaveSuccessMessage(false), 4000);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate({
      settings: {
        school_profile: {
          nameAm,
          nameEn,
          logoUrl,
          parish,
          mottoAm,
          mottoEn,
        },
        contact_details: {
          phone,
          alternatePhone,
          email,
          address,
          poBox,
        },
        localization: {
          defaultLanguage,
          supportedLanguages: ['am', 'en'],
          timezone: 'Africa/Addis_Ababa',
          calendar,
        },
      },
    });
  };

  // Upload logo handler
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Attempt upload to /members/upload or storage
      const res = await apiClient.postFormData<{ url: string }>('/members/upload', formData);
      if (res?.url) {
        setLogoUrl(res.url);
      }
    } catch {
      // Fallback: local object URL for preview
      const localUrl = URL.createObjectURL(file);
      setLogoUrl(localUrl);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'የሲስተም ማስተካከያዎች' : 'School & System Settings'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'የትምህርት ቤቱን መረጃ፣ አርማ (Logo)፣ የአድራሻና ቋንቋ መረጃዎችን ማስተካከል'
              : 'Configure branding, Sunday school profile, contact information, and public header'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>
            {saveSettingsMutation.isPending
              ? locale === 'am'
                ? 'እየተመዘገበ...'
                : 'Saving...'
              : locale === 'am'
                ? 'ማስተካከያዎችን መዝግብ'
                : 'Save Settings'}
          </span>
        </button>
      </div>

      {saveSuccessMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>
            {locale === 'am'
              ? 'ማስተካከያዎቹ በተሳካ ሁኔታ ተቀምጠዋል!'
              : 'Settings saved and applied successfully!'}
          </span>
        </div>
      )}

      {/* Live Interactive Header Preview */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {locale === 'am'
                ? 'የህዝብ ድረ-ገጽ የቀጥታ ዕይታ (Live Preview)'
                : 'Public Website Header Live Preview'}
            </h2>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 text-xs">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                previewMode === 'desktop'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                previewMode === 'mobile'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Live Header Frame */}
        <div className="flex justify-center bg-muted/40 p-3 sm:p-6 rounded-xl border border-border/50">
          <div
            className={`transition-all duration-300 rounded-xl border border-border bg-card shadow-md overflow-hidden ${
              previewMode === 'mobile' ? 'w-[360px]' : 'w-full max-w-4xl'
            }`}
          >
            {/* Top Bar Banner with Phone & Motto */}
            <div className="bg-primary px-4 py-1.5 text-primary-foreground text-[11px] flex justify-between items-center">
              <span className="truncate max-w-[240px]">
                {locale === 'am' ? mottoAm : mottoEn}
              </span>
              <span className="shrink-0 flex items-center gap-1 text-[10px]">
                <Phone className="h-3 w-3" />
                {phone}
              </span>
            </div>

            {/* Main Navigation Bar */}
            <div className="flex items-center justify-between p-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                  {logoUrl && logoUrl !== '/uploads/branding/logo.png' ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-8 w-8 rounded-lg object-contain"
                    />
                  ) : (
                    <Cross className="h-5 w-5 text-secondary" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                    {locale === 'am' ? nameAm : nameEn}
                  </h3>
                  <p className="text-[10px] text-secondary font-medium">{parish}</p>
                </div>
              </div>

              {previewMode === 'desktop' ? (
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                  <span>{locale === 'am' ? 'መነሻ' : 'Home'}</span>
                  <span>{locale === 'am' ? 'ትምህርቶች' : 'Courses'}</span>
                  <span>{locale === 'am' ? 'ስንክሳር' : 'Sinksar'}</span>
                  <span>{locale === 'am' ? 'መዝሙራት' : 'Mezmur'}</span>
                  <div className="h-4 w-[1px] bg-border" />
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                    {locale === 'am' ? 'የአባላት ፖርታል' : 'Member Portal'}
                  </span>
                </div>
              ) : (
                <div className="rounded-md border border-border p-1 text-muted-foreground">
                  <span className="text-[10px] font-bold">MENU</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 1: School Profile */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Building className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {locale === 'am' ? 'የትምህርት ቤቱ መገለጫ' : 'School Profile & Branding'}
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {locale === 'am' ? 'የትምህርት ቤቱ ስም (በአማርኛ) *' : 'School Name (Amharic) *'}
            </label>
            <input
              type="text"
              value={nameAm}
              onChange={(e) => setNameAm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {locale === 'am' ? 'የትምህርት ቤቱ ስም (በእንግሊዝኛ) *' : 'School Name (English) *'}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {locale === 'am' ? 'የደብሩ ስም / ቤተክርስቲያን' : 'Parish / Church Name'}
            </label>
            <input
              type="text"
              value={parish}
              onChange={(e) => setParish(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {locale === 'am' ? 'መሪ ቃል (በአማርኛ)' : 'Motto (Amharic)'}
              </label>
              <input
                type="text"
                value={mottoAm}
                onChange={(e) => setMottoAm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {locale === 'am' ? 'መሪ ቃል (በእንግሊዝኛ)' : 'Motto (English)'}
              </label>
              <input
                type="text"
                value={mottoEn}
                onChange={(e) => setMottoEn(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {locale === 'am' ? 'የትምህርት ቤቱ አርማ (Logo)' : 'School Logo Image'}
            </label>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 p-1">
                {logoUrl && logoUrl !== '/uploads/branding/logo.png' ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {isUploadingLogo
                      ? locale === 'am'
                        ? 'እየተጫነ...'
                        : 'Uploading...'
                      : locale === 'am'
                        ? 'አርማ ምረጥ / ቀይር'
                        : 'Choose Logo Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Details & Localization */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Phone className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-foreground">
                {locale === 'am' ? 'የአድራሻና ግንኙነት መረጃ' : 'Contact Information'}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'ዋና ስልክ ቁጥር *' : 'Primary Phone *'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'ተጨማሪ ስልክ ቁጥር' : 'Secondary Phone'}
                </label>
                <input
                  type="text"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {locale === 'am' ? 'ኦፊሴላዊ ኢሜይል *' : 'Official Email *'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የመገኛ አድራሻ' : 'Physical Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የፖስታ ሣጥን ቁጥር' : 'P.O. Box'}
                </label>
                <input
                  type="text"
                  value={poBox}
                  onChange={(e) => setPoBox(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Localization */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Globe className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-foreground">
                {locale === 'am' ? 'ቋንቋና የቀን መቁጠሪያ' : 'Localization & Calendar'}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'መደበኛ ቋንቋ' : 'Default Language'}
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value as 'am' | 'en')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="am">አማርኛ (Amharic)</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የቀን አቆጣጠር' : 'Default Calendar'}
                </label>
                <select
                  value={calendar}
                  onChange={(e) => setCalendar(e.target.value as 'ethiopian' | 'gregorian')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="ethiopian">
                    {locale === 'am' ? 'የኢትዮጵያ ዘመን አቆጣጠር' : 'Ethiopian Calendar'}
                  </option>
                  <option value="gregorian">
                    {locale === 'am' ? 'የጎርጎርዮሳዊ ዘመን አቆጣጠር' : 'Gregorian Calendar'}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
