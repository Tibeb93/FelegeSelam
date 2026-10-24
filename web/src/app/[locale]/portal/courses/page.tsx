'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Clock,
  User,
  CheckCircle,
  FileText,
  Music,
  Video,
  Download,
  ChevronRight,
  Loader2,
  ArrowRight,
  PlayCircle,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { Member, Course, Lesson } from '@/types/api';

export default function PortalCoursesPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('Portal');

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  // Query Member Profile (contains enrolled courses)
  const {
    data: profile,
    isLoading: profileLoading,
  } = useQuery<Member>({
    queryKey: ['members', 'me', 'profile'],
    queryFn: () => apiRequest<Member>('/members/me/profile'),
  });

  // Query Lessons for selected course
  const {
    data: lessonsData,
    isLoading: lessonsLoading,
  } = useQuery<{ items: Lesson[] } | Lesson[]>({
    queryKey: ['courses', selectedCourse?.id, 'lessons'],
    queryFn: () => apiRequest(`/courses/${selectedCourse?.id}/lessons`),
    enabled: !!selectedCourse?.id,
  });

  const lessons: Lesson[] = Array.isArray(lessonsData)
    ? lessonsData
    : (lessonsData as any)?.items || [];

  const enrolledCourses =
    profile?.enrollments?.map((e) => ({
      ...e.course,
      enrollmentStatus: e.status,
      enrollmentId: e.id,
      grades: (e as any).grades,
    })) || [];

  const toggleLessonComplete = (lessonId: string) => {
    setCompletedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-ethiopic">
          {t('myCourses')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Access course lessons, study materials, spiritual audio, and video lectures.
        </p>
      </div>

      {/* Enrolled Courses Grid */}
      {enrolledCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-40 mb-3" />
          <h3 className="text-lg font-bold text-foreground font-ethiopic">
            ምንም የተመዘገቡበት የትምህርት ክፍል የለም
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
            You are not currently enrolled in any academic courses. Browse open classes to enroll.
          </p>
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-secondary shadow-md hover:bg-primary-hover"
          >
            <span>Explore Open Courses</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrolledCourses.map((c: any) => {
            const isSelected = selectedCourse?.id === c.id;
            return (
              <div
                key={c.id || c.title}
                className={`flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-xs transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {c.level || 'All Levels'}
                    </span>
                    <span className="rounded-full bg-status-success/15 px-2.5 py-0.5 text-xs font-bold text-status-success uppercase tracking-wider">
                      {c.enrollmentStatus || 'Active'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground font-ethiopic line-clamp-1">
                    {c.title || c.titleAm}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {c.description || 'Spiritual curriculum and liturgical education'}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                    {c.teacher && (
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>Teacher: {c.teacher.fullName || c.teacher.email}</span>
                      </div>
                    )}
                    {c.schedule && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{c.schedule}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourse(c);
                      setSelectedLesson(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 hover:bg-primary hover:text-white px-4 py-2 text-xs font-bold text-primary transition-colors"
                  >
                    <span>View Lessons & Materials</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SELECTED COURSE LESSON DRAWER / VIEWER */}
      {selectedCourse && (
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                  Course Content
                </span>
                {selectedCourse.code && (
                  <span className="text-xs text-muted-foreground">{selectedCourse.code}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground font-ethiopic mt-1">
                {selectedCourse.title || selectedCourse.titleAm}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCourse(null);
                setSelectedLesson(null);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lessons List Column */}
            <div className="lg:col-span-1 space-y-2 border-r border-border pr-0 lg:pr-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Course Syllabus ({lessons.length} Lessons)
              </h4>

              {lessonsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : lessons.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No published lessons available for this course yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {lessons.map((lesson, idx) => {
                    const isCurrent = selectedLesson?.id === lesson.id;
                    const isDone = !!completedLessons[lesson.id];
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                          isCurrent
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-foreground font-ethiopic line-clamp-1">
                              {lesson.title}
                            </span>
                          </div>
                          {isDone && <CheckCircle className="h-4 w-4 shrink-0 text-primary" />}
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                          {(lesson.pdfUrl || lesson.mediaType === 'pdf') && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-red-500" />
                              <span>PDF</span>
                            </span>
                          )}
                          {(lesson.audioUrl || lesson.mediaType === 'audio') && (
                            <span className="flex items-center gap-1">
                              <Music className="h-3 w-3 text-secondary" />
                              <span>Audio</span>
                            </span>
                          )}
                          {(lesson.videoUrl || lesson.mediaType === 'video') && (
                            <span className="flex items-center gap-1">
                              <Video className="h-3 w-3 text-blue-500" />
                              <span>Video</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lesson Content / Media Viewer Column */}
            <div className="lg:col-span-2">
              {selectedLesson ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <span className="text-xs font-semibold text-primary">Lesson Material</span>
                      <h3 className="text-lg font-bold text-foreground font-ethiopic">
                        {selectedLesson.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLessonComplete(selectedLesson.id)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                        completedLessons[selectedLesson.id]
                          ? 'bg-primary text-white'
                          : 'border border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>
                        {completedLessons[selectedLesson.id] ? 'Completed' : 'Mark as Done'}
                      </span>
                    </button>
                  </div>

                  {/* Body Content */}
                  {selectedLesson.content && (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground font-ethiopic">
                      <p>{selectedLesson.content}</p>
                    </div>
                  )}

                  {/* Audio Player */}
                  {(selectedLesson.audioUrl || (selectedLesson.mediaType === 'audio' && selectedLesson.fileUrl)) && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Music className="h-4 w-4" />
                        <span>Spiritual Chants & Hymn Lesson Audio</span>
                      </div>
                      <audio controls className="w-full h-10" src={selectedLesson.audioUrl || selectedLesson.fileUrl || ''}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Video Player */}
                  {(selectedLesson.videoUrl || (selectedLesson.mediaType === 'video' && selectedLesson.fileUrl)) && (
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <Video className="h-4 w-4" />
                        <span>Lecture Video</span>
                      </div>
                      <video
                        controls
                        className="w-full rounded-lg max-h-[360px] bg-black"
                        src={selectedLesson.videoUrl || selectedLesson.fileUrl || ''}
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  )}

                  {/* PDF Document Preview & Download */}
                  {(selectedLesson.pdfUrl || (selectedLesson.mediaType === 'pdf' && selectedLesson.fileUrl)) && (
                    <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Lecture Notes & Handout</p>
                          <span className="text-[11px] text-muted-foreground">PDF Document</span>
                        </div>
                      </div>
                      <a
                        href={selectedLesson.pdfUrl || selectedLesson.fileUrl || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-secondary hover:bg-primary-hover shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  <PlayCircle className="h-10 w-10 opacity-40 mb-2" />
                  <p className="text-sm font-semibold">Select a lesson from the syllabus</p>
                  <p className="text-xs mt-1">Click on any lesson on the left to read notes, stream audio or video.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
