'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Mezmur, MezmurCategory, PaginatedResponse } from '@/types/api';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { MezmurFormDialog } from '@/components/mezmur/MezmurFormDialog';
import { CategoryManagerDialog } from '@/components/mezmur/CategoryManagerDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  Volume2,
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

  // Audio playback preview state
  const [currentlyPlayingUrl, setCurrentlyPlayingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const togglePlayAudio = (url: string) => {
    if (currentlyPlayingUrl === url) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentlyPlayingUrl(url);
      setIsPlaying(true);
    }
  };

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
      cell: (mezmur) => (
        <div className="flex items-center gap-2">
          {mezmur.audioUrl ? (
            <button
              type="button"
              onClick={() => togglePlayAudio(mezmur.audioUrl!)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                currentlyPlayingUrl === mezmur.audioUrl && isPlaying
                  ? 'bg-primary text-primary-foreground animate-pulse'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-200'
              }`}
              title={locale === 'am' ? 'ድምፅ አጫውት' : 'Play Audio'}
            >
              {currentlyPlayingUrl === mezmur.audioUrl && isPlaying ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3 fill-current" />
              )}
              <span>Audio</span>
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
      ),
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
    <div className="space-y-6 pb-20">
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
              : 'Manage church hymns, lyrics, audio recordings, and categories.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* Mezmurs Data Table */}
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

      {/* Floating Audio Player Preview Bar */}
      {currentlyPlayingUrl && (
        <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 z-40 flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Volume2 className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {locale === 'am' ? 'የድምፅ ቅድመ-ዕይታ እየተጫወተ ነው' : 'Playing Audio Preview'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate max-w-xs md:max-w-md">
                {currentlyPlayingUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-md">
            <audio
              controls
              autoPlay={isPlaying}
              src={currentlyPlayingUrl}
              className="w-full h-8"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <button
              type="button"
              onClick={() => {
                setCurrentlyPlayingUrl(null);
                setIsPlaying(false);
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1"
            >
              {locale === 'am' ? 'ዝጋ' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Mezmur Dialog */}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={locale === 'am' ? 'መዝሙሩን መሰረዝ ይፈልጋሉ?' : 'Delete Mezmur?'}
        description={
          locale === 'am'
            ? `«${deleteTarget?.title}» የሚለውን መዝሙር ከስርዓቱ ለማስወገድ እርግጠኛ ነዎት?`
            : `Are you sure you want to delete "${deleteTarget?.title}"?`
        }
        confirmLabel={locale === 'am' ? 'ሰርዝ' : 'Delete'}
        cancelLabel={locale === 'am' ? 'ይቅር' : 'Cancel'}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
