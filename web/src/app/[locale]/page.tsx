import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Church,
  BookOpen,
  Music,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Award,
  Users,
  GraduationCap,
  Clock,
  MapPin,
  PlayCircle,
  AlertCircle,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { SpiritualBanner } from '@/components/public/SpiritualBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  params: { locale: string };
}

export default async function HomePage({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale, namespace: 'Website' });
  const tCommon = await getTranslations({ locale, namespace: 'Common' });

  // Sample or API-backed highlights
  const featuredCourses = [
    {
      id: 'course-1',
      titleAm: 'መሠረተ ሃይማኖት (የዶግማ ትምህርት)',
      titleEn: 'Foundations of Orthodox Dogma',
      level: 'ደረጃ ፩ (መሠረታዊ)',
      schedule: 'ቅዳሜ ከቀኑ 8:00 - 10:00',
      lessonsCount: 12,
      capacity: 50,
    },
    {
      id: 'course-2',
      titleAm: 'የብሉይና የሐዲስ ኪዳን ጥናት',
      titleEn: 'Old and New Testament Studies',
      level: 'ደረጃ ፪ (መካከለኛ)',
      schedule: 'እሑድ ከቀኑ 3:00 - 5:00',
      lessonsCount: 16,
      capacity: 45,
    },
    {
      id: 'course-3',
      titleAm: 'ሥርዓተ ቤተክርስቲያንና የዜማ መሠረቶች',
      titleEn: 'Church Liturgy and Hymnody',
      level: 'ደረጃ ፫ (ከፍተኛ)',
      schedule: 'ቅዳሜ ከቀኑ 10:00 - 12:00',
      lessonsCount: 20,
      capacity: 40,
    },
  ];

  const featuredMezmurs = [
    {
      id: 'mezmur-1',
      title: 'አዕማደ ሰላም ነሽ እመቤታችን',
      singer: 'የአዕማደ ሰላም ሰ/ት/ቤት መዘምራን',
      category: 'የእመቤታችን ማርያም',
      duration: '4:15',
    },
    {
      id: 'mezmur-2',
      title: 'እስጢፋኖስ ቀዳሜ ሰማዕት',
      singer: 'የሰንበት ት/ቤቱ መዘምራን',
      category: 'የቅዱሳን መታሰቢያ',
      duration: '5:02',
    },
    {
      id: 'mezmur-3',
      title: 'በመስቀሉ ሰላምን አደረገ',
      singer: 'የበዓላት መዘምራን',
      category: 'የበዓለ መስቀል',
      duration: '3:45',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* 1. Public Accessible Header */}
      <PublicHeader locale={locale} />

      {/* 2. Main Content Landmark for SEO & Lighthouse Accessibility */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-card via-card/70 to-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/15 px-4 py-1.5 text-xs sm:text-sm font-semibold text-secondary shadow-xs">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>
                  {locale === 'am' ? 'ደብረ ሰላም ቅዱስ እስጢፋኖስ ቤተ ክርስቲያን' : 'Debre Selam St. Stephen Church'}
                </span>
              </div>

              {/* Single primary H1 for the page */}
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl leading-tight">
                {locale === 'am' ? 'አዕማደ ሰላም ሰንበት ትምህርት ቤት' : 'Aemade Selam Sunday School'}
              </h1>

              <p className="text-lg text-secondary font-bold tracking-wide sm:text-2xl">
                {t('heroTitle')}
              </p>

              <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                {locale === 'am'
                  ? 'የተዋሕዶ ልጆችን በኦርቶዶክሳዊ እምነት፣ ሥርዓትና ትውፊት አንፆ ለቤተ ክርስቲያንና ለአገር የሚያበቃ መንፈሳዊ የትምህርት ማዕከል'
                  : 'Nurturing generations in Orthodox Christian doctrine, holy liturgy, and sacred tradition to serve the Church and society.'}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="min-h-[48px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-base px-6 rounded-xl"
                >
                  <Link href={`/${locale}/courses`}>
                    <BookOpen className="mr-2 h-5 w-5" aria-hidden="true" />
                    <span>{t('exploreCourses')}</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="min-h-[48px] border-2 border-secondary text-foreground hover:bg-secondary/15 text-base px-6 rounded-xl"
                >
                  <Link href={`/${locale}/mezmur`}>
                    <Music className="mr-2 h-5 w-5 text-secondary" aria-hidden="true" />
                    <span>{t('listenMezmur')}</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="min-h-[48px] text-foreground hover:bg-muted text-base px-6 rounded-xl"
                >
                  <Link href={`/${locale}/calendar`}>
                    <Calendar className="mr-2 h-5 w-5 text-primary" aria-hidden="true" />
                    <span>{t('viewCalendar')}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Spiritual Banner Section: Today's Sinksar & Urgent Notice */}
        <section className="container mx-auto px-4 py-8">
          <SpiritualBanner locale={locale} />
        </section>

        {/* About Highlights */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div className="space-y-5">
              <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
                {t('aboutSchool')}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                {locale === 'am' ? 'የጥንታዊት ኦርቶዶክስ ተዋሕዶ እምነትና ሥርዓት ብርሃን' : 'Preserving Orthodox Faith and Heritage'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('aboutText')}
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{t('mission')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('missionText')}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                  <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                    <Award className="h-4 w-4" />
                    <span>{t('vision')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('visionText')}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/${locale}/about`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <span>{locale === 'am' ? 'ስለ ሰንበት ት/ቤቱ ታሪክ በዝርዝር ያንብቡ' : 'Learn more about our school'}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Stats & Highlights Showcase */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-2">
                  <Users className="h-8 w-8 text-primary mb-1" />
                  <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    1,200+
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    {locale === 'am' ? 'ተማሪዎችና ንቁ አባላት' : 'Active Students & Members'}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-2">
                  <GraduationCap className="h-8 w-8 text-secondary mb-1" />
                  <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    35+
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    {locale === 'am' ? 'የትምህርት ክፍሎችና ኮርሶች' : 'Spiritual Courses Offered'}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-2">
                  <Music className="h-8 w-8 text-secondary mb-1" />
                  <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    500+
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    {locale === 'am' ? 'መዝሙራት በድምፅና በግጥም' : 'Spiritual Hymns in Library'}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="pb-2">
                  <Church className="h-8 w-8 text-primary mb-1" />
                  <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    30+
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    {locale === 'am' ? 'ዓመታት በታማኝ አገልግሎት' : 'Years of Faithful Service'}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Open Courses */}
        <section className="border-t border-border/80 bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
                  {t('featuredCourses')}
                </Badge>
                <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                  {locale === 'am' ? 'ለመመዝገብ ክፍት የሆኑ መንፈሳዊ ትምህርቶች' : 'Open Spiritual Courses for Enrollment'}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  {locale === 'am'
                    ? 'በብቃት ባላቸው መምህራን የሚሰጡ የኦርቶዶክሳዊ ትምህርት ክፍሎች'
                    : 'Systematic courses taught by qualified clergy and theologians'}
                </p>
              </div>

              <Button asChild variant="outline" className="self-start md:self-auto min-h-[44px] rounded-xl">
                <Link href={`/${locale}/courses`}>
                  <span>{t('viewAll')}</span>
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredCourses.map((c) => (
                <Card key={c.id} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {c.level}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c.lessonsCount} {locale === 'am' ? 'ትምህርቶች' : 'Lessons'}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
                      {locale === 'am' ? c.titleAm : c.titleEn}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{c.schedule}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] rounded-xl font-semibold">
                      <Link href={`/${locale}/courses`}>
                        {locale === 'am' ? 'ዝርዝሩን ይመልከቱ' : 'View Course'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Public Mezmur Library Preview */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <Badge variant="outline" className="text-secondary border-secondary/40 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
                {t('featuredMezmurs')}
              </Badge>
              <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                {locale === 'am' ? 'የኦርቶዶክስ ተዋሕዶ መንፈሳዊ መዝሙራት' : 'Spiritual Mezmur Library'}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {locale === 'am'
                  ? 'የበዓላት፣ የቅዱሳን መታሰቢያና የንስሐ መዝሙራትን በድምፅ ያዳምጡ፣ ግጥማቸውን ያንብቡ'
                  : 'Listen to feast, memorial, and repentance hymns with full lyrics'}
              </p>
            </div>

            <Button asChild variant="outline" className="self-start md:self-auto min-h-[44px] rounded-xl border-secondary text-secondary hover:bg-secondary/15">
              <Link href={`/${locale}/mezmur`}>
                <span>{t('viewAll')}</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featuredMezmurs.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-xs hover:border-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                    <PlayCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{m.singer}</p>
                    <span className="inline-block text-[11px] font-medium text-secondary mt-0.5">
                      {m.category}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/${locale}/mezmur`}
                  className="rounded-lg p-2 text-primary hover:bg-primary/10 transition-colors"
                  aria-label={`Listen to ${m.title}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Calendar & Fasting Highlights CTA */}
        <section className="border-t border-border/80 bg-gradient-to-r from-primary/10 via-background to-secondary/10 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="rounded-3xl border border-primary/20 bg-card p-6 md:p-12 shadow-md">
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">
                    {locale === 'am' ? 'የቤተክርስቲያን አጽዋማትና በዓላት' : 'Orthodox Calendar & Fasts'}
                  </Badge>
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                    {locale === 'am' ? 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ የቀን መቁጠሪያ' : 'Ethiopian & Gregorian Liturgical Calendar'}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {locale === 'am'
                      ? 'ሰባቱን አጽዋማት፣ ዐበይትና ንዑሳን የጌታ በዓላትን እንዲሁም ወርሃዊ የቅዱሳን መታሰቢያዎችን በአስተዳዳሪው በቀጥታ የሚዘመኑ መረጃዎችን ይመልከቱ።'
                      : 'Explore the seven canonical fasting seasons, major feasts of Our Lord, and monthly commemorations of the saints.'}
                  </p>
                  <Button asChild size="lg" className="min-h-[48px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold">
                    <Link href={`/${locale}/calendar`}>
                      <Calendar className="mr-2 h-5 w-5" />
                      <span>{t('viewCalendar')}</span>
                    </Link>
                  </Button>
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-6">
                  <h3 className="font-bold text-foreground text-base">
                    {locale === 'am' ? 'የሚቀጥሉት ታላላቅ በዓላት' : 'Upcoming Major Feasts'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span className="font-medium">{locale === 'am' ? 'በዓለ መስቀል (ደመራ)' : 'Feast of the Holy Cross (Meskel)'}</span>
                      <span className="text-xs text-primary font-bold">መስከረም 17</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span className="font-medium">{locale === 'am' ? 'በዓለ ልደት (ገና)' : 'Feast of the Nativity (Genna)'}</span>
                      <span className="text-xs text-primary font-bold">ታኅሣሥ 29</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span className="font-medium">{locale === 'am' ? 'በዓለ ጥምቀት' : 'Epiphany (Timkat)'}</span>
                      <span className="text-xs text-primary font-bold">ጥር 11</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{locale === 'am' ? 'ቅዱስ እስጢፋኖስ (ጠባቂያችን)' : 'St. Stephen (Patron Feast)'}</span>
                      <span className="text-xs text-secondary font-bold">ታኅሣሥ 17</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Public Accessible Footer */}
      <PublicFooter locale={locale} />
    </div>
  );
}
