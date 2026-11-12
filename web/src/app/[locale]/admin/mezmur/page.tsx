'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Mezmur, MezmurCategory, PaginatedResponse } from '@/types/api';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { MezmurFormDialog } from '@/components/mezmur/MezmurFormDialog';
import { CategoryManagerDialog } from '@/components/mezmur/CategoryManagerDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import {
  Music,
  Plus,
  FolderCog,
  Search,
  Play,
  Pause,
  Video,
  Globe,
  Lock,
  Edit2,
  Trash2,
  Activity,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function MezmurAdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingMezmur, setEditingMezmur] = useState<Mezmur | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mezmur | null>(null);

  // Active audio player
  const [activeMezmurForPlayer, setActiveMezmurForPlayer] = useState<Mezmur | null>(null);

  // Health check state
  const [healthCheckResult, setHealthCheckResult] = useState<any | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<MezmurCategory[]>({
    queryKey: ['mezmur-categories'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/mezmurs/categories');
      return Array.isArray(res) ? res : res?.items || res?.data || [];
    },
  });

  // Fetch mezmurs
  const { data, isLoading } = useQuery<PaginatedResponse<Mezmur>>({
    queryKey: ['mezmurs', page, pageSize, selectedCategory, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (selectedCategory) params.append('categoryId', String(selectedCategory));
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await apiClient.get<any>(`/mezmurs?${params.toString()}`);
      return res;
    },
  });

  const mezmurs = data?.items || data?.data || [];
  const total = data?.total || 0;

  // Run storage health check
  const runHealthCheck = async () => {
    try {
      setIsCheckingHealth(true);
      const res = await apiClient.get<any>('/mezmurs/storage/health');
      setHealthCheckResult(res);
      queryClient.invalidateQueries({ queryKey: ['mezmurs'] });
    } catch {
      // Storage health check error captured in UI state
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/mezmurs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mezmurs'] });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<Mezmur>[] = [
    {
      header: locale === 'am' ? 'ርዕስና አዝማሪ' : 'Title & Singer',
      accessorKey: 'title',
      cell: (mezmur) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Music className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs md:text-sm">
              {mezmur.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {mezmur.singer || (locale === 'am' ? 'አዝማሪ ያልተጠቀሰ' : 'Unknown Artist')}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: locale === 'am' ? 'ምድብ' : 'Category',
      accessorKey: 'category',
      cell: (mezmur) => {
        const catName =
          locale === 'am'
            ? mezmur.category?.nameAm
            : mezmur.category?.nameEn || mezmur.category?.nameAm;
        return (
          <span className="inline-flex items-center rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
            {catName || (locale === 'am' ? 'ያልተመደበ' : 'Uncategorized')}
          </span>
        );
      },
    },
    {
      header: locale === 'am' ? 'ፋይሎች' : 'Media',
      accessorKey: 'audioUrl',
      cell: (mezmur) => {
        if (mezmur.audioStatus === 'missing') {
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-3 w-3" />
                <span>{locale === 'am' ? 'ፋይሉ ጠፍቷል' : 'File missing'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingMezmur(mezmur);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                title={locale === 'am' ? 'ፋይሉን እንደገና ጫን' : 'Re-upload audio file'}
              >
                <Upload className="h-3 w-3" />
                <span>{locale === 'am' ? 'እንደገና ጫን' : 'Re-upload'}</span>
              </button>
            </div>
          );
        }

        const hasAudio = !!(mezmur.audioUrl || mezmur.audioStorageKey);
        const isPlayingThis = activeMezmurForPlayer?.id === mezmur.id;

        return (
          <div className="flex items-center gap-2">
            {hasAudio ? (
              <button
                type="button"
                onClick={() =>
                  setActiveMezmurForPlayer(isPlayingThis ? null : mezmur)
                }
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  isPlayingThis
                    ? 'bg-primary text-primary-foreground animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-200'
                }`}
                title={locale === 'am' ? 'ድምፅ አጫውት' : 'Play Audio'}
              >
                {isPlayingThis ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3 fill-current" />
                )}
                <span>Audio</span>
                {mezmur.audioDurationSeconds ? (
                  <span className="text-[10px] opacity-80 font-mono">
                    ({Math.floor(mezmur.audioDurationSeconds / 60)}:
                    {Math.floor(mezmur.audioDurationSeconds % 60) < 10 ? '0' : ''}
                    {Math.floor(mezmur.audioDurationSeconds % 60)})
                  </span>
                ) : null}
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground">—</span>
            )}

            {mezmur.videoUrl && (
              <a
                href={mezmur.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-200 transition-colors"
                title={locale === 'am' ? 'ቪዲዮ ተመልከት' : 'View Video'}
              >
                <Video className="h-3 w-3" />
                <span>Video</span>
              </a>
            )}
          </div>
        );
      },
    },
    {
      header: locale === 'am' ? 'ተደራሽነት' : 'Visibility',
      accessorKey: 'isPublic',
      cell: (mezmur) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            mezmur.isPublic
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
        >
          {mezmur.isPublic ? (
            <>
              <Globe className="h-3 w-3" />
              <span>{locale === 'am' ? 'ክፍት' : 'Public'}</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              <span>{locale === 'am' ? 'ለአባላት' : 'Members'}</span>
            </>
          )}
        </span>
      ),
    },
    {
      header: locale === 'am' ? 'ድርጊት' : 'Actions',
      accessorKey: 'id',
      cell: (mezmur) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setEditingMezmur(mezmur);
              setIsFormOpen(true);
            }}
            className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title={locale === 'am' ? 'አርትዕ' : 'Edit'}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(mezmur)}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title={locale === 'am' ? 'ሰርዝ' : 'Delete'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-28">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Music className="h-3.5 w-3.5" />
            <span>{locale === 'am' ? 'መንፈሳዊ ዜማዎች' : 'Spiritual Library'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'መዝሙራትና ዜማዎች' : 'Hymns & Mezmur'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'የሰንበት ትምህርት ቤቱ መዝሙራት፣ የድምፅና ቪዲዮ ማኅደር ማስተዳደሪያ'
              : 'Manage church hymns, lyrics, audio recordings, and storage health.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Storage Health Check Button */}
          <button
            type="button"
            data-testid="storage-health-btn"
            onClick={runHealthCheck}
            disabled={isCheckingHealth}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs md:text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
            title={locale === 'am' ? 'የድምፅ ፋይሎች ማረጋገጫ' : 'Check audio storage health'}
          >
            {isCheckingHealth ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Activity className="h-4 w-4 text-emerald-500" />
            )}
            <span>
              {isCheckingHealth
                ? locale === 'am'
                  ? 'እየተረጋገጠ ነው...'
                  : 'Checking...'
                : locale === 'am'
                ? 'የማከማቻ ጤንነት'
                : 'Storage Health'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs md:text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
          >
            <FolderCog className="h-4 w-4 text-secondary" />
            <span>{locale === 'am' ? 'ምድቦች' : 'Categories'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMezmur(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{locale === 'am' ? 'አዲስ መዝሙር' : 'Add Mezmur'}</span>
          </button>
        </div>
      </div>

      {/* Storage Health Alert Banner (if run) */}
      {healthCheckResult && (
        <div
          className={`rounded-2xl border p-4 space-y-2 animate-in slide-in-from-top-2 ${
            healthCheckResult.missing > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs md:text-sm">
              {healthCheckResult.missing > 0 ? (
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>
                {locale === 'am'
                  ? `የማከማቻ ጤንነት ውጤት፦ ${healthCheckResult.available} ዝግጁ፣ ${healthCheckResult.missing} ፋይል አልተገኘም (ድምር፡ ${healthCheckResult.total})`
                  : `Storage Health Result: ${healthCheckResult.available} available, ${healthCheckResult.missing} missing files (Total: ${healthCheckResult.total})`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHealthCheckResult(null)}
              className="text-xs opacity-70 hover:opacity-100 font-semibold"
            >
              ✕
            </button>
          </div>
          {healthCheckResult.missing > 0 && (
            <p className="text-xs opacity-90">
              {locale === 'am'
                ? 'የጎደሉ ፋይሎችን በሰንጠረዡ ውስጥ "እንደገና ጫን" (Re-upload) ቁልፍን በመጫን ፋይሉን ያያይዙ።'
                : 'Items marked with "File missing" below can be repaired by clicking "Re-upload".'}
            </p>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={
              locale === 'am'
                ? 'በመዝሙር ርዕስ፣ በስንኝ ወይም በአዝማሪ ፈልግ...'
                : 'Search by title, lyrics, or singer...'
            }
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">
              {locale === 'am' ? 'ሁሉም ምድቦች' : 'All Categories'}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === 'am' ? c.nameAm : c.nameEn || c.nameAm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. MOBILE CARDS VIEW (< 768px - No Horizontal Scroll!)       */}
      {/* ============================================================== */}
      <div data-testid="mobile-mezmur-cards" className="block md:hidden space-y-3">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-card border border-border animate-pulse p-4"
            />
          ))
        ) : mezmurs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {locale === 'am' ? 'ምንም መዝሙር አልተገኘም' : 'No mezmurs found'}
          </div>
        ) : (
          mezmurs.map((m) => {
            const hasAudio = !!(m.audioUrl || m.audioStorageKey);
            const isMissing = m.audioStatus === 'missing';
            const isPlayingThis = activeMezmurForPlayer?.id === m.id;
            const catName =
              locale === 'am'
                ? m.category?.nameAm
                : m.category?.nameEn || m.category?.nameAm;

            return (
              <div
                key={m.id}
                className={`rounded-2xl border bg-card p-4 space-y-3 shadow-xs transition-colors ${
                  isPlayingThis ? 'border-primary ring-1 ring-primary' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground text-sm truncate">
                      {m.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {m.singer || (locale === 'am' ? 'አዝማሪ ያልተጠቀሰ' : 'Unknown Artist')}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary shrink-0">
                    {catName || (locale === 'am' ? 'ያልተመደበ' : 'Uncategorized')}
                  </span>
                </div>

                {/* Missing Audio Warning or Play Button */}
                {isMissing ? (
                  <div className="flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{locale === 'am' ? 'ፋይሉ ጠፍቷል' : 'File missing'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMezmur(m);
                        setIsFormOpen(true);
                      }}
                      className="inline-flex items-center gap-1 font-bold underline shrink-0 hover:opacity-80"
                    >
                      <Upload className="h-3 w-3" />
                      <span>{locale === 'am' ? 'እንደገና ጫን' : 'Re-upload'}</span>
                    </button>
                  </div>
                ) : hasAudio ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMezmurForPlayer(isPlayingThis ? null : m)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isPlayingThis
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {isPlayingThis ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 fill-current" />
                      )}
                      <span>
                        {isPlayingThis
                          ? locale === 'am'
                            ? 'አቁም'
                            : 'Pause'
                          : locale === 'am'
                          ? 'ድምፅ አጫውት'
                          : 'Play Audio'}
                      </span>
                      {m.audioDurationSeconds && (
                        <span className="text-[10px] opacity-80 font-mono">
                          ({Math.floor(m.audioDurationSeconds / 60)}:
                          {Math.floor(m.audioDurationSeconds % 60) < 10 ? '0' : ''}
                          {Math.floor(m.audioDurationSeconds % 60)})
                        </span>
                      )}
                    </button>
                  </div>
                ) : null}

                {/* Visibility Badge & Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      m.isPublic
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {m.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    <span>
                      {m.isPublic
                        ? locale === 'am'
                          ? 'ክፍት'
                          : 'Public'
                        : locale === 'am'
                        ? 'ለአባላት'
                        : 'Members'}
                    </span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMezmur(m);
                        setIsFormOpen(true);
                      }}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      aria-label="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(m)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. DESKTOP DATA TABLE (Screens >= 768px)                       */}
      {/* ============================================================== */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={mezmurs}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Responsive Audio Player (Adapts to desktop bar & phone bottom mini-player) */}
      {activeMezmurForPlayer && (
        <AudioPlayer
          mezmur={activeMezmurForPlayer}
          onClose={() => setActiveMezmurForPlayer(null)}
          locale={locale}
        />
      )}

      {/* Mezmur Form Dialog (Single column, progress bar, sticky save) */}
      <MezmurFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mezmurToEdit={editingMezmur}
        locale={locale}
      />

      {/* Category Manager Dialog */}
      <CategoryManagerDialog
        open={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
        locale={locale}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={locale === 'am' ? 'መዝሙር ሰርዝ' : 'Delete Mezmur'}
        description={
          locale === 'am'
            ? `እርግጠኛ ነዎት "${deleteTarget?.title}" የተሰኘውን መዝሙር መሰረዝ ይፈልጋሉ? ይህ ድርጊት አይመለስም።`
            : `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`
        }
        confirmLabel={locale === 'am' ? 'ሰርዝ' : 'Delete'}
        cancelLabel={locale === 'am' ? 'ተመለስ' : 'Cancel'}
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
