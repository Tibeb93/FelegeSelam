import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  GraduationCap,
  CalendarCheck,
  Church,
  ShieldCheck,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { DateDisplay } from '@/components/DateDisplay';

export default function HomePage({ params: { locale } }: { params: { locale: 'am' | 'en' } }) {
  const tCommon = useTranslations('Common');
  const tHero = useTranslations('Hero');
  const tFeatures = useTranslations('Features');
  const tStats = useTranslations('Stats');
  const tFooter = useTranslations('Footer');

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Banner with Date & Language */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-secondary shadow-md">
              <Church className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-secondary uppercase">
                {tCommon('churchName')}
              </p>
              <h1 className="text-lg font-bold text-primary md:text-xl">
                {tCommon('schoolName')}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateDisplay locale={locale} />
            <LanguageSwitcher currentLocale={locale} />
            <Button
              asChild
              variant="outline"
              className="min-h-[48px] border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
            >
              <Link href={`/${locale}/login`}>{tCommon('login')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-card to-background py-16 md:py-24">
          <div className="container mx-auto">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 flex justify-center">
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-4 py-1.5 text-sm font-semibold tracking-wide shadow-sm"
                >
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>{tCommon('churchName')}</span>
                </Badge>
              </div>

              <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-primary md:text-5xl lg:text-6xl">
                {tHero('title')}
              </h2>

              <p className="mb-10 text-lg leading-relaxed text-foreground/90 md:text-xl md:leading-loose">
                {tHero('subtitle')}
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto min-h-[48px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-lg"
                >
                  <Link href={`/${locale}/portal`}>
                    {tHero('primaryCta')}
                    <ChevronRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-h-[48px] border-2 border-secondary text-foreground hover:bg-secondary/20 text-lg"
                >
                  <Link href={`/${locale}/about`}>{tHero('secondaryCta')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-border/60 bg-primary text-primary-foreground py-12">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              <div className="rounded-lg bg-white/10 p-6 text-center backdrop-blur">
                <div className="text-3xl font-extrabold text-secondary md:text-4xl">
                  {tStats('membersCount')}
                </div>
                <div className="mt-2 text-base font-medium opacity-90">{tStats('members')}</div>
              </div>
              <div className="rounded-lg bg-white/10 p-6 text-center backdrop-blur">
                <div className="text-3xl font-extrabold text-secondary md:text-4xl">
                  {tStats('classesCount')}
                </div>
                <div className="mt-2 text-base font-medium opacity-90">{tStats('classes')}</div>
              </div>
              <div className="rounded-lg bg-white/10 p-6 text-center backdrop-blur">
                <div className="text-3xl font-extrabold text-secondary md:text-4xl">
                  {tStats('teachersCount')}
                </div>
                <div className="mt-2 text-base font-medium opacity-90">{tStats('teachers')}</div>
              </div>
              <div className="rounded-lg bg-white/10 p-6 text-center backdrop-blur">
                <div className="text-3xl font-extrabold text-secondary md:text-4xl">
                  {tStats('foundedValue')}
                </div>
                <div className="mt-2 text-base font-medium opacity-90">{tStats('founded')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features / Pillars Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto">
            <div className="mb-14 text-center">
              <h3 className="text-2xl font-bold text-primary md:text-4xl">{tFeatures('title')}</h3>
              <p className="mt-3 text-lg text-foreground/80">{tFeatures('subtitle')}</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-2 border-border/80 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-2xl text-primary">
                    {tFeatures('academic.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-foreground/85">
                    {tFeatures('academic.desc')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-border/80 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
                    <CalendarCheck className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-2xl text-primary">
                    {tFeatures('attendance.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-foreground/85">
                    {tFeatures('attendance.desc')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-border/80 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-2xl text-primary">
                    {tFeatures('activities.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-foreground/85">
                    {tFeatures('activities.desc')}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Spiritual Motto Section */}
        <section className="border-t border-border/80 bg-card/60 py-16">
          <div className="container mx-auto text-center">
            <div className="mx-auto max-w-2xl">
              <Award className="mx-auto mb-4 h-12 w-12 text-secondary" aria-hidden="true" />
              <blockquote className="text-2xl font-semibold italic text-primary md:text-3xl">
                «{tFooter('motto')}»
              </blockquote>
              <p className="mt-4 text-base text-foreground/80">{tCommon('schoolName')}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-secondary">
              <Church className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-primary">{tCommon('schoolName')}</p>
              <p className="text-sm text-foreground/75">{tCommon('churchName')}</p>
            </div>
          </div>

          <p className="text-center text-sm text-foreground/75 md:text-right">
            © {new Date().getFullYear()} {tFooter('rights')}
          </p>
        </div>
      </footer>
    </div>
  );
}
