'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Department,
  Member,
  NotificationItem,
  NotificationTarget,
  PaginatedResponse,
} from '@/types/api';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import {
  Bell,
  Send,
  Users,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  History,
} from 'lucide-react';

export default function NotificationsAdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const queryClient = useQueryClient();

  // Form state
  const [target, setTarget] = useState<NotificationTarget>('all');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [successResult, setSuccessResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // History state
  const [historySearch, setHistorySearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Fetch departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/departments');
      return Array.isArray(res) ? res : res?.items || res?.data || [];
    },
  });

  // Search members with user accounts when target is 'user'
  const { data: membersResult } = useQuery<
    PaginatedResponse<Member>
  >({
    queryKey: ['members-search-users', userSearchTerm],
    queryFn: async () => {
      if (!userSearchTerm.trim()) {
        return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      }
      return apiClient.get<any>(`/members?search=${encodeURIComponent(userSearchTerm)}&limit=10`);
    },
    enabled: target === 'user' && userSearchTerm.length >= 2,
  });

  const searchedMembers = membersResult?.items || membersResult?.data || [];

  // Fetch sent notifications history
  const { data: historyData, isLoading: isLoadingHistory } = useQuery<
    PaginatedResponse<NotificationItem>
  >({
    queryKey: ['notifications-history', page, pageSize, historySearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (historySearch.trim()) params.append('search', historySearch.trim());
      const res = await apiClient.get<any>(`/notifications/history?${params.toString()}`);
      return res;
    },
  });

  const historyItems = historyData?.items || historyData?.data || [];
  const historyTotal = historyData?.total || 0;

  // Send Notification mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error(
          locale === 'am' ? 'እባክዎ የማሳወቂያውን ርዕስ ያስገቡ' : 'Notification title is required',
        );
      }
      if (!body.trim()) {
        throw new Error(
          locale === 'am' ? 'እባክዎ የማሳወቂያውን መልዕክት ያስገቡ' : 'Message body is required',
        );
      }
      if (target === 'department' && !departmentId) {
        throw new Error(
          locale === 'am' ? 'እባክዎ ተቀባዩን ክፍል ይምረጡ' : 'Please select target department',
        );
      }
      if (target === 'user' && !selectedUserId) {
        throw new Error(
          locale === 'am' ? 'እባክዎ ተቀባዩን አባል ይምረጡ' : 'Please select target member/user',
        );
      }

      const payload = {
        target,
        title: title.trim(),
        body: body.trim(),
        departmentId: target === 'department' ? Number(departmentId) : undefined,
        userId: target === 'user' ? selectedUserId : undefined,
      };

      return apiClient.post<any>('/notifications/send', payload);
    },
    onSuccess: (res: any) => {
      const count = res.sentCount ?? 0;
      setSuccessResult(
        locale === 'am'
          ? `ማሳወቂያው ለ${count} ተጠቃሚዎች በተሳካ ሁኔታ ተልኳል!`
          : `Notification successfully sent to ${count} user(s)!`,
      );
      setTitle('');
      setBody('');
      setSelectedUserId('');
      setUserSearchTerm('');
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['notifications-history'] });
      setTimeout(() => setSuccessResult(null), 6000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to dispatch notification');
    },
  });

  const columns: ColumnDef<NotificationItem>[] = [
    {
      header: locale === 'am' ? 'የማሳወቂያ ርዕስና መልዕክት' : 'Notification & Message',
      accessorKey: 'title',
      cell: (item) => (
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs md:text-sm">
              {item.title}
            </p>
            {item.body && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm md:max-w-md">
                {item.body}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: locale === 'am' ? 'ተቀባይ' : 'Recipient',
      accessorKey: 'userId',
      cell: (item) => {
        const member = item.user?.member;
        const name = member ? `${member.firstName} ${member.fatherName}` : null;
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">
              {name || item.user?.email || item.user?.phone || 'All Users'}
            </p>
            {member?.memberNo && (
              <p className="font-mono text-[10px] text-muted-foreground">
                {member.memberNo}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: locale === 'am' ? 'የተላከበት ሰዓት' : 'Sent Date & Time',
      accessorKey: 'sentAt',
      cell: (item) => {
        const d = new Date(item.sentAt);
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">{d.toLocaleDateString()}</p>
            <p className="text-[11px] text-muted-foreground">
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        );
      },
    },
    {
      header: locale === 'am' ? 'ሁኔታ' : 'Status',
      accessorKey: 'readAt',
      cell: (item) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            item.readAt
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          {item.readAt
            ? locale === 'am'
              ? 'የተነበበ'
              : 'Read'
            : locale === 'am'
            ? 'ያልተነበበ'
            : 'Unread'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
          <Bell className="h-3.5 w-3.5" />
          <span>{locale === 'am' ? 'የማሳወቂያ ማዕከል' : 'Notification Hub'}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {locale === 'am' ? 'ማሳወቂያዎችና መልዕክቶች' : 'Notifications & Announcements'}
        </h1>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
          {locale === 'am'
            ? 'ለሁሉም ምዕመናን፣ ለአንድ የተወሰነ ክፍል ወይም ለአንድ አባል ማሳወቂያ ይላኩና የታሪክ መዝገብ ይከታተሉ'
            : 'Dispatch in-app notifications to all active members, a department, or individual users.'}
        </p>
      </div>

      {/* Top Section: Send Notification Form Card */}
      <div className="rounded-2xl border border-primary/25 bg-card p-5 md:p-6 shadow-sm">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Send className="h-4 w-4 text-primary" />
          <span>{locale === 'am' ? 'አዲስ ማሳወቂያ መላኪያ' : 'Send In-App Notification'}</span>
        </h2>

        {successResult && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successResult}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* Audience Target Selector */}
          <div>
            <label className="text-xs font-semibold text-foreground">
              {locale === 'am' ? 'ተቀባይ አካል (Audience) *' : 'Target Audience *'}
            </label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTarget('all')}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  target === 'all'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-background hover:bg-muted/40 text-foreground'
                }`}
              >
                <Users className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">
                    {locale === 'am' ? 'ለሁሉም አባላት' : 'Everyone (All)'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {locale === 'am' ? 'ሁሉም ንቁ ተጠቃሚዎች' : 'All active accounts'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTarget('department')}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  target === 'department'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-background hover:bg-muted/40 text-foreground'
                }`}
              >
                <Building className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">
                    {locale === 'am' ? 'ለተወሰነ ክፍል' : 'Department'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {locale === 'am' ? 'የክፍሉ አባላት ብቻ' : 'Members in department'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTarget('user')}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  target === 'user'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-background hover:bg-muted/40 text-foreground'
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">
                    {locale === 'am' ? 'ለአንድ አባል' : 'Single Member'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {locale === 'am' ? 'የተለየ ግለሰብ' : 'Specific user'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Department Selector */}
          {target === 'department' && (
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'ክፍል ይምረጡ *' : 'Select Department *'}
              </label>
              <select
                value={departmentId}
                onChange={(e) =>
                  setDepartmentId(e.target.value ? Number(e.target.value) : '')
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">
                  {locale === 'am' ? '— ክፍል ይምረጡ —' : '— Select Department —'}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {locale === 'am' ? d.nameAm : d.nameEn || d.nameAm}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User Search & Select */}
          {target === 'user' && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'አባል በስም ወይም በአባል ቁጥር ፈልግ *' : 'Search Member *'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setSelectedUserId('');
                  }}
                  placeholder={locale === 'am' ? 'የአባሉን ስም ወይም ቁጥር ይተይቡ...' : 'Type member name...'}
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {searchedMembers.length > 0 && !selectedUserId && (
                <div className="max-h-40 overflow-y-auto divide-y divide-border rounded-lg border border-border bg-card">
                  {searchedMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!m.userId}
                      onClick={() => {
                        if (m.userId) {
                          setSelectedUserId(m.userId);
                          setUserSearchTerm(`${m.firstName} ${m.fatherName} (${m.memberNo})`);
                        }
                      }}
                      className={`w-full p-2 text-left text-xs flex items-center justify-between transition-colors ${
                        !m.userId
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-primary/10'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-foreground">
                          {m.firstName} {m.fatherName}
                        </span>
                        <span className="ml-2 font-mono text-muted-foreground">
                          {m.memberNo}
                        </span>
                      </div>
                      {!m.userId && (
                        <span className="text-[10px] text-destructive">
                          {locale === 'am' ? 'የተጠቃሚ መለያ የለውም' : 'No user account'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedUserId && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{locale === 'am' ? 'አባል ተመርጧል' : 'Member Selected'}</span>
                </p>
              )}
            </div>
          )}

          {/* Title & Body */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'የማሳወቂያው ርዕስ *' : 'Notification Title *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  locale === 'am'
                    ? 'ምሳሌ፦ የሰንበት ትምህርት ቤት ጠቅላላ ጉባኤ ጥሪ'
                    : 'Notification title...'
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'ዝርዝር መልዕክት *' : 'Message Body *'}
              </label>
              <textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  locale === 'am'
                    ? 'የማሳወቂያውን ዝርዝር መልዕክት እዚህ ያስገቡ...'
                    : 'Enter message body...'
                }
                className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{locale === 'am' ? 'ማሳወቂያውን ላክ' : 'Send Notification'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Sent Notifications History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-secondary" />
            <h2 className="text-base font-bold text-foreground">
              {locale === 'am' ? 'የተላኩ ማሳወቂያዎች ታሪክ' : 'Sent Notification History'}
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setPage(1);
              }}
              placeholder={locale === 'am' ? 'በታሪክ ውስጥ ፈልግ...' : 'Search sent history...'}
              className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={historyItems}
          total={historyTotal}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          isLoading={isLoadingHistory}
        />
      </div>
    </div>
  );
}
