import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  ShieldCheck,
  Award,
  BookOpen,
  Music,
  Heart,
  ChevronRight,
  Cross,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AboutPageProps {
  params: { locale: string };
}

export default async function AboutPage({ params: { locale } }: AboutPageProps) {
  const t = await getTranslations({ locale, namespace: 'Website' });

  const departments = [
    {
      id: 1,
      nameAm: 'የትምህርትና ስብከት ክፍል',
      nameEn: 'Education and Preaching Department',
      descAm: 'የዶግማ፣ የቀኖና፣ የቅዱሳት መጻሕፍትና የቤተክርስቲያን ታሪክ ትምህርቶችን በደረጃ በማዘጋጀት ያስተምራል።',
      descEn: 'Delivers graded courses in dogma, canon law, scriptures, and church history.',
      icon: BookOpen,
    },
    {
      id: 2,
      nameAm: 'የመዝሙርና ዜማ ክፍል',
      nameEn: 'Hymnody and Choral Department',
      descAm: 'የቅዱስ ያሬድ ዜማዎችን፣ የዝማሬ ሥልጠናዎችንና ኦርቶዶክሳዊ መዝሙራትን ለተማሪዎች ያሰለጥናል።',
      descEn: 'Trains students in Saint Yared hymns, liturgical chants, and choral presentations.',
      icon: Music,
    },
    {
      id: 3,
      nameAm: 'የሙያና ሥነ-ጥበብ ክፍል',
      nameEn: 'Arts and Media Department',
      descAm: 'የሥነ-ጽሑፍ፣ ድራማ፣ የመድረክ ዝግጅትና ሚዲያ አገልግሎቶችን በመምራት ወንጌልን ያሰራጫል።',
      descEn: 'Oversees literature, stage plays, graphic arts, and spiritual media production.',
      icon: Award,
    },
    {
      id: 4,
      nameAm: 'የልማትና በጎ አድራጎት ክፍል',
      nameEn: 'Charity and Development Department',
      descAm: 'የአቅመ ደካሞችንና ወላጅ አልባ ሕፃናትን በመደገፍ የፍቅርና የበጎ አድራጎት ሥራዎችን ያከናውናል።',
      descEn: 'Coordinates charitable outreach, elder care, and orphan support programs.',
      icon: Heart,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader locale={locale} />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {/* Hero Header */}
        <section className="border-b border-border/80 bg-gradient-to-b from-card to-background py-12 md:py-16">
          <div className="container mx-auto px-4 text-center space-y-4">
            <Badge variant="outline" className="border-primary/40 text-primary px-3 py-1 text-xs uppercase font-semibold">
              {t('aboutSchool')}
            </Badge>
            <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl md:text-5xl">
              {locale === 'am' ? 'የሰንበት ትምህርት ቤታችን ታሪክና ተልዕኮ' : 'History & Sacred Mission'}
            </h1>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t('aboutText')}
            </p>
          </div>
        </section>

        {/* History & Foundation Section */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
                  <Cross className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    {locale === 'am' ? 'መሠረተ አመሠራረትና አመጣጥ' : 'Foundation & Heritage'}
                  </h2>
                  <p className="text-xs text-primary font-semibold">
                    {locale === 'am' ? 'በደብረ ሰላም ቅዱስ እስጢፋኖስ ቤተ ክርስቲያን' : 'At Debre Selam Saint Stephen Church'}
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {locale === 'am'
                  ? 'አዕማደ ሰላም ሰንበት ትምህርት ቤት የተመሠረተው በደብረ ሰላም ቅዱስ እስጢፋኖስ አጥቢያ ቤተ ክርስቲያን ምእመናንና ካህናት አነሳሽነት ሲሆን፣ ዓላማውም የኦርቶዶክስ ተዋሕዶ ሃይማኖትን ሕገ ወንጌልና የቤተክርስቲያን ትውፊት ለሕፃናትና ወጣቶች በተቀናጀ መልኩ ማስተማር ነው። ላለፉት ሠላሳ ዓመታት በሺዎች የሚቆጠሩ መንፈሳዊ ልጆችን በዕውቀትና በሥነ-ምግባር አንጾ ለቤተክርስቲያን መሪነትና ለአገር ጠቃሚ ዜግነት አብቅቷል።'
                  : 'Aemade Selam Sunday School was founded by the clergy and faithful of Debre Selam Saint Stephen Church with the sacred objective of providing systematic theological instruction, liturgical tradition, and moral virtue to the youth. Over the past three decades, it has nurtured thousands of faithful servants of Christ.'}
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <ShieldCheck className="h-5 w-5" />
                  <span>{t('mission')}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('missionText')}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <Award className="h-5 w-5" />
                  <span>{t('vision')}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('visionText')}
                </p>
              </div>
            </div>

            {/* Patron Saint Profile */}
            <div className="rounded-3xl border border-border bg-gradient-to-r from-card to-primary/5 p-6 md:p-8 space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {t('patronSaint')}
              </span>
              <h3 className="text-xl font-bold text-foreground">
                {locale === 'am' ? 'ቅዱስ እስጢፋኖስ ቀዳሜ ሰማዕት ወሊቀ ዲያቆናት' : 'Saint Stephen Protomartyr & Archdeacon'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {locale === 'am'
                  ? 'ቅዱስ እስጢፋኖስ በሐዋርያት እጅ ከተመረጡት ሰባቱ ዲያቆናት የመጀመሪያውና ስለ ክርስቶስ ስም ደሙን ያፈሰሰ ቀዳሜ ሰማዕት ነው። የእርሱ ጽናት፣ እምነትና ይቅር ባይነት ለሰንበት ትምህርት ቤታችን ተማሪዎች ዘወትር አርአያና አብነት ሆኖ ይኖራል።'
                  : 'Saint Stephen, the first among the seven deacons and the very first martyr of the Christian Church, stands as our eternal patron. His unyielding faith, profound scriptural defense, and merciful prayer inspire our community.'}
              </p>
            </div>

            {/* Departments */}
            <div className="space-y-6 pt-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {locale === 'am' ? 'የሰንበት ትምህርት ቤቱ ክፍሎች' : 'Organizational Departments'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {locale === 'am' ? 'በተለያዩ መንፈሳዊ ዘርፎች የተደራጁ የአገልግሎት ክፍሎች' : 'Diverse service divisions working in harmony'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {departments.map((dept) => (
                  <div key={dept.id} className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <dept.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-foreground text-sm sm:text-base">
                        {locale === 'am' ? dept.nameAm : dept.nameEn}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {locale === 'am' ? dept.descAm : dept.descEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Join */}
            <div className="rounded-3xl border border-border bg-muted/40 p-8 text-center space-y-4">
              <h3 className="text-xl font-bold text-foreground">
                {locale === 'am' ? 'የሰንበት ትምህርት ቤታችን አባል ይሁኑ' : 'Join Our Sunday School Family'}
              </h3>
              <p className="mx-auto max-w-lg text-xs sm:text-sm text-muted-foreground">
                {locale === 'am'
                  ? 'በእድሜዎና በፍላጎትዎ መሠረት በተዘጋጁ ክፍሎች ውስጥ በመመዝገብ በኦርቶዶክሳዊ ትምህርት ይታነጹ።'
                  : 'Enroll in age-appropriate theological courses and partake in liturgical choir service.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="bg-primary text-primary-foreground min-h-[48px] rounded-xl font-semibold">
                  <Link href={`/${locale}/register`}>
                    <span>{t('navRegister')}</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-h-[48px] rounded-xl">
                  <Link href={`/${locale}/courses`}>
                    <span>{t('exploreCourses')}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
