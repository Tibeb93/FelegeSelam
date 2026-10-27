'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useSiteSettings } from '@/providers/SiteSettingsProvider';
import {
  Save,
  RotateCcw,
  History,
  Upload,
  Globe,
  Sliders,
  Sparkles,
  FileText,
  Shield,
  AlertTriangle,
  Monitor,
  Smartphone,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Palette,
  CreditCard,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { SchoolLogo } from '@/components/common/SchoolLogo';

// ---------------------------------------------------------------------------
// WCAG Contrast Utilities
// ---------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [15, 76, 129];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getLuminance([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function calculateContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SettingVersionItem {
  id: string;
  settingKey: string;
  settingValue: any;
  changeReason?: string;
  createdAt: string;
  changedBy?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  } | null;
}

export default function SiteSettingsAdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAm = locale === 'am';
  const { user, role, isLoading } = useAuth();
  const toast = useToast();
  const showToast = toast.show;
  const queryClient = useQueryClient();
  const { refetchSettings } = useSiteSettings();

  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name || role;
  const isSuperAdmin = userRole === 'super_admin';
  const userPerms = Array.isArray(user?.role?.permissions)
    ? (user?.role?.permissions as string[])
    : Array.isArray((user as any)?.permissions)
    ? ((user as any).permissions as string[])
    : [];
  const hasSiteWrite = isSuperAdmin || userPerms.includes('site:write');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'identity' | 'appearance' | 'home' | 'about' | 'system' | 'roles' | 'payments' | 'danger'
  >('identity');

  // Preview Mode: desktop vs mobile
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  // Version History Drawer
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [versionKey, setVersionKey] = useState<string>('site_identity');

  // Danger Zone Modals
  const [dangerModal, setDangerModal] = useState<'restore' | 'purge' | 'backup' | null>(null);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [purgeDays, setPurgeDays] = useState(30);

  // File Upload States
  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const heroImageInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Local Form States
  // -------------------------------------------------------------------------
  // Tab 1: Identity
  const [nameAm, setNameAm] = useState('አዕማደ ሰላም ሰንበት ትምህርት ቤት');
  const [nameEn, setNameEn] = useState('Aemade Selam Sunday School');
  const [shortName, setShortName] = useState('አዕማደ ሰላም');
  const [taglineAm, setTaglineAm] = useState('በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ');
  const [taglineEn, setTaglineEn] = useState('Firm in Faith, Shining in Good Deeds');
  const [churchName, setChurchName] = useState('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል');
  const [churchNameEn, setChurchNameEn] = useState('Felegeselam Kidus Giyorgis Cathedral');
  const [townAm, setTownAm] = useState('ፍኖተ ሰላም');
  const [townEn, setTownEn] = useState('Finote Selam');
  const [zoneAm, setZoneAm] = useState('ምዕራብ ጎጃም ዞን');
  const [zoneEn, setZoneEn] = useState('West Gojjam Zone');
  const [regionCountryAm, setRegionCountryAm] = useState('አማራ ክልል፣ ኢትዮጵያ');
  const [regionCountryEn, setRegionCountryEn] = useState('Amhara Region, Ethiopia');
  const [logoUrl, setLogoUrl] = useState('/uploads/branding/logo.png');
  const [faviconUrl, setFaviconUrl] = useState('/favicon.ico');

  // Tab 2: Appearance
  const [heroBgType, setHeroBgType] = useState<'gradient' | 'image' | 'solid'>('gradient');
  const [heroBgImage, setHeroBgImage] = useState<string | null>(null);
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState<number>(65);
  const [heroSolidColor, setHeroSolidColor] = useState('#0A2E52');
  const [primaryColor, setPrimaryColor] = useState('#0F4C81');
  const [accentColor, setAccentColor] = useState('#F2B233');
  const [primaryDark, setPrimaryDark] = useState('#0A2E52');
  const [softBg, setSoftBg] = useState('#E8F1FB');

  // Tab 3: Home Content
  const [heroTitleAm, setHeroTitleAm] = useState('እንኳን ወደ ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል ሰንበት ትምህርት ቤት በደህና መጡ');
  const [heroTitleEn, setHeroTitleEn] = useState('Welcome to the Sunday School of Felegeselam Kidus Giyorgis Cathedral');
  const [heroSubtitleAm, setHeroSubtitleAm] = useState('የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን እምነትና ሥርዓት የሚማሩበትና መንፈሳዊ ሕይወትዎን የሚያዳብሩበት መድረክ');
  const [heroSubtitleEn, setHeroSubtitleEn] = useState('A platform to learn the faith and order of the Church');
  const [welcomeMessageAm, setWelcomeMessageAm] = useState('በሰላም መጡ! በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰንበት ትምህርት ቤት ተማሪዎችና ምዕመናን አገልግሎት።');
  const [welcomeMessageEn, setWelcomeMessageEn] = useState('Welcome! Dedicated to serving students and parishioners of Felegeselam Kidus Giyorgis Cathedral in Finote Selam.');
  const [primaryCtaTextAm, setPrimaryCtaTextAm] = useState('የአባላት ምዝገባ');
  const [primaryCtaTextEn, setPrimaryCtaTextEn] = useState('Member Registration');
  const [primaryCtaLink, setPrimaryCtaLink] = useState('/register');
  const [secondaryCtaTextAm, setSecondaryCtaTextAm] = useState('ትምህርቶችን ይመልከቱ');
  const [secondaryCtaTextEn, setSecondaryCtaTextEn] = useState('Explore Courses');
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('/courses');
  const [sections, setSections] = useState<Array<{ id: string; enabled: boolean; titleAm: string; titleEn: string; order: number }>>([
    { id: 'sinksar', enabled: true, titleAm: 'የዕለቱ ስንክሳር', titleEn: "Today's Synaxarium", order: 1 },
    { id: 'news', enabled: true, titleAm: 'ዜናዎችና ማስታወቂያዎች', titleEn: 'News & Announcements', order: 2 },
    { id: 'courses', enabled: true, titleAm: 'የሚሰጡ ትምህርቶች', titleEn: 'Featured Courses', order: 3 },
    { id: 'mezmur', enabled: true, titleAm: 'የምስጋና መዝሙራት', titleEn: 'Spiritual Hymns', order: 4 },
    { id: 'contact', enabled: true, titleAm: 'አድራሻና ግንኙነት', titleEn: 'Contact Us', order: 5 },
  ]);
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementTextAm, setAnnouncementTextAm] = useState('የዘንድሮው የትምህርት ዘመን ምዝገባ ተጀምሯል!');
  const [announcementTextEn, setAnnouncementTextEn] = useState('Registration for the new academic year is now open!');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'success'>('info');
  const [announcementLink, setAnnouncementLink] = useState('/register');

  // Tab 4: About, Contact & Footer
  const [aboutAm, setAboutAm] = useState('አዕማደ ሰላም ሰንበት ትምህርት ቤት በፍኖተ ሰላም ከተማ በሚገኘው በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል ስር የሚገኝ መንፈሳዊ ተቋም ነው።');
  const [aboutEn, setAboutEn] = useState('Aemade Selam Sunday School is a spiritual institution under Felegeselam Kidus Giyorgis Cathedral in Finote Selam, West Gojjam.');
  const [missionAm, setMissionAm] = useState('ሕፃናትንና ወጣቶችን በኦርቶዶክሳዊት ተዋሕዶ እምነት ማነጽ።');
  const [missionEn, setMissionEn] = useState('Nurturing children and youth in Orthodox Tewahedo faith.');
  const [visionAm, setVisionAm] = useState('በሃይማኖት የጸና፣ በምግባር ያበራና በትምህርት የበለጸገ መንፈሳዊ ትውልድ ማየት።');
  const [visionEn, setVisionEn] = useState('To see a spiritual generation steadfast in faith and radiant in good deeds.');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም፣ አማራ ክልል፣ ኢትዮጵያ');
  const [mapLink, setMapLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [tiktokLink, setTiktokLink] = useState('');
  const [footerCopyrightAm, setFooterCopyrightAm] = useState('© ፳፻፲፰ አዕማደ ሰላም ሰንበት ትምህርት ቤት። መብቱ በሕግ የተጠበቀ ነው።');
  const [footerCopyrightEn, setFooterCopyrightEn] = useState('© 2026 Aemade Selam Sunday School. All rights reserved.');

  // Tab 5: Language & System
  const [defaultLanguage, setDefaultLanguage] = useState<'am' | 'en'>('am');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessageAm, setMaintenanceMessageAm] = useState('ጣቢያችን ለጊዜያዊ እድሳት ተዘግቷል። በቅርቡ እንመለሳለን!');
  const [maintenanceMessageEn, setMaintenanceMessageEn] = useState('Our website is undergoing scheduled maintenance. Back shortly!');
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  const [adminIpAllowlist, setAdminIpAllowlist] = useState('');

  // Tab 6: Roles & Permissions Matrix
  const [rolesMatrix, setRolesMatrix] = useState<Array<{ id: number; name: string; permissions: string[] }>>([]);

  // Tab 7: Membership Fee & Accounts
  const [membershipAmount, setMembershipAmount] = useState<number>(600);
  const [membershipCurrency, setMembershipCurrency] = useState<string>('ETB');
  const [membershipYear, setMembershipYear] = useState<number>(2019);
  const [membershipYearLabel, setMembershipYearLabel] = useState<string>('2019 ዓ.ም.');
  const [membershipDeadline, setMembershipDeadline] = useState<string>('2026-12-31');
  const [paymentAccounts, setPaymentAccounts] = useState<Array<{
    id?: string;
    type: string;
    bankName: string;
    accountName: string;
    accountNumber?: string;
    telebirrNumber?: string;
    active: boolean;
  }>>([
    {
      id: 'cbe-1',
      type: 'cbe',
      bankName: 'የኢትዮጵያ ንግድ ባንክ (CBE)',
      accountName: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
      accountNumber: '1000123456789',
      active: true,
    },
    {
      id: 'telebirr-1',
      type: 'telebirr',
      bankName: 'ቴሌብር (Telebirr)',
      accountName: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
      telebirrNumber: '0911223344',
      active: true,
    },
  ]);

  // -------------------------------------------------------------------------
  // Data Queries
  // -------------------------------------------------------------------------
  const { data: publicData } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: () => apiClient.get<any>('/settings/public'),
  });

  const { data: rolesMatrixData, refetch: refetchRolesMatrix } = useQuery({
    queryKey: ['admin-roles-matrix'],
    queryFn: () => apiClient.get<any>('/settings/roles-matrix'),
    enabled: activeTab === 'roles',
  });

  const { data: dangerStats, refetch: refetchDangerStats } = useQuery({
    queryKey: ['admin-danger-stats'],
    queryFn: () => apiClient.get<any>('/settings/danger/stats'),
    enabled: activeTab === 'danger',
  });

  const { data: paymentsConfigData } = useQuery({
    queryKey: ['admin-payments-config'],
    queryFn: () => apiClient.get<any>('/payments/config'),
  });

  const { data: versionHistory, isLoading: isLoadingVersions } = useQuery<SettingVersionItem[]>({
    queryKey: ['admin-setting-versions', versionKey],
    queryFn: () => apiClient.get<SettingVersionItem[]>(`/settings/versions/${versionKey}`),
    enabled: versionDrawerOpen,
  });

  // Populate state from fetched public data
  useEffect(() => {
    if (!publicData) return;
    const { siteIdentity, appearance, homeContent, aboutContact, systemConfig } = publicData;

    if (siteIdentity) {
      if (siteIdentity.nameAm) setNameAm(siteIdentity.nameAm);
      if (siteIdentity.nameEn) setNameEn(siteIdentity.nameEn);
      if (siteIdentity.shortName) setShortName(siteIdentity.shortName);
      if (siteIdentity.taglineAm) setTaglineAm(siteIdentity.taglineAm);
      if (siteIdentity.taglineEn) setTaglineEn(siteIdentity.taglineEn);
      if (siteIdentity.churchName) setChurchName(siteIdentity.churchName);
      if (siteIdentity.logoUrl) setLogoUrl(siteIdentity.logoUrl);
      if (siteIdentity.faviconUrl) setFaviconUrl(siteIdentity.faviconUrl);
    }

    if (publicData.church) {
      if (publicData.church.nameAm) setChurchName(publicData.church.nameAm);
      if (publicData.church.nameEn) setChurchNameEn(publicData.church.nameEn);
    }

    if (publicData.location) {
      if (publicData.location.townAm) setTownAm(publicData.location.townAm);
      if (publicData.location.townEn) setTownEn(publicData.location.townEn);
      if (publicData.location.zoneAm) setZoneAm(publicData.location.zoneAm);
      if (publicData.location.zoneEn) setZoneEn(publicData.location.zoneEn);
      if (publicData.location.regionCountryAm) setRegionCountryAm(publicData.location.regionCountryAm);
      if (publicData.location.regionCountryEn) setRegionCountryEn(publicData.location.regionCountryEn);
    }

    if (appearance) {
      if (appearance.heroBackgroundType) setHeroBgType(appearance.heroBackgroundType);
      if (appearance.heroBackgroundImage !== undefined) setHeroBgImage(appearance.heroBackgroundImage);
      if (appearance.heroOverlayOpacity !== undefined) setHeroOverlayOpacity(appearance.heroOverlayOpacity);
      if (appearance.heroSolidColor) setHeroSolidColor(appearance.heroSolidColor);
      if (appearance.primaryColor) setPrimaryColor(appearance.primaryColor);
      if (appearance.accentColor) setAccentColor(appearance.accentColor);
      if (appearance.primaryDark) setPrimaryDark(appearance.primaryDark);
      if (appearance.softBg) setSoftBg(appearance.softBg);
    }

    if (homeContent) {
      if (homeContent.heroTitleAm) setHeroTitleAm(homeContent.heroTitleAm);
      if (homeContent.heroTitleEn) setHeroTitleEn(homeContent.heroTitleEn);
      if (homeContent.heroSubtitleAm) setHeroSubtitleAm(homeContent.heroSubtitleAm);
      if (homeContent.heroSubtitleEn) setHeroSubtitleEn(homeContent.heroSubtitleEn);
      if (homeContent.welcomeMessageAm) setWelcomeMessageAm(homeContent.welcomeMessageAm);
      if (homeContent.welcomeMessageEn) setWelcomeMessageEn(homeContent.welcomeMessageEn);
      if (homeContent.primaryCtaTextAm) setPrimaryCtaTextAm(homeContent.primaryCtaTextAm);
      if (homeContent.primaryCtaTextEn) setPrimaryCtaTextEn(homeContent.primaryCtaTextEn);
      if (homeContent.primaryCtaLink) setPrimaryCtaLink(homeContent.primaryCtaLink);
      if (homeContent.secondaryCtaTextAm) setSecondaryCtaTextAm(homeContent.secondaryCtaTextAm);
      if (homeContent.secondaryCtaTextEn) setSecondaryCtaTextEn(homeContent.secondaryCtaTextEn);
      if (homeContent.secondaryCtaLink) setSecondaryCtaLink(homeContent.secondaryCtaLink);
      if (homeContent.sections) setSections(homeContent.sections);
      if (homeContent.announcement) {
        setAnnouncementEnabled(!!homeContent.announcement.enabled);
        if (homeContent.announcement.textAm) setAnnouncementTextAm(homeContent.announcement.textAm);
        if (homeContent.announcement.textEn) setAnnouncementTextEn(homeContent.announcement.textEn);
        if (homeContent.announcement.type) setAnnouncementType(homeContent.announcement.type);
        if (homeContent.announcement.link) setAnnouncementLink(homeContent.announcement.link);
      }
    }

    if (aboutContact) {
      if (aboutContact.aboutAm) setAboutAm(aboutContact.aboutAm);
      if (aboutContact.aboutEn) setAboutEn(aboutContact.aboutEn);
      if (aboutContact.missionAm) setMissionAm(aboutContact.missionAm);
      if (aboutContact.missionEn) setMissionEn(aboutContact.missionEn);
      if (aboutContact.visionAm) setVisionAm(aboutContact.visionAm);
      if (aboutContact.visionEn) setVisionEn(aboutContact.visionEn);
      if (aboutContact.phone) setPhone(aboutContact.phone);
      if (aboutContact.alternatePhone) setAlternatePhone(aboutContact.alternatePhone);
      if (aboutContact.email) setEmail(aboutContact.email);
      if (aboutContact.address) setAddress(aboutContact.address);
      if (aboutContact.mapLink) setMapLink(aboutContact.mapLink);
      if (aboutContact.socialLinks) {
        setTelegramLink(aboutContact.socialLinks.telegram || '');
        setYoutubeLink(aboutContact.socialLinks.youtube || '');
        setFacebookLink(aboutContact.socialLinks.facebook || '');
        setTiktokLink(aboutContact.socialLinks.tiktok || '');
      }
      if (aboutContact.footerCopyrightAm) setFooterCopyrightAm(aboutContact.footerCopyrightAm);
      if (aboutContact.footerCopyrightEn) setFooterCopyrightEn(aboutContact.footerCopyrightEn);
    }

    if (systemConfig) {
      if (systemConfig.defaultLanguage) setDefaultLanguage(systemConfig.defaultLanguage);
      if (systemConfig.maintenanceMode !== undefined) setMaintenanceMode(systemConfig.maintenanceMode);
      if (systemConfig.maintenanceMessageAm) setMaintenanceMessageAm(systemConfig.maintenanceMessageAm);
      if (systemConfig.maintenanceMessageEn) setMaintenanceMessageEn(systemConfig.maintenanceMessageEn);
      if (systemConfig.sessionTimeoutMinutes) setSessionTimeoutMinutes(systemConfig.sessionTimeoutMinutes);
      if (systemConfig.adminIpAllowlist !== undefined) setAdminIpAllowlist(systemConfig.adminIpAllowlist);
    }
  }, [publicData]);

  // Populate roles matrix from query
  useEffect(() => {
    if (rolesMatrixData?.roles) {
      setRolesMatrix(rolesMatrixData.roles);
    }
  }, [rolesMatrixData]);

  // Populate payments config
  useEffect(() => {
    if (paymentsConfigData) {
      if (paymentsConfigData.fee) {
        if (paymentsConfigData.fee.amount) setMembershipAmount(Number(paymentsConfigData.fee.amount));
        if (paymentsConfigData.fee.currency) setMembershipCurrency(paymentsConfigData.fee.currency);
        if (paymentsConfigData.fee.year) setMembershipYear(Number(paymentsConfigData.fee.year));
        if (paymentsConfigData.fee.yearLabel) setMembershipYearLabel(paymentsConfigData.fee.yearLabel);
        if (paymentsConfigData.fee.deadline) setMembershipDeadline(paymentsConfigData.fee.deadline);
      }
      if (paymentsConfigData.accounts && Array.isArray(paymentsConfigData.accounts)) {
        setPaymentAccounts(paymentsConfigData.accounts);
      }
    }
  }, [paymentsConfigData]);

  // -------------------------------------------------------------------------
  // WCAG Contrast Checks
  // -------------------------------------------------------------------------
  const primaryOnWhiteContrast = useMemo(() => {
    return calculateContrastRatio(primaryColor, '#FFFFFF');
  }, [primaryColor]);

  const accentOnNavyContrast = useMemo(() => {
    return calculateContrastRatio(accentColor, '#0A2E52');
  }, [accentColor]);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------
  const saveSettingMutation = useMutation({
    mutationFn: async ({ key, value, reason }: { key: string; value: any; reason?: string }) => {
      return apiClient.put(`/settings/${key}`, { settingValue: value, changeReason: reason });
    },
    onSuccess: (_, variables) => {
      showToast({
        type: 'success',
        title: isAm ? 'ቅንብሩ በተሳካ ሁኔታ ተቀምጧል' : 'Setting saved successfully',
        message: isAm
          ? `${variables.key} በተሳካ ሁኔታ ተሻሽሏል`
          : `${variables.key} has been updated. Changes take effect immediately.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      refetchSettings();
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: isAm ? 'ስህተት ተከስቷል' : 'Failed to save setting',
        message: err.message || (isAm ? 'ቅንብሩን ማስቀመጥ አልተቻለም' : 'An error occurred while saving.'),
      });
    },
  });

  const resetSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiClient.post(`/settings/reset/${key}`);
    },
    onSuccess: (_, key) => {
      showToast({
        type: 'info',
        title: isAm ? 'ወደ መደበኛ ሁኔታ ተመልሷል' : 'Reset to default',
        message: isAm ? `${key} ወደ ቀድሞው መደበኛ ይዘት ተመልሷል` : `${key} has been reset to defaults.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      refetchSettings();
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: isAm ? 'ስህተት' : 'Error',
        message: err.message || 'Failed to reset setting',
      });
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async ({ key, versionId }: { key: string; versionId: string }) => {
      return apiClient.post(`/settings/restore/${key}/${versionId}`);
    },
    onSuccess: () => {
      showToast({
        type: 'success',
        title: isAm ? 'ቀዳሚው ቅጂ ተመልሷል' : 'Version restored',
        message: isAm ? 'የተመረጠው የቅንብር ቅጂ በተሳካ ሁኔታ ተመልሷል' : 'Selected version has been restored.',
      });
      setVersionDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      refetchSettings();
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: isAm ? 'ስህተት' : 'Error',
        message: err.message || 'Failed to restore version',
      });
    },
  });

  const updateRolesMatrixMutation = useMutation({
    mutationFn: async (matrix: Array<{ roleId: number; permissions: string[] }>) => {
      return apiClient.put('/settings/roles-matrix', { matrix });
    },
    onSuccess: () => {
      showToast({
        type: 'success',
        title: isAm ? 'የሚና ፈቃዶች ተሻሽለዋል' : 'Roles & Permissions updated',
        message: isAm ? 'የፈቃዶች ሰንጠረዥ በተሳካ ሁኔታ ተቀምጧል' : 'Permissions matrix has been saved.',
      });
      refetchRolesMatrix();
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: isAm ? 'ስህተት' : 'Error',
        message: err.message || 'Failed to update roles matrix',
      });
    },
  });

  // Danger actions
  const restoreMembersMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/settings/danger/restore-members', { confirmation: typedConfirmation });
    },
    onSuccess: (data: any) => {
      showToast({
        type: 'success',
        title: isAm ? 'አባላት ተመልሰዋል' : 'Members restored',
        message: data.message || `Successfully restored ${data.restoredCount} members.`,
      });
      setDangerModal(null);
      setTypedConfirmation('');
      refetchDangerStats();
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: isAm ? 'ስህተት' : 'Error',
        message: err.message || 'Failed to restore members',
      });
    },
  });

  const purgeAuditLogsMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/settings/danger/purge-audit-logs', {
        confirmation: typedConfirmation,
        days: purgeDays,
      });
    },
    onSuccess: (data: any) => {
      showToast({
        type: 'info',
        title: isAm ? 'የኦዲት መዝገብ ጸድቷል' : 'Audit logs purged',
        message: data.message || `Purged ${data.purgedCount} audit logs.`,
      });
      setDangerModal(null);
      setTypedConfirmation('');
      refetchDangerStats();
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: isAm ? 'ስህተት' : 'Error',
        message: err.message || 'Failed to purge audit logs',
      });
    },
  });

  const generateBackupMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/settings/danger/backup', { confirmation: typedConfirmation });
    },
    onSuccess: (data: any) => {
      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `felege-selam-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: isAm ? 'ምትኬ ወርዷል' : 'Backup downloaded',
        message: isAm ? 'የስርዓቱ ሙሉ የውሂብ ምትኬ ፋይል በተሳካ ሁኔታ ተዘጋጅቷል' : 'System backup JSON file has been downloaded.',
      });
      setDangerModal(null);
      setTypedConfirmation('');
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: isAm ? 'ስህተት' : 'Error',
        message: err.message || 'Failed to create backup',
      });
    },
  });

  // -------------------------------------------------------------------------
  // Branding File Upload Handler
  // -------------------------------------------------------------------------
  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'hero') => {
    // Client-side validations
    const maxSizes = {
      logo: 2 * 1024 * 1024,
      favicon: 1 * 1024 * 1024,
      hero: 5 * 1024 * 1024,
    };

    if (file.size > maxSizes[type]) {
      showToast({
        type: 'error',
        title: isAm ? 'የፋይል መጠን ይበልጣል' : 'File too large',
        message: isAm
          ? `የፋይሉ መጠን ከ ${(maxSizes[type] / (1024 * 1024)).toFixed(0)}MB መብለጥ የለበትም`
          : `File exceeds maximum limit of ${(maxSizes[type] / (1024 * 1024)).toFixed(0)}MB`,
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    setIsUploading(true);
    try {
      const res = await apiClient.post<any>(`/settings/upload-branding?type=${type}`, formData);
      if (res.fileUrl) {
        if (type === 'logo') setLogoUrl(res.fileUrl);
        else if (type === 'favicon') setFaviconUrl(res.fileUrl);
        else if (type === 'hero') setHeroBgImage(res.fileUrl);

        showToast({
          type: 'success',
          title: isAm ? 'ፋይሉ በተሳካ ሁኔታ ተጭኗል' : 'Uploaded successfully',
          message: isAm ? 'ምስሉ ተጭኗል፤ ለማጽናት Save የሚለውን ይጫኑ' : 'Asset processed. Remember to click Save.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: isAm ? 'የጭነት ስህተት' : 'Upload failed',
        message: err.message || 'Failed to upload image',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Tab Save Actions
  // -------------------------------------------------------------------------
  const handleSaveCurrentTab = () => {
    if (activeTab === 'identity') {
      saveSettingMutation.mutate({
        key: 'site_identity',
        value: {
          nameAm,
          nameEn,
          shortName,
          taglineAm,
          taglineEn,
          churchName,
          churchNameEn,
          townAm,
          townEn,
          zoneAm,
          zoneEn,
          regionCountryAm,
          regionCountryEn,
          logoUrl,
          faviconUrl,
        },
        reason: 'Updated site identity and branding',
      });
      saveSettingMutation.mutate({
        key: 'identity.church',
        value: {
          nameAm: churchName,
          nameEn: churchNameEn,
          cathedral: true,
          patronSaintAm: 'ቅዱስ ጊዮርጊስ',
          patronSaintEn: 'Saint George',
        },
        reason: 'Updated church identity',
      });
      saveSettingMutation.mutate({
        key: 'identity.location',
        value: {
          townAm,
          townEn,
          zoneAm,
          zoneEn,
          regionCountryAm,
          regionCountryEn,
          combinedAm: `${churchName}፣ ${townAm}፣ ${zoneAm.replace(' ዞን', '')}`,
          combinedEn: `${churchNameEn}, ${townEn}, ${zoneEn.replace(' Zone', '')}`,
          latitude: '',
          longitude: '',
        },
        reason: 'Updated location identity',
      });
    } else if (activeTab === 'appearance') {
      saveSettingMutation.mutate({
        key: 'appearance',
        value: {
          heroBackgroundType: heroBgType,
          heroBackgroundImage: heroBgImage,
          heroOverlayOpacity,
          heroSolidColor,
          primaryColor,
          accentColor,
          primaryDark,
          softBg,
        },
        reason: 'Updated appearance tokens and hero background',
      });
    } else if (activeTab === 'home') {
      saveSettingMutation.mutate({
        key: 'home_content',
        value: {
          heroTitleAm,
          heroTitleEn,
          heroSubtitleAm,
          heroSubtitleEn,
          welcomeMessageAm,
          welcomeMessageEn,
          primaryCtaTextAm,
          primaryCtaTextEn,
          primaryCtaLink,
          secondaryCtaTextAm,
          secondaryCtaTextEn,
          secondaryCtaLink,
          sections,
          announcement: {
            enabled: announcementEnabled,
            textAm: announcementTextAm,
            textEn: announcementTextEn,
            type: announcementType,
            link: announcementLink,
          },
        },
        reason: 'Updated home page content and announcement banner',
      });
    } else if (activeTab === 'about') {
      saveSettingMutation.mutate({
        key: 'about_contact',
        value: {
          aboutAm,
          aboutEn,
          missionAm,
          missionEn,
          visionAm,
          visionEn,
          phone,
          alternatePhone,
          email,
          address,
          mapLink,
          socialLinks: {
            telegram: telegramLink,
            youtube: youtubeLink,
            facebook: facebookLink,
            tiktok: tiktokLink,
          },
          footerCopyrightAm,
          footerCopyrightEn,
        },
        reason: 'Updated about page, contacts, and footer text',
      });
    } else if (activeTab === 'system') {
      saveSettingMutation.mutate({
        key: 'system_config',
        value: {
          defaultLanguage,
          maintenanceMode,
          maintenanceMessageAm,
          maintenanceMessageEn,
          sessionTimeoutMinutes,
          adminIpAllowlist,
        },
        reason: 'Updated system security and localization settings',
      });
    } else if (activeTab === 'roles') {
      updateRolesMatrixMutation.mutate(
        rolesMatrix.map((r) => ({ roleId: r.id, permissions: r.permissions })),
      );
    } else if (activeTab === 'payments') {
      saveSettingMutation.mutate({
        key: 'membership.fee',
        value: {
          amount: Number(membershipAmount),
          currency: membershipCurrency,
          year: Number(membershipYear),
          yearLabel: membershipYearLabel,
          deadline: membershipDeadline,
        },
        reason: 'Updated membership fee schedule',
      });
      saveSettingMutation.mutate({
        key: 'payment.accounts',
        value: paymentAccounts,
        reason: 'Updated active payment accounts',
      });
    }
  };

  const handleResetCurrentTab = () => {
    const keyMap: Record<string, string> = {
      identity: 'site_identity',
      appearance: 'appearance',
      home: 'home_content',
      about: 'about_contact',
      system: 'system_config',
      payments: 'membership.fee',
    };
    const key = keyMap[activeTab];
    if (key) {
      if (confirm(isAm ? 'እርግጠኛ ነዎት ይህን ክፍል ወደ መደበኛ ይዘቱ መመለስ ይፈልጋሉ?' : 'Reset this section to defaults?')) {
        resetSettingMutation.mutate(key);
      }
    }
  };

  const handleOpenVersions = () => {
    const keyMap: Record<string, string> = {
      identity: 'site_identity',
      appearance: 'appearance',
      home: 'home_content',
      about: 'about_contact',
      system: 'system_config',
      payments: 'membership.fee',
    };
    const k = keyMap[activeTab] || 'site_identity';
    setVersionKey(k);
    setVersionDrawerOpen(true);
  };

  // Section Ordering Helpers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[newIdx];
    newSections[newIdx] = temp;
    // update order numbers
    newSections.forEach((s, idx) => (s.order = idx + 1));
    setSections(newSections);
  };

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  // Role Permissions Helpers
  const toggleRolePermission = (roleId: number, permKey: string) => {
    setRolesMatrix((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const perms = r.permissions || [];
        const exists = perms.includes(permKey);
        const nextPerms = exists ? perms.filter((p) => p !== permKey) : [...perms, permKey];
        return { ...r, permissions: nextPerms };
      }),
    );
  };

  // Show spinner while auth state is loading
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent" />
      </div>
    );
  }

  // Authorization check guard
  if (!hasSiteWrite) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto rounded-2xl bg-amber-50 border border-amber-200 p-8 text-center text-amber-900 shadow-sm">
          <Shield className="h-14 w-14 mx-auto mb-4 text-amber-600" />
          <h2 className="text-2xl font-bold mb-2">
            {isAm ? 'ይህንን ገጽ የማግኘት ፈቃድ የለዎትም' : 'Access Restricted'}
          </h2>
          <p className="text-sm text-amber-800 leading-relaxed mb-4">
            {isAm
              ? 'የጣቢያ ቅንብሮችን የማሻሻል ፈቃድ (site:write) ለዋና አስተዳዳሪ (Super Admin) ብቻ የተሰጠ ነው። እባክዎ ለዋና አስተዳዳሪው ያመልክቱ።'
              : 'Site control requires the "site:write" permission assigned to Super Admins. Please contact your system administrator.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ------------------------------------------------------------------- */}
      {/* Header & Global Action Bar */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D7E3F1] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F4C81]">
            <Sparkles className="h-4 w-4 text-[#F2B233]" />
            <span>{isAm ? 'የጣቢያ ቁጥጥር ማዕከል (Super Admin)' : 'Site Settings & Control'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2438] tracking-tight">
            {isAm ? 'የጣቢያ ቅንብሮች' : 'Site Identity & Appearance'}
          </h1>
          <p className="text-sm text-[#5B6B7C]">
            {isAm
              ? 'የድረ-ገጹን ገጽታ፣ ስም፣ አርማ፣ ቀለማት እና ይዘቶች ያለ ኮድ በቀጥታ ይቆጣጠሩ።'
              : 'Customize branding, colors, content, roles, and danger zone safely with real-time preview.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab !== 'danger' && activeTab !== 'roles' && (
            <button
              type="button"
              onClick={handleOpenVersions}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D7E3F1] bg-white text-xs font-semibold text-[#0F2438] hover:bg-[#E8F1FB] hover:border-[#1E78C8] transition-colors shadow-2xs"
            >
              <History className="h-4 w-4 text-[#0F4C81]" />
              <span>{isAm ? 'የቀደሙ ቅጂዎች (Versions)' : 'Version History'}</span>
            </button>
          )}

          {activeTab !== 'danger' && activeTab !== 'roles' && (
            <button
              type="button"
              onClick={handleResetCurrentTab}
              disabled={resetSettingMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D7E3F1] bg-white text-xs font-semibold text-[#C62828] hover:bg-red-50 hover:border-red-300 transition-colors shadow-2xs disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{isAm ? 'ወደ መደበኛ መልስ' : 'Reset Tab'}</span>
            </button>
          )}

          {activeTab !== 'danger' && (
            <button
              type="button"
              data-testid="save-site-settings-btn"
              onClick={handleSaveCurrentTab}
              disabled={saveSettingMutation.isPending || updateRolesMatrixMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C81] text-white text-sm font-bold shadow-md hover:bg-[#0A2E52] focus:ring-2 focus:ring-[#1E78C8] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4 text-[#F2B233]" />
              <span>
                {saveSettingMutation.isPending || updateRolesMatrixMutation.isPending
                  ? isAm ? 'በማስቀመጥ ላይ...' : 'Saving...'
                  : isAm ? 'ለውጦችን መዝግብ' : 'Save Changes'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 7 Tabs Navigation Bar */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex border-b border-[#D7E3F1] overflow-x-auto no-scrollbar gap-1 text-sm font-semibold">
        {[
          { id: 'identity', labelAm: '፩. መለያና አርማ', labelEn: '1. Identity', icon: Globe },
          { id: 'appearance', labelAm: '፪. ገጽታና ቀለማት', labelEn: '2. Appearance', icon: Palette },
          { id: 'home', labelAm: '፫. የመነሻ ገጽ', labelEn: '3. Home Content', icon: Layers },
          { id: 'about', labelAm: '፬. ስለ እኛና አድራሻ', labelEn: '4. About & Contact', icon: FileText },
          { id: 'system', labelAm: '፭. ቋንቋና ሥርዓት', labelEn: '5. System & Language', icon: Sliders },
          { id: 'roles', labelAm: '፮. ሚናዎችና ፈቃዶች', labelEn: '6. Roles Matrix', icon: Shield },
          { id: 'payments', labelAm: '፯. ክፍያና ሂሳቦች', labelEn: '7. Membership & Accounts', icon: CreditCard },
          { id: 'danger', labelAm: '፰. አደገኛ ተግባራት', labelEn: '8. Danger Zone', icon: AlertTriangle, danger: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-bold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? tab.danger
                    ? 'border-[#C62828] text-[#C62828] bg-red-50/50'
                    : 'border-[#0F4C81] text-[#0F4C81] bg-[#E8F1FB]/60'
                  : 'border-transparent text-[#5B6B7C] hover:text-[#0F2438] hover:border-[#D7E3F1]'
              }`}
            >
              <Icon className={`h-4 w-4 ${tab.danger ? 'text-[#C62828]' : isActive ? 'text-[#0F4C81]' : 'text-[#5B6B7C]'}`} />
              <span>{isAm ? tab.labelAm : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Main Grid: Form on Left (60%), Live Preview on Right (40%) */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: ACTIVE TAB FORM */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: IDENTITY */}
          {activeTab === 'identity' && (
            <div className="bg-white rounded-2xl border border-[#D7E3F1] p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2438]">
                  {isAm ? 'የትምህርት ቤቱ መለያና አርማ' : 'School Identity & Logo'}
                </h2>
                <p className="text-xs text-[#5B6B7C]">
                  {isAm
                    ? 'እነዚህ መረጃዎች በራስጌው፣ በመግቢያ ገጾች፣ በሰርቲፊኬትና መታወቂያ ካርዶች ላይ በቀጥታ ይታያሉ።'
                    : 'Used in public headers, login cards, certificates, and ID cards.'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'የትምህርት ቤቱ ሙሉ ስም (በአማርኛ) *' : 'School Full Name (Amharic) *'}
                  </label>
                  <input
                    type="text"
                    data-testid="input-name-am"
                    value={nameAm}
                    onChange={(e) => setNameAm(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'የትምህርት ቤቱ ስም (በእንግሊዝኛ) *' : 'School Name (English) *'}
                  </label>
                  <input
                    type="text"
                    data-testid="input-name-en"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'አጭር መጠሪያ (Short Name)' : 'Short Name'}
                    </label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'የካቴድራሉ / የቤተክርስቲያኑ ስም (በአማርኛ) *' : 'Cathedral / Church Name (Amharic) *'}
                    </label>
                    <input
                      type="text"
                      data-testid="input-church-name-am"
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'የካቴድራሉ / የቤተክርስቲያኑ ስም (በእንግሊዝኛ) *' : 'Cathedral / Church Name (English) *'}
                    </label>
                    <input
                      type="text"
                      data-testid="input-church-name-en"
                      value={churchNameEn}
                      onChange={(e) => setChurchNameEn(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'ከተማ (Town / City)' : 'Town / City'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="አማርኛ (ፍኖተ ሰላም)"
                        value={townAm}
                        onChange={(e) => setTownAm(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                      />
                      <input
                        type="text"
                        placeholder="English (Finote Selam)"
                        value={townEn}
                        onChange={(e) => setTownEn(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'ዞን (Zone)' : 'Zone'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="ምዕራብ ጎጃም ዞን"
                        value={zoneAm}
                        onChange={(e) => setZoneAm(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                      />
                      <input
                        type="text"
                        placeholder="West Gojjam Zone"
                        value={zoneEn}
                        onChange={(e) => setZoneEn(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'ክልልና አገር (Region & Country)' : 'Region & Country'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="አማራ ክልል፣ ኢትዮጵያ"
                        value={regionCountryAm}
                        onChange={(e) => setRegionCountryAm(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                      />
                      <input
                        type="text"
                        placeholder="Amhara Region, Ethiopia"
                        value={regionCountryEn}
                        onChange={(e) => setRegionCountryEn(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'መሪ ቃል / መፈክር (በአማርኛ)' : 'Motto / Tagline (Amharic)'}
                  </label>
                  <input
                    type="text"
                    data-testid="input-tagline-am"
                    value={taglineAm}
                    onChange={(e) => setTaglineAm(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'መሪ ቃል / መፈክር (በእንግሊዝኛ)' : 'Motto / Tagline (English)'}
                  </label>
                  <input
                    type="text"
                    value={taglineEn}
                    onChange={(e) => setTaglineEn(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E78C8]"
                  />
                </div>

                {/* Logo Upload Section */}
                <div className="pt-2 border-t border-[#D7E3F1]">
                  <label className="block text-xs font-bold text-[#0F2438] mb-2">
                    {isAm ? 'የትምህርት ቤቱ አርማ / Logo (PNG, JPG, SVG - ከፍተኛ 2MB)' : 'School Logo (PNG, JPG, SVG, max 2MB)'}
                  </label>
                  <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-[#D7E3F1] bg-[#F8FAFD] hover:border-[#1E78C8] transition-colors">
                    <SchoolLogo size={64} logoUrl={logoUrl} />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-semibold text-[#0F2438]">
                        {logoUrl ? logoUrl.split('/').pop() : 'Default Emblem SVG'}
                      </p>
                      <p className="text-[11px] text-[#5B6B7C]">
                        {isAm ? 'ለውጤትና ምስክር ወረቀቶች ግልጽ የሆነ PNG ወይም SVG ይመረጣል' : 'Sharp-optimized transparent PNG or SVG recommended'}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isUploading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F4C81] text-white text-xs font-bold hover:bg-[#0A2E52] cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>{isUploading ? (isAm ? 'በመጫን ላይ...' : 'Uploading...') : (isAm ? 'አዲስ አርማ ጫን' : 'Upload New Logo')}</span>
                        </button>
                        {logoUrl !== '/uploads/branding/logo.png' && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl('/uploads/branding/logo.png')}
                            className="text-xs text-[#C62828] hover:underline cursor-pointer"
                          >
                            {isAm ? 'ወደ ነባሪ መልስ' : 'Revert to Default'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                  />
                </div>

                {/* Favicon Upload Section */}
                <div className="pt-2 border-t border-[#D7E3F1]">
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ፋቪኮን (Favicon - ከፍተኛ 1MB)' : 'Favicon Icon (max 1MB)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs font-mono"
                      placeholder="/favicon.ico"
                    />
                    <button
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      className="h-10 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-xs font-bold text-[#0F4C81] hover:bg-[#E8F1FB] cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{isAm ? 'ጫን' : 'Browse'}</span>
                    </button>
                  </div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/x-icon,image/svg+xml,image/vnd.microsoft.icon"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'favicon');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE & COLORS */}
          {activeTab === 'appearance' && (
            <div className="bg-white rounded-2xl border border-[#D7E3F1] p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2438]">
                  {isAm ? 'ገጽታ፣ ቀለማት እና የጀርባ ምስል' : 'Appearance, Colors & Hero Background'}
                </h2>
                <p className="text-xs text-[#5B6B7C]">
                  {isAm
                    ? 'የመነሻ ገጹን ጀርባ እና የቀለማት መለያዎችን ይቆጣጠሩ። የንፅፅር ደረጃ በራስ-ሰር ይሰላል።'
                    : 'Manage hero backgrounds and primary brand tokens with automated WCAG contrast checks.'}
                </p>
              </div>

              {/* Contrast Checker Alert Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  primaryOnWhiteContrast < 4.5
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {primaryOnWhiteContrast < 4.5 ? (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>
                      {isAm ? 'የቀለም ንፅፅር ደረጃ (WCAG 4.5:1 Contrast):' : 'WCAG Contrast Ratio:'}
                    </span>
                    <span className="font-mono text-sm underline">
                      {primaryOnWhiteContrast.toFixed(2)}:1
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        primaryOnWhiteContrast >= 7.0
                          ? 'bg-emerald-200 text-emerald-900'
                          : primaryOnWhiteContrast >= 4.5
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {primaryOnWhiteContrast >= 7.0
                        ? 'Pass AAA'
                        : primaryOnWhiteContrast >= 4.5
                        ? 'Pass AA'
                        : 'Fail (Low Contrast)'}
                    </span>
                  </div>
                  <p className="leading-relaxed opacity-90">
                    {primaryOnWhiteContrast < 4.5
                      ? isAm
                        ? 'ማስጠንቀቂያ፡ የተመረጠው ዋና ቀለም ከነጭ ጽሑፍ ጋር ያለው ንፅፅር ዝቅተኛ ስለሆነ ለማንበብ አስቸጋሪ ሊሆን ይችላል። ደማቅ ሰማያዊ እንዲመርጡ ይመከራል።'
                        : 'Warning: The selected primary color has insufficient contrast against white text (< 4.5:1). Please pick a deeper shade.'
                      : isAm
                      ? 'እጅግ በጣም ጥሩ! የተመረጠው ቀለም ከፍተኛ የንፅፅር ደረጃ ያለውና ለማንበብ ግልጽ ነው።'
                      : 'Great! The primary color passes standard WCAG accessibility contrast requirements.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1 border-t border-current/15 text-[11px]">
                    <span className="font-semibold">
                      {isAm ? 'የወርቅ ማድመቂያ ከደማቅ ሰማያዊ ጋር (Accent on Navy):' : 'Accent on Navy Contrast:'}
                    </span>
                    <span className="font-mono font-bold">{accentOnNavyContrast.toFixed(2)}:1</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        accentOnNavyContrast >= 4.5
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {accentOnNavyContrast >= 4.5 ? 'Pass AA' : 'Notice'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ዋና ቀለም (Primary 700 - Headers/Buttons)' : 'Primary Color (#0F4C81)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-11 w-14 rounded-xl border border-[#D7E3F1] cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 h-11 px-3 rounded-xl border border-[#D7E3F1] font-mono text-sm uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ጎልድ አክሰንት (Accent Gold - Buttons/Highlights)' : 'Accent Gold (#F2B233)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-11 w-14 rounded-xl border border-[#D7E3F1] cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 h-11 px-3 rounded-xl border border-[#D7E3F1] font-mono text-sm uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Hero Background Mode */}
              <div className="space-y-4 pt-4 border-t border-[#D7E3F1]">
                <label className="block text-xs font-bold text-[#0F2438]">
                  {isAm ? 'የመነሻ ገጽ (Hero) የጀርባ አይነት' : 'Hero Section Background Type'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'gradient', labelAm: 'ግራዲየንት (Gradient)', labelEn: 'Gradient' },
                    { id: 'image', labelAm: 'ምስል (Image)', labelEn: 'Image Upload' },
                    { id: 'solid', labelAm: 'ጠጣር ቀለም (Solid)', labelEn: 'Solid Color' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setHeroBgType(mode.id as any)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        heroBgType === mode.id
                          ? 'border-[#0F4C81] bg-[#E8F1FB] text-[#0F4C81] shadow-2xs ring-1 ring-[#0F4C81]'
                          : 'border-[#D7E3F1] bg-white text-[#5B6B7C] hover:border-[#1E78C8]'
                      }`}
                    >
                      {isAm ? mode.labelAm : mode.labelEn}
                    </button>
                  ))}
                </div>

                {heroBgType === 'image' && (
                  <div className="space-y-4 p-4 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F2438]">
                        {isAm ? 'የጀርባ ምስል መጫኛ (ከፍተኛ 5MB)' : 'Hero Background Image (max 5MB)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => heroImageInputRef.current?.click()}
                        disabled={isUploading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F4C81] text-white text-xs font-bold hover:bg-[#0A2E52] cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{isAm ? 'ምስል ይምረጡ' : 'Upload Hero Image'}</span>
                      </button>
                    </div>

                    {heroBgImage && (
                      <div className="relative h-28 w-full rounded-lg overflow-hidden border border-[#D7E3F1]">
                        <img src={heroBgImage} alt="Hero Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setHeroBgImage(null)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Dark Overlay Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>{isAm ? 'የደማቅ ጥላ መጠን (Dark Overlay)' : 'Dark Overlay Opacity'}</span>
                        <span className="font-mono text-[#0F4C81]">{heroOverlayOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={heroOverlayOpacity}
                        onChange={(e) => setHeroOverlayOpacity(Number(e.target.value))}
                        className="w-full accent-[#0F4C81] cursor-pointer"
                      />
                      <p className="text-[11px] text-[#5B6B7C] mt-1">
                        {isAm
                          ? 'ጽሑፉ በምስሉ ላይ በግልጽ እንዲታይ ጥላውን 50%-80% ማድረግ ይመረጣል።'
                          : 'Ensures hero text contrast remains readable over busy photos.'}
                      </p>
                    </div>

                    <input
                      ref={heroImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'hero');
                      }}
                    />
                  </div>
                )}

                {heroBgType === 'solid' && (
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'የጀርባው ጠጣር ቀለም' : 'Solid Background Color'}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={heroSolidColor}
                        onChange={(e) => setHeroSolidColor(e.target.value)}
                        className="h-10 w-14 rounded-xl border border-[#D7E3F1] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={heroSolidColor}
                        onChange={(e) => setHeroSolidColor(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl border border-[#D7E3F1] font-mono text-sm uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HOME CONTENT & ANNOUNCEMENT */}
          {activeTab === 'home' && (
            <div className="bg-white rounded-2xl border border-[#D7E3F1] p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2438]">
                  {isAm ? 'የመነሻ ገጽ ይዘቶችና ማስታወቂያ' : 'Home Content & Announcement Banner'}
                </h2>
                <p className="text-xs text-[#5B6B7C]">
                  {isAm
                    ? 'የመነሻ ገጹን አርእስቶች፣ መግለጫዎች፣ አዝራሮችና ክፍሎች ቅደም ተከተል ያስተካክሉ።'
                    : 'Manage hero titles, CTA links, announcement banners, and section visibility.'}
                </p>
              </div>

              {/* Announcement Banner Controls */}
              <div className="p-4 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F2438] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#F2B233]" />
                    <span>{isAm ? 'አስቸኳይ ማስታወቂያ ባነር (Announcement Banner)' : 'Announcement Banner'}</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementEnabled}
                      onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F4C81]"></div>
                  </label>
                </div>

                {announcementEnabled && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6B7C] mb-1">
                        {isAm ? 'የማስታወቂያ ጽሑፍ (በአማርኛ)' : 'Banner Text (Amharic)'}
                      </label>
                      <input
                        type="text"
                        value={announcementTextAm}
                        onChange={(e) => setAnnouncementTextAm(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6B7C] mb-1">
                        {isAm ? 'የማስታወቂያ ጽሑፍ (በእንግሊዝኛ)' : 'Banner Text (English)'}
                      </label>
                      <input
                        type="text"
                        value={announcementTextEn}
                        onChange={(e) => setAnnouncementTextEn(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#5B6B7C] mb-1">
                          {isAm ? 'የባነሩ አይነት' : 'Banner Style'}
                        </label>
                        <select
                          value={announcementType}
                          onChange={(e) => setAnnouncementType(e.target.value as any)}
                          className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                        >
                          <option value="info">Info (ሰማያዊ)</option>
                          <option value="warning">Warning (ቢጫ)</option>
                          <option value="success">Success (አረንጓዴ)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#5B6B7C] mb-1">
                          {isAm ? 'የሊንክ አድራሻ (አማራጭ)' : 'Optional Target Link'}
                        </label>
                        <input
                          type="text"
                          value={announcementLink}
                          onChange={(e) => setAnnouncementLink(e.target.value)}
                          placeholder="/register"
                          className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hero Title & Subtitle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ዋና የደህና መጡ መልዕክት (በአማርኛ)' : 'Hero Title (Amharic)'}
                  </label>
                  <input
                    type="text"
                    value={heroTitleAm}
                    onChange={(e) => setHeroTitleAm(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ዋና የደህና መጡ መልዕክት (በእንግሊዝኛ)' : 'Hero Title (English)'}
                  </label>
                  <input
                    type="text"
                    value={heroTitleEn}
                    onChange={(e) => setHeroTitleEn(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ንዑስ አርእስት (በአማርኛ)' : 'Hero Subtitle (Amharic)'}
                  </label>
                  <input
                    type="text"
                    value={heroSubtitleAm}
                    onChange={(e) => setHeroSubtitleAm(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ሙሉ የእንኳን ደህና መጡ መልዕክት (በአማርኛ)' : 'Welcome Message (Amharic)'}
                  </label>
                  <textarea
                    rows={2}
                    value={welcomeMessageAm}
                    onChange={(e) => setWelcomeMessageAm(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D7E3F1] bg-white text-xs leading-relaxed"
                  />
                </div>

                {/* CTA Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD] space-y-2">
                    <span className="text-xs font-bold text-[#0F4C81]">{isAm ? 'ዋና አዝራር (Primary CTA)' : 'Primary Button'}</span>
                    <input
                      type="text"
                      placeholder="Button Text"
                      value={primaryCtaTextAm}
                      onChange={(e) => setPrimaryCtaTextAm(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#D7E3F1] bg-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="/register"
                      value={primaryCtaLink}
                      onChange={(e) => setPrimaryCtaLink(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#D7E3F1] bg-white text-xs font-mono"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD] space-y-2">
                    <span className="text-xs font-bold text-[#5B6B7C]">{isAm ? 'ሁለተኛ አዝራር (Secondary CTA)' : 'Secondary Button'}</span>
                    <input
                      type="text"
                      placeholder="Button Text"
                      value={secondaryCtaTextAm}
                      onChange={(e) => setSecondaryCtaTextAm(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#D7E3F1] bg-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="/courses"
                      value={secondaryCtaLink}
                      onChange={(e) => setSecondaryCtaLink(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#D7E3F1] bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Section Order & Visibility */}
                <div className="pt-4 border-t border-[#D7E3F1] space-y-3">
                  <label className="block text-xs font-bold text-[#0F2438]">
                    {isAm ? 'የመነሻ ገጽ ክፍሎች ቅደም ተከተልና ማሳያ (Section Order & Visibility)' : 'Home Sections Order & Visibility'}
                  </label>
                  <div className="space-y-2">
                    {sections.map((sec, idx) => (
                      <div
                        key={sec.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          sec.enabled ? 'bg-white border-[#D7E3F1]' : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#E8F1FB] text-[#0F4C81] font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-[#0F2438]">
                              {isAm ? sec.titleAm : sec.titleEn}
                            </span>
                            <span className="ml-2 text-[10px] text-[#5B6B7C] font-mono">
                              ({sec.id})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="h-4 w-4 text-[#5B6B7C]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 'down')}
                            disabled={idx === sections.length - 1}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="h-4 w-4 text-[#5B6B7C]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSection(sec.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              sec.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {sec.enabled ? (isAm ? 'ክፍት' : 'Enabled') : (isAm ? 'ዝግ' : 'Disabled')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT, CONTACT & FOOTER */}
          {activeTab === 'about' && (
            <div className="bg-white rounded-2xl border border-[#D7E3F1] p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2438]">
                  {isAm ? 'ስለ እኛ፣ አድራሻና ማኅበራዊ ትስስር' : 'About Us, Contact & Social Links'}
                </h2>
                <p className="text-xs text-[#5B6B7C]">
                  {isAm
                    ? 'ስለ ሰንበት ት/ቤቱ፣ ራዕይ፣ ተልዕኮ፣ የስልክና የካርታ አድራሻ እንዲሁም የማኅበራዊ ሚዲያ ሊንኮች።'
                    : 'Configure institutional mission, phone, map coordinates, and social media links.'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ስለ ሰንበት ት/ቤቱ መግለጫ (በአማርኛ)' : 'About Description (Amharic)'}
                  </label>
                  <textarea
                    rows={3}
                    value={aboutAm}
                    onChange={(e) => setAboutAm(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D7E3F1] bg-white text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'ተልዕኮ / Mission (በአማርኛ)' : 'Mission (Amharic)'}
                    </label>
                    <textarea
                      rows={2}
                      value={missionAm}
                      onChange={(e) => setMissionAm(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'ራዕይ / Vision (በአማርኛ)' : 'Vision (Amharic)'}
                    </label>
                    <textarea
                      rows={2}
                      value={visionAm}
                      onChange={(e) => setVisionAm(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#D7E3F1]">
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'ዋና ስልክ' : 'Primary Phone'}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'ተጨማሪ ስልክ' : 'Alternate Phone'}
                    </label>
                    <input
                      type="text"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F2438] mb-1">
                      {isAm ? 'ኢሜይል' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'አድራሻ (ቦታ)' : 'Physical Address'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ጎግል ካርታ ሊንክ (Google Maps URL)' : 'Google Maps Embed/URL'}
                  </label>
                  <input
                    type="text"
                    value={mapLink}
                    onChange={(e) => setMapLink(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs font-mono"
                  />
                </div>

                {/* Social Links */}
                <div className="pt-2 border-t border-[#D7E3F1] space-y-3">
                  <span className="block text-xs font-bold text-[#0F2438]">
                    {isAm ? 'የማኅበራዊ ሚዲያ ገጾች' : 'Social Media Channels'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] text-[#5B6B7C] mb-0.5">Telegram:</span>
                      <input
                        type="text"
                        value={telegramLink}
                        onChange={(e) => setTelegramLink(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#5B6B7C] mb-0.5">YouTube:</span>
                      <input
                        type="text"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#5B6B7C] mb-0.5">Facebook:</span>
                      <input
                        type="text"
                        value={facebookLink}
                        onChange={(e) => setFacebookLink(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#5B6B7C] mb-0.5">TikTok:</span>
                      <input
                        type="text"
                        value={tiktokLink}
                        onChange={(e) => setTiktokLink(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Copyright */}
                <div className="pt-2 border-t border-[#D7E3F1]">
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'የግርጌ የቅጂ መብት ጽሑፍ (Footer Copyright Text)' : 'Footer Copyright Text'}
                  </label>
                  <input
                    type="text"
                    value={footerCopyrightAm}
                    onChange={(e) => setFooterCopyrightAm(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LANGUAGE & SYSTEM */}
          {activeTab === 'system' && (
            <div className="bg-white rounded-2xl border border-[#D7E3F1] p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2438]">
                  {isAm ? 'ቋንቋ፣ ደህንነትና የስርዓት ቅንብሮች' : 'System Configuration & Security'}
                </h2>
                <p className="text-xs text-[#5B6B7C]">
                  {isAm
                    ? 'ነባሪ ቋንቋ፣ የጥገና ሁነታ (Maintenance Mode)፣ የቆይታ ሰዓትና የተፈቀደ የአይፒ ዝርዝር።'
                    : 'System defaults, session timeouts, maintenance controls, and IP whitelisting.'}
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'ነባሪ ቋንቋ (Default Language)' : 'Default Language'}
                  </label>
                  <select
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value as any)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm"
                  >
                    <option value="am">አማርኛ (Amharic)</option>
                    <option value="en">English (እንግሊዝኛ)</option>
                  </select>
                </div>

                {/* Maintenance Mode */}
                <div className="p-4 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#0F2438] block">
                        {isAm ? 'የጥገና ሁነታ (Maintenance Mode)' : 'Maintenance Mode'}
                      </span>
                      <span className="text-[11px] text-[#5B6B7C]">
                        {isAm
                          ? 'ሲበራ ለሕዝብ ጣቢያው ይዘጋል፤ ዋና አስተዳዳሪዎች ግን መግባት ይችላሉ።'
                          : 'Public visitors see a maintenance screen; super admins can still sign in.'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F4C81]"></div>
                    </label>
                  </div>

                  {maintenanceMode && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-[#5B6B7C] mb-1">
                        {isAm ? 'ለጎብኝዎች የሚታይ የጥገና መልዕክት' : 'Maintenance Notice for Visitors'}
                      </label>
                      <input
                        type="text"
                        value={maintenanceMessageAm}
                        onChange={(e) => setMaintenanceMessageAm(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'የአስተዳዳሪ የቆይታ ገደብ (Session Timeout - ደቂቃ)' : 'Admin Session Inactivity Timeout (Minutes)'}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={sessionTimeoutMinutes}
                    onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm"
                  />
                  <p className="text-[11px] text-[#5B6B7C] mt-1">
                    {isAm ? 'ለደህንነት ሲባል 30 ደቂቃ እንዲሆን ይመከራል።' : 'Standard recommendation is 30 minutes.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1">
                    {isAm ? 'የተፈቀዱ አስተዳዳሪ IP አድራሻዎች (Admin IP Allow-list)' : 'Admin IP Allow-list (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={adminIpAllowlist}
                    onChange={(e) => setAdminIpAllowlist(e.target.value)}
                    placeholder="e.g. 192.168.1.1, 10.0.0.0/24 (ባዶ ከሆነ አይገደብም)"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm font-mono"
                  />
                  <p className="text-[11px] text-[#5B6B7C] mt-1">
                    {isAm
                      ? 'ባዶ ሲሆን ማንም አስተዳዳሪ ከየትኛውም አውታረ መረብ መግባት ይችላል።'
                      : 'Leave blank to allow admin sign in from any network.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ROLES & PERMISSIONS MATRIX */}
          {activeTab === 'roles' && (
            <div className="bg-white rounded-2xl border border-[#D7E3F1] p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2438]">
                  {isAm ? 'የሚናዎችና የፈቃዶች ሰንጠረዥ (Roles & Permissions Matrix)' : 'Roles & Permissions Matrix'}
                </h2>
                <p className="text-xs text-[#5B6B7C]">
                  {isAm
                    ? 'ለእያንዳንዱ ሚና የተፈቀዱትን ሞጁሎችና ተግባራት በቀጥታ ይቆጣጠሩ። የዋና አስተዳዳሪ (Super Admin) ሙሉ ፈቃድ አይቀየርም።'
                    : 'Toggle granular permissions per role. Changes take effect on the next API call.'}
                </p>
              </div>

              <div className="overflow-x-auto border border-[#D7E3F1] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0F4C81] text-white">
                      <th className="p-3 font-bold border-r border-white/20">
                        {isAm ? 'ሞጁል / ፈቃድ (Permission)' : 'Module / Permission'}
                      </th>
                      {rolesMatrix.map((r) => (
                        <th key={r.id} className="p-3 font-bold text-center border-r border-white/20 last:border-0 capitalize">
                          {r.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D7E3F1]">
                    {(rolesMatrixData?.modules || []).map((mod: any) => (
                      <React.Fragment key={mod.id}>
                        <tr className="bg-[#E8F1FB]/60 font-bold text-[#0F4C81]">
                          <td colSpan={rolesMatrix.length + 1} className="p-2.5">
                            {isAm ? mod.labelAm : mod.labelEn}
                          </td>
                        </tr>
                        {mod.permissions.map((perm: any) => (
                          <tr key={perm.key} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 pl-6 border-r border-[#D7E3F1]">
                              <div className="font-semibold text-[#0F2438]">{isAm ? perm.labelAm : perm.labelEn}</div>
                              <div className="font-mono text-[10px] text-[#5B6B7C]">{perm.key}</div>
                            </td>
                            {rolesMatrix.map((r) => {
                              const isSuper = r.name === 'super_admin';
                              const isChecked = isSuper || (r.permissions || []).includes(perm.key);
                              return (
                                <td key={r.id} className="p-3 text-center border-r border-[#D7E3F1] last:border-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isSuper}
                                    onChange={() => toggleRolePermission(r.id, perm.key)}
                                    className="h-4 w-4 rounded accent-[#0F4C81] cursor-pointer disabled:cursor-not-allowed"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: MEMBERSHIP FEE & PAYMENT ACCOUNTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Fee Schedule */}
              <div className="bg-white rounded-2xl border border-[#D7E3F1] p-6 shadow-xs space-y-4">
                <div className="border-b border-[#D7E3F1] pb-3">
                  <h2 className="text-lg font-bold text-[#0F2438]">
                    {isAm ? 'የዓመታዊ የአባልነት ክፍያ ተመን (Membership Fee Schedule)' : 'Membership Fee Schedule'}
                  </h2>
                  <p className="text-xs text-[#5B6B7C]">
                    {isAm
                      ? 'የዓመቱን የአባልነት ክፍያ መጠን፣ የዓመተ ምሕረት ስያሜ እና የመጨረሻ መክፈያ ቀን ይወስኑ።'
                      : 'Define the annual membership fee amount, currency, year label, and payment deadline.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#0F2438] block mb-1">
                      {isAm ? 'የክፍያ መጠን (በብር)' : 'Amount'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={membershipAmount}
                      onChange={(e) => setMembershipAmount(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0F2438] block mb-1">
                      {isAm ? 'የገንዘብ ዓይነት (Currency)' : 'Currency'}
                    </label>
                    <input
                      type="text"
                      value={membershipCurrency}
                      onChange={(e) => setMembershipCurrency(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0F2438] block mb-1">
                      {isAm ? 'የአባልነት ዓ.ም. (Year)' : 'Year'}
                    </label>
                    <input
                      type="number"
                      value={membershipYear}
                      onChange={(e) => setMembershipYear(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0F2438] block mb-1">
                      {isAm ? 'የዓመቱ ስያሜ (Year Label)' : 'Year Label'}
                    </label>
                    <input
                      type="text"
                      value={membershipYearLabel}
                      onChange={(e) => setMembershipYearLabel(e.target.value)}
                      placeholder="e.g. 2019 ዓ.ም."
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm font-ethiopic"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-[#0F2438] block mb-1">
                      {isAm ? 'የመጨረሻው መክፈያ ቀን (Deadline)' : 'Payment Deadline'}
                    </label>
                    <input
                      type="date"
                      value={membershipDeadline}
                      onChange={(e) => setMembershipDeadline(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D7E3F1] bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Bank & Telebirr Accounts */}
              <div className="bg-white rounded-2xl border border-[#D7E3F1] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#D7E3F1] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#0F2438]">
                      {isAm ? 'የባንክና የቴሌብር ሂሳቦች (Payment Accounts)' : 'Payment Accounts'}
                    </h2>
                    <p className="text-xs text-[#5B6B7C]">
                      {isAm
                        ? 'አባላት ክፍያ የሚፈጽሙባቸውን የባንክና የቴሌብር ሂሳቦች እዚህ ያስተዳድሩ።'
                        : 'Configure bank and telebirr accounts shown on member payment portal.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentAccounts([
                        ...paymentAccounts,
                        {
                          id: `acc-${Date.now()}`,
                          type: 'other_bank',
                          bankName: 'አዲስ ባንክ',
                          accountName: 'አዕማደ ሰላም ሰ/ት/ቤት',
                          accountNumber: '',
                          active: true,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8F1FB] hover:bg-[#D7E3F1] text-[#0F4C81] px-3.5 py-2 text-xs font-bold transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isAm ? 'አዲስ ሂሳብ ጨምር' : 'Add Account'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {paymentAccounts.map((acc, index) => (
                    <div
                      key={acc.id || index}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD]"
                    >
                      <div className="w-full sm:w-40">
                        <select
                          value={acc.type}
                          onChange={(e) => {
                            const updated = [...paymentAccounts];
                            updated[index].type = e.target.value;
                            setPaymentAccounts(updated);
                          }}
                          className="w-full h-10 px-2.5 rounded-lg border border-[#D7E3F1] bg-white text-xs font-semibold"
                        >
                          <option value="telebirr">ቴሌብር (Telebirr)</option>
                          <option value="cbe">CBE</option>
                          <option value="abyssinia">Abyssinia</option>
                          <option value="awash">Awash</option>
                          <option value="dashen">Dashen</option>
                          <option value="other_bank">Other Bank</option>
                        </select>
                      </div>

                      <div className="w-full sm:w-48">
                        <input
                          type="text"
                          placeholder="Bank / Provider Name"
                          value={acc.bankName}
                          onChange={(e) => {
                            const updated = [...paymentAccounts];
                            updated[index].bankName = e.target.value;
                            setPaymentAccounts(updated);
                          }}
                          className="w-full h-10 px-3 rounded-lg border border-[#D7E3F1] bg-white text-xs font-medium"
                        />
                      </div>

                      <div className="w-full sm:w-48">
                        <input
                          type="text"
                          placeholder="Account Name"
                          value={acc.accountName}
                          onChange={(e) => {
                            const updated = [...paymentAccounts];
                            updated[index].accountName = e.target.value;
                            setPaymentAccounts(updated);
                          }}
                          className="w-full h-10 px-3 rounded-lg border border-[#D7E3F1] bg-white text-xs"
                        />
                      </div>

                      <div className="w-full sm:flex-1">
                        <input
                          type="text"
                          placeholder={acc.type === 'telebirr' ? 'Telebirr Phone (09...)' : 'Account Number'}
                          value={acc.type === 'telebirr' ? (acc.telebirrNumber || '') : (acc.accountNumber || '')}
                          onChange={(e) => {
                            const updated = [...paymentAccounts];
                            if (acc.type === 'telebirr') {
                              updated[index].telebirrNumber = e.target.value;
                            } else {
                              updated[index].accountNumber = e.target.value;
                            }
                            setPaymentAccounts(updated);
                          }}
                          className="w-full h-10 px-3 rounded-lg border border-[#D7E3F1] bg-white font-mono text-xs font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#0F2438] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acc.active}
                            onChange={(e) => {
                              const updated = [...paymentAccounts];
                              updated[index].active = e.target.checked;
                              setPaymentAccounts(updated);
                            }}
                            className="h-4 w-4 rounded accent-[#0F4C81]"
                          />
                          <span>{isAm ? 'ንቁ' : 'Active'}</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAccounts(paymentAccounts.filter((_, i) => i !== index));
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="bg-white rounded-2xl border-2 border-red-200 p-6 shadow-xs space-y-6">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 shrink-0 text-[#C62828] mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[#C62828]">
                    {isAm ? 'አደገኛ የውሂብ ማስጠንቀቂያ (Danger Zone)' : 'Danger Zone Actions'}
                  </h2>
                  <p className="text-xs text-red-800 leading-relaxed">
                    {isAm
                      ? 'እነዚህ ተግባራት በቀጥታ በዳታቤዝ ላይ ተፅዕኖ ያሳድራሉ። እያንዳንዱን ተግባር ለመፈጸም የተጠየቀውን ማረጋገጫ በትክክል መጻፍ ያስፈልጋል።'
                      : 'Actions here modify or purge database records permanently. Every action requires explicit typed confirmation.'}
                  </p>
                </div>
              </div>

              {/* Danger Zone Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD] text-center">
                  <div className="text-xl font-bold text-[#0F4C81]">
                    {dangerStats?.softDeletedMembers ?? 0}
                  </div>
                  <div className="text-[10px] text-[#5B6B7C] uppercase font-bold mt-1">
                    {isAm ? 'የተሰረዙ አባላት' : 'Deleted Members'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD] text-center">
                  <div className="text-xl font-bold text-[#0F4C81]">
                    {dangerStats?.totalAuditLogs ?? 0}
                  </div>
                  <div className="text-[10px] text-[#5B6B7C] uppercase font-bold mt-1">
                    {isAm ? 'ጠቅላላ ኦዲት መዝገብ' : 'Audit Logs'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD] text-center">
                  <div className="text-xl font-bold text-[#E39B00]">
                    {dangerStats?.purgeableAuditLogs ?? 0}
                  </div>
                  <div className="text-[10px] text-[#5B6B7C] uppercase font-bold mt-1">
                    {isAm ? 'ከ30 ቀን በላይ የሆኑ' : 'Older than 30d'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD] text-center">
                  <div className="text-xl font-bold text-[#1B8E5A]">
                    {dangerStats?.totalVersions ?? 0}
                  </div>
                  <div className="text-[10px] text-[#5B6B7C] uppercase font-bold mt-1">
                    {isAm ? 'የቅንብር ቅጂዎች' : 'Saved Versions'}
                  </div>
                </div>
              </div>

              {/* Action 1: Restore Soft-Deleted Members */}
              <div className="p-4 rounded-xl border border-[#D7E3F1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0F2438]">
                    {isAm ? 'የተሰረዙ አባላትን መልስ (Restore Soft-deleted Members)' : 'Restore Soft-deleted Members'}
                  </h3>
                  <p className="text-xs text-[#5B6B7C] mt-0.5">
                    {isAm
                      ? 'ቀደም ሲል የተሰረዙ አባላትን መዝገብ ወደ ቀድሞ ሁኔታቸው ይመልሳል።'
                      : 'Restores all records where deletedAt is set back into active membership.'}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="btn-open-restore-modal"
                  onClick={() => {
                    setTypedConfirmation('');
                    setDangerModal('restore');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer shrink-0"
                >
                  {isAm ? 'አባላትን መልስ' : 'Restore Members'}
                </button>
              </div>

              {/* Action 2: Purge Old Audit Logs */}
              <div className="p-4 rounded-xl border border-[#D7E3F1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0F2438]">
                    {isAm ? 'የቆዩ የኦዲት መዝገቦችን አጽዳ (Purge Audit Logs)' : 'Purge Old Audit Logs'}
                  </h3>
                  <p className="text-xs text-[#5B6B7C] mt-0.5">
                    {isAm
                      ? 'የዳታቤዝ ቦታን ለመቆጠብ የተመረጡትን የቆዩ የኦዲት መዝገቦች እስከመጨረሻው ያጠፋል።'
                      : 'Permanently deletes historic audit log entries older than specified retention.'}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="btn-open-purge-modal"
                  onClick={() => {
                    setTypedConfirmation('');
                    setDangerModal('purge');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#C62828] hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer shrink-0"
                >
                  {isAm ? 'መዝገቦችን አጽዳ' : 'Purge Logs'}
                </button>
              </div>

              {/* Action 3: System Backup */}
              <div className="p-4 rounded-xl border border-[#D7E3F1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0F2438]">
                    {isAm ? 'የስርዓቱ ሙሉ የውሂብ ምትኬ (Download System Backup)' : 'Download System Backup'}
                  </h3>
                  <p className="text-xs text-[#5B6B7C] mt-0.5">
                    {isAm
                      ? 'የጣቢያ ቅንብሮችን፣ ክፍሎችን፣ እና ሚናዎችን በJSON ቅርጸት አውርዶ ያስቀምጣል።'
                      : 'Creates and triggers instant download of all settings, roles, and schema tables.'}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="btn-open-backup-modal"
                  onClick={() => {
                    setTypedConfirmation('');
                    setDangerModal('backup');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F4C81] hover:bg-[#0A2E52] text-white font-bold text-xs shadow-xs cursor-pointer shrink-0"
                >
                  {isAm ? 'ምትኬ አውርድ' : 'Download Backup'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LIVE PREVIEW */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center justify-between bg-white rounded-xl border border-[#D7E3F1] p-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#0F4C81]" />
              <span className="text-xs font-bold text-[#0F2438]">
                {isAm ? 'የቀጥታ ቅድመ-ዕይታ (Live Preview)' : 'Live Preview'}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#F8FAFD] p-1 rounded-lg border border-[#D7E3F1]">
              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  previewViewport === 'desktop'
                    ? 'bg-white shadow-xs text-[#0F4C81]'
                    : 'text-[#5B6B7C] hover:text-[#0F2438]'
                }`}
                title="Desktop View"
              >
                <Monitor className="h-3.5 w-3.5" />
                <span className="text-[10px]">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  previewViewport === 'mobile'
                    ? 'bg-white shadow-xs text-[#0F4C81]'
                    : 'text-[#5B6B7C] hover:text-[#0F2438]'
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="text-[10px]">Mobile</span>
              </button>
            </div>
          </div>

          {/* Device Mockup Frame */}
          <div
            data-testid="preview-frame"
            className={`mx-auto bg-white rounded-2xl border-2 border-[#D7E3F1] shadow-md overflow-hidden transition-all duration-300 ${
              previewViewport === 'mobile' ? 'max-w-[360px] w-[360px]' : 'w-full max-w-4xl'
            }`}
          >
            {/* Mock Header */}
            <div
              style={{ backgroundColor: primaryColor }}
              className="px-3 py-2 text-white flex items-center justify-between border-b border-white/20"
            >
              <div className="flex items-center gap-2">
                <SchoolLogo size={28} logoUrl={logoUrl} />
                <div className="truncate">
                  <div className="text-[9px] uppercase tracking-wider text-[#F2B233] font-bold truncate">
                    {churchName}
                  </div>
                  <div className="text-xs font-extrabold truncate text-white">
                    {nameAm}
                  </div>
                </div>
              </div>
              <div
                style={{ backgroundColor: accentColor, color: '#0F2438' }}
                className="px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs whitespace-nowrap"
              >
                {isAm ? 'ግባ' : 'Login'}
              </div>
            </div>

            {/* Mock Announcement */}
            {announcementEnabled && (
              <div
                className={`px-2.5 py-1 text-[10px] font-semibold text-center truncate ${
                  announcementType === 'warning'
                    ? 'bg-amber-100 text-amber-900'
                    : announcementType === 'success'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-[#E8F1FB] text-[#0F4C81]'
                }`}
              >
                {isAm ? announcementTextAm : announcementTextEn}
              </div>
            )}

            {/* Mock Hero Box */}
            <div
              style={{
                position: 'relative',
                backgroundColor: heroBgType === 'solid' ? heroSolidColor : '#0A2E52',
                ...(heroBgType === 'image' && heroBgImage
                  ? {
                      backgroundImage: `url(${heroBgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : heroBgType === 'gradient'
                  ? {
                      background: `linear-gradient(to bottom, #0A2E52, ${primaryColor}, #0A2E52)`,
                    }
                  : {}),
              }}
              className="p-5 text-center text-white space-y-2 relative"
            >
              {heroBgType === 'image' && heroBgImage && (
                <div
                  className="absolute inset-0 bg-[#0A2E52]"
                  style={{ opacity: heroOverlayOpacity / 100 }}
                />
              )}

              <div className="relative z-10 space-y-2">
                <div className="flex justify-center">
                  <SchoolLogo size={44} logoUrl={logoUrl} />
                </div>
                <div className="text-sm font-black leading-tight text-white line-clamp-2">
                  {heroTitleAm}
                </div>
                <div className="text-xs text-[#E8F1FB] font-medium line-clamp-2">
                  {heroSubtitleAm}
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <div
                    style={{ backgroundColor: accentColor, color: '#0F2438' }}
                    className="px-3 py-1 rounded-md text-[10px] font-extrabold shadow-sm"
                  >
                    {primaryCtaTextAm}
                  </div>
                  <div className="px-3 py-1 rounded-md text-[10px] font-semibold border border-white/40 text-white">
                    {secondaryCtaTextAm}
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Body Sections */}
            <div className="p-3 bg-[#F8FAFD] space-y-2 text-xs">
              <div className="font-bold text-[#5B6B7C] text-[10px] uppercase">
                {isAm ? 'ክፍሎች በቅደም ተከተል' : 'Active Sections'}
              </div>
              {sections
                .filter((s) => s.enabled)
                .map((sec) => (
                  <div
                    key={sec.id}
                    className="p-2 rounded-lg bg-white border border-[#D7E3F1] text-[11px] font-semibold text-[#0F2438] flex items-center justify-between"
                  >
                    <span>{isAm ? sec.titleAm : sec.titleEn}</span>
                    <span className="text-[9px] text-[#1B8E5A] font-bold">● Active</span>
                  </div>
                ))}
            </div>

            {/* Mock Footer */}
            <div className="p-3 bg-[#0A2E52] text-white text-[10px] text-center space-y-1">
              <div className="text-white/80">{phone} | {email}</div>
              <div className="text-white/60 text-[9px]">{footerCopyrightAm}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* VERSION HISTORY DRAWER / MODAL */}
      {/* ------------------------------------------------------------------- */}
      {versionDrawerOpen && (
        <div data-testid="version-history-drawer" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D7E3F1] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#D7E3F1] pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#0F4C81]" />
                <h3 className="text-base font-bold text-[#0F2438]">
                  {isAm ? `የቀደሙ ቅጂዎች፡ ${versionKey}` : `Version History: ${versionKey}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVersionDrawerOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingVersions ? (
                <div className="py-8 text-center text-xs text-[#5B6B7C]">
                  {isAm ? 'ቅጂዎችን በመጫን ላይ...' : 'Loading versions...'}
                </div>
              ) : (versionHistory || []).length === 0 ? (
                <div className="py-8 text-center text-xs text-[#5B6B7C]">
                  {isAm ? 'ምንም የተመዘገበ የቀደመ ቅጂ የለም።' : 'No recorded historical versions yet.'}
                </div>
              ) : (
                (versionHistory || []).map((ver) => (
                  <div
                    key={ver.id}
                    className="p-3.5 rounded-xl border border-[#D7E3F1] bg-[#F8FAFD] hover:border-[#1E78C8] transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[#5B6B7C]">
                      <span className="font-mono text-[10px]">
                        {new Date(ver.createdAt).toLocaleString(isAm ? 'am-ET' : 'en-US')}
                      </span>
                      {ver.changedBy && (
                        <span className="font-semibold text-[#0F4C81]">
                          {ver.changedBy.name || ver.changedBy.email}
                        </span>
                      )}
                    </div>
                    {ver.changeReason && (
                      <p className="font-bold text-[#0F2438]">{ver.changeReason}</p>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        restoreVersionMutation.mutate({
                          key: ver.settingKey,
                          versionId: ver.id,
                        })
                      }
                      disabled={restoreVersionMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F4C81] text-white font-bold text-[11px] hover:bg-[#0A2E52] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>{isAm ? 'ይህን ቅጂ መልስ (Restore)' : 'Restore this version'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TYPED CONFIRMATION MODAL FOR DANGER ZONE */}
      {/* ------------------------------------------------------------------- */}
      {dangerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-red-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-[#0F2438]">
                {dangerModal === 'restore'
                  ? isAm ? 'አባላትን ለመመለስ ያረጋግጡ' : 'Confirm Member Restoration'
                  : dangerModal === 'purge'
                  ? isAm ? 'የኦዲት መዝገብን ለማጽዳት ያረጋግጡ' : 'Confirm Audit Log Purge'
                  : isAm ? 'የስርዓት ምትኬን ለማውረድ ያረጋግጡ' : 'Confirm System Backup Download'}
              </h3>
            </div>

            <p className="text-xs text-[#5B6B7C] leading-relaxed">
              {isAm
                ? `ይህን ተግባር ለመፈጸም በትልቁ ፊደል "${dangerModal.toUpperCase()}" ብለው ይጻፉ።`
                : `To proceed, please type the exact confirmation word "${dangerModal.toUpperCase()}".`}
            </p>

            {dangerModal === 'purge' && (
              <div>
                <label className="block text-xs font-bold text-[#0F2438] mb-1">
                  {isAm ? 'የመዝገብ ዕድሜ' : 'Retention Window'}
                </label>
                <select
                  value={purgeDays}
                  onChange={(e) => setPurgeDays(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-[#D7E3F1] bg-white text-xs"
                >
                  <option value={30}>ከ30 ቀናት በላይ የቆዩ (Older than 30 days)</option>
                  <option value={60}>ከ60 ቀናት በላይ የቆዩ (Older than 60 days)</option>
                  <option value={90}>ከ90 ቀናት በላይ የቆዩ (Older than 90 days)</option>
                  <option value={180}>ከ180 ቀናት በላይ የቆዩ (Older than 180 days)</option>
                  <option value={0}>ሁሉንም የኦዲት መዝገቦች አጥፋ (All logs)</option>
                </select>
              </div>
            )}

            <div>
              <input
                type="text"
                data-testid="input-typed-confirmation"
                placeholder={dangerModal.toUpperCase()}
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-red-300 font-mono text-center tracking-widest text-sm uppercase focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDangerModal(null);
                  setTypedConfirmation('');
                }}
                className="px-4 py-2 rounded-xl border border-[#D7E3F1] text-xs font-bold text-[#5B6B7C] hover:bg-gray-100 cursor-pointer"
              >
                {isAm ? 'ይቅር' : 'Cancel'}
              </button>

              <button
                type="button"
                data-testid="btn-confirm-danger-action"
                disabled={typedConfirmation !== dangerModal.toUpperCase()}
                onClick={() => {
                  if (dangerModal === 'restore') restoreMembersMutation.mutate();
                  else if (dangerModal === 'purge') purgeAuditLogsMutation.mutate();
                  else if (dangerModal === 'backup') generateBackupMutation.mutate();
                }}
                className="px-5 py-2 rounded-xl bg-[#C62828] text-white text-xs font-bold hover:bg-red-700 disabled:opacity-30 cursor-pointer"
              >
                {isAm ? 'አረጋግጥና ፈጽም' : 'Confirm & Execute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
