'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Mezmur, MezmurCategory } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Music,
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Video,
  FileAudio,
} from 'lucide-react';

interface MezmurFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mezmurToEdit?: Mezmur | null;
  locale: string;
}

export function MezmurFormDialog({
  open,
  onOpenChange,
  mezmurToEdit,
  locale,
}: MezmurFormDialogProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [lyrics, setLyrics] = useState('');
  const [singer, setSinger] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch categories
  const { data: categories = [] } = useQuery<MezmurCategory[]>({
    queryKey: ['mezmur-categories'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/mezmurs/categories');
      return Array.isArray(res) ? res : res?.items || res?.data || [];
    },
    enabled: open,
  });

  // Populate on edit
  useEffect(() => {
    if (mezmurToEdit) {
      setTitle(mezmurToEdit.title || '');
      setCategoryId(mezmurToEdit.categoryId || '');
      setLyrics(mezmurToEdit.lyrics || '');
      setSinger(mezmurToEdit.singer || '');
      setAudioUrl(mezmurToEdit.audioUrl || '');
      setVideoUrl(mezmurToEdit.videoUrl || '');
      setIsPublic(mezmurToEdit.isPublic ?? true);
      setErrorMsg('');
    } else {
      setTitle('');
      setCategoryId('');
      setLyrics('');
      setSinger('');
      setAudioUrl('');
      setVideoUrl('');
      setIsPublic(true);
      setErrorMsg('');
    }
  }, [mezmurToEdit, open]);

  // Audio file upload handler
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3')) {
      setErrorMsg(
        locale === 'am'
          ? 'እባክዎ የድምፅ ፋይል (MP3) ይምረጡ'
          : 'Please select an audio file (MP3/WAV)',
      );
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);

      // Upload via upload service
      const res = await apiClient.post<any>('/forms/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.url || res.data?.url || res;
      setAudioUrl(uploadedUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Audio upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error(
          locale === 'am' ? 'የመዝሙሩ ርዕስ ያስፈልጋል' : 'Mezmur title is required',
        );
      }

      const payload = {
        title: title.trim(),
        categoryId: categoryId ? Number(categoryId) : undefined,
        lyrics: lyrics.trim() || undefined,
        singer: singer.trim() || undefined,
        audioUrl: audioUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        isPublic,
      };

      if (mezmurToEdit) {
        return apiClient.put(`/mezmurs/${mezmurToEdit.id}`, payload);
      } else {
        return apiClient.post('/mezmurs', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mezmurs'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Operation failed');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Music className="h-5 w-5 text-primary" />
            <span>
              {mezmurToEdit
                ? locale === 'am'
                  ? 'መዝሙር አርትዕ'
                  : 'Edit Mezmur'
                : locale === 'am'
                ? 'አዲስ መዝሙር መዝግብ'
                : 'Add New Mezmur'}
            </span>
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Title & Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'የመዝሙሩ ርዕስ *' : 'Mezmur Title *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={locale === 'am' ? 'ምሳሌ፦ በመስቀልህ ጥላ ሥር' : 'Title'}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'የመዝሙር ምድብ' : 'Category'}
              </label>
              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : '')
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">
                  {locale === 'am' ? '— ምድብ ይምረጡ —' : '— Select Category —'}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === 'am' ? c.nameAm : c.nameEn || c.nameAm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Singer & Visibility */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'አዝማሪ / መዘምራን' : 'Singer / Choir'}
              </label>
              <input
                type="text"
                value={singer}
                onChange={(e) => setSinger(e.target.value)}
                placeholder={
                  locale === 'am'
                    ? 'ምሳሌ፦ አዕማደ ሰላም መዘምራን'
                    : 'e.g. Aemade Selam Choir'
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <label htmlFor="isPublic" className="text-xs font-medium text-foreground cursor-pointer">
                {locale === 'am'
                  ? 'ለሁሉም ምዕመናን በድረ-ገጹ ክፍት ይሁን (Public)'
                  : 'Publicly visible to visitors on website'}
              </label>
            </div>
          </div>

          {/* Lyrics */}
          <div>
            <label className="text-xs font-semibold text-foreground">
              {locale === 'am' ? 'የመዝሙሩ ስንኞችና ቃላት' : 'Lyrics'}
            </label>
            <textarea
              rows={5}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={
                locale === 'am'
                  ? 'የመዝሙሩን ሙሉ ቃላት እዚህ ያስገቡ...'
                  : 'Enter full lyrics in Amharic/Ge’ez...'
              }
              className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Audio Upload & Player Preview */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileAudio className="h-4 w-4 text-primary" />
              <span>{locale === 'am' ? 'የድምፅ ቅጂ (Audio)' : 'Audio Recording'}</span>
            </h4>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted cursor-pointer transition-colors">
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Upload className="h-4 w-4 text-primary" />
                )}
                <span>
                  {isUploading
                    ? locale === 'am'
                      ? 'እየተጫነ ነው...'
                      : 'Uploading...'
                    : locale === 'am'
                    ? 'የድምፅ ፋይል ምረጥ'
                    : 'Upload Audio File'}
                </span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a"
                  onChange={handleAudioUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder={
                    locale === 'am'
                      ? 'ወይም የድምፅ ፋይል ማስፈንጠሪያ (URL) እዚህ ያስገቡ'
                      : 'Or enter direct audio URL'
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Audio Preview Player */}
            {audioUrl && (
              <div className="mt-2 rounded-lg bg-card border border-border/80 p-3">
                <p className="text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-primary fill-primary" />
                  <span>{locale === 'am' ? 'የድምፅ ቅድመ-ዕይታ' : 'Audio Player Preview'}</span>
                </p>
                <audio controls src={audioUrl} className="w-full h-8 mt-1" />
              </div>
            )}
          </div>

          {/* Video URL */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Video className="h-4 w-4 text-secondary" />
              <span>{locale === 'am' ? 'የቪዲዮ ማስፈንጠሪያ (YouTube/MP4)' : 'Video URL'}</span>
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {saveMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>
              {mezmurToEdit
                ? locale === 'am'
                  ? 'አድስ'
                  : 'Save Changes'
                : locale === 'am'
                ? 'መዝግብ'
                : 'Create Mezmur'}
            </span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
