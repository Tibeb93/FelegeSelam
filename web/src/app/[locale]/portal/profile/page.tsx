'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  CreditCard,
  Download,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Church,
  MapPin,
  Heart,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from '@/lib/api-client';
import { Member } from '@/types/api';
import { useToast } from '@/providers/ToastProvider';
import { SchoolLogo } from '@/components/common/SchoolLogo';

export default function PortalProfilePage() {
  const t = useTranslations('Portal');
  const tMembers = useTranslations('Members');
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'idcard'>('profile');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    baptismalName: '',
    sex: 'male',
    dateOfBirth: '',
    phone: '',
    email: '',
    region: '',
    zone: '',
    woreda: '',
    kebele: '',
    addressDetail: '',
    parish: '',
    confessionFather: '',
    educationLevel: '',
    occupation: '',
    emergencyName: '',
    emergencyPhone: '',
  });

  // Query Member Profile
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<Member>({
    queryKey: ['members', 'me', 'profile'],
    queryFn: () => apiRequest<Member>('/members/me/profile'),
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        fatherName: profile.fatherName || '',
        grandfatherName: profile.grandfatherName || '',
        baptismalName: profile.baptismalName || '',
        sex: profile.sex || 'male',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        phone: profile.phone || '',
        email: profile.email || '',
        region: profile.region || '',
        zone: profile.zone || '',
        woreda: profile.woreda || '',
        kebele: profile.kebele || '',
        addressDetail: profile.addressDetail || '',
        parish: profile.parish || '',
        confessionFather: profile.confessionFather || '',
        educationLevel: profile.educationLevel || '',
        occupation: profile.occupation || '',
        emergencyName: profile.emergencyName || '',
        emergencyPhone: profile.emergencyPhone || '',
      });
    }
  }, [profile]);

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest('/members/me/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', 'me', 'profile'] });
      setSuccessMsg(t('profileUpdated'));
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update profile');
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDownloadIdCard = async () => {
    if (!profile) return;
    try {
      setDownloadingId(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`http://localhost:3000/api/v1/members/${profile.id}/id-card`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('Failed to download ID card');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID_Card_${profile.memberNo || 'Member'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error(err.message || 'Error downloading ID card');
    } finally {
      setDownloadingId(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
        <AlertCircle className="mx-auto h-10 w-10 mb-2" />
        <h3 className="text-lg font-bold">Profile Unavailable</h3>
        <p className="text-sm mt-1">Unable to load your member profile. Please ensure you are logged in.</p>
      </div>
    );
  }

  const qrData = JSON.stringify({
    memberNo: profile.memberNo,
    name: `${profile.firstName} ${profile.fatherName}`,
    dept: profile.department?.nameAm || profile.department?.nameEn || 'General',
    status: profile.status,
    verifyUrl: `http://localhost:3001/verify/${profile.memberNo}`,
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-ethiopic">
            {t('myProfile')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.firstName} {profile.fatherName} ({profile.memberNo})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-card text-foreground border border-border hover:bg-muted'
            }`}
          >
            <User className="h-4 w-4" />
            <span>{t('myProfile')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('idcard')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'idcard'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-card text-foreground border border-border hover:bg-muted'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>{t('idCard')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: ID CARD */}
      {activeTab === 'idcard' && (
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          {/* Card Container */}
          <div
            id="printable-id-card"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-[#0F4C81] bg-white p-6 shadow-xl dark:bg-[#0A2644] dark:border-[#1E78C8]"
          >
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b-2 border-[#0F4C81]/20 pb-3">
              <div className="flex items-center gap-2.5">
                <SchoolLogo size={38} />
                <div>
                  <h4 className="font-bold text-[11px] text-[#0F4C81] dark:text-[#F2B233] uppercase tracking-wider">
                    ደብረ ሰላም ቅዱስ እስጢፋኖስ
                  </h4>
                  <p className="font-bold text-xs text-foreground font-ethiopic leading-tight">
                    አዕማደ ሰላም ሰንበት ት/ቤት
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#E8F7F0] px-2.5 py-0.5 text-[10px] font-bold text-[#136640] uppercase tracking-wider border border-[#A8E2C8]">
                {profile.status}
              </span>
            </div>

            {/* Body */}
            <div className="mt-5 grid grid-cols-3 gap-4 items-center">
              {/* Photo */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative h-28 w-24 overflow-hidden rounded-xl border-2 border-[#0F4C81] bg-card shadow-sm">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.firstName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                      <User className="h-10 w-10 opacity-40" />
                    </div>
                  )}
                </div>
                <span className="mt-2 text-[10px] font-bold font-mono text-muted-foreground">
                  {profile.memberNo}
                </span>
              </div>

              {/* Details */}
              <div className="col-span-2 space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Full Name / ሙሉ ስም
                  </span>
                  <p className="font-bold text-sm text-[#0F4C81] dark:text-[#F0F6FC] font-ethiopic leading-tight">
                    {profile.firstName} {profile.fatherName} {profile.grandfatherName || ''}
                  </p>
                </div>
                {profile.baptismalName && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Baptismal / የክርስትና ስም
                    </span>
                    <p className="font-medium text-foreground font-ethiopic">
                      {profile.baptismalName}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Department / ክፍል
                  </span>
                  <p className="font-medium text-foreground font-ethiopic">
                    {profile.department?.nameAm || profile.department?.nameEn || 'አጠቃላይ'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Joined / የተቀላቀሉበት
                  </span>
                  <p className="font-mono text-xs text-foreground">
                    {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code and Footer */}
            <div className="mt-5 flex items-center justify-between border-t border-[#D7E3F1] dark:border-[#1A3E63] pt-3">
              <div className="text-[10px] text-muted-foreground leading-tight max-w-[200px]">
                <p className="font-bold text-foreground">Official Sunday School ID</p>
                <p>ደብረ ሰላም ቅዱስ እስጢፋኖስ ቤ/ክ - አዲስ አበባ</p>
              </div>
              <div className="rounded-lg bg-white p-1.5 shadow-xs border border-[#D7E3F1]">
                <QRCodeSVG value={qrData} size={64} level="M" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDownloadIdCard}
              disabled={downloadingId}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-hover disabled:opacity-50"
            >
              {downloadingId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{t('downloadIdCard')}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Print Card</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT PROFILE FORM */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border pb-3 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                {tMembers('personalInfo')}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('firstName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('fatherName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('grandfatherName')}
                </label>
                <input
                  type="text"
                  value={formData.grandfatherName}
                  onChange={(e) => setFormData({ ...formData, grandfatherName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('baptismalName')}
                </label>
                <input
                  type="text"
                  value={formData.baptismalName}
                  onChange={(e) => setFormData({ ...formData, baptismalName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('dateOfBirth')}
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('sex')}
                </label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                >
                  <option value="male">{tMembers('male')}</option>
                  <option value="female">{tMembers('female')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Church & Parish */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border pb-3 mb-4">
              <Church className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                {tMembers('churchInfo')}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('parish')}
                </label>
                <input
                  type="text"
                  value={formData.parish}
                  onChange={(e) => setFormData({ ...formData, parish: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('confessionFather')}
                </label>
                <input
                  type="text"
                  value={formData.confessionFather}
                  onChange={(e) => setFormData({ ...formData, confessionFather: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Residential Address */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border pb-3 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                {tMembers('addressInfo')}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('region')}
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('zone')}
                </label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('woreda')}
                </label>
                <input
                  type="text"
                  value={formData.woreda}
                  onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('kebele')}
                </label>
                <input
                  type="text"
                  value={formData.kebele}
                  onChange={(e) => setFormData({ ...formData, kebele: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact & Work */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border pb-3 mb-4">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                {tMembers('emergencyContact')} & {tMembers('educationWork')}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('emergencyName')}
                </label>
                <input
                  type="text"
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('emergencyPhone')}
                </label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('educationLevel')}
                </label>
                <input
                  type="text"
                  value={formData.educationLevel}
                  onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {tMembers('occupation')}
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-hover disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{t('saveProfile')}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
