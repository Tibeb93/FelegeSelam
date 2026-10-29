import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Church,
  Music,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Award,
  Users,
  GraduationCap,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { SpiritualBanner } from '@/components/public/SpiritualBanner';
import { PublicHomeHero } from '@/components/public/PublicHomeHero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  params: { locale: string };
}

export default async function HomePage({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale, namespace: 'Website' });

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
      title: 'ጊዮርጊስ ኃያል',
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
        {/* Dynamic & Configurable Hero Section */}
        <PublicHomeHero locale={locale} />

        {/* Spiritual Banner Section: Today's Sinksar & Urgent Notice */}
        <section className="container mx-auto px-4 py-8">
          <SpiritualBanner locale={locale} />
        </section>

        {/* About Highlights */}
        <section id="about" className="scroll-mt-24 container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div className="space-y-5">
              <Badge variant="outline" className="text-[#0F4C81] dark:text-[#68A7E0] border-[#0F4C81]/40 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
                {t('aboutSchool')}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                {locale === 'am' ? 'የጥንታዊት ኦርቶዶክስ ተዋሕዶ እምነትና ሥርዓት ብርሃን' : 'Preserving Orthodox Faith and Heritage'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('aboutText')}
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] p-4 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2 text-[#0F4C81] dark:text-[#68A7E0] font-bold text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{t('mission')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('missionText')}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] p-4 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2 text-[#0F4C81] dark:text-[#68A7E0] font-bold text-sm">
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
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F4C81] dark:text-[#68A7E0] hover:underline transition-colors"
                >
                  <span>{locale === 'am' ? 'ስለ ሰንበት ት/ቤቱ ታሪክ በዝርዝር ያንብቡ' : 'Learn more about our school'}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Stats & Highlights Showcase */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] shadow-sm">
                <CardHeader className="pb-2">
                  <Users className="h-8 w-8 text-[#0F4C81] dark:text-[#68A7E0] mb-1" />
                  <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    1,200+
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    {locale === 'am' ? 'ተማሪዎችና ንቁ አባላት' : 'Active Students & Members'}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] shadow-sm">
                <CardHeader className="pb-2">
                  <GraduationCap className="h-8 w-8 text-[#0F4C81] dark:text-[#68A7E0] mb-1" />
                  <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    35+
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    {locale === 'am' ? 'የትምህርት ክፍሎችና ኮርሶች' : 'Spiritual Courses Offered'}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] shadow-sm">
                <CardHeader className="pb-2">
                  <Music className="h-8 w-8 text-[#0F4C81] dark:text-[#68A7E0] mb-1" />
                  <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    500+
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    {locale === 'am' ? 'መዝሙራት በድምፅና በግጥም' : 'Spiritual Hymns in Library'}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] shadow-sm">
                <CardHeader className="pb-2">
                  <Church className="h-8 w-8 text-[#0F4C81] dark:text-[#68A7E0] mb-1" />
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
        <section id="courses" className="scroll-mt-24 border-t border-border/80 bg-muted/30 py-12 md:py-16">
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
                <Card key={c.id} className="rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-lg bg-[#E8F1FB] dark:bg-[#061B30] px-2.5 py-1 text-xs font-semibold text-[#0F4C81] dark:text-[#68A7E0]">
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
                      <Clock className="h-3.5 w-3.5 text-[#0F4C81] dark:text-[#68A7E0]" />
                      <span>{c.schedule}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button asChild className="w-full bg-[#0F4C81] text-white hover:bg-[#0A2E52] min-h-[44px] rounded-xl font-semibold transition-colors">
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
        <section id="mezmur" className="scroll-mt-24 container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <Badge variant="outline" className="text-[#0F4C81] dark:text-[#68A7E0] border-[#0F4C81]/40 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
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

            <Button asChild variant="outline" className="self-start md:self-auto min-h-[44px] rounded-xl border-[#0F4C81] text-[#0F4C81] hover:bg-[#E8F1FB] dark:border-[#1E78C8] dark:text-[#68A7E0] dark:hover:bg-[#0A2644]">
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
                className="flex items-center justify-between p-4 rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] shadow-xs hover:border-[#1E78C8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F1FB] text-[#0F4C81] dark:bg-[#061B30] dark:text-[#68A7E0]">
                    <PlayCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{m.singer}</p>
                    <span className="inline-block text-[11px] font-medium text-[#0F4C81] dark:text-[#68A7E0] mt-0.5">
                      {m.category}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/${locale}/mezmur`}
                  className="rounded-lg p-2 text-[#0F4C81] dark:text-[#68A7E0] hover:bg-[#E8F1FB] dark:hover:bg-[#061B30] transition-colors"
                  aria-label={`Listen to ${m.title}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Calendar & Fasting Highlights CTA */}
        <section id="calendar" className="scroll-mt-24 border-t border-[#D7E3F1] dark:border-[#1A3E63] bg-gradient-to-r from-[#E8F1FB]/40 via-background to-[#E8F1FB]/20 dark:from-[#061B30] dark:to-[#0A2644] py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="rounded-3xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] p-6 md:p-12 shadow-md">
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <Badge className="bg-[#0F4C81] text-white text-xs font-semibold px-3 py-1">
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
                  <Button asChild size="lg" className="min-h-[48px] bg-[#0F4C81] text-white hover:bg-[#0A2E52] rounded-xl font-semibold shadow-sm">
                    <Link href={`/${locale}/calendar`}>
                      <Calendar className="mr-2 h-5 w-5" />
                      <span>{t('viewCalendar')}</span>
                    </Link>
                  </Button>
                </div>

                <div className="space-y-3 rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-[#F4F8FC] dark:bg-[#061B30] p-6">
                  <h3 className="font-bold text-foreground text-base">
                    {locale === 'am' ? 'የሚቀጥሉት ታላላቅ በዓላት' : 'Upcoming Major Feasts'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between border-b border-[#D7E3F1] dark:border-[#1A3E63] pb-2">
                      <span className="font-medium">{locale === 'am' ? 'በዓለ መስቀል (ደመራ)' : 'Feast of the Holy Cross (Meskel)'}</span>
                      <span className="text-xs text-[#0F4C81] dark:text-[#68A7E0] font-bold">መስከረም 17</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#D7E3F1] dark:border-[#1A3E63] pb-2">
                      <span className="font-medium">{locale === 'am' ? 'በዓለ ልደት (ገና)' : 'Feast of the Nativity (Genna)'}</span>
                      <span className="text-xs text-[#0F4C81] dark:text-[#68A7E0] font-bold">ታኅሣሥ 29</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#D7E3F1] dark:border-[#1A3E63] pb-2">
                      <span className="font-medium">{locale === 'am' ? 'በዓለ ጥምቀት' : 'Epiphany (Timkat)'}</span>
                      <span className="text-xs text-[#0F4C81] dark:text-[#68A7E0] font-bold">ጥር 11</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{locale === 'am' ? 'ቅዱስ ጊዮርጊስ (የካቴድራሉ ጠባቂ)' : 'St. George (Cathedral Patron Feast)'}</span>
                      <span className="text-xs text-[#F2B233] font-bold">ሚያዝያ 23</span>
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
