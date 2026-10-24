'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { CustomForm, MemberFormSubmission } from '@/types/api';

export default function PortalFormsPage() {
  const t = useTranslations('Portal');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'open' | 'submissions'>('open');
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<MemberFormSubmission | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // 1. Query Open Forms
  const { data: openFormsData, isLoading: openLoading } = useQuery<{ items: CustomForm[] } | CustomForm[]>({
    queryKey: ['forms', 'public'],
    queryFn: () => apiRequest('/forms/public'),
  });

  const openForms: CustomForm[] = Array.isArray(openFormsData)
    ? openFormsData
    : (openFormsData as any)?.items || [];

  // 2. Query My Submissions
  const { data: mySubmissions, isLoading: submissionsLoading } = useQuery<MemberFormSubmission[]>({
    queryKey: ['forms', 'submissions', 'me'],
    queryFn: () => apiRequest<MemberFormSubmission[]>('/forms/submissions/me'),
  });

  // Submit Form Mutation
  const submitMutation = useMutation({
    mutationFn: ({ formId, answers }: { formId: string; answers: Record<string, any> }) =>
      apiRequest(`/forms/${formId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', 'submissions', 'me'] });
      setSubmitSuccess('Form submitted successfully!');
      setSelectedForm(null);
      setFormAnswers({});
      setActiveTab('submissions');
      setTimeout(() => setSubmitSuccess(null), 5000);
    },
    onError: (err: any) => {
      setSubmitError(err.message || 'Failed to submit form');
      setTimeout(() => setSubmitError(null), 5000);
    },
  });

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;
    submitMutation.mutate({ formId: selectedForm.id, answers: formAnswers });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-ethiopic">
            {t('forms')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Apply for spiritual programs, service departments, retreats, and track review status.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('open');
              setSelectedForm(null);
            }}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'open'
                ? 'bg-primary text-secondary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('openForms')} ({openForms.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'submissions'
                ? 'bg-primary text-secondary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('mySubmissions')} ({mySubmissions?.length || 0})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {submitSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}
      {submitError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* TAB 1: AVAILABLE OPEN FORMS */}
      {activeTab === 'open' && (
        <div>
          {selectedForm ? (
            /* ACTIVE FORM FILLER */
            <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-md space-y-6">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                    Application Form
                  </span>
                  <h2 className="text-xl font-bold text-foreground font-ethiopic mt-1">
                    {selectedForm.title}
                  </h2>
                  {selectedForm.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedForm.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedForm(null)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {(selectedForm.formSchema?.fields || selectedForm.schema?.fields || [])?.map((field: any) => {
                  return (
                    <div key={field.id} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          required={field.required}
                          rows={3}
                          value={formAnswers[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                          placeholder={field.placeholder || ''}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={formAnswers[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                        >
                          <option value="">Select an option...</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-2">
                          {field.options?.map((opt: string) => (
                            <label key={opt} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                              <input
                                type="radio"
                                name={field.id}
                                value={opt}
                                checked={formAnswers[field.id] === opt}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="text-primary"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!formAnswers[field.id]}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                            className="text-primary rounded-sm"
                          />
                          <span>{field.description || field.label}</span>
                        </label>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          required={field.required}
                          value={formAnswers[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden"
                          placeholder={field.placeholder || ''}
                        />
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setSelectedForm(null)}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-secondary shadow-md hover:bg-primary-hover disabled:opacity-50"
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Submit Application</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* FORMS LIST */
            <div className="space-y-4">
              {openLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : openForms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-30 mb-2" />
                  <p className="text-sm font-semibold">No open forms available currently.</p>
                  <p className="text-xs mt-1">Check back later for seasonal registrations and applications.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {openForms.map((f) => (
                    <div
                      key={f.id}
                      className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/50"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                            Open
                          </span>
                          {(f.openUntil || f.deadline) && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Until {new Date((f.openUntil || f.deadline)!).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-foreground font-ethiopic line-clamp-1">
                          {f.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {f.description || 'Fill out the application questions'}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-border">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedForm(f);
                            setFormAnswers({});
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-secondary shadow-xs hover:bg-primary-hover transition-colors"
                        >
                          <span>{t('fillForm')}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {submissionsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !mySubmissions || mySubmissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 opacity-30 mb-2" />
              <h3 className="text-base font-bold text-foreground font-ethiopic">
                ምንም ያስገቧቸው ማመልከቻዎች የሉም
              </h3>
              <p className="text-xs mt-1">You have not submitted any forms or applications yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Form Title</th>
                      <th className="px-6 py-3">{t('submittedOn')}</th>
                      <th className="px-6 py-3">{t('reviewStatus')}</th>
                      <th className="px-6 py-3">{t('adminNote')}</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mySubmissions.map((sub) => {
                      const statusColor =
                        sub.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : sub.status === 'rejected'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';

                      return (
                        <tr key={sub.id} className="hover:bg-muted/30">
                          <td className="px-6 py-3 font-semibold text-foreground font-ethiopic">
                            {sub.form?.title || 'Form Application'}
                          </td>
                          <td className="px-6 py-3 font-mono text-muted-foreground">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusColor}`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground max-w-xs truncate">
                            {sub.reviewNote || sub.reviewerNote || '-'}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingSubmission(sub)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View Answers</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submission Detail Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-semibold text-primary">Submission Answers</span>
                <h3 className="text-base font-bold text-foreground font-ethiopic">
                  {viewingSubmission.form?.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSubmission(null)}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-3 pr-2">
              {Object.entries(viewingSubmission.answers || {}).map(([key, val]) => (
                <div key={key} className="rounded-xl border border-border bg-background p-3">
                  <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                    {key}
                  </span>
                  <p className="text-xs font-medium text-foreground mt-1">
                    {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                  </p>
                </div>
              ))}
            </div>

            {(viewingSubmission.reviewNote || viewingSubmission.reviewerNote) && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                <span className="font-bold text-primary block">Official Reviewer Note:</span>
                <p className="text-foreground mt-0.5">{viewingSubmission.reviewNote || viewingSubmission.reviewerNote}</p>
              </div>
            )}

            <div className="flex justify-end border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setViewingSubmission(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-secondary hover:bg-primary-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
