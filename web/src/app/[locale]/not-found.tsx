import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCmsPage } from '@/lib/cms';
import { SectionRenderer } from '@/components/cms/SectionRenderer';

export default async function NotFound() {
  // Attempt to load editable CMS 404 page if configured
  const cms404Page = (await getCmsPage('404')) || (await getCmsPage('not-found'));

  if (cms404Page && cms404Page.sections && cms404Page.sections.length > 0) {
    return (
      <main className="min-h-screen bg-background">
        {cms404Page.sections.map((section, idx) => (
          <SectionRenderer
            key={section.id || `sec-404-${idx}`}
            section={section}
            locale="am"
          />
        ))}
      </main>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-black mb-4">
        404
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
        ገጹ አልተገኘም
      </h1>
      <p className="mt-2 text-base text-muted-foreground max-w-md">
        የፈለጉት ገጽ አልተገኘም ወይም ተሰርዟል። እባክዎ ወደ ዋናው መነሻ ገጽ ይመለሱ።
      </p>
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <Button asChild className="min-h-[44px] px-6 rounded-xl font-semibold">
          <Link href="/am">ወደ መነሻ ገጽ (Home)</Link>
        </Button>
      </div>
    </div>
  );
}
