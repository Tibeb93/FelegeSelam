'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/utils';
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
  AlertCircle,
  Loader2,
  Video,
  FileAudio,
} from 'lucide-react';
import {
  TextField,
  TextArea,
  SelectWithSearch,
  SwitchField,
  PrimaryButton,
  SecondaryButton,
} from '@/components/forms';

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

    // Reset input value so selecting the same file again triggers change event
    e.target.value = '';

    const isAudio =
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name);

    if (!isAudio) {
      setErrorMsg(
        locale === 'am'
          ? 'እባክዎ የድምፅ ፋይል (MP3, WAV, M4A, OGG) ይምረጡ'
          : 'Please select an audio file (MP3, WAV, M4A, OGG)',
      );
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg(
        locale === 'am'
          ? 'የድምፅ ፋይሉ መጠን ከ 25MB መብለጥ የለበትም'
          : 'Audio file size exceeds 25MB limit',
      );
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);

      // Upload via standalone mezmur audio endpoint
      const res = await apiClient.postFormData<any>('/mezmurs/upload-audio', formData);

      const uploadedUrl = res?.url || res?.fileUrl || res?.data?.url || (typeof res === 'string' ? res : '');
      if (uploadedUrl) {
        setAudioUrl(uploadedUrl);
      } else {
        throw new Error('No URL returned from server');
      }
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

  const categoryOptions = [
    {
      label: locale === 'am' ? '— ምድብ ይምረጡ —' : '— Select Category —',
      value: '',
    },
    ...categories.map((c) => ({
      label: locale === 'am' ? c.nameAm : c.nameEn || c.nameAm,
      value: c.id,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card p-6 md:p-8 rounded-2xl border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <Music className="h-5 w-5" />
            </div>
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
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Title & Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              name="title"
              label={locale === 'am' ? 'የመዝሙሩ ርዕስ' : 'Mezmur Title'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === 'am' ? 'ምሳሌ፦ በመስቀልህ ጥላ ሥር' : 'Title'}
              required
            />

            <SelectWithSearch
              name="categoryId"
              label={locale === 'am' ? 'የመዝሙር ምድብ' : 'Category'}
              options={categoryOptions}
              value={categoryId}
              onChange={(val) => setCategoryId(val ? Number(val) : '')}
            />
          </div>

          {/* Singer & Visibility */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-center">
            <TextField
              name="singer"
              label={locale === 'am' ? 'አዝማሪ / መዘምራን' : 'Singer / Choir'}
              value={singer}
              onChange={(e) => setSinger(e.target.value)}
              placeholder={
                locale === 'am'
                  ? 'ምሳሌ፦ አዕማደ ሰላም መዘምራን'
                  : 'e.g. Aemade Selam Choir'
              }
            />

            <div className="pt-2">
              <SwitchField
                name="isPublic"
                label={
                  locale === 'am'
                    ? 'ለሁሉም በድረ-ገጹ ክፍት ይሁን (Public)'
                    : 'Publicly visible'
                }
                helperText={
                  locale === 'am'
                    ? 'በመዝሙር ቤተ-መጽሐፍት ለጎብኚዎች ይታያል'
                    : 'Shown in public library'
                }
                checked={isPublic}
                onChange={setIsPublic}
              />
            </div>
          </div>

          {/* Lyrics */}
          <TextArea
            name="lyrics"
            label={locale === 'am' ? 'የመዝሙሩ ስንኞችና ቃላት' : 'Lyrics'}
            rows={5}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder={
              locale === 'am'
                ? 'የመዝሙሩን ሙሉ ቃላት እዚህ ያስገቡ...'
                : 'Enter full lyrics in Amharic/Ge’ez...'
            }
          />

          {/* Audio Upload & Player Preview */}
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileAudio className="h-4 w-4 text-primary" />
              <span>{locale === 'am' ? 'የድምፅ ቅጂ (Audio)' : 'Audio Recording'}</span>
            </h4>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground shadow-sm hover:bg-muted cursor-pointer transition-colors shrink-0">
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
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.flac"
                  onChange={handleAudioUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              <div className="flex-1 w-full">
                <TextField
                  name="audioUrl"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder={
                    locale === 'am'
                      ? 'ወይም የድምፅ ፋይል ማስፈንጠሪያ (URL) እዚህ ያስገቡ'
                      : 'Or enter direct audio URL'
                  }
                />
              </div>
            </div>

            {/* Audio Preview Player */}
            {audioUrl && (
              <div className="mt-2 rounded-xl bg-card border border-border p-3.5 shadow-sm">
                <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-primary fill-primary" />
                  <span>{locale === 'am' ? 'የድምፅ ቅድመ-ዕይታ' : 'Audio Player Preview'}</span>
                </p>
                <audio controls src={resolveMediaUrl(audioUrl)} className="w-full h-9 mt-1" />
              </div>
            )}
          </div>

          {/* Video URL */}
          <TextField
            name="videoUrl"
            label={locale === 'am' ? 'የቪዲዮ ማስፈንጠሪያ (YouTube/MP4)' : 'Video URL'}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            startIcon={<Video className="h-4 w-4" />}
          />
        </div>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border">
          <SecondaryButton
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11"
          >
            {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isUploading}
            loading={saveMutation.isPending}
            className="w-full sm:w-auto h-11"
          >
            {mezmurToEdit
              ? locale === 'am'
                ? 'አድስ'
                : 'Save Changes'
              : locale === 'am'
              ? 'መዝግብ'
              : 'Create Mezmur'}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
