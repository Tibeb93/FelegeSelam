import { redirect } from 'next/navigation';

export default function GradesRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/admin/courses`);
}
