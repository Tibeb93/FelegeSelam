'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { UserItem, RoleItem, UserRoleName } from '../../../../types/api';
import { useAuth } from '../../../../providers/AuthProvider';
import {
  UserCog,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Ban,
  CheckCircle,
  Search,
  Lock,
  Mail,
  Phone,
  Clock,
  X,
  AlertTriangle,
} from 'lucide-react';
import { DataTable, Column } from '../../../../components/ui/DataTable';

export default function UsersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<UserItem | null>(null);

  // Form states
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRoleId, setCreateRoleId] = useState<number>(2);
  const [createError, setCreateError] = useState('');

  const [newRoleId, setNewRoleId] = useState<number>(2);
  const [roleError, setRoleError] = useState('');

  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetError, setResetError] = useState('');

  const isSuperAdmin = currentUser?.role?.name === 'super_admin';

  // Query users list
  const { data: usersData, isLoading: isUsersLoading } = useQuery<{
    data: UserItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ['admin-users-list', page, pageSize, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (searchTerm) params.set('search', searchTerm);
      return apiClient.get(`/users?${params.toString()}`);
    },
    enabled: isSuperAdmin,
  });

  // Query system roles
  const { data: rolesList } = useQuery<RoleItem[]>({
    queryKey: ['system-roles-list'],
    queryFn: () => apiClient.get<RoleItem[]>('/users/roles'),
    enabled: isSuperAdmin,
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (payload: {
      email?: string;
      phone?: string;
      password: string;
      roleId: number;
    }) => apiClient.post('/users', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setIsCreateModalOpen(false);
      setCreateEmail('');
      setCreatePhone('');
      setCreatePassword('');
      setCreateError('');
    },
    onError: (err: any) => {
      setCreateError(err.message || 'Failed to create user');
    },
  });

  // Suspend User Mutation
  const suspendUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.patch(`/users/${userId}/suspend`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
  });

  // Activate User Mutation
  const activateUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.put(`/users/${userId}`, { status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
  });

  // Assign Role Mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: number }) =>
      apiClient.patch(`/users/${userId}/role`, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setRoleModalUser(null);
      setRoleError('');
    },
    onError: (err: any) => {
      setRoleError(err.message || 'Failed to assign role');
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      apiClient.put(`/users/${userId}`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setPasswordModalUser(null);
      setResetPasswordVal('');
      setResetError('');
    },
    onError: (err: any) => {
      setResetError(err.message || 'Failed to reset password');
    },
  });

  // Handle Create User Submit
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail && !createPhone) {
      setCreateError(
        locale === 'am' ? 'እባክዎ ኢሜይል ወይም ስልክ ቁጥር ያስገቡ' : 'Please provide an email or phone number',
      );
      return;
    }
    if (!createPassword || createPassword.length < 6) {
      setCreateError(
        locale === 'am'
          ? 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት'
          : 'Password must be at least 6 characters',
      );
      return;
    }

    createUserMutation.mutate({
      email: createEmail.trim() || undefined,
      phone: createPhone.trim() || undefined,
      password: createPassword,
      roleId: createRoleId,
    });
  };

  // If not super_admin, display restricted access banner
  if (!isSuperAdmin) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mb-3" />
        <h2 className="text-lg font-bold text-foreground">
          {locale === 'am' ? 'የተከለከለ ክልል' : 'Restricted Access'}
        </h2>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {locale === 'am'
            ? 'ይህን ገጽ ማግኘት የሚችሉት ከፍተኛ አስተዳዳሪዎች (Super Admins) ብቻ ናቸው። እባክዎ ወደ ዋናው ዳሽቦርድ ይመለሱ።'
            : 'Only Super Administrators have permission to manage user accounts and system roles.'}
        </p>
      </div>
    );
  }

  // DataTable Columns
  const columns: Column<UserItem>[] = [
    {
      key: 'user',
      title: locale === 'am' ? 'ተጠቃሚ' : 'User Account',
      render: (u) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs">
            {u.email || u.phone || 'Unnamed User'}
          </span>
          {u.member && (
            <span className="text-[11px] text-muted-foreground">
              {u.member.firstName} {u.member.fatherName} ({u.member.memberNo})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      title: locale === 'am' ? 'ሚና' : 'Role',
      render: (u) => {
        const isSuper = u.role?.name === 'super_admin';
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
              isSuper
                ? 'bg-primary/15 text-primary'
                : 'bg-secondary/15 text-secondary'
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span className="capitalize">{u.role?.name || 'User'}</span>
          </span>
        );
      },
    },
    {
      key: 'status',
      title: locale === 'am' ? 'ሁኔታ' : 'Status',
      render: (u) => {
        const isActive = u.status === 'active';
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
              isActive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
            }`}
          >
            {isActive ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>{locale === 'am' ? 'ንቁ' : 'Active'}</span>
              </>
            ) : (
              <>
                <Ban className="h-3 w-3" />
                <span>{locale === 'am' ? 'የታገደ' : 'Suspended'}</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      key: 'lastLogin',
      title: locale === 'am' ? 'የመጨረሻ መግቢያ' : 'Last Login',
      render: (u) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {u.lastLogin
            ? new Date(u.lastLogin).toLocaleString(locale === 'am' ? 'am-ET' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : locale === 'am'
              ? 'እስካሁን አልገባም'
              : 'Never'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: locale === 'am' ? 'የተፈጠረበት' : 'Created',
      render: (u) => (
        <span className="text-xs text-muted-foreground">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      title: locale === 'am' ? 'ተግባራት' : 'Actions',
      render: (u) => {
        const isSelf = u.id === currentUser?.id;
        return (
          <div className="flex items-center gap-1.5">
            {/* Change Role Button */}
            <button
              onClick={() => {
                setRoleModalUser(u);
                setNewRoleId(u.role?.id || 2);
                setRoleError('');
              }}
              disabled={isSelf}
              className="rounded-lg border border-border p-1.5 text-xs text-foreground hover:bg-muted disabled:opacity-30"
              title={locale === 'am' ? 'ሚና ቀይር' : 'Change Role'}
            >
              <UserCog className="h-3.5 w-3.5 text-secondary" />
            </button>

            {/* Reset Password Button */}
            <button
              onClick={() => {
                setPasswordModalUser(u);
                setResetPasswordVal('');
                setResetError('');
              }}
              className="rounded-lg border border-border p-1.5 text-xs text-foreground hover:bg-muted"
              title={locale === 'am' ? 'የይለፍ ቃል ቀይር' : 'Reset Password'}
            >
              <KeyRound className="h-3.5 w-3.5 text-primary" />
            </button>

            {/* Suspend or Activate Button */}
            {u.status === 'active' ? (
              <button
                onClick={() => {
                  if (
                    confirm(
                      locale === 'am'
                        ? 'ይህን ተጠቃሚ ለማገድ እርግጠኛ ነዎት?'
                        : 'Are you sure you want to suspend this user?',
                    )
                  ) {
                    suspendUserMutation.mutate(u.id);
                  }
                }}
                disabled={isSelf}
                className="rounded-lg border border-destructive/20 p-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-30"
                title={locale === 'am' ? 'አግድ' : 'Suspend Account'}
              >
                <Ban className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => activateUserMutation.mutate(u.id)}
                className="rounded-lg border border-emerald-500/20 p-1.5 text-xs text-emerald-600 hover:bg-emerald-500/10"
                title={locale === 'am' ? 'አንቃ' : 'Activate Account'}
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'ተጠቃሚዎችና ሚናዎች' : 'Users & Roles'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'የአስተዳዳሪና የመምህራን ተጠቃሚዎችን መቆጣጠር፣ ሚና መመደብና የይለፍ ቃል ማስተካከል'
              : 'Manage administrative and teacher user accounts, access roles, and credentials'}
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError('');
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>{locale === 'am' ? 'አዲስ ተጠቃሚ ፍጠር' : 'Create User'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={
              locale === 'am'
                ? 'በኢሜይል፣ በስልክ ወይም በአባል ስም ፈልግ...'
                : 'Search by email, phone, or member name...'
            }
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs md:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={usersData?.data || []}
        isLoading={isUsersLoading}
        page={page}
        total={usersData?.total || 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyMessage={
          locale === 'am' ? 'ምንም የተጠቃሚ አካውንት አልተገኘም' : 'No user accounts found'
        }
      />

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {locale === 'am' ? 'አዲስ ተጠቃሚ መዝግብ' : 'Create User Account'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {locale === 'am'
                  ? 'የአስተዳዳሪ፣ የመምህር ወይም የይዘት አዘጋጅ ተጠቃሚ አካውንት ፍጠር'
                  : 'Add an administrator, teacher, or content manager account.'}
              </p>
            </div>

            {createError && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የኢሜይል አድራሻ' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="user@aemade.org"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+251 9..."
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የይለፍ ቃል *' : 'Password *'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የተመደበው ሚና *' : 'Assigned Role *'}
                </label>
                <select
                  value={createRoleId}
                  onChange={(e) => setCreateRoleId(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {rolesList?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.description ? `(${r.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs md:text-sm font-semibold text-foreground hover:bg-muted"
                >
                  {locale === 'am' ? 'ተመለስ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  <span>
                    {createUserMutation.isPending
                      ? locale === 'am'
                        ? 'እየተፈጠረ...'
                        : 'Creating...'
                      : locale === 'am'
                        ? 'ተጠቃሚ ፍጠር'
                        : 'Create User'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={() => setRoleModalUser(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {locale === 'am' ? 'ሚና ቀይር' : 'Change User Role'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {roleModalUser.email || roleModalUser.phone}
              </p>
            </div>

            {roleError && (
              <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                {roleError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'አዲስ ሚና ምረጥ' : 'Select New Role'}
                </label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {rolesList?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.description ? `(${r.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  {locale === 'am' ? 'ተመለስ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={assignRoleMutation.isPending}
                  onClick={() =>
                    assignRoleMutation.mutate({
                      userId: roleModalUser.id,
                      roleId: newRoleId,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  <span>
                    {assignRoleMutation.isPending
                      ? locale === 'am'
                        ? 'እየተቀየረ...'
                        : 'Saving...'
                      : locale === 'am'
                        ? 'ሚናውን ቀይር'
                        : 'Update Role'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={() => setPasswordModalUser(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {locale === 'am' ? 'የይለፍ ቃል ቀይር' : 'Reset User Password'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {passwordModalUser.email || passwordModalUser.phone}
              </p>
            </div>

            {resetError && (
              <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                {resetError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'አዲስ የይለፍ ቃል' : 'New Password'}
                </label>
                <input
                  type="password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  {locale === 'am' ? 'ተመለስ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={resetPasswordMutation.isPending || resetPasswordVal.length < 6}
                  onClick={() =>
                    resetPasswordMutation.mutate({
                      userId: passwordModalUser.id,
                      password: resetPasswordVal,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  <span>
                    {resetPasswordMutation.isPending
                      ? locale === 'am'
                        ? 'እየተቀየረ...'
                        : 'Resetting...'
                      : locale === 'am'
                        ? 'የይለፍ ቃል ቀይር'
                        : 'Reset Password'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
