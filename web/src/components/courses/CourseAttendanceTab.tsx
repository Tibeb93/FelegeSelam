'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Course, CourseEnrollment, CourseAttendanceRecord } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
  QrCode,
  Camera,
  Save,
  RotateCcw,
  AlertCircle,
  History,
  Check,
  X,
} from 'lucide-react';

interface CourseAttendanceTabProps {
  course: Course;
  enrollments: CourseEnrollment[];
  onRefresh: () => void;
}

type AttendanceStatusType = 'present' | 'absent' | 'late' | 'excused';

export function CourseAttendanceTab({
  course,
  enrollments,
  onRefresh,
}: CourseAttendanceTabProps) {
  const locale = useLocale();
  const t = useTranslations('Courses');
  const tCommon = useTranslations('Common');

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Map of student memberId -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatusType>>({});
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSuccessMsg, setSessionSuccessMsg] = useState<string | null>(null);
  const [sessionErrorMsg, setSessionErrorMsg] = useState<string | null>(null);

  // Past attendance records
  const [historyRecords, setHistoryRecords] = useState<CourseAttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // QR Scanner Modal State
  const [showScanModal, setShowScanModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualMemberNo, setManualMemberNo] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeStudents = enrollments.filter((e) => e.status !== 'dropped');

  // Initialize attendance map with present by default or empty
  useEffect(() => {
    async function loadAttendanceForDate() {
      try {
        const res = await apiClient.get<any>(`/courses/${course.id}/attendance`, {
          params: { sessionDate: selectedDate },
        });
        const items: CourseAttendanceRecord[] = res?.data?.items || res?.data || [];

        if (items.length > 0) {
          const map: Record<string, AttendanceStatusType> = {};
          items.forEach((item) => {
            map[item.memberId] = item.status;
          });
          setAttendanceMap(map);
        } else {
          // Default all active students to present
          const map: Record<string, AttendanceStatusType> = {};
          const active = enrollments.filter((e) => e.status !== 'dropped');
          active.forEach((enr) => {
            map[enr.memberId] = 'present';
          });
          setAttendanceMap(map);
        }
      } catch (err) {
        console.error('Failed to load session attendance', err);
      }
    }

    if (selectedDate) {
      loadAttendanceForDate();
    }
  }, [selectedDate, course.id, enrollments]);

  // Load overall attendance history
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await apiClient.get<any>(`/courses/${course.id}/attendance`, {
        params: { limit: 100 },
      });
      const items: CourseAttendanceRecord[] = res?.data?.items || res?.data || [];
      setHistoryRecords(items);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to load attendance history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleMarkAllPresent = () => {
    const map: Record<string, AttendanceStatusType> = {};
    activeStudents.forEach((enr) => {
      map[enr.memberId] = 'present';
    });
    setAttendanceMap(map);
  };

  const handleStatusChange = (memberId: string, status: AttendanceStatusType) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [memberId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setSavingSession(true);
      setSessionErrorMsg(null);
      setSessionSuccessMsg(null);

      const records = activeStudents.map((enr) => ({
        memberId: enr.memberId,
        status: attendanceMap[enr.memberId] || 'present',
      }));

      // Try POST first; if 409 conflict (duplicate date), use PUT to update
      try {
        await apiClient.post(`/courses/${course.id}/attendance`, {
          sessionDate: selectedDate,
          records,
        });
      } catch (postErr: any) {
        if (postErr?.response?.status === 409 || postErr?.statusCode === 409) {
          await apiClient.put(`/courses/${course.id}/attendance`, {
            sessionDate: selectedDate,
            records,
          });
        } else {
          throw postErr;
        }
      }

      setSessionSuccessMsg(t('sessionSaved'));
      onRefresh();
    } catch (err: any) {
      setSessionErrorMsg(err?.response?.data?.message || err?.message || 'Failed to save attendance');
    } finally {
      setSavingSession(false);
    }
  };

  // QR Camera Handling
  const startCamera = async () => {
    try {
      setCameraActive(true);
      setScanResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleScanSubmit = async (memberNumberToScan?: string) => {
    const num = (memberNumberToScan || manualMemberNo).trim();
    if (!num) return;

    try {
      setScanning(true);
      setScanResult(null);

      const res = await apiClient.post<any>('/attendance/scan', {
        courseId: course.id,
        memberNo: num,
        sessionDate: selectedDate,
      });

      setScanResult({
        success: true,
        message: `${t('scanSuccess')}: ${num}`,
      });
      setManualMemberNo('');

      // Update local state if member is in list
      const matchedEnr = activeStudents.find((e) => e.member.memberNo === num);
      if (matchedEnr) {
        setAttendanceMap((prev) => ({
          ...prev,
          [matchedEnr.memberId]: 'present',
        }));
      }

      onRefresh();
    } catch (err: any) {
      const msg =
        err?.response?.status === 409
          ? t('scanDuplicate')
          : err?.response?.data?.message || err?.message || 'Scan failed';
      setScanResult({
        success: false,
        message: msg,
      });
    } finally {
      setScanning(false);
    }
  };

  // Group history by date
  const groupedHistory = historyRecords.reduce(
    (acc, rec) => {
      const dateKey = rec.sessionDate.split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(rec);
      return acc;
    },
    {} as Record<string, CourseAttendanceRecord[]>,
  );

  return (
    <div className="space-y-6">
      {/* Session Date & Action Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">{t('sessionDate')}:</span>
          </div>

          <div className="w-56">
            <EthiopianDatePicker
              value={selectedDate}
              onChange={(val) => {
                if (val) setSelectedDate(val);
              }}
              locale={locale as 'am' | 'en'}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span>{t('markAllPresent')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowScanModal(true);
              setScanResult(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <QrCode className="h-4 w-4" />
            <span>{t('scanQr')}</span>
          </button>

          <button
            type="button"
            onClick={loadHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <History className="h-4 w-4" />
            <span>{t('attendanceHistory')}</span>
          </button>

          <button
            type="button"
            disabled={savingSession || activeStudents.length === 0}
            onClick={handleSaveAttendance}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{savingSession ? t('savingSession') : t('saveSession')}</span>
          </button>
        </div>
      </div>

      {sessionSuccessMsg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{sessionSuccessMsg}</span>
        </div>
      )}

      {sessionErrorMsg && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{sessionErrorMsg}</span>
        </div>
      )}

      {/* Attendance Grid */}
      {activeStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground text-xs">
          {locale === 'am'
            ? 'በዚህ ትምህርት ውስጥ የተመዘገቡ ንቁ ተማሪዎች የሉም። አስቀድመው ተማሪዎችን ይመዝግቡ።'
            : 'No active students enrolled in this course yet.'}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">{locale === 'am' ? 'ተማሪ' : 'Student'}</th>
                  <th className="px-4 py-3">{locale === 'am' ? 'የአባል ቁጥር' : 'Member No'}</th>
                  <th className="px-4 py-3 text-center">{t('present')}</th>
                  <th className="px-4 py-3 text-center">{t('absent')}</th>
                  <th className="px-4 py-3 text-center">{t('late')}</th>
                  <th className="px-4 py-3 text-center">{t('excused')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeStudents.map((enr) => {
                  const m = enr.member;
                  const fullName = `${m.firstName} ${m.fatherName} ${m.grandfatherName || ''}`.trim();
                  const currentStatus = attendanceMap[enr.memberId] || 'present';

                  return (
                    <tr key={enr.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{fullName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {m.memberNo}
                      </td>

                      {/* Present Radio */}
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`att_${enr.memberId}`}
                            value="present"
                            checked={currentStatus === 'present'}
                            onChange={() => handleStatusChange(enr.memberId, 'present')}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                              currentStatus === 'present'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                                : 'bg-background border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            ✓
                          </span>
                        </label>
                      </td>

                      {/* Absent Radio */}
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`att_${enr.memberId}`}
                            value="absent"
                            checked={currentStatus === 'absent'}
                            onChange={() => handleStatusChange(enr.memberId, 'absent')}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-destructive text-destructive-foreground border-destructive shadow-sm'
                                : 'bg-background border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            ✕
                          </span>
                        </label>
                      </td>

                      {/* Late Radio */}
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`att_${enr.memberId}`}
                            value="late"
                            checked={currentStatus === 'late'}
                            onChange={() => handleStatusChange(enr.memberId, 'late')}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                : 'bg-background border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            ⏰
                          </span>
                        </label>
                      </td>

                      {/* Excused Radio */}
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`att_${enr.memberId}`}
                            value="excused"
                            checked={currentStatus === 'excused'}
                            onChange={() => handleStatusChange(enr.memberId, 'excused')}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                              currentStatus === 'excused'
                                ? 'bg-blue-500 text-white border-blue-600 shadow-sm'
                                : 'bg-background border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            ✉
                          </span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Scanner / Camera & Manual Input Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <span>{t('scanQr')}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setShowScanModal(false);
                }}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">{t('scanQrDesc')}</p>

            {/* Camera Viewfinder */}
            <div className="relative rounded-2xl bg-black overflow-hidden aspect-video flex flex-col items-center justify-center border border-border">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder target box */}
                  <div className="absolute inset-8 border-2 border-primary/80 rounded-xl pointer-events-none animate-pulse" />
                </>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Camera className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    {locale === 'am' ? 'ካሜራው አልተከፈተም' : 'Camera is inactive'}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{t('startCamera')}</span>
                  </button>
                </div>
              )}
            </div>

            {cameraActive && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {t('stopCamera')}
                </button>
              </div>
            )}

            {/* Manual memberNo fallback */}
            <div className="pt-2 border-t border-border space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                {t('manualMemberNo')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualMemberNo}
                  onChange={(e) => setManualMemberNo(e.target.value)}
                  placeholder="e.g. AS-2026-0001"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleScanSubmit();
                  }}
                />
                <button
                  type="button"
                  disabled={scanning || !manualMemberNo.trim()}
                  onClick={() => handleScanSubmit()}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {scanning ? '...' : t('submitScan')}
                </button>
              </div>
            </div>

            {/* Scan Feedback Banner */}
            {scanResult && (
              <div
                className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                  scanResult.success
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-destructive/10 border border-destructive/20 text-destructive'
                }`}
              >
                {scanResult.success ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{scanResult.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <span>{t('attendanceHistory')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {Object.keys(groupedHistory).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  {locale === 'am' ? 'ምንም ያለፈ የመገኘት መዝገብ የለም' : 'No past sessions recorded yet'}
                </p>
              ) : (
                Object.entries(groupedHistory).map(([date, records]) => {
                  const presentCount = records.filter((r) => r.status === 'present').length;
                  const total = records.length;
                  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

                  return (
                    <div
                      key={date}
                      className="rounded-xl border border-border bg-muted/20 p-3.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-foreground text-sm block">
                          {new Date(date).toLocaleDateString()}
                        </span>
                        <span className="text-muted-foreground">
                          {presentCount} / {total} {t('present')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-lg ${
                            pct >= 75
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {pct}%
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(date);
                            setShowHistoryModal(false);
                          }}
                          className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-muted"
                        >
                          {tCommon('edit')}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
