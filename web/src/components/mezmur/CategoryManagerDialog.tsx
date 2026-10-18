'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { MezmurCategory } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, Trash2, Edit2, FolderPlus, Loader2, Music } from 'lucide-react';

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

export function CategoryManagerDialog({
  open,
  onOpenChange,
  locale,
}: CategoryManagerDialogProps) {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<MezmurCategory | null>(null);
  const [nameAm, setNameAm] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<MezmurCategory[]>({
    queryKey: ['mezmur-categories'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/mezmurs/categories');
      return Array.isArray(res) ? res : res?.items || res?.data || [];
    },
    enabled: open,
  });

  // Save / Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nameAm.trim()) {
        throw new Error(locale === 'am' ? 'የምድቡ የአማርኛ ስም ያስፈልጋል' : 'Amharic name is required');
      }
      if (editingCategory) {
        return apiClient.put(`/mezmurs/categories/${editingCategory.id}`, {
          nameAm: nameAm.trim(),
          nameEn: nameEn.trim() || undefined,
        });
      } else {
        return apiClient.post('/mezmurs/categories', {
          nameAm: nameAm.trim(),
          nameEn: nameEn.trim() || undefined,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mezmur-categories'] });
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Operation failed');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiClient.delete(`/mezmurs/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mezmur-categories'] });
      setDeleteTargetId(null);
    },
  });

  const resetForm = () => {
    setEditingCategory(null);
    setNameAm('');
    setNameEn('');
    setErrorMsg('');
  };

  const startEdit = (cat: MezmurCategory) => {
    setEditingCategory(cat);
    setNameAm(cat.nameAm);
    setNameEn(cat.nameEn || '');
    setErrorMsg('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg bg-card p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Music className="h-5 w-5 text-primary" />
              <span>
                {locale === 'am' ? 'የመዝሙር ምድቦች ማስተዳደሪያ' : 'Manage Mezmur Categories'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Create or Edit Form */}
          <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <FolderPlus className="h-4 w-4 text-secondary" />
              <span>
                {editingCategory
                  ? locale === 'am'
                    ? 'ምድብ ማስተካከል'
                    : 'Edit Category'
                  : locale === 'am'
                  ? 'አዲስ ምድብ መፍጠር'
                  : 'Add New Category'}
              </span>
            </h4>

            {errorMsg && (
              <p className="mb-3 text-xs text-destructive font-medium">{errorMsg}</p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-foreground">
                  {locale === 'am' ? 'ስም (በአማርኛ) *' : 'Name (Amharic) *'}
                </label>
                <input
                  type="text"
                  value={nameAm}
                  onChange={(e) => setNameAm(e.target.value)}
                  placeholder={locale === 'am' ? 'ምሳሌ፦ የንስሐ መዝሙራት' : 'e.g. የንስሐ መዝሙራት'}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">
                  {locale === 'am' ? 'ስም (በእንግሊዝኛ)' : 'Name (English)'}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Hymns of Repentance"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
                </button>
              )}
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>
                  {editingCategory
                    ? locale === 'am'
                      ? 'አድስ'
                      : 'Update'
                    : locale === 'am'
                    ? 'አስቀምጥ'
                    : 'Save Category'}
                </span>
              </button>
            </div>
          </div>

          {/* Categories List */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              {locale === 'am' ? 'ያሉ ምድቦች' : 'Existing Categories'} ({categories.length})
            </h4>

            {isLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted-foreground">
                {locale === 'am' ? 'ምንም ምድብ አልተመዘገበም' : 'No categories found'}
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {cat.nameAm}
                      </p>
                      {cat.nameEn && (
                        <p className="text-[11px] text-muted-foreground">
                          {cat.nameEn}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        title={locale === 'am' ? 'አርትዕ' : 'Edit'}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(cat.id)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title={locale === 'am' ? 'ሰርዝ' : 'Delete'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              {locale === 'am' ? 'ዝጋ' : 'Close'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title={locale === 'am' ? 'ምድቡን መሰረዝ ይፈልጋሉ?' : 'Delete Category?'}
        description={
          locale === 'am'
            ? 'ይህን ምድብ ሲሰርዙ በውስጡ ያሉ መዝሙራት ምድባቸው ያልተገለጸ ይሆናል።'
            : 'Deleting this category will remove it from associated hymns.'
        }
        confirmLabel={locale === 'am' ? 'ሰርዝ' : 'Delete'}
        cancelLabel={locale === 'am' ? 'ይቅር' : 'Cancel'}
        onConfirm={async () => {
          if (deleteTargetId !== null) {
            await deleteMutation.mutateAsync(deleteTargetId);
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
