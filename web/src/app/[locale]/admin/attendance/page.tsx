import { redirect } from 'next/navigation';

export default function AttendanceRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/admin/courses`);
}
