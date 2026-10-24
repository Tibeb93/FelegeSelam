'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import {
  ShieldCheck,
  Lock,
  Eye,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Download,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

export default function PortalPrivacyPage() {
  const t = useTranslations('Portal');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Privacy Preferences State
  const [preferences, setPreferences] = useState({
    showPhoneToClassmates: true,
    showEmailToClassmates: false,
    showPhotoInDirectory: true,
    receiveUrgentSms: true,
    receiveEmailNotices: true,
    twoFactorEnabled: false,
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('member_privacy_preferences', JSON.stringify(preferences));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save preferences');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Change Password Mutation
  const passwordMutation = useMutation({
    mutationFn: () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      if (passwordData.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      return apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to change password');
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await apiRequest('/members/me/data-export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `felege-selam-member-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export member data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = window.prompt(
      'Are you sure you want to deactivate your account? Type DELETE to confirm:',
    );
    if (confirmText !== 'DELETE') return;

    try {
      setIsDeleting(true);
      await apiRequest('/members/me/account', { method: 'DELETE' });
      window.location.href = '/login';
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to deactivate account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-ethiopic">
          {t('privacySettings')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account security, profile visibility to classmates, and communications.
        </p>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{t('privacyUpdated')}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Directory & Profile Visibility */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Directory & Classmate Visibility
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-border bg-background p-4 cursor-pointer hover:bg-muted/30">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Phone Number Visibility
                </p>
                <span className="text-xs text-muted-foreground">
                  Allow teachers and classmates in your enrolled courses to see your mobile phone number.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.showPhoneToClassmates}
                onChange={() => handleToggle('showPhoneToClassmates')}
                className="h-5 w-5 rounded-md accent-primary"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-border bg-background p-4 cursor-pointer hover:bg-muted/30">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Email Address Visibility
                </p>
                <span className="text-xs text-muted-foreground">
                  Allow fellow Sunday school members to view your email address in group activities.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.showEmailToClassmates}
                onChange={() => handleToggle('showEmailToClassmates')}
                className="h-5 w-5 rounded-md accent-primary"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-border bg-background p-4 cursor-pointer hover:bg-muted/30">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Photo Visibility in Department Roster
                </p>
                <span className="text-xs text-muted-foreground">
                  Display your membership portrait in the department member board.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.showPhotoInDirectory}
                onChange={() => handleToggle('showPhotoInDirectory')}
                className="h-5 w-5 rounded-md accent-primary"
              />
            </label>
          </div>
        </div>

        {/* Notifications & Communications */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Communications & Alerts
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-border bg-background p-4 cursor-pointer hover:bg-muted/30">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Urgent SMS Announcements
                </p>
                <span className="text-xs text-muted-foreground">
                  Receive SMS messages for critical church schedule shifts, holidays, and emergency notices.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.receiveUrgentSms}
                onChange={() => handleToggle('receiveUrgentSms')}
                className="h-5 w-5 rounded-md accent-primary"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-border bg-background p-4 cursor-pointer hover:bg-muted/30">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Email Bulletins & Event Reminders
                </p>
                <span className="text-xs text-muted-foreground">
                  Receive weekly spiritual newsletters, lesson summaries, and feast calendar highlights.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.receiveEmailNotices}
                onChange={() => handleToggle('receiveEmailNotices')}
                className="h-5 w-5 rounded-md accent-primary"
              />
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-secondary shadow-md hover:bg-primary-hover"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Privacy Preferences</span>
            </button>
          </div>
        </div>
      </form>

      {/* Account Security & Password Change */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-border pb-3">
          <KeyRound className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">
            Account Security & Password
          </h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            passwordMutation.mutate();
          }}
          className="space-y-4 max-w-lg"
        >
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              New Password (min 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-primary-hover disabled:opacity-50"
            >
              {passwordMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Safety & GDPR (Export and Account Deactivation) */}
      <div className="rounded-2xl border border-destructive/20 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">
            Data Safety & Right to Erasure
          </h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          In accordance with Sunday School privacy and data protection standards, you can download a full archive of all records associated with your membership or request immediate account deactivation.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-primary" />}
            <span>Export My Personal Data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
            <span>Deactivate My Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
