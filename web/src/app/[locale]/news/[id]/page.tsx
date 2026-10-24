import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ChevronLeft, Calendar, User, Share2, AlertTriangle, BookOpen } from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PostDetailProps {
  params: { locale: string; id: string };
}

async function getPost(id: string) {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/posts/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params: { locale, id } }: PostDetailProps): Promise<Metadata> {
  const post = await getPost(id);
  if (!post) {
    return { title: 'Post Not Found' };
  }
  return {
    title: `${post.title} | አዕማደ ሰላም`,
    description: post.body ? post.body.replace(/<[^>]*>?/gm, '').slice(0, 160) : 'Spiritual Post Detail',
    openGraph: {
      title: post.title,
      description: post.body ? post.body.replace(/<[^>]*>?/gm, '').slice(0, 160) : '',
      images: post.imageUrl ? [{ url: post.imageUrl }] : undefined,
    },
  };
}

export default async function PostDetailPage({ params: { locale, id } }: PostDetailProps) {
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader locale={locale} />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-10 md:py-16 max-w-4xl space-y-8" tabIndex={-1}>
        {/* Back Link */}
        <div>
          <Button asChild variant="ghost" className="gap-2 text-xs font-semibold rounded-xl min-h-[44px]">
            <Link href={`/${locale}/news`}>
              <ChevronLeft className="h-4 w-4" />
              <span>{locale === 'am' ? 'ወደ ዜናዎች ዝርዝር ተመለስ' : 'Back to News & Notices'}</span>
            </Link>
          </Button>
        </div>

        {/* Urgent Alert Banner if Urgent */}
        {post.isUrgent && (
          <div className="rounded-2xl border-2 border-red-600 bg-red-50 p-4 text-red-950 dark:bg-red-950/50 dark:text-red-100 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                {locale === 'am' ? 'አስቸኳይ ማስታወቂያ' : 'Urgent Notice'}
              </p>
              <p className="text-xs">
                {locale === 'am'
                  ? 'ይህ መልዕክት ለሁሉም አባላትና ምእመናን የተላለፈ አስቸኳይ ማስታወቂያ ነው።'
                  : 'This notice carries urgent information for all Sunday school members and parishioners.'}
              </p>
            </div>
          </div>
        )}

        {/* Article Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs font-bold uppercase tracking-wider px-3 py-1"
            >
              {post.type}
            </Badge>

            <span className="text-xs text-muted-foreground flex items-center gap-1.5 ml-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {new Date(post.publishAt).toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl leading-tight">
            {post.title}
          </h1>
        </div>

        {/* Cover Image */}
        {post.imageUrl && (
          <div className="rounded-3xl overflow-hidden border border-border shadow-md max-h-[450px] w-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover max-h-[450px]"
            />
          </div>
        )}

        {/* Article Body */}
        <article className="prose prose-neutral dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed space-y-4 text-foreground/90">
          <div dangerouslySetInnerHTML={{ __html: post.body }} />
        </article>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-border flex items-center justify-between">
          <Button asChild variant="outline" className="min-h-[44px] rounded-xl">
            <Link href={`/${locale}/news`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span>{locale === 'am' ? 'ወደ ዜናዎች ተመለስ' : 'Back to News'}</span>
            </Link>
          </Button>

          <Button asChild variant="secondary" className="min-h-[44px] rounded-xl">
            <Link href={`/${locale}/mezmur`}>
              <span>{locale === 'am' ? 'መዝሙራትን ያዳምጡ' : 'Explore Mezmurs'}</span>
            </Link>
          </Button>
        </div>
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
