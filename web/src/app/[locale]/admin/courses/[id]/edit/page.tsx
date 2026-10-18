'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Course } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { CourseForm } from '@/components/courses/CourseForm';
import { FormSkeleton } from '@/components/ui/SkeletonLoaders';

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const res = await apiClient.get<Course>(`/courses/${courseId}`);
        if (res) {
          setCourse(res);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    }
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  if (loading) {
    return <FormSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
        {error || 'Course not found'}
      </div>
    );
  }

  return <CourseForm initialData={course} courseId={courseId} />;
}
