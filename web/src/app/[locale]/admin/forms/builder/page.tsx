'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  FormFieldSchema,
  FormFieldType,
  FormFieldOption,
  FormSchemaDefinition,
  FormStatus,
  FormItem,
} from '@/types/api';


import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDownSquare,
  CircleDot,
  CheckSquare,
  Paperclip,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings,
  Eye,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

const FIELD_PALETTE: {
  type: FormFieldType;
  labelAm: string;
  labelEn: string;
  icon: any;
  defaultLabelAm: string;
  defaultLabelEn: string;
}[] = [
  {
    type: 'text',
    labelAm: 'አጭር ጽሑፍ (Text)',
    labelEn: 'Short Text',
    icon: Type,
    defaultLabelAm: 'አዲስ የጽሑፍ ጥያቄ',
    defaultLabelEn: 'Short Text Field',
  },
  {
    type: 'textarea',
    labelAm: 'ረጅም ጽሑፍ (Textarea)',
    labelEn: 'Long Text',
    icon: AlignLeft,
    defaultLabelAm: 'ዝርዝር ሐሳብ ወይም ማብራሪያ',
    defaultLabelEn: 'Detailed Description',
  },
  {
    type: 'number',
    labelAm: 'ቁጥር (Number)',
    labelEn: 'Number',
    icon: Hash,
    defaultLabelAm: 'የቁጥር መጠን',
    defaultLabelEn: 'Numeric Amount',
  },
  {
    type: 'date',
    labelAm: 'ቀን (Date)',
    labelEn: 'Date Picker',
    icon: Calendar,
    defaultLabelAm: 'ቀን ምረጥ',
    defaultLabelEn: 'Date',
  },
  {
    type: 'dropdown',
    labelAm: 'ተቆልቋይ ምርጫ (Dropdown)',
    labelEn: 'Dropdown Select',
    icon: ChevronDownSquare,
    defaultLabelAm: 'አማራጭ ይምረጡ',
    defaultLabelEn: 'Select an Option',
  },
  {
    type: 'radio',
    labelAm: 'አንድ ምርጫ (Radio)',
    labelEn: 'Single Choice Radio',
    icon: CircleDot,
    defaultLabelAm: 'ከአማራጮች አንዱን ይምረጡ',
    defaultLabelEn: 'Select One',
  },
  {
    type: 'checkbox',
    labelAm: 'ባለብዙ ምርጫ (Checkbox)',
    labelEn: 'Multiple Checkboxes',
    icon: CheckSquare,
    defaultLabelAm: 'የሚመለከተውን ይምረጡ',
    defaultLabelEn: 'Select All That Apply',
  },
  {
    type: 'file',
    labelAm: 'ፋይል መጫኛ (File)',
    labelEn: 'File Attachment',
    icon: Paperclip,
    defaultLabelAm: 'ማስረጃ ወይም ሰነድ ይጫኑ',
    defaultLabelEn: 'Upload Document / Receipt',
  },
];

export default function FormBuilderPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const existingFormId = searchParams.get('id');

  // Form Meta State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<FormStatus>('draft');
  const [openUntil, setOpenUntil] = useState('');
  const [allowOneResponsePerMember, setAllowOneResponsePerMember] = useState(false);
  const [fields, setFields] = useState<FormFieldSchema[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);

  // Tab state for mobile: 'builder' vs 'preview'
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [errorMsg, setErrorMsg] = useState('');

  // Helper for datetime-local
  const formatDatetimeLocal = (isoString?: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  };

  // Fetch existing form if editing
  const { data: existingForm } = useQuery<FormItem>({
    queryKey: ['admin-form-details', existingFormId],
    queryFn: async () => {
      if (!existingFormId) return null;
      const res = await apiClient.get<any>(`/forms/${existingFormId}`);
      return res.data || res;
    },
    enabled: Boolean(existingFormId),
  });

  useEffect(() => {
    if (existingForm) {
      setTitle(existingForm.title || '');
      setDescription(existingForm.description || '');
      setStatus(existingForm.status || 'draft');
      setOpenUntil(formatDatetimeLocal(existingForm.openUntil));
      setAllowOneResponsePerMember(existingForm.allowOneResponsePerMember ?? false);
      const schemaFields = existingForm.formSchema?.fields || [];
      setFields(schemaFields);
      if (schemaFields.length > 0) {
        setSelectedFieldIndex(0);
      }
    }
  }, [existingForm]);

  // Add field to canvas
  const handleAddField = (paletteItem: (typeof FIELD_PALETTE)[0]) => {
    const fieldIndex = fields.length + 1;
    const newField: FormFieldSchema = {
      id: `field_${Date.now()}`,
      name: `field_${fieldIndex}`,
      type: paletteItem.type,
      labelAm: paletteItem.defaultLabelAm,
      labelEn: paletteItem.defaultLabelEn,
      required: false,
      options:
        paletteItem.type === 'dropdown' ||
        paletteItem.type === 'radio' ||
        paletteItem.type === 'checkbox'
          ? [
              { value: 'option_1', labelAm: 'አማራጭ ፩', labelEn: 'Option 1' },
              { value: 'option_2', labelAm: 'አማራጭ ፪', labelEn: 'Option 2' },
            ]
          : undefined,
    };

    setFields([...fields, newField]);
    setSelectedFieldIndex(fields.length);
  };

  // Reorder fields
  const moveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const updated = [...fields];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setFields(updated);
    setSelectedFieldIndex(targetIndex);
  };

  // Remove field
  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(updated.length > 0 ? 0 : null);
    } else if (selectedFieldIndex !== null && selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1);
    }
  };

  // Update field property
  const updateSelectedField = (updates: Partial<FormFieldSchema>) => {
    if (selectedFieldIndex === null || !fields[selectedFieldIndex]) return;
    const updated = [...fields];
    updated[selectedFieldIndex] = {
      ...updated[selectedFieldIndex],
      ...updates,
    };
    setFields(updated);
  };

  // Save form mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error(
          locale === 'am' ? 'እባክዎ የቅጹን ርዕስ ያስገቡ' : 'Form title is required',
        );
      }
      if (fields.length === 0) {
        throw new Error(
          locale === 'am'
            ? 'ቅጹ ቢያንስ አንድ የጥያቄ መስክ (Field) ሊኖረው ይገባል'
            : 'Form must have at least one field',
        );
      }

      const formSchema: FormSchemaDefinition = {
        titleAm: title.trim(),
        titleEn: title.trim(),
        descriptionAm: description.trim() || undefined,
        descriptionEn: description.trim() || undefined,
        fields,
        settings: {
          allowOneResponsePerMember,
        },
      };

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        openUntil: openUntil ? new Date(openUntil).toISOString() : undefined,
        allowOneResponsePerMember,
        formSchema,
      };

      if (existingFormId) {
        return apiClient.put(`/forms/${existingFormId}`, payload);
      } else {
        return apiClient.post('/forms', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] });
      router.push(`/${locale}/admin/forms`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to save form');
    },
  });

  const selectedField =
    selectedFieldIndex !== null ? fields[selectedFieldIndex] : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/admin/forms`)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {existingFormId
                ? locale === 'am'
                  ? 'ቅጽ ማስተካከያ'
                  : 'Edit Form Schema'
                : locale === 'am'
                ? 'አዲስ ቅጽ ገንቢ (Form Builder)'
                : 'Online Form Builder'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {locale === 'am'
                ? 'ጥያቄዎችን ይምረጡ፣ ማስተካከያዎችን ያብጁና የቀጥታ ቅድመ-ዕይታ ይመልከቱ'
                : 'Add fields, customize validation, and preview interactive response submission.'}
            </p>
          </div>
        </div>

        {/* Action Controls & Tab switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex lg:hidden rounded-lg border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className={`rounded-md px-3 py-1 text-xs font-semibold ${
                activeTab === 'builder'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground'
              }`}
            >
              {locale === 'am' ? 'ገንቢ' : 'Builder'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`rounded-md px-3 py-1 text-xs font-semibold ${
                activeTab === 'preview'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground'
              }`}
            >
              {locale === 'am' ? 'ቅድመ-ዕይታ' : 'Live Preview'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {existingFormId
                ? locale === 'am'
                  ? 'ለውጦችን መዝግብ'
                  : 'Update Form'
                : locale === 'am'
                ? 'ቅጹን አስቀምጥ'
                : 'Save Form'}
            </span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Settings Strip (Title, Status, Deadline, Limit) */}
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-foreground">
              {locale === 'am' ? 'የቅጹ ርዕስ *' : 'Form Title *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                locale === 'am'
                  ? 'ምሳሌ፦ የአባልነት እድሳት ቅጽ (2019 ዓ.ም)'
                  : 'e.g. Membership Renewal Form'
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">
              {locale === 'am' ? 'የቅጹ ሁኔታ *' : 'Form Status *'}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FormStatus)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="draft">{locale === 'am' ? 'ረቂቅ (Draft)' : 'Draft'}</option>
              <option value="open">{locale === 'am' ? 'ክፍት (Open)' : 'Open'}</option>
              <option value="closed">{locale === 'am' ? 'የተዘጋ (Closed)' : 'Closed'}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-foreground">
              {locale === 'am' ? 'የቅጹ ዝርዝር መግለጫ' : 'Form Description'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                locale === 'am'
                  ? 'የቅጹ ዓላማና መመሪያ...'
                  : 'Instructions for members filling this form...'
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">
              {locale === 'am' ? 'የመዝጊያ ቀን (Deadline)' : 'Submission Deadline'}
            </label>
            <input
              type="datetime-local"
              value={openUntil}
              onChange={(e) => setOpenUntil(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="allowOnePerMember"
            checked={allowOneResponsePerMember}
            onChange={(e) => setAllowOneResponsePerMember(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <label
            htmlFor="allowOnePerMember"
            className="text-xs font-medium text-foreground cursor-pointer"
          >
            {locale === 'am'
              ? 'አንድ አባል አንድ ጊዜ ብቻ እንዲሞላ ገድብ (One response per member)'
              : 'Restrict to one response per authenticated member'}
          </label>
        </div>
      </div>

      {/* Main Builder Grid: Palette + Canvas + Settings Drawer + Live Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Palette & Canvas */}
        <div
          className={`space-y-6 lg:col-span-7 ${
            activeTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Field Type Palette */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              <span>{locale === 'am' ? 'ጥያቄዎችን ጨምር (Field Palette)' : 'Add Questions (Click to Add)'}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FIELD_PALETTE.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAddField(item)}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background p-3 text-center transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.02] shadow-2xs group"
                  >
                    <Icon className="h-4 w-4 text-secondary group-hover:text-primary transition-colors" />
                    <span className="text-[11px] font-semibold text-foreground leading-tight">
                      {locale === 'am' ? item.labelAm : item.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields Canvas */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>{locale === 'am' ? 'በቅጹ ውስጥ ያሉ ጥያቄዎች' : 'Canvas Questions'} ({fields.length})</span>
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {locale === 'am' ? 'ለመቀየር ጠቅ ያድርጉ' : 'Click to edit settings'}
              </span>
            </div>

            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-xl">
                <Type className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  {locale === 'am' ? 'ምንም ጥያቄ አልተጨመረም' : 'No fields added yet'}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {locale === 'am'
                    ? 'ከላይ ካሉት አማራጮች የሚፈልጉትን ዓይነት ጠቅ በማድረግ ጥያቄዎችን ያክሉ'
                    : 'Click any field type above to insert questions into this form.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field, idx) => {
                  const palette = FIELD_PALETTE.find((p) => p.type === field.type);
                  const Icon = palette?.icon || Type;
                  const isSelected = selectedFieldIndex === idx;

                  return (
                    <div
                      key={field.id || idx}
                      onClick={() => setSelectedFieldIndex(idx)}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                          : 'border-border bg-background hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <Icon className="h-4 w-4 shrink-0 text-secondary" />
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {field.labelAm || field.labelEn || field.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="font-mono text-secondary">
                              {field.name}
                            </span>
                            <span>•</span>
                            <span>{field.type}</span>
                            {field.required && (
                              <span className="font-bold text-rose-500">* Required</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => moveField(idx, 'up')}
                          disabled={idx === 0}
                          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(idx, 'down')}
                          disabled={idx === fields.length - 1}
                          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(idx)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Delete Field"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Field Settings Inspector */}
          {selectedField && (
            <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-border pb-2">
                <Settings className="h-4 w-4" />
                <span>
                  {locale === 'am' ? 'የተመረጠው ጥያቄ ማስተካከያ' : 'Field Settings Inspector'} (
                  {selectedField.type})
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {locale === 'am' ? 'የጥያቄው ስያሜ (በአማርኛ) *' : 'Label (Amharic) *'}
                  </label>
                  <input
                    type="text"
                    value={selectedField.labelAm}
                    onChange={(e) => updateSelectedField({ labelAm: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {locale === 'am' ? 'የጥያቄው ስያሜ (በእንግሊዝኛ)' : 'Label (English)'}
                  </label>
                  <input
                    type="text"
                    value={selectedField.labelEn || ''}
                    onChange={(e) => updateSelectedField({ labelEn: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {locale === 'am' ? 'የሜዳው ቁልፍ (name) *' : 'Field Key (name) *'}
                  </label>
                  <input
                    type="text"
                    value={selectedField.name}
                    onChange={(e) => updateSelectedField({ name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedField.required}
                      onChange={(e) => updateSelectedField({ required: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {locale === 'am' ? 'ግዴታ የሚሞላ (Required)' : 'Required Field'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Options Editor for Dropdown, Radio, Checkbox */}
              {(selectedField.type === 'dropdown' ||
                selectedField.type === 'radio' ||
                selectedField.type === 'checkbox') && (
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      {locale === 'am' ? 'የምርጫ አማራጮች (Options)' : 'Selection Options'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const optIndex = (selectedField.options?.length || 0) + 1;
                        const newOption: FormFieldOption = {
                          value: `opt_${optIndex}`,
                          labelAm: `አማራጭ ${optIndex}`,
                          labelEn: `Option ${optIndex}`,
                        };
                        updateSelectedField({
                          options: [...(selectedField.options || []), newOption],
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded bg-secondary/15 px-2 py-0.5 text-[11px] font-bold text-secondary hover:bg-secondary/25"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{locale === 'am' ? 'አማራጭ ጨምር' : 'Add Option'}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedField.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.labelAm}
                          onChange={(e) => {
                            const newOpts = [...(selectedField.options || [])];
                            newOpts[optIdx] = { ...opt, labelAm: e.target.value };
                            updateSelectedField({ options: newOpts });
                          }}
                          placeholder="አማራጭ ስም (አማርኛ)"
                          className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground"
                        />
                        <input
                          type="text"
                          value={opt.labelEn || ''}
                          onChange={(e) => {
                            const newOpts = [...(selectedField.options || [])];
                            newOpts[optIdx] = { ...opt, labelEn: e.target.value };
                            updateSelectedField({ options: newOpts });
                          }}
                          placeholder="Option (English)"
                          className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = (selectedField.options || []).filter(
                              (_, i) => i !== optIdx,
                            );
                            updateSelectedField({ options: newOpts });
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Form Preview */}
        <div
          className={`space-y-4 lg:col-span-5 ${
            activeTab === 'builder' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="sticky top-20 rounded-2xl border border-primary/20 bg-card p-5 shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Eye className="h-4 w-4 text-primary" />
                <span>{locale === 'am' ? 'የቀጥታ ቅጽ ቅድመ-ዕይታ' : 'Live Interactive Form Preview'}</span>
              </div>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                {locale === 'am' ? 'የተጠቃሚ ዕይታ' : 'Reader View'}
              </span>
            </div>

            {/* Rendered Dynamic Form Header */}
            <div className="mt-4 pb-3 border-b border-border/80">
              <h3 className="text-base font-bold text-foreground">
                {title || (locale === 'am' ? 'የቅጹ ርዕስ እዚህ ይታያል' : 'Form Title')}
              </h3>
              {description && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Rendered Form Fields */}
            {fields.length === 0 ? (
              <p className="text-center py-10 text-xs text-muted-foreground italic">
                {locale === 'am'
                  ? 'ጥያቄዎች ሲጨመሩ እዚህ በቅድመ-ዕይታ ይታያሉ'
                  : 'Interactive preview will render your fields here'}
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.info(locale === 'am' ? 'ይህ የቅድመ-ዕይታ መሞከሪያ ነው!' : 'This is a live preview test!');
                }}
                className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1"
              >
                {fields.map((f, idx) => (
                  <div key={f.id || idx} className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <span>{f.labelAm || f.labelEn || f.name}</span>
                      {f.required && <span className="text-rose-500 font-bold">*</span>}
                    </label>

                    {/* Field type input rendering */}
                    {f.type === 'text' && (
                      <input
                        type="text"
                        placeholder={f.labelAm}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                      />
                    )}

                    {f.type === 'textarea' && (
                      <textarea
                        rows={3}
                        placeholder={f.labelAm}
                        className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground focus:outline-none"
                      />
                    )}

                    {f.type === 'number' && (
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                      />
                    )}

                    {f.type === 'date' && (
                      <input
                        type="date"
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                      />
                    )}

                    {f.type === 'dropdown' && (
                      <select className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none">
                        <option value="">-- ምረጥ / Select --</option>
                        {f.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt.value}>
                            {opt.labelAm || opt.labelEn}
                          </option>
                        ))}
                      </select>
                    )}

                    {f.type === 'radio' && (
                      <div className="space-y-1 pt-1">
                        {f.options?.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                            <input type="radio" name={f.name} value={opt.value} className="text-primary" />
                            <span>{opt.labelAm || opt.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {f.type === 'checkbox' && (
                      <div className="space-y-1 pt-1">
                        {f.options?.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                            <input type="checkbox" value={opt.value} className="text-primary rounded" />
                            <span>{opt.labelAm || opt.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {f.type === 'file' && (
                      <div className="rounded-lg border border-dashed border-input bg-muted/20 p-3 text-center">
                        <Paperclip className="h-5 w-5 mx-auto text-muted-foreground/60 mb-1" />
                        <p className="text-[11px] text-muted-foreground">
                          {locale === 'am' ? 'ፋይል ይምረጡ (PDF, JPG, PNG)' : 'Select attachment file'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 mt-4"
                >
                  {locale === 'am' ? 'ቅጹን አስገባ (ሙከራ)' : 'Submit Response (Test)'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
