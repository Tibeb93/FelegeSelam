'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Lesson } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Plus,
  GripVertical,
  FileText,
  FileSpreadsheet,
  Music,
  Video,
  Link as LinkIcon,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  Play,
  Download,
  X,
  AlertCircle,
} from 'lucide-react';

interface CourseLessonsTabProps {
  courseId: string;
  lessons: Lesson[];
  onRefresh: () => void;
}

export function CourseLessonsTab({
  courseId,
  lessons: initialLessons,
  onRefresh,
}: CourseLessonsTabProps) {
  const locale = useLocale();
  const t = useTranslations('Courses');
  const tCommon = useTranslations('Common');

  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  // Lesson form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<'text' | 'pdf' | 'audio' | 'video' | 'link'>('text');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // File upload state per lesson
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Media preview modal state
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'pdf' | 'audio' | 'video';
    url: string;
    title: string;
  } | null>(null);

  // Synchronize initial lessons when parent updates
  React.useEffect(() => {
    setLessons(initialLessons);
  }, [initialLessons]);

  const handleOpenAddModal = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setTitle(lesson.title);
      setContent(lesson.content || '');
      setMediaType(lesson.mediaType);
      setPublished(lesson.published);
    } else {
      setEditingLesson(null);
      setTitle('');
      setContent('');
      setMediaType('text');
      setPublished(true);
    }
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError(locale === 'am' ? 'የትምህርቱ ርዕስ መሞላት አለበት' : 'Title is required');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      if (editingLesson) {
        await apiClient.put(`/courses/${courseId}/lessons/${editingLesson.id}`, {
          title,
          content,
          mediaType,
          published,
        });
      } else {
        await apiClient.post(`/courses/${courseId}/lessons`, {
          title,
          content,
          mediaType,
          orderNo: lessons.length + 1,
          published,
        });
      }

      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    try {
      await apiClient.patch(`/courses/${courseId}/lessons/${lesson.id}`, {
        published: !lesson.published,
      });
      // Optimistic update
      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, published: !l.published } : l)),
      );
      onRefresh();
    } catch (err) {
      logger.error('Failed to toggle publish', err);
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    try {
      await apiClient.delete(`/courses/${courseId}/lessons/${lessonToDelete.id}`);
      setLessonToDelete(null);
      onRefresh();
    } catch (err) {
      logger.error('Failed to delete lesson', err);
    }
  };

  // Drag and Drop ordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updated = [...lessons];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, draggedItem);

    // Update orderNos
    const reordered = updated.map((item, idx) => ({
      ...item,
      orderNo: idx + 1,
    }));

    setLessons(reordered);
    setDraggedIndex(null);

    try {
      await apiClient.patch(`/courses/${courseId}/lessons/reorder`, {
        items: reordered.map((item) => ({
          lessonId: item.id,
          orderNo: item.orderNo,
        })),
      });
      onRefresh();
    } catch (err) {
      logger.error('Failed to reorder lessons', err);
    }
  };

  // File Upload with Progress
  const handleFileUpload = async (lessonId: string, file: File) => {
    try {
      setUploadingLessonId(lessonId);
      setUploadProgress(0);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', file);

      // Using XMLHttpRequest for upload progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/v1/courses/${courseId}/lessons/${lessonId}/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      setUploadingLessonId(null);
      setUploadProgress(100);
      onRefresh();
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
      setUploadingLessonId(null);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileSpreadsheet className="h-4 w-4 text-red-500" />;
      case 'audio':
        return <Music className="h-4 w-4 text-purple-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'link':
        return <LinkIcon className="h-4 w-4 text-emerald-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header & Add Lesson Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>{t('lessonsList')}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('reorderNotice')}</p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t('addLesson')}</span>
        </button>
      </div>

      {uploadError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            {locale === 'am' ? 'ምንም ትምህርት አልተጨመረም' : 'No lessons yet'}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {locale === 'am'
              ? 'የትምህርት ክፍለ ጊዜዎችን፣ የPDF ማስታወሻዎችንና የድምጽ ቅጂዎችን እዚህ ይጨምሩ'
              : 'Add lecture notes, PDF study guides, and audio/video files to this course'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addLesson')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`rounded-2xl border bg-card p-4 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-grab active:cursor-grabbing hover:border-primary/40 ${
                draggedIndex === index ? 'opacity-40 border-primary' : 'border-border'
              }`}
            >
              {/* Drag Handle & Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-muted-foreground hover:text-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground font-semibold text-xs border border-border">
                  {lesson.orderNo || index + 1}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {getMediaIcon(lesson.mediaType)}
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {lesson.title}
                    </h3>
                  </div>
                  {lesson.content && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md">
                      {lesson.content}
                    </p>
                  )}
                </div>
              </div>

              {/* Status & Media File Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                {/* File Upload / Preview Pill */}
                {lesson.fileUrl ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewMedia({
                          type: lesson.mediaType as any,
                          url: lesson.fileUrl!,
                          title: lesson.title,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary hover:bg-secondary/20 transition-colors"
                      title={t('previewMedia')}
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>{t('previewMedia')}</span>
                    </button>
                    <a
                      href={lesson.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                      title={tCommon('download')}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{t('uploadMedia')}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.mp3,.wav,.m4a,.mp4,.webm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(lesson.id, file);
                      }}
                    />
                  </label>
                )}

                {/* Upload Progress Bar if active */}
                {uploadingLessonId === lesson.id && (
                  <div className="flex items-center gap-2 text-xs text-primary font-medium">
                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span>{uploadProgress}%</span>
                  </div>
                )}

                {/* Publish Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleTogglePublish(lesson)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    lesson.published
                      ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  title={lesson.published ? t('hide') : t('publish')}
                >
                  {lesson.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span>{lesson.published ? t('published') : t('hidden')}</span>
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(lesson)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={tCommon('edit')}
                >
                  <FileText className="h-4 w-4" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setLessonToDelete(lesson)}
                  className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  title={tCommon('delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Lesson Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingLesson ? t('editLesson') : t('addLesson')}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('lessonTitle')} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ለምሳሌ፡ ክፍል ፩፡ የቤተ ክርስቲያን ታሪክ"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('mediaType')}
                </label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="text">{t('mediaText')}</option>
                  <option value="pdf">{t('mediaPdf')}</option>
                  <option value="audio">{t('mediaAudio')}</option>
                  <option value="video">{t('mediaVideo')}</option>
                  <option value="link">{t('mediaLink')}</option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">{t('mediaLimits')}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('lessonContent')}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="የትምህርቱ ማጠቃለያ፣ ማስታወሻ ወይም መግለጫ..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="publishedCheckbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label
                  htmlFor="publishedCheckbox"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  {t('publish')} ({locale === 'am' ? 'ለተማሪዎች ይታይ' : 'Visible to students'})
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? tCommon('loading') : tCommon('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground truncate">{previewMedia.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-[250px] flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden p-2">
              {previewMedia.type === 'audio' ? (
                <div className="w-full max-w-md p-6 text-center space-y-4">
                  <Music className="h-12 w-12 text-primary mx-auto" />
                  <audio controls className="w-full" src={previewMedia.url}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : previewMedia.type === 'video' ? (
                <video controls className="w-full max-h-[480px] rounded-lg" src={previewMedia.url}>
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-[500px]">
                  <iframe
                    src={previewMedia.url}
                    className="w-full h-full rounded-lg border border-border"
                    title={previewMedia.title}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="rounded-xl bg-muted px-4 py-2 text-xs font-medium hover:bg-muted/80"
              >
                {tCommon('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lesson Confirmation */}
      <ConfirmDialog
        open={!!lessonToDelete}
        onOpenChange={(open) => !open && setLessonToDelete(null)}
        title={t('deleteLesson')}
        description={
          locale === 'am'
            ? `«${lessonToDelete?.title}» የሚለውን ትምህርት በእርግጥ መሰረዝ ይፈልጋሉ?`
            : `Are you sure you want to delete lesson "${lessonToDelete?.title}"?`
        }
        confirmLabel={locale === 'am' ? 'አዎ ሰርዝ' : 'Delete'}
        cancelLabel={tCommon('cancel')}
        variant="destructive"
        onConfirm={handleDeleteLesson}
      />
    </div>
  );
}
