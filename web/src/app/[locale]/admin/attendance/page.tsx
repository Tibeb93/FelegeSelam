'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { gregorianToEthiopian, formatEthiopianDate } from '@/lib/ethiopian-calendar';
import { apiRequest } from '@/lib/api-client';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  Lock,
  Unlock,
  Users,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  UserX,
  X,
  Loader2,
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  memberId: string;
  sessionId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string | null;
  markedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  member: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    grandfatherName?: string | null;
    photoUrl?: string | null;
    department?: { id: number; nameAm: string; nameEn?: string | null } | null;
  };
}

interface AttendanceSession {
  id: string;
  title: string;
  sessionDate: string;
  courseId: string | null;
  status: 'open' | 'closed';
  openedBy: string;
  closedAt: string | null;
  stats: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    totalMarked: number;
    totalEligible: number;
    unmarked: number;
  };
  records: AttendanceRecord[];
  course?: { id: string; titleAm: string; titleEn?: string | null } | null;
}

interface SearchMemberResult {
  id: string;
  memberNo: string;
  fullName: string;
  photo: string | null;
  department: string | null;
  status: string;
}

interface UndoState {
  recordId: string;
  memberId: string;
  memberName: string;
  previousStatus: 'present' | 'absent' | 'late' | 'excused' | null;
  markedStatus: 'present' | 'absent' | 'late' | 'excused';
}

export default function AdminAttendancePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { role } = useAuth();
  const toast = useToast();

  const isSuperAdmin = role === 'super_admin';
  const isAmharic = locale === 'am';

  // State
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchMemberResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<SearchMemberResult | null>(null);
  const [isMarking, setIsMarking] = useState<boolean>(false);

  // Feedback & Undo
  const [flashCard, setFlashCard] = useState<boolean>(false);
  const [undoItem, setUndoItem] = useState<UndoState | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dialogs
  const [isMarkAllAbsentOpen, setIsMarkAllAbsentOpen] = useState<boolean>(false);
  const [isCloseSessionOpen, setIsCloseSessionOpen] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Live clock
  const [currentTime, setCurrentTime] = useState<string>('');

  // Roster table filter
  const [rosterFilter, setRosterFilter] = useState<string>('all');
  const [rosterSearch, setRosterSearch] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Soft Web Audio feedback
  const playChime = useCallback((type: 'success' | 'warning' | 'error') => {
    try {
      if (typeof window === 'undefined') return;
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.15);
      }

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio autoplay might be blocked, gracefully ignore
    }
  }, []);

  // Update live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(isAmharic ? 'am-ET' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isAmharic]);

  // Load available sessions and open/reuse today's general session
  const loadSessions = useCallback(
    async (preferId?: string) => {
      try {
        setIsLoadingSession(true);
        // First, open or reuse today's general session
        const todayStr = new Date().toISOString().split('T')[0];
        const defaultSessionRes = await apiRequest<AttendanceSession>('attendance/sessions', {
          method: 'POST',
          body: {
            sessionDate: todayStr,
            title: isAmharic ? 'የሰንበት መርሐ-ግብር / Sunday Service' : 'Sunday Service Attendance',
          },
        });

        // List sessions
        const list = await apiRequest<AttendanceSession[]>('attendance/sessions');
        setSessions(list || []);

        const activeId = preferId || defaultSessionRes.id;
        setSelectedSessionId(activeId);

        // Fetch complete active session data
        const activeData = await apiRequest<AttendanceSession>(`attendance/sessions/${activeId}`);
        setSession(activeData);
      } catch (err: any) {
        toast.error(err.message || 'Failed to initialize attendance session');
      } finally {
        setIsLoadingSession(false);
      }
    },
    [isAmharic, toast],
  );

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Switch session dropdown
  const handleSelectSession = async (id: string) => {
    setSelectedSessionId(id);
    setSelectedMember(null);
    setSearchQuery('');
    setSearchResults([]);
    try {
      setIsLoadingSession(true);
      const data = await apiRequest<AttendanceSession>(`attendance/sessions/${id}`);
      setSession(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load session');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await apiRequest<SearchMemberResult[]>(
          `members/search?q=${encodeURIComponent(searchQuery.trim())}`,
        );
        setSearchResults(results || []);

        // Auto select if single exact match or matches memberNo
        const exactMatch = results?.find(
          (m) =>
            m.memberNo.toLowerCase() === searchQuery.trim().toLowerCase() ||
            m.fullName.toLowerCase() === searchQuery.trim().toLowerCase(),
        );
        if (exactMatch && !selectedMember) {
          setSelectedMember(exactMatch);
        }
      } catch {
        // Silently ignore search errors while typing
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedMember]);

  // Handle Mark Attendance
  const handleMark = useCallback(
    async (status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => {
      if (!session || !selectedMember) return;
      if (session.status === 'closed') {
        toast.warning(
          isAmharic
            ? 'ክፍለ-ጊዜው ተዘግቷል። የተዘጋ መዝገብ መቀየር አይቻልም።'
            : 'Session is closed. Closed sessions reject attendance marks.',
        );
        return;
      }

      setIsMarking(true);
      const memberToMark = selectedMember;

      // Find previous status if already marked
      const records = session.records || (session as any).attendances || [];
      const existing = records.find((r: any) => r.memberId === memberToMark.id);
      const previousStatus = existing?.status || null;

      try {
        const res = await apiRequest<{ record: AttendanceRecord; session: AttendanceSession }>(
          `attendance/sessions/${session.id}/records/${memberToMark.id}`,
          {
            method: 'PUT',
            body: { status, notes },
          },
        );

        // Flash animation & audio chime
        setFlashCard(true);
        setTimeout(() => setFlashCard(false), 500);
        playChime(status === 'present' ? 'success' : status === 'late' ? 'warning' : 'error');

        // Update session state
        setSession(res.session);

        // Set undo toast state
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setUndoItem({
          recordId: res.record.id,
          memberId: memberToMark.id,
          memberName: memberToMark.fullName,
          previousStatus,
          markedStatus: status,
        });

        undoTimerRef.current = setTimeout(() => {
          setUndoItem(null);
        }, 6000);

        // Clear search and member selection, re-focus search box
        setSelectedMember(null);
        setSearchQuery('');
        setSearchResults([]);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to record attendance');
      } finally {
        setIsMarking(false);
      }
    },
    [session, selectedMember, isAmharic, playChime, toast],
  );

  // Undo Handler
  const handleUndo = async () => {
    if (!undoItem || !session) return;
    try {
      if (undoItem.previousStatus) {
        // Revert to previous status
        const res = await apiRequest<{ record: AttendanceRecord; session: AttendanceSession }>(
          `attendance/sessions/${session.id}/records/${undoItem.memberId}`,
          {
            method: 'PUT',
            body: { status: undoItem.previousStatus },
          },
        );
        setSession(res.session);
        toast.info(
          isAmharic
            ? `የ${undoItem.memberName} መገኘት ወደ ቀድሞ ሁኔታው ተመልሷል።`
            : `Reverted ${undoItem.memberName} attendance.`,
        );
      } else {
        // Was freshly marked, delete record to unmark
        const res = await apiRequest<{ success: boolean; session: AttendanceSession }>(
          `attendance/sessions/${session.id}/records/${undoItem.memberId}`,
          {
            method: 'DELETE',
          },
        );
        setSession(res.session);
        toast.info(
          isAmharic
            ? `የ${undoItem.memberName} ምዝገባ ተሰርዟል።`
            : `Cleared mark for ${undoItem.memberName}.`,
        );
      }
      setUndoItem(null);
    } catch {
      toast.error('Failed to undo attendance');
    }
  };

  // Keyboard Shortcuts: P (present), A (absent), L (late), Esc (clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is actively typing in a non-attendance input
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === 'textarea' ||
        (activeTag === 'input' && document.activeElement !== searchInputRef.current)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setSelectedMember(null);
        setSearchQuery('');
        setSearchResults([]);
        if (searchInputRef.current) searchInputRef.current.focus();
        return;
      }

      if (selectedMember && !isMarking) {
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          handleMark('present');
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handleMark('absent');
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          handleMark('late');
        }
      } else if (!selectedMember && searchResults.length > 0 && e.key === 'Enter') {
        e.preventDefault();
        setSelectedMember(searchResults[0]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMember, searchResults, isMarking, handleMark]);

  // Bulk mark all remaining as absent
  const handleConfirmMarkAllAbsent = async () => {
    if (!session) return;
    setIsActionLoading(true);
    try {
      const updated = await apiRequest<AttendanceSession>(
        `attendance/sessions/${session.id}/mark-all-absent`,
        { method: 'POST' },
      );
      setSession(updated);
      toast.success(
        isAmharic
          ? 'ቀሪ ያልተመዘገቡ አባላት በሙሉ "አልተገኙም" ተብለው ተመዝግበዋል።'
          : 'Marked all remaining active members as absent.',
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark remaining absent');
    } finally {
      setIsActionLoading(false);
      setIsMarkAllAbsentOpen(false);
    }
  };

  // Close session
  const handleConfirmCloseSession = async () => {
    if (!session) return;
    setIsActionLoading(true);
    try {
      const updated = await apiRequest<AttendanceSession>(
        `attendance/sessions/${session.id}/close`,
        { method: 'POST' },
      );
      setSession(updated);
      toast.success(isAmharic ? 'ክፍለ-ጊዜው በተሳካ ሁኔታ ተዘግቷል።' : 'Session closed successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to close session');
    } finally {
      setIsActionLoading(false);
      setIsCloseSessionOpen(false);
    }
  };

  // Reopen session (Super Admin only)
  const handleReopenSession = async () => {
    if (!session || !isSuperAdmin) return;
    setIsActionLoading(true);
    try {
      const updated = await apiRequest<AttendanceSession>(
        `attendance/sessions/${session.id}/reopen`,
        { method: 'POST' },
      );
      setSession(updated);
      toast.success(isAmharic ? 'ክፍለ-ጊዜው ዳግም ተከፍቷል።' : 'Session reopened successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reopen session');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Export Sheet (Excel or PDF)
  const handleExport = (format: 'xlsx' | 'pdf') => {
    if (!session) return;
    const url = `/api/v1/attendance/sessions/${session.id}/export?format=${format}`;
    window.open(url, '_blank');
  };

  // Filtered Roster
  const filteredRecords: AttendanceRecord[] = useMemo(() => {
    const records: AttendanceRecord[] = session?.records || (session as any)?.attendances || [];
    return records.filter((rec: AttendanceRecord) => {
      const matchesStatus = rosterFilter === 'all' || rec.status === rosterFilter;
      const fullName = [
        rec.member.firstName,
        rec.member.fatherName,
        rec.member.grandfatherName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch =
        !rosterSearch.trim() ||
        fullName.includes(rosterSearch.toLowerCase()) ||
        rec.member.memberNo.toLowerCase().includes(rosterSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [session, rosterFilter, rosterSearch]);

  const ethToday = gregorianToEthiopian(new Date());
  const ethFormatted = formatEthiopianDate(ethToday, isAmharic ? 'am' : 'en');
  const gregFormatted = new Date().toLocaleDateString(isAmharic ? 'am-ET' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#E8F1FB] dark:bg-slate-950 px-3 py-6 sm:px-6 sm:py-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* TOP BAR / LIVE HEADER CARD */}
        <div className="rounded-2xl border border-[#D7E3F1] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Header info */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0F4C81] text-white shadow-md">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#0F2438] dark:text-white sm:text-2xl">
                  {isAmharic ? 'የዛሬው የመገኘት መዝገብ' : "Today's Attendance"}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-[#5B6B7C] dark:text-slate-400 sm:text-sm">
                  <span className="font-semibold text-[#0F4C81] dark:text-blue-400">
                    {ethFormatted}
                  </span>
                  <span>•</span>
                  <span>{gregFormatted}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1 font-mono text-[#0F2438] dark:text-slate-200">
                    <Clock className="h-3.5 w-3.5 text-[#1E78C8]" />
                    <span>{currentTime || '00:00:00'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Session selector dropdown & status */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[220px]">
                <select
                  value={selectedSessionId}
                  onChange={(e) => handleSelectSession(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#D7E3F1] dark:border-slate-700 bg-[#E8F1FB]/60 dark:bg-slate-800 py-2.5 pl-3.5 pr-9 text-xs sm:text-sm font-semibold text-[#0F2438] dark:text-white focus:border-[#1E78C8] focus:outline-none focus:ring-2 focus:ring-[#1E78C8]/30"
                  disabled={isLoadingSession}
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.course ? `[ትምህርት] ${s.course.titleAm}` : `[ሰንበት] ${s.title}`} (
                      {s.status === 'open' ? 'ክፍት' : 'የተዘጋ'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B7C]" />
              </div>

              {/* Status badge */}
              {session?.status === 'open' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#1B8E5A] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-[#1B8E5A] animate-pulse" />
                  {isAmharic ? 'ክፍት (Open)' : 'Open'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                  <Lock className="h-3 w-3" />
                  {isAmharic ? 'የተዘጋ (Closed)' : 'Closed'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MAIN ATTENDANCE CARD */}
        <div className="rounded-2xl border border-[#D7E3F1] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {/* 1. LIVE COUNTERS HEADER */}
          <div className="grid grid-cols-2 gap-2 border-b border-[#D7E3F1] dark:border-slate-800 bg-[#E8F1FB]/40 dark:bg-slate-900/60 p-4 sm:grid-cols-3 md:grid-cols-6 sm:gap-3">
            {/* Present */}
            <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-3 text-center">
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                {isAmharic ? 'የተገኙ' : 'Present'}
              </span>
              <p className="mt-0.5 text-2xl font-black text-[#1B8E5A] dark:text-emerald-400">
                {session?.stats.present ?? 0}
              </p>
            </div>

            {/* Absent */}
            <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 p-3 text-center">
              <span className="text-xs font-medium text-rose-800 dark:text-rose-300">
                {isAmharic ? 'ያልተገኙ' : 'Absent'}
              </span>
              <p className="mt-0.5 text-2xl font-black text-[#C62828] dark:text-rose-400">
                {session?.stats.absent ?? 0}
              </p>
            </div>

            {/* Late */}
            <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 p-3 text-center">
              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                {isAmharic ? 'ያረፈዱ' : 'Late'}
              </span>
              <p className="mt-0.5 text-2xl font-black text-[#E39B00] dark:text-amber-400">
                {session?.stats.late ?? 0}
              </p>
            </div>

            {/* Excused */}
            <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-3 text-center">
              <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                {isAmharic ? 'ፈቃድ' : 'Excused'}
              </span>
              <p className="mt-0.5 text-2xl font-black text-[#1E78C8] dark:text-blue-400">
                {session?.stats.excused ?? 0}
              </p>
            </div>

            {/* Not Marked Yet */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-center">
              <span className="text-xs font-medium text-[#5B6B7C] dark:text-slate-400">
                {isAmharic ? 'ቀሪዎች' : 'Not Marked'}
              </span>
              <p className="mt-0.5 text-2xl font-black text-[#5B6B7C] dark:text-slate-300">
                {session?.stats.unmarked ?? 0}
              </p>
            </div>

            {/* Total Eligible */}
            <div className="rounded-xl border border-[#D7E3F1] dark:border-slate-800 bg-white dark:bg-slate-800 p-3 text-center">
              <span className="text-xs font-medium text-[#5B6B7C] dark:text-slate-400">
                {isAmharic ? 'ተሳታፊዎች' : 'Eligible'}
              </span>
              <p className="mt-0.5 text-2xl font-black text-[#0F2438] dark:text-white">
                {session?.stats.totalEligible ?? 0}
              </p>
            </div>
          </div>

          {/* 2. SEARCH & MEMBER MARKING AREA */}
          <div className="p-5 sm:p-7 space-y-6">
            {/* Search Input Box */}
            <div className="relative">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6B7C]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAmharic
                      ? 'የአባል ስም ወይም መለያ ቁጥር ይፈልጉ... (ምሳሌ፦ MEM-0001 ወይም ዳዊት)'
                      : 'Search member by name or ID (e.g. MEM-0001 or Dawit)...'
                  }
                  className="w-full rounded-xl border-2 border-[#D7E3F1] dark:border-slate-700 bg-white dark:bg-slate-800 py-3.5 pl-12 pr-11 text-base sm:text-lg font-medium text-[#0F2438] dark:text-white placeholder-[#5B6B7C]/70 shadow-sm transition-all focus:border-[#1E78C8] focus:outline-none focus:ring-4 focus:ring-[#1E78C8]/20"
                  disabled={session?.status === 'closed'}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#5B6B7C] hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isSearching && (
                  <Loader2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#1E78C8]" />
                )}
              </div>

              {/* Instant Search Dropdown List */}
              {searchResults.length > 0 && !selectedMember && (
                <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-[#D7E3F1] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
                  {searchResults.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        setSearchResults([]);
                      }}
                      className="flex w-full items-center justify-between border-b border-[#E8F1FB] dark:border-slate-800 px-4 py-3 text-left transition hover:bg-[#E8F1FB]/60 dark:hover:bg-slate-800/80 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F4C81] text-sm font-bold text-white uppercase">
                          {m.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.photo}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            m.fullName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0F2438] dark:text-white">
                            {m.fullName}
                          </p>
                          <p className="text-xs font-mono text-[#5B6B7C] dark:text-slate-400">
                            {m.memberNo} {m.department && `• ${m.department}`}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-[#E8F1FB] dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-[#0F4C81] dark:text-blue-300">
                        {idx === 0 ? 'Enter ↵' : 'ምረጥ (Select)'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SELECTED MEMBER CARD (Large with Big Action Buttons) */}
            {selectedMember ? (
              <div
                className={`rounded-2xl border-2 p-6 transition-all duration-300 ${
                  flashCard
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20'
                    : 'border-[#1E78C8] bg-[#E8F1FB]/30 dark:bg-slate-800/60 shadow-md'
                }`}
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  {/* Member details */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#0F4C81] text-2xl font-black text-white shadow-lg overflow-hidden border-2 border-white dark:border-slate-700">
                      {selectedMember.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedMember.photo}
                          alt={selectedMember.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        selectedMember.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-[#0F2438] dark:text-white sm:text-2xl">
                          {selectedMember.fullName}
                        </h2>
                        <span className="rounded-lg border border-[#D7E3F1] dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-0.5 text-xs font-mono font-bold text-[#0F4C81] dark:text-blue-300">
                          {selectedMember.memberNo}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#5B6B7C] dark:text-slate-400">
                        {selectedMember.department || (isAmharic ? 'ክፍል አልተመደበም' : 'No Dept')}
                      </p>
                      {/* Check if already marked */}
                      {(() => {
                        const records = session?.records || (session as any)?.attendances || [];
                        const rec = records.find((r: any) => r.memberId === selectedMember.id);
                        if (!rec) return null;
                        return (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                            <span>የዛሬ ምዝገባ፦ {rec.status}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Cancel / Clear button */}
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                    className="self-end md:self-center inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-[#5B6B7C] hover:bg-white dark:hover:bg-slate-700 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>ሰርዝ (Esc)</span>
                  </button>
                </div>

                {/* Big Action Buttons */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* PRESENT BUTTON */}
                  <button
                    onClick={() => handleMark('present')}
                    disabled={isMarking || session?.status === 'closed'}
                    className="flex h-16 items-center justify-between rounded-xl bg-[#1B8E5A] hover:bg-[#157347] active:scale-[0.98] text-white px-5 shadow-lg transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-6 w-6" />
                      <span className="text-lg font-bold">
                        {isAmharic ? 'ተገኝቷል' : 'Present'}
                      </span>
                    </div>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-xs font-bold uppercase">
                      P
                    </span>
                  </button>

                  {/* ABSENT BUTTON */}
                  <button
                    onClick={() => handleMark('absent')}
                    disabled={isMarking || session?.status === 'closed'}
                    className="flex h-16 items-center justify-between rounded-xl bg-[#C62828] hover:bg-[#a71d1d] active:scale-[0.98] text-white px-5 shadow-lg transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <XCircle className="h-6 w-6" />
                      <span className="text-lg font-bold">{isAmharic ? 'አልተገኘም' : 'Absent'}</span>
                    </div>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-xs font-bold uppercase">
                      A
                    </span>
                  </button>

                  {/* LATE BUTTON */}
                  <button
                    onClick={() => handleMark('late')}
                    disabled={isMarking || session?.status === 'closed'}
                    className="flex h-16 items-center justify-between rounded-xl bg-[#E39B00] hover:bg-[#b87d00] active:scale-[0.98] text-white px-5 shadow-lg transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-6 w-6" />
                      <span className="text-lg font-bold">{isAmharic ? 'አርፍዷል' : 'Late'}</span>
                    </div>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-xs font-bold uppercase">
                      L
                    </span>
                  </button>

                  {/* EXCUSED BUTTON */}
                  <button
                    onClick={() => handleMark('excused')}
                    disabled={isMarking || session?.status === 'closed'}
                    className="flex h-16 items-center justify-between rounded-xl bg-[#1E78C8] hover:bg-[#0F4C81] active:scale-[0.98] text-white px-5 shadow-lg transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-6 w-6" />
                      <span className="text-lg font-bold">{isAmharic ? 'ፈቃድ' : 'Excused'}</span>
                    </div>
                    <span className="text-xs font-medium opacity-80">
                      {isAmharic ? 'ይቅርታ' : 'Permission'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Idle / Prompt box when no member is selected */
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D7E3F1] dark:border-slate-800 p-8 text-center bg-[#E8F1FB]/20 dark:bg-slate-900/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F1FB] text-[#0F4C81] dark:bg-slate-800 dark:text-blue-400">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-[#0F2438] dark:text-white">
                  {isAmharic ? 'አባል በመፈለጊያው ሳጥን ይፈልጉ' : 'Search for a member above'}
                </h3>
                <p className="mt-1 max-w-sm text-xs text-[#5B6B7C] dark:text-slate-400">
                  {isAmharic
                    ? 'የአባሉን ስም ወይም መለያ ቁጥር ሲተይቡ ወዲያውኑ ይመረጣል። ፈጣን ምዝገባ ለማድረግ ኪቦርድ [P]፣ [A]፣ [L] ይጠቀሙ።'
                    : 'Type a member name or ID. Press P (present), A (absent), or L (late) for rapid entry.'}
                </p>
              </div>
            )}

            {/* UNDO FLOATING TOAST BAR */}
            {undoItem && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/80 p-3.5 shadow-lg animate-in fade-in slide-in-from-top duration-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-[#1B8E5A]" />
                  <p className="text-sm font-medium text-emerald-950 dark:text-emerald-100">
                    {isAmharic
                      ? `የ${undoItem.memberName} መገኘት "${undoItem.markedStatus}" ተብሎ ተመዝግቧል።`
                      : `Marked ${undoItem.memberName} as ${undoItem.markedStatus}.`}
                  </p>
                </div>
                <button
                  onClick={handleUndo}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 text-xs font-bold transition shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{isAmharic ? 'መልስ (Undo)' : 'Undo'}</span>
                </button>
              </div>
            )}

            {/* ACTION BUTTONS TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D7E3F1] dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {/* Mark all remaining absent */}
                <button
                  onClick={() => setIsMarkAllAbsentOpen(true)}
                  disabled={session?.status === 'closed' || (session?.stats.unmarked ?? 0) === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#C62828] dark:text-rose-300 transition disabled:opacity-40"
                >
                  <UserX className="h-4 w-4" />
                  <span>
                    {isAmharic
                      ? `ቀሪዎችን በሙሉ ያልተገኙ በል (${session?.stats.unmarked ?? 0})`
                      : `Mark all remaining as absent (${session?.stats.unmarked ?? 0})`}
                  </span>
                </button>

                {/* Close Session Button */}
                {session?.status === 'open' ? (
                  <button
                    onClick={() => setIsCloseSessionOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition"
                  >
                    <Lock className="h-4 w-4" />
                    <span>{isAmharic ? 'ክፍለ-ጊዜውን ዝጋ' : 'Close Session'}</span>
                  </button>
                ) : (
                  /* Reopen button for super admin */
                  isSuperAdmin && (
                    <button
                      onClick={handleReopenSession}
                      disabled={isActionLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0F4C81] hover:bg-[#0A2E52] text-white px-3.5 py-2 text-xs sm:text-sm font-semibold transition shadow-sm"
                    >
                      <Unlock className="h-4 w-4" />
                      <span>{isAmharic ? 'ክፍለ-ጊዜውን መልሰው ይክፈቱ' : 'Reopen Session'}</span>
                    </button>
                  )
                )}
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('xlsx')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 px-3 py-2 text-xs sm:text-sm font-semibold text-[#1B8E5A] dark:text-emerald-300 transition"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 px-3 py-2 text-xs sm:text-sm font-semibold text-[#C62828] dark:text-rose-300 transition"
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMPACT ROSTER TABLE OF MARKED MEMBERS */}
        <div className="rounded-2xl border border-[#D7E3F1] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#D7E3F1] dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-[#0F2438] dark:text-white sm:text-lg">
                {isAmharic ? 'ዛሬ የተመዘገቡ አባላት ዝርዝር' : 'Recorded Attendance Roster'}
              </h3>
              <p className="text-xs text-[#5B6B7C] dark:text-slate-400">
                {session?.stats.totalMarked ?? 0}{' '}
                {isAmharic ? 'አባላት ተመዝግበዋል' : 'records logged today'}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder={isAmharic ? 'በስም ወይም መለያ ፈልግ...' : 'Filter roster...'}
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="rounded-xl border border-[#D7E3F1] dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-[#0F2438] dark:text-white placeholder-[#5B6B7C] focus:border-[#1E78C8] focus:outline-none"
              />
              <select
                value={rosterFilter}
                onChange={(e) => setRosterFilter(e.target.value)}
                className="rounded-xl border border-[#D7E3F1] dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#0F2438] dark:text-white focus:border-[#1E78C8] focus:outline-none"
              >
                <option value="all">{isAmharic ? 'ሁሉም (All)' : 'All'}</option>
                <option value="present">{isAmharic ? 'የተገኙ (Present)' : 'Present'}</option>
                <option value="absent">{isAmharic ? 'ያልተገኙ (Absent)' : 'Absent'}</option>
                <option value="late">{isAmharic ? 'ያረፈዱ (Late)' : 'Late'}</option>
                <option value="excused">{isAmharic ? 'ፈቃድ (Excused)' : 'Excused'}</option>
              </select>
            </div>
          </div>

          {/* Records Table */}
          <div className="mt-4 overflow-x-auto">
            {filteredRecords.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#D7E3F1] dark:border-slate-800 text-xs font-semibold text-[#5B6B7C] uppercase">
                    <th className="py-2.5 px-3">አባል (Member)</th>
                    <th className="py-2.5 px-3">ክፍል (Dept)</th>
                    <th className="py-2.5 px-3">ሁኔታ (Status)</th>
                    <th className="py-2.5 px-3">ሰዓት (Time)</th>
                    <th className="py-2.5 px-3 text-right">ፈጣን ቅያሬ (Quick Change)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F1FB] dark:divide-slate-800">
                  {filteredRecords.map((rec: AttendanceRecord) => {
                    const fullName = [
                      rec.member.firstName,
                      rec.member.fatherName,
                      rec.member.grandfatherName,
                    ]
                      .filter(Boolean)
                      .join(' ');
                    const timeStr = rec.updatedAt
                      ? new Date(rec.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-[#E8F1FB]/40 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F4C81] text-xs font-bold text-white uppercase">
                              {rec.member.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={rec.member.photoUrl}
                                  alt=""
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                rec.member.firstName.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[#0F2438] dark:text-white">
                                {fullName}
                              </p>
                              <p className="text-xs font-mono text-[#5B6B7C] dark:text-slate-400">
                                {rec.member.memberNo}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-[#5B6B7C] dark:text-slate-400">
                          {rec.member.department?.nameAm || '—'}
                        </td>
                        <td className="py-3 px-3">
                          {rec.status === 'present' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              {isAmharic ? 'ተገኝቷል' : 'Present'}
                            </span>
                          )}
                          {rec.status === 'absent' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                              {isAmharic ? 'አልተገኘም' : 'Absent'}
                            </span>
                          )}
                          {rec.status === 'late' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                              {isAmharic ? 'አርፍዷል' : 'Late'}
                            </span>
                          )}
                          {rec.status === 'excused' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                              {isAmharic ? 'ፈቃድ' : 'Excused'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs font-mono text-[#5B6B7C] dark:text-slate-400">
                          {timeStr}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <select
                            value={rec.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value as any;
                              if (session?.status === 'closed') {
                                toast.warning('ክፍለ-ጊዜው ተዘግቷል።');
                                return;
                              }
                              try {
                                const res = await apiRequest<{
                                  record: AttendanceRecord;
                                  session: AttendanceSession;
                                }>(
                                  `attendance/sessions/${session?.id}/records/${rec.memberId}`,
                                  {
                                    method: 'PUT',
                                    body: { status: newStatus },
                                  },
                                );
                                setSession(res.session);
                                toast.success(
                                  isAmharic
                                    ? `የ${fullName} ሁኔታ ተቀይሯል።`
                                    : `Updated ${fullName} status to ${newStatus}.`,
                                );
                              } catch {
                                toast.error('Failed to change status');
                              }
                            }}
                            disabled={session?.status === 'closed'}
                            className="rounded-lg border border-[#D7E3F1] dark:border-slate-700 bg-white dark:bg-slate-800 py-1 px-2 text-xs font-semibold text-[#0F2438] dark:text-white focus:border-[#1E78C8] focus:outline-none"
                          >
                            <option value="present">
                              {isAmharic ? 'ተገኝቷል' : 'Present'}
                            </option>
                            <option value="absent">
                              {isAmharic ? 'አልተገኘም' : 'Absent'}
                            </option>
                            <option value="late">{isAmharic ? 'አርፍዷል' : 'Late'}</option>
                            <option value="excused">
                              {isAmharic ? 'ፈቃድ' : 'Excused'}
                            </option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center text-[#5B6B7C] dark:text-slate-400">
                <Users className="mx-auto h-8 w-8 text-[#5B6B7C]/60" />
                <p className="mt-2 text-sm font-medium">
                  {isAmharic ? 'ምንም የተመዘገበ አባል አልተገኘም' : 'No attendance records match your filter'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG: MARK ALL ABSENT */}
      <ConfirmDialog
        open={isMarkAllAbsentOpen}
        onOpenChange={setIsMarkAllAbsentOpen}
        title={isAmharic ? 'ቀሪዎችን በሙሉ ያልተገኙ ብለህ መመዝገብ ትፈልጋለህ?' : 'Mark All Remaining Absent?'}
        description={
          isAmharic
            ? `እስካሁን ያልተመዘገቡ ${session?.stats.unmarked ?? 0} አባላት በሙሉ "አልተገኙም" ተብለው ይመዘገባሉ። ይህ እርምጃ ቀሪዎችን ወዲያውኑ ያጠናቅቃል።`
            : `All ${session?.stats.unmarked ?? 0} unmarked eligible members will be marked as absent. Do you want to proceed?`
        }
        confirmLabel={isAmharic ? 'አዎ፣ በሙሉ ያልተገኙ ብለህ መዝግብ' : 'Yes, Mark All Absent'}
        cancelLabel={isAmharic ? 'ይቅር (Cancel)' : 'Cancel'}
        variant="destructive"
        isLoading={isActionLoading}
        onConfirm={handleConfirmMarkAllAbsent}
      />

      {/* CONFIRMATION DIALOG: CLOSE SESSION */}
      <ConfirmDialog
        open={isCloseSessionOpen}
        onOpenChange={setIsCloseSessionOpen}
        title={isAmharic ? 'የዛሬውን የመገኘት መዝገብ መዝጋት ትፈልጋለህ?' : 'Close Attendance Session?'}
        description={
          isAmharic
            ? `የተገኙ: ${session?.stats.present ?? 0} | ያልተገኙ: ${session?.stats.absent ?? 0} | ያረፈዱ: ${session?.stats.late ?? 0}። መዝገቡ ከተዘጋ በኋላ ተጨማሪ ለውጦችን ማድረግ አይቻልም።`
            : `Totals: ${session?.stats.present ?? 0} Present, ${session?.stats.absent ?? 0} Absent, ${session?.stats.late ?? 0} Late. Once closed, further edits will be locked.`
        }
        confirmLabel={isAmharic ? 'አዎ፣ መዝገቡን ዝጋ' : 'Yes, Close Session'}
        cancelLabel={isAmharic ? 'ይቅር (Cancel)' : 'Cancel'}
        variant="primary"
        isLoading={isActionLoading}
        onConfirm={handleConfirmCloseSession}
      />
    </div>
  );
}
