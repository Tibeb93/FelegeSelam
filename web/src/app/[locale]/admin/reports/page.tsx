'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import {
  Member,
  Course,
  Contribution,
  ContributionType,
  PaymentMethod,
} from '../../../../types/api';
import {
  BarChart3,
  Users,
  CalendarCheck,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Eye,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Skeleton } from '../../../../components/ui/SkeletonLoaders';

type ReportCategory = 'members' | 'attendance' | 'contributions';

export default function ReportsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [selectedReport, setSelectedReport] = useState<ReportCategory>('members');

  // Filter states
  const [memberDepartmentId, setMemberDepartmentId] = useState<string>('all');
  const [memberStatus, setMemberStatus] = useState<string>('all');
  const [memberSex, setMemberSex] = useState<string>('all');

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [contributionType, setContributionType] = useState<string>('all');
  const [contributionMethod, setContributionMethod] = useState<string>('all');

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [isExporting, setIsExporting] = useState<string | null>(null);

  // 1. Fetch departments
  const { data: departments } = useQuery<Array<{ id: number; nameAm: string; nameEn?: string }>>({
    queryKey: ['report-departments'],
    queryFn: () => apiClient.get('/members/departments'),
  });

  // 2. Fetch courses
  const { data: coursesData } = useQuery<{ data: Course[] }>({
    queryKey: ['report-courses-list'],
    queryFn: () => apiClient.get('/courses?limit=100'),
  });

  // Set default selected course once loaded
  React.useEffect(() => {
    if (coursesData?.data?.length && !selectedCourseId) {
      setSelectedCourseId(coursesData.data[0].id);
    }
  }, [coursesData, selectedCourseId]);

  // 3. Preview Data Queries
  // Members preview data
  const { data: membersPreview, isLoading: isMembersLoading } = useQuery<{ data: Member[] }>({
    queryKey: ['report-preview-members', memberDepartmentId, memberStatus, memberSex],
    queryFn: () => {
      const p = new URLSearchParams({ limit: '20' });
      if (memberDepartmentId !== 'all') p.set('departmentId', memberDepartmentId);
      if (memberStatus !== 'all') p.set('status', memberStatus);
      if (memberSex !== 'all') p.set('sex', memberSex);
      return apiClient.get(`/members?${p.toString()}`);
    },
    enabled: selectedReport === 'members',
  });

  // Attendance preview data
  const { data: courseReportData, isLoading: isAttendanceLoading } = useQuery<{
    course: { id: string; titleAm: string };
    totalEnrolled: number;
    students: Array<{
      memberId: string;
      memberNo: string;
      fullName: string;
      totalSessions: number;
      presentCount: number;
      attendanceRate: number;
      averageScore?: number;
    }>;
  }>({
    queryKey: ['report-preview-attendance', selectedCourseId],
    queryFn: () => apiClient.get(`/courses/${selectedCourseId}/report`),
    enabled: selectedReport === 'attendance' && Boolean(selectedCourseId),
  });

  // Contributions preview data
  const { data: contributionsPreview, isLoading: isContributionsLoading } = useQuery<{
    data: Contribution[];
    total: number;
  }>({
    queryKey: ['report-preview-contributions', contributionType, contributionMethod],
    queryFn: () => {
      const p = new URLSearchParams({ limit: '20' });
      if (contributionType !== 'all') p.set('type', contributionType);
      if (contributionMethod !== 'all') p.set('paymentMethod', contributionMethod);
      return apiClient.get(`/contributions?${p.toString()}`);
    },
    enabled: selectedReport === 'contributions',
  });

  // Export handlers
  const handleExportMembers = async (format: 'pdf' | 'docx' | 'xlsx') => {
    setIsExporting(format);
    try {
      const p = new URLSearchParams({ format });
      if (memberDepartmentId !== 'all') p.set('departmentId', memberDepartmentId);
      if (memberStatus !== 'all') p.set('status', memberStatus);
      if (memberSex !== 'all') p.set('sex', memberSex);

      const blob = await apiClient.getBlob(`/members/export?${p.toString()}`);
      const ext = format === 'pdf' ? 'pdf' : format === 'docx' ? 'docx' : 'xlsx';
      const filename = `Members_Report_${new Date().toISOString().split('T')[0]}.${ext}`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportContributions = async () => {
    setIsExporting('xlsx');
    try {
      const p = new URLSearchParams({ format: 'xlsx' });
      if (contributionType !== 'all') p.set('type', contributionType);
      if (contributionMethod !== 'all') p.set('paymentMethod', contributionMethod);

      const blob = await apiClient.getBlob(`/contributions/export?${p.toString()}`);
      const filename = `Contributions_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportAttendance = async (format: 'pdf' | 'xlsx') => {
    setIsExporting(format);
    try {
      // Create CSV/Excel or trigger print
      if (!courseReportData?.students?.length) return;
      const csvHeader = 'Member No,Student Name,Total Sessions,Present,Attendance Rate (%)\n';
      const rows = courseReportData.students
        .map(
          (s) =>
            `"${s.memberNo}","${s.fullName}",${s.totalSessions},${s.presentCount},${s.attendanceRate}%`,
        )
        .join('\n');
      const blob = new Blob([csvHeader + rows], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `Course_Attendance_${courseReportData.course.titleAm}_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Export attendance failed:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'የሪፖርቶችና ትንተና ማዕከል' : 'Reports & Analytics'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'የአባላት፣ የትምህርት መገኘትና የፋይናንስ ኦፊሴላዊ ሪፖርቶችን ማመንጨትና በPDF, Word ወይም Excel ማውረድ'
              : 'Generate, preview, and export official reports for members, academic attendance, and contributions'}
          </p>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setSelectedReport('members')}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
            selectedReport === 'members'
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border bg-card hover:bg-muted/50'
          }`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              selectedReport === 'members'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              {locale === 'am' ? 'የአባላት አጠቃላይ ሪፖርት' : 'Members Report'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {locale === 'am' ? 'ስነ-ሕዝብ፣ ዘርፎችና ሁኔታ' : 'Demographics & rosters'}
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedReport('attendance')}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
            selectedReport === 'attendance'
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border bg-card hover:bg-muted/50'
          }`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              selectedReport === 'attendance'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              {locale === 'am' ? 'የትምህርት መገኘት ሪፖርት' : 'Attendance Report'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {locale === 'am' ? 'የተማሪዎች መገኘት ምጣኔ' : 'Course attendance %'}
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedReport('contributions')}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
            selectedReport === 'contributions'
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border bg-card hover:bg-muted/50'
          }`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              selectedReport === 'contributions'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              {locale === 'am' ? 'የስጦታና ክፍያዎች ሪፖርት' : 'Contributions Report'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {locale === 'am' ? 'መዋጮ፣ ስጦታና ገቢዎች' : 'Offerings & finances'}
            </p>
          </div>
        </button>
      </div>

      {/* Filters and Export Actions Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {locale === 'am' ? 'የሪፖርት ማጣሪያዎችና ማውረጃ' : 'Report Filters & Export Formats'}
            </h2>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedReport === 'members' && (
              <>
                <button
                  onClick={() => handleExportMembers('pdf')}
                  disabled={Boolean(isExporting)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isExporting === 'pdf' ? '...' : 'PDF'}</span>
                </button>
                <button
                  onClick={() => handleExportMembers('docx')}
                  disabled={Boolean(isExporting)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isExporting === 'docx' ? '...' : 'Word (.docx)'}</span>
                </button>
                <button
                  onClick={() => handleExportMembers('xlsx')}
                  disabled={Boolean(isExporting)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>{isExporting === 'xlsx' ? '...' : 'Excel (.xlsx)'}</span>
                </button>
              </>
            )}

            {selectedReport === 'attendance' && (
              <button
                onClick={() => handleExportAttendance('xlsx')}
                disabled={Boolean(isExporting)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>
                  {isExporting === 'xlsx'
                    ? '...'
                    : locale === 'am'
                      ? 'የመገኘት ሪፖርት አውርድ (CSV/Excel)'
                      : 'Export Attendance (CSV)'}
                </span>
              </button>
            )}

            {selectedReport === 'contributions' && (
              <button
                onClick={handleExportContributions}
                disabled={Boolean(isExporting)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>
                  {isExporting === 'xlsx'
                    ? '...'
                    : locale === 'am'
                      ? 'በExcel አውርድ (.xlsx)'
                      : 'Export to Excel (.xlsx)'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Filters depending on chosen report */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {selectedReport === 'members' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'ክፍል / ዘርፍ' : 'Department'}
                </label>
                <select
                  value={memberDepartmentId}
                  onChange={(e) => setMemberDepartmentId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="all">{locale === 'am' ? 'ሁሉም ክፍሎች' : 'All Departments'}</option>
                  {departments?.map((d) => (
                    <option key={d.id} value={d.id.toString()}>
                      {locale === 'am' ? d.nameAm : d.nameEn || d.nameAm}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የአባልነት ሁኔታ' : 'Membership Status'}
                </label>
                <select
                  value={memberStatus}
                  onChange={(e) => setMemberStatus(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none capitalize"
                >
                  <option value="all">{locale === 'am' ? 'ሁሉም ሁኔታዎች' : 'All Statuses'}</option>
                  <option value="active">Active (ንቁ)</option>
                  <option value="pending">Pending (ተጠባባቂ)</option>
                  <option value="suspended">Suspended (የታገደ)</option>
                  <option value="inactive">Inactive (ቦዘኔ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'ጾታ' : 'Sex'}
                </label>
                <select
                  value={memberSex}
                  onChange={(e) => setMemberSex(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="all">{locale === 'am' ? 'ሁሉም' : 'All'}</option>
                  <option value="male">{locale === 'am' ? 'ወንድ' : 'Male'}</option>
                  <option value="female">{locale === 'am' ? 'ሴት' : 'Female'}</option>
                </select>
              </div>
            </>
          )}

          {selectedReport === 'attendance' && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                {locale === 'am' ? 'የትምህርት ክፍል / ኮርስ *' : 'Course *'}
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {coursesData?.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleAm} {c.titleEn ? `(${c.titleEn})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedReport === 'contributions' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የክፍያው ዓይነት' : 'Contribution Type'}
                </label>
                <select
                  value={contributionType}
                  onChange={(e) => setContributionType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="all">{locale === 'am' ? 'ሁሉም ዓይነቶች' : 'All Types'}</option>
                  <option value="monthly_fee">Monthly Fee (ወርሃዊ መዋጮ)</option>
                  <option value="special_offering">Special Offering (ስእለትና ስጦታ)</option>
                  <option value="building_fund">Building Fund (የሕንጻ ፈንድ)</option>
                  <option value="event_donation">Event Donation (የበዓል ድጋፍ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የክፍያ መንገድ' : 'Payment Method'}
                </label>
                <select
                  value={contributionMethod}
                  onChange={(e) => setContributionMethod(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="all">{locale === 'am' ? 'ሁሉም መንገዶች' : 'All Methods'}</option>
                  <option value="cash">Cash (ጥሬ ገንዘብ)</option>
                  <option value="cbe_birr">CBE Birr</option>
                  <option value="telebirr">Telebirr</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {locale === 'am' ? 'የሪፖርቱ የቀጥታ ዕይታ (Live Preview)' : 'Report Live Preview'}
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {locale === 'am' ? 'የመጀመሪያዎቹ 20 መረጃዎች' : 'Showing top sample rows'}
          </span>
        </div>

        {/* Members Table Preview */}
        {selectedReport === 'members' && (
          <div className="overflow-x-auto">
            {isMembersLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : membersPreview?.data?.length ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Member No</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Sex</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {membersPreview.data.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-bold text-primary">{m.memberNo}</td>
                      <td className="p-3 font-medium text-foreground">
                        {m.firstName} {m.fatherName} {m.grandfatherName || ''}
                      </td>
                      <td className="p-3 capitalize">{m.sex}</td>
                      <td className="p-3 font-mono">{m.phone || '—'}</td>
                      <td className="p-3">
                        {locale === 'am'
                          ? m.department?.nameAm || 'ያልተመደበ'
                          : m.department?.nameEn || m.department?.nameAm || 'Unassigned'}
                      </td>
                      <td className="p-3 capitalize font-semibold">{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-8 text-center text-xs text-muted-foreground">No members found</p>
            )}
          </div>
        )}

        {/* Attendance Table Preview */}
        {selectedReport === 'attendance' && (
          <div className="overflow-x-auto">
            {isAttendanceLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : courseReportData?.students?.length ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Member No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Sessions</th>
                    <th className="p-3">Present</th>
                    <th className="p-3">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {courseReportData.students.map((s) => (
                    <tr key={s.memberId} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-bold text-primary">{s.memberNo}</td>
                      <td className="p-3 font-medium text-foreground">{s.fullName}</td>
                      <td className="p-3 font-mono">{s.totalSessions}</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">{s.presentCount}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-400">
                          {s.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-8 text-center text-xs text-muted-foreground">
                No attendance enrollments found for this course
              </p>
            )}
          </div>
        )}

        {/* Contributions Table Preview */}
        {selectedReport === 'contributions' && (
          <div className="overflow-x-auto">
            {isContributionsLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : contributionsPreview?.data?.length ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Member</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {contributionsPreview.data.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-bold text-primary">{c.receiptNo}</td>
                      <td className="p-3 font-medium text-foreground">
                        {c.member ? `${c.member.firstName} ${c.member.fatherName}` : '—'}
                      </td>
                      <td className="p-3 capitalize">{c.type}</td>
                      <td className="p-3 font-bold text-foreground">
                        {Number(c.amount).toLocaleString()} ETB
                      </td>
                      <td className="p-3 capitalize">{c.paymentMethod}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {new Date(c.paidAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-8 text-center text-xs text-muted-foreground">
                No contribution records found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
