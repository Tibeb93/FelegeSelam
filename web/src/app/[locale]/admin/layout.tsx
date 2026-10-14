import React from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';

export default function Layout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return <AdminLayout locale={locale}>{children}</AdminLayout>;
}
