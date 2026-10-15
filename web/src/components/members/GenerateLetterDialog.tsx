'use client';

import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { FileText, Download, Loader2, X } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useToast } from '../../providers/ToastProvider';
import { Member } from '../../types/api';

interface GenerateLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  locale?: string;
}

export function GenerateLetterDialog({
  open,
  onOpenChange,
  member,
  locale = 'am',
}: GenerateLetterDialogProps) {
  const toast = useToast();
  const [type, setType] = useState<'confirmation' | 'recommendation'>('confirmation');
  const [recipient, setRecipient] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isAm = locale === 'am';

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      toast.info(
        isAm ? 'ደብዳቤ በመዘጋጀት ላይ ነው...' : 'Generating letter...',
        isAm ? 'የደብዳቤ ዝግጅት' : 'Letter Generation'
      );

      const blob = await apiClient.post<Blob>(
        `/members/${member.id}/letter`,
        {
          type,
          recipient: recipient.trim() || undefined,
          purpose: purpose.trim() || undefined,
        }
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Letter-${type}-${member.memberNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        isAm ? 'ደብዳቤው በተሳካ ሁኔታ ወርዷል' : 'Letter downloaded successfully'
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err.message || (isAm ? 'ደብዳቤ ማዘጋጀት አልተቻለም' : 'Failed to generate letter')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-lg font-bold text-foreground">
                  {isAm ? 'ኦፊሴላዊ ደብዳቤ አዘጋጅ' : 'Generate Official Letter'}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-muted-foreground">
                  {isAm ? 'የአባል ስም:' : 'Member:'} {member.firstName} {member.fatherName} ({member.memberNo})
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <form onSubmit={handleGenerate} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                {isAm ? 'የደብዳቤ ዓይነት' : 'Letter Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="confirmation">
                  {isAm ? 'የአባልነት ማረጋገጫ ደብዳቤ (Membership Confirmation)' : 'Membership Confirmation Letter'}
                </option>
                <option value="recommendation">
                  {isAm ? 'የድጋፍ / የውክልና ደብዳቤ (Recommendation)' : 'Recommendation Letter'}
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                {isAm ? 'ተቀባይ / ለሚመለከተው አካል' : 'Recipient / Addressee'}
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={isAm ? 'ለምሳሌ፡ ለሚመለከተው ሁሉ / ለቅዱስ ጳውሎስ ሰ/ት/ቤት' : 'e.g., To Whom It May Concern'}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
              <p className="text-xs text-muted-foreground">
                {isAm ? 'ባዶ ከተተወ በነባሪነት «ለሚመለከተው ሁሉ» ተብሎ ይዘጋጃል' : 'Defaults to "To Whom It May Concern" if left blank'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                {isAm ? 'የደብዳቤው ምክንያት / ዓላማ (አማራጭ)' : 'Purpose / Reason (Optional)'}
              </label>
              <textarea
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={isAm ? 'ለምሳሌ፡ የትምህርት ዝውውር ጥያቄን በሚመለከት' : 'e.g., Regarding school transfer or employment'}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  disabled={isLoading}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {isAm ? 'ይቅር' : 'Cancel'}
                </button>
              </DialogPrimitive.Close>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isAm ? 'ደብዳቤውን አውርድ (PDF)' : 'Download Letter (PDF)'}</span>
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
