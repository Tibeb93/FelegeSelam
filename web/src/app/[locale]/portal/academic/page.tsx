'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Download,
  AlertCircle,
  Loader2,
  TrendingUp,
  FileBadge,
  Percent,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { Member } from '@/types/api';

export default function PortalAcademicPage() {
  const t = useTranslations('Portal');
  const tCourses = useTranslations('Courses');

  const [activeTab, setActiveTab] = useState<'attendance' | 'grades' | 'certificates'>('attendance');

  // Query Member Profile (contains attendances, enrollments with grades, certificates)
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<Member>({
    queryKey: ['members', 'me', 'profile'],
    queryFn: () => apiRequest<Member>('/members/me/profile'),
  });

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
        <p className="text-sm">Unable to load your academic records.</p>
      </div>
    );
  }

  // Calculate Attendance Stats
  const attendances = (profile as any).attendances || [];
  const totalSessions = attendances.length;
  const presentCount = attendances.filter((a: any) => a.status === 'present').length;
  const lateCount = attendances.filter((a: any) => a.status === 'late').length;
  const excusedCount = attendances.filter((a: any) => a.status === 'excused').length;
  const absentCount = attendances.filter((a: any) => a.status === 'absent').length;

  const attendanceRate = totalSessions > 0
    ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
    : 100;

  // Enrollments & Grades
  const enrollments = profile.enrollments || [];
  const certificates = (profile as any).certificates || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-ethiopic">
            {t('attendanceGrades')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review your Sunday school session attendance rate, course assessments, and earned certificates.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'attendance'
                ? 'bg-primary text-secondary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Attendance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grades')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'grades'
                ? 'bg-primary text-secondary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Grades & GPA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('certificates')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'certificates'
                ? 'bg-primary text-secondary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Certificates ({certificates.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Attendance Rate</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{attendanceRate}%</span>
                <span className="text-xs text-muted-foreground">of {totalSessions} sessions</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Present Days</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {presentCount}
                </span>
                <span className="text-xs text-muted-foreground">sessions</span>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Timely and active presence</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Late / Excused</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {lateCount + excusedCount}
                </span>
                <span className="text-xs text-muted-foreground">sessions</span>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Permitted exceptions</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Absences</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-destructive">{absentCount}</span>
                <span className="text-xs text-muted-foreground">unexcused</span>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Requires spiritual advisor check</p>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-bold text-foreground">Recent Attendance Log</h3>
            </div>

            {attendances.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No attendance sessions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Course</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendances.map((att: any) => {
                      const statusColor =
                        att.status === 'present'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : att.status === 'late'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : att.status === 'excused'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';

                      return (
                        <tr key={att.id} className="hover:bg-muted/30">
                          <td className="px-6 py-3 font-mono font-medium">
                            {new Date(att.sessionDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 font-semibold text-foreground font-ethiopic">
                            {att.course?.title || 'Sunday School Service'}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusColor}`}
                            >
                              {att.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {att.remarks || 'Regular class session'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GRADES & ASSESSMENTS */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          {enrollments.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No course assessment grades available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {enrollments.map((e: any) => {
                const grades = e.grades || [];
                const totalScore = grades.reduce(
                  (sum: number, g: any) => sum + (Number(g.score) || 0),
                  0,
                );
                const isPassed = totalScore >= 50;

                return (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
                      <div>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                          {e.course?.code || 'Course'}
                        </span>
                        <h3 className="text-base font-bold text-foreground font-ethiopic mt-1">
                          {e.course?.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block">Overall Total</span>
                          <span className="text-lg font-bold text-foreground font-mono">
                            {totalScore} / 100
                          </span>
                        </div>
                        <span
                          className={`rounded-xl px-3 py-1 text-xs font-bold uppercase ${
                            isPassed
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-destructive/10 text-destructive border border-destructive/20'
                          }`}
                        >
                          {isPassed ? 'PASSED' : 'IN PROGRESS'}
                        </span>
                      </div>
                    </div>

                    {grades.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">
                        Midterm and final scores have not been published for this course yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {grades.map((g: any) => (
                          <div
                            key={g.id || g.assessmentName}
                            className="rounded-xl border border-border bg-background p-3"
                          >
                            <span className="text-[11px] font-semibold text-muted-foreground block">
                              {g.assessmentName || 'Assessment'}
                            </span>
                            <span className="text-base font-bold text-primary font-mono mt-1 block">
                              {g.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {certificates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              <Award className="mx-auto h-12 w-12 opacity-30 mb-2" />
              <h3 className="text-base font-bold text-foreground font-ethiopic">
                ምንም የተሰጠ የምስክር ወረቀት የለም
              </h3>
              <p className="text-xs mt-1">
                Certificates of completion are issued by teachers upon passing course requirements.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {certificates.map((cert: any) => (
                <div
                  key={cert.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#C9A227] bg-[#FAF6EB] p-5 shadow-sm dark:bg-[#1f281e] dark:border-[#C9A227]/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary shadow-xs">
                      <Award className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {cert.certificateCode}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-base font-bold text-foreground font-ethiopic">
                      {cert.course?.title || 'Sunday School Diploma'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#C9A227]/30 flex items-center justify-between">
                    <Link
                      href={`/verify/${cert.certificateCode}`}
                      target="_blank"
                      className="text-xs font-semibold text-primary underline hover:opacity-80"
                    >
                      Verify Publicly
                    </Link>
                    <a
                      href={`http://localhost:3000/api/v1/certificates/${cert.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-primary-hover shadow-xs"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
