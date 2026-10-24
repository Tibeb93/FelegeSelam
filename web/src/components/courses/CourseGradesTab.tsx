'use client';

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Course, CourseEnrollment } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import {
  Award,
  Plus,
  Save,
  CheckCircle2,
  X,
} from 'lucide-react';

interface CourseGradesTabProps {
  course: Course;
  enrollments: CourseEnrollment[];
  onRefresh: () => void;
}

interface StudentGradeRow {
  enrollmentId: string;
  memberId: string;
  memberNo: string;
  fullName: string;
  grades: Record<string, { id?: string; score: number; maxScore: number }>;
}

export function CourseGradesTab({ course: _course, enrollments, onRefresh }: CourseGradesTabProps) {
  const locale = useLocale();
  const t = useTranslations('Courses');
  const tCommon = useTranslations('Common');

  // Assessments list across the course
  const [assessmentNames, setAssessmentNames] = useState<
    Array<{ name: string; maxScore: number }>
  >([
    { name: 'ፈተና ፩ (Exam 1)', maxScore: 50 },
    { name: 'ፈተና ፪ (Final Exam)', maxScore: 50 },
  ]);

  const [studentRows, setStudentRows] = useState<StudentGradeRow[]>([]);
  const [showAddAssessmentModal, setShowAddAssessmentModal] = useState(false);
  const [newAssessmentName, setNewAssessmentName] = useState('');
  const [newMaxScore, setNewMaxScore] = useState<number>(100);

  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Initialize and populate student grades from enrollment grades
  useEffect(() => {
    const discoveredAssessments = new Map<string, number>();
    const active = enrollments.filter((e) => e.status !== 'dropped');

    const rows: StudentGradeRow[] = active.map((enr) => {
      const gradesMap: Record<string, { id?: string; score: number; maxScore: number }> = {};

      if (enr.grades && enr.grades.length > 0) {
        enr.grades.forEach((g) => {
          gradesMap[g.assessment] = {
            id: g.id,
            score: Number(g.score),
            maxScore: Number(g.maxScore || 100),
          };
          if (!discoveredAssessments.has(g.assessment)) {
            discoveredAssessments.set(g.assessment, Number(g.maxScore || 100));
          }
        });
      }

      return {
        enrollmentId: enr.id,
        memberId: enr.memberId,
        memberNo: enr.member.memberNo,
        fullName:
          `${enr.member.firstName} ${enr.member.fatherName} ${enr.member.grandfatherName || ''}`.trim(),
        grades: gradesMap,
      };
    });

    if (discoveredAssessments.size > 0) {
      const arr = Array.from(discoveredAssessments.entries()).map(([name, maxScore]) => ({
        name,
        maxScore,
      }));
      setAssessmentNames(arr);
    }

    setStudentRows(rows);
  }, [enrollments]);

  // Handle score change in the spreadsheet grid
  const handleScoreChange = (
    enrollmentId: string,
    assessment: string,
    scoreVal: string,
    maxScore: number,
  ) => {
    const num = scoreVal === '' ? 0 : Math.max(0, Math.min(maxScore, Number(scoreVal)));

    setStudentRows((prev) =>
      prev.map((row) => {
        if (row.enrollmentId !== enrollmentId) return row;
        return {
          ...row,
          grades: {
            ...row.grades,
            [assessment]: {
              ...row.grades[assessment],
              score: num,
              maxScore,
            },
          },
        };
      }),
    );
  };

  // Save student grades row to the backend
  const handleSaveStudentGrades = async (row: StudentGradeRow) => {
    try {
      setSavingRowId(row.enrollmentId);
      setSaveSuccessMsg(null);

      // Save each assessment grade
      for (const [assessmentName, gradeData] of Object.entries(row.grades)) {
        if (gradeData.id) {
          // Update existing grade
          await apiClient.put(`/grades/${gradeData.id}`, {
            assessment: assessmentName,
            score: gradeData.score,
            maxScore: gradeData.maxScore,
          });
        } else if (gradeData.score !== undefined) {
          // Add new grade
          await apiClient.post(`/enrollments/${row.enrollmentId}/grades`, {
            assessment: assessmentName,
            score: gradeData.score,
            maxScore: gradeData.maxScore,
          });
        }
      }

      setSaveSuccessMsg(`${t('gradeAverage')}: ${row.fullName}`);
      onRefresh();
    } catch (err) {
      logger.error('Failed to save grade', err);
    } finally {
      setSavingRowId(null);
    }
  };

  const handleAddAssessmentColumn = () => {
    if (!newAssessmentName.trim()) return;
    setAssessmentNames((prev) => [
      ...prev,
      { name: newAssessmentName.trim(), maxScore: newMaxScore },
    ]);
    setNewAssessmentName('');
    setShowAddAssessmentModal(false);
  };

  // Helper to calculate student average percentage and pass/fail
  const calculateStudentAverage = (row: StudentGradeRow) => {
    const gradesList = Object.values(row.grades);
    if (gradesList.length === 0) {
      return { average: 0, status: 'INCOMPLETE' as const };
    }

    const totalScored = gradesList.reduce((acc, g) => acc + (g.score || 0), 0);
    const totalMax = gradesList.reduce((acc, g) => acc + (g.maxScore || 100), 0);
    const avg = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0;
    const status = avg >= 50 ? ('PASS' as const) : ('FAIL' as const);

    return { average: avg, status };
  };

  return (
    <div className="space-y-6">
      {/* Tab Header & Add Assessment */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <span>{t('tabGrades')}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === 'am'
              ? 'የተማሪዎችን ውጤቶች በሰንጠረዡ ውስጥ በቀጥታ ያስገቡና አማካዩን በቅጽበት ይከታተሉ'
              : 'Enter scores in the spreadsheet grid below with live average and pass/fail results'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddAssessmentModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t('addAssessment')}</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Spreadsheet-like Table Grid */}
      {studentRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-xs text-muted-foreground">
          {locale === 'am' ? 'ምንም ንቁ ተማሪዎች አልተመዘገቡም' : 'No active students to grade yet'}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted/60 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">
                    {locale === 'am' ? 'ተማሪ' : 'Student'}
                  </th>
                  <th className="px-3 py-3 min-w-[120px]">
                    {locale === 'am' ? 'የአባል ቁጥር' : 'Member No'}
                  </th>

                  {/* Dynamic Assessment Columns */}
                  {assessmentNames.map((col, idx) => (
                    <th key={idx} className="px-3 py-3 text-center min-w-[140px]">
                      <div className="font-semibold text-foreground text-xs">{col.name}</div>
                      <span className="text-[10px] text-muted-foreground lowercase">
                        / {col.maxScore} pts
                      </span>
                    </th>
                  ))}

                  <th className="px-4 py-3 text-center min-w-[120px] bg-muted/40">
                    {t('gradeAverage')}
                  </th>
                  <th className="px-4 py-3 text-center min-w-[120px] bg-muted/40">
                    {t('passFail')}
                  </th>
                  <th className="px-4 py-3 text-right min-w-[100px]">{tCommon('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentRows.map((row) => {
                  const { average, status } = calculateStudentAverage(row);
                  const isSaving = savingRowId === row.enrollmentId;

                  return (
                    <tr key={row.enrollmentId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{row.fullName}</td>
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                        {row.memberNo}
                      </td>

                      {/* Assessment Inputs */}
                      {assessmentNames.map((col, colIdx) => {
                        const cellData = row.grades[col.name];
                        const val = cellData?.score !== undefined ? cellData.score : '';

                        return (
                          <td key={colIdx} className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={col.maxScore}
                              value={val}
                              placeholder="0"
                              onChange={(e) =>
                                handleScoreChange(
                                  row.enrollmentId,
                                  col.name,
                                  e.target.value,
                                  col.maxScore,
                                )
                              }
                              className="w-20 mx-auto text-center rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            />
                          </td>
                        );
                      })}

                      {/* Calculated Average */}
                      <td className="px-4 py-3 text-center font-bold text-sm bg-muted/20 text-foreground">
                        {average}%
                      </td>

                      {/* Live Pass/Fail Badge */}
                      <td className="px-4 py-3 text-center bg-muted/20">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            status === 'PASS'
                              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                              : status === 'FAIL'
                                ? 'bg-destructive/15 text-destructive border border-destructive/30'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {status === 'PASS' ? t('pass') : status === 'FAIL' ? t('fail') : t('incomplete')}
                        </span>
                      </td>

                      {/* Save Row Button */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveStudentGrades(row)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                          title={tCommon('save')}
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>{isSaving ? '...' : tCommon('save')}</span>
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

      {/* Add Assessment Modal */}
      {showAddAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">{t('addAssessment')}</h3>
              <button
                type="button"
                onClick={() => setShowAddAssessmentModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('assessmentName')} *
                </label>
                <input
                  type="text"
                  value={newAssessmentName}
                  onChange={(e) => setNewAssessmentName(e.target.value)}
                  placeholder="ለምሳሌ፡ የክፍል ሥራ / Assignment"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('maxScore')} (Pts) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={newMaxScore}
                  onChange={(e) => setNewMaxScore(Number(e.target.value))}
                  placeholder="100"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddAssessmentModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                disabled={!newAssessmentName.trim()}
                onClick={handleAddAssessmentColumn}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {t('addAssessment')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
