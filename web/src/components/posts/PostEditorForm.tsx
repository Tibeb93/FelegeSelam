'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Post, PostType } from '@/types/api';
import { TiptapEditor } from './TiptapEditor';
import {
  Flame,
  Sparkles,
  BookOpen,
  Calendar,
  Newspaper,
  GraduationCap,
  Upload,
  Eye,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CalendarDays,
} from 'lucide-react';

const POST_TYPES: { value: PostType; labelAm: string; labelEn: string; icon: any }[] = [
  { value: 'sinksar', labelAm: 'ስንክሳር (Synaxarium)', labelEn: 'Sinksar', icon: Sparkles },
  { value: 'bible_reading', labelAm: 'የዕለቱ ንባብ', labelEn: 'Bible Reading', icon: BookOpen },
  { value: 'saint_of_day', labelAm: 'የዕለቱ ቅዱስ', labelEn: 'Saint of Day', icon: Sparkles },
  { value: 'urgent', labelAm: 'አስቸኳይ ማስታወቂያ', labelEn: 'Urgent Announcement', icon: Flame },
  { value: 'event', labelAm: 'መርሐ-ግብር', labelEn: 'Event Notice', icon: Calendar },
  { value: 'news', labelAm: 'የሰንበት ት/ቤት ዜና', labelEn: 'Sunday School News', icon: Newspaper },
  { value: 'teaching', labelAm: 'ትምህርተ ወንጌል', labelEn: 'Spiritual Teaching', icon: GraduationCap },
];

interface PostEditorFormProps {
  initialPost?: Post | null;
  locale: string;
}

export function PostEditorForm({ initialPost, locale }: PostEditorFormProps) {
  const router = useRouter();

  // Helper to format Date to datetime-local string YYYY-MM-DDTHH:mm
  const formatDatetimeLocal = (isoString?: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  };

  const [type, setType] = useState<PostType>(initialPost?.type || 'sinksar');
  const [title, setTitle] = useState(initialPost?.title || '');
  const [body, setBody] = useState(initialPost?.body || '<p></p>');
  const [imageUrl, setImageUrl] = useState(initialPost?.imageUrl || '');
  const [isUrgent, setIsUrgent] = useState(initialPost?.isUrgent || false);
  const [publishAt, setPublishAt] = useState(
    formatDatetimeLocal(initialPost?.publishAt || new Date().toISOString()),
  );
  const [expiresAt, setExpiresAt] = useState(
    formatDatetimeLocal(initialPost?.expiresAt),
  );

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // When type changes to urgent, automatically turn on urgent toggle
  useEffect(() => {
    if (type === 'urgent') {
      setIsUrgent(true);
    }
  }, [type]);

  // Image file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post<any>('/forms/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = res.url || res.data?.url || res;
      setImageUrl(url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Submit mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error(
          locale === 'am' ? 'እባክዎ የመልዕክቱን ርዕስ ያስገቡ' : 'Post title is required',
        );
      }
      if (!body.trim() || body === '<p></p>') {
        throw new Error(
          locale === 'am' ? 'እባክዎ የመልዕክቱን ዝርዝር ይዘት ይጻፉ' : 'Post content is required',
        );
      }

      const payload = {
        type,
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        isUrgent,
        publishAt: publishAt ? new Date(publishAt).toISOString() : new Date().toISOString(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      if (initialPost) {
        return apiClient.put(`/posts/${initialPost.id}`, payload);
      } else {
        return apiClient.post('/posts', payload);
      }
    },
    onSuccess: () => {
      router.push(`/${locale}/admin/posts`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to save post');
    },
  });

  const selectedTypeInfo = POST_TYPES.find((t) => t.value === type);

  return (
    <div className="space-y-6">
      {/* Top Bar with Back and Action Buttons */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{locale === 'am' ? 'ተመለስ' : 'Back to Posts'}</span>
        </button>

        {/* Tab switch for mobile */}
        <div className="flex lg:hidden rounded-lg border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              activeTab === 'edit'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground'
            }`}
          >
            {locale === 'am' ? 'አዘጋጅ' : 'Editor'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              activeTab === 'preview'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground'
            }`}
          >
            {locale === 'am' ? 'ቅድመ-ዕይታ' : 'Preview'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || isUploadingImage}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            {initialPost
              ? locale === 'am'
                ? 'ለውጦችን አድስ'
                : 'Update Post'
              : locale === 'am'
              ? 'መልዕክቱን አትም / መዝግብ'
              : 'Publish Post'}
          </span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Split Columns Layout: Editor on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Editor Form Column */}
        <div
          className={`space-y-5 lg:col-span-7 ${
            activeTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Post Type & Urgent Announcement Toggle */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  {locale === 'am' ? 'የመልዕክት ዓይነት *' : 'Post Type *'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PostType)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {POST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {locale === 'am' ? t.labelAm : t.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="relative flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    disabled={type === 'urgent'}
                    className="h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500/30"
                  />
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <Flame className="h-4 w-4 fill-current" />
                      <span>{locale === 'am' ? 'አስቸኳይ ማስታወቂያ' : 'Mark as Urgent'}</span>
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {locale === 'am'
                        ? 'ለአባላት ወዲያውኑ ማሳወቂያ ይልካል'
                        : 'Dispatches instant push notification'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'የመልዕክቱ ርዕስ *' : 'Post Title *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  locale === 'am'
                    ? 'ምሳሌ፦ የዕለቱ ስንክሳር - ጥቅምት ፫'
                    : 'Post title...'
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Cover Image Upload & URL */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <label className="text-xs font-semibold text-foreground">
              {locale === 'am' ? 'የፊት ገጽ ምስል (Cover Image)' : 'Cover Image'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted cursor-pointer transition-colors">
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Upload className="h-4 w-4 text-primary" />
                )}
                <span>
                  {isUploadingImage
                    ? locale === 'am'
                      ? 'እየተጫነ...'
                      : 'Uploading...'
                    : locale === 'am'
                    ? 'ምስል ጫን'
                    : 'Upload Image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... or /uploads/..."
                className="flex-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Rich-Text Body Editor (Tiptap) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'የመልዕክቱ ይዘት (Rich Text) *' : 'Post Content (Rich Text) *'}
              </label>
              <span className="text-[11px] text-muted-foreground">
                {locale === 'am' ? 'Tiptap Editor' : 'Tiptap Rich-Text'}
              </span>
            </div>
            <TiptapEditor
              content={body}
              onChange={setBody}
              placeholder={
                locale === 'am'
                  ? 'የመልዕክቱን ሙሉ ጽሑፍ እዚህ ይጻፉ...'
                  : 'Compose spiritual post content here...'
              }
            />
          </div>

          {/* Scheduling & Expiry Controls */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-secondary" />
              <span>{locale === 'am' ? 'የህትመትና ሥርጭት መርሐ-ግብር' : 'Scheduling & Expiry'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  {locale === 'am' ? 'የሚለቀቅበት ቀንና ሰዓት *' : 'Publish Date & Time *'}
                </label>
                <input
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {locale === 'am'
                    ? 'ወደፊት የታቀደ ከሆነ በሰዓቱ እስኪደርስ አይታይም'
                    : 'Will remain scheduled until this time'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {locale === 'am' ? 'የሚያበቃበት ቀንና ሰዓት (አማራጭ)' : 'Expiry Date & Time (Optional)'}
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {locale === 'am'
                    ? 'ከዚህ ሰዓት በኋላ ከህዝብ እይታ ይሰወራል'
                    : 'Automatically hidden after this date'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div
          className={`space-y-4 lg:col-span-5 ${
            activeTab === 'edit' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="sticky top-20 rounded-2xl border border-primary/20 bg-card p-5 shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Eye className="h-4 w-4 text-primary" />
                <span>{locale === 'am' ? 'የቀጥታ ቅድመ-ዕይታ' : 'Live Reader Preview'}</span>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {locale === 'am' ? selectedTypeInfo?.labelAm : selectedTypeInfo?.labelEn}
              </span>
            </div>

            {/* Preview Post Card */}
            <article className="mt-4 space-y-4">
              {/* Cover Image */}
              {imageUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-border max-h-56">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {isUrgent && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      <Flame className="h-3 w-3 fill-current" />
                      <span>{locale === 'am' ? 'አስቸኳይ' : 'URGENT'}</span>
                    </div>
                  )}
                </div>
              ) : isUrgent ? (
                <div className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-3 py-1 text-xs font-bold">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  <span>{locale === 'am' ? 'አስቸኳይ ማስታወቂያ' : 'URGENT ANNOUNCEMENT'}</span>
                </div>
              ) : null}

              {/* Title & Metadata */}
              <div>
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground leading-snug">
                  {title || (locale === 'am' ? 'የመልዕክቱ ርዕስ እዚህ ይታያል' : 'Post Title Here')}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {publishAt ? new Date(publishAt).toLocaleDateString() : 'Today'}
                  </span>
                  <span>•</span>
                  <span>{locale === 'am' ? 'አዕማደ ሰላም ሰ/ት/ቤት' : 'Aemade Selam'}</span>
                </div>
              </div>

              {/* Rendered HTML Body */}
              <div
                className="prose dark:prose-invert max-w-none text-xs md:text-sm text-foreground/90 leading-relaxed border-t border-border pt-3"
                dangerouslySetInnerHTML={{
                  __html:
                    body && body !== '<p></p>'
                      ? body
                      : `<p class="text-muted-foreground italic">${
                          locale === 'am'
                            ? 'የመልዕክቱ ይዘት እዚህ በቅድመ-ዕይታ ይታያል...'
                            : 'Content preview will appear here...'
                        }</p>`,
                }}
              />
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
