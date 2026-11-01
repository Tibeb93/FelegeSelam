'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Music,
  Play,
  Pause,
  Search,
  Volume2,
  FileText,
  Heart,
  Disc,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/utils';
import { MezmurItem, MezmurCategory, PaginatedResult } from '@/types/api';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';

interface MezmurPageProps {
  params: { locale: string };
}

export default function MezmurLibraryPage({ params: { locale } }: MezmurPageProps) {
  const t = useTranslations('Website');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeMezmur, setActiveMezmur] = useState<MezmurItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLyricsMezmur, setSelectedLyricsMezmur] = useState<MezmurItem | null>(null);

  // Fetch categories
  const { data: categoriesData } = useQuery<{ data: MezmurCategory[] } | any>({
    queryKey: ['mezmurs', 'categories'],
    queryFn: () => apiRequest('/mezmurs/categories'),
  });

  const categories: MezmurCategory[] =
    categoriesData?.data ||
    categoriesData?.items ||
    (Array.isArray(categoriesData) ? categoriesData : []);

  // Fetch mezmurs
  const { data: mezmursData, isLoading } = useQuery<PaginatedResult<MezmurItem> | any>({
    queryKey: ['mezmurs', 'public', searchQuery, selectedCategory],
    queryFn: () =>
      apiRequest('/mezmurs/public', {
        params: {
          search: searchQuery || undefined,
          categoryId: selectedCategory || undefined,
          limit: 50,
        },
      }),
  });

  const mezmurs: MezmurItem[] =
    mezmursData?.data ||
    mezmursData?.items ||
    (Array.isArray(mezmursData) ? mezmursData : []);

  // Audio playback controls
  const handlePlayMezmur = (m: MezmurItem) => {
    if (!m.audioUrl) {
      // If no audio is attached, open the lyrics viewer
      setSelectedLyricsMezmur(m);
      return;
    }

    if (activeMezmur?.id === m.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveMezmur(m);
      setIsPlaying(true);
    }
  };

  // Add / Remove Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async ({ id, isFav }: { id: string; isFav: boolean }) => {
      if (isFav) {
        return apiRequest(`/mezmurs/${id}/favorite`, { method: 'DELETE' });
      } else {
        return apiRequest(`/mezmurs/${id}/favorite`, { method: 'POST' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mezmurs'] });
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader locale={locale} />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-10 md:py-16 space-y-8" tabIndex={-1}>
        {/* Header */}
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="text-secondary border-secondary/40 px-3 py-1 text-xs uppercase font-semibold">
            {t('navMezmur')}
          </Badge>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {locale === 'am' ? 'የኦርቶዶክስ ተዋሕዶ መዝሙራት ቤተ-መጻሕፍት' : 'Orthodox Mezmur Library'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'የበዓላት፣ የቅዱሳን መታሰቢያና የንስሐ መዝሙራትን በድምፅ ያዳምጡ፣ ግጥማቸውን ያንብቡ'
              : 'Listen to hymns of praise, memorial feasts, and repentance with full lyrics and audio recordings.'}
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchMezmur')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 min-h-[48px] rounded-xl text-base"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {locale === 'am' ? 'ሁሉም ክፍሎች' : 'All Categories'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {locale === 'am' ? cat.nameAm : cat.nameEn || cat.nameAm}
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Audio Player if active */}
        {activeMezmur && activeMezmur.audioUrl && (
          <div className="sticky top-20 z-30 rounded-2xl border-2 border-secondary/40 bg-card/95 backdrop-blur-md p-4 shadow-xl animate-in slide-in-from-top-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-sm shrink-0">
                  <Disc className={`h-6 w-6 ${isPlaying ? 'animate-spin' : ''}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                    {activeMezmur.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeMezmur.singer || (locale === 'am' ? 'የሰንበት ት/ቤት መዘምራን' : 'Sunday School Choir')}
                  </p>
                </div>
              </div>

              {/* Native browser audio controls with autoPlay */}
              <div className="flex-1 max-w-xl flex items-center gap-3">
                <audio
                  key={activeMezmur.id}
                  controls
                  autoPlay
                  src={resolveMediaUrl(activeMezmur.audioUrl)}
                  className="w-full h-9"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {activeMezmur.lyrics && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLyricsMezmur(activeMezmur)}
                    className="text-xs gap-1.5 rounded-lg text-secondary font-semibold shrink-0"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t('lyrics')}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mezmurs List Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : mezmurs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
            <Music className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-base font-bold text-foreground">
              {locale === 'am' ? 'ምንም መዝሙር አልተገኘም' : 'No mezmurs found'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {locale === 'am' ? 'እባክዎ የተለየ የፍለጋ ቃል ይሞክሩ።' : 'Try searching with another keyword.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mezmurs.map((m) => {
              const isThisPlaying = activeMezmur?.id === m.id && isPlaying;
              const hasAudio = !!m.audioUrl;
              return (
                <Card
                  key={m.id}
                  className={`border-border bg-card shadow-xs transition-all hover:border-primary/50 flex flex-col justify-between ${
                    activeMezmur?.id === m.id ? 'border-primary ring-1 ring-primary' : ''
                  }`}
                >
                  <CardHeader className="p-4 flex flex-row items-center justify-between gap-3 space-y-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Button
                        onClick={() => handlePlayMezmur(m)}
                        size="icon"
                        className={`h-11 w-11 rounded-xl shrink-0 transition-transform ${
                          isThisPlaying
                            ? 'bg-secondary text-secondary-foreground scale-105 shadow-md'
                            : hasAudio
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                        aria-label={hasAudio ? `Play ${m.title}` : `View lyrics for ${m.title}`}
                        title={
                          hasAudio
                            ? isThisPlaying
                              ? 'Pause'
                              : 'Play'
                            : locale === 'am'
                            ? 'ግጥሙን አንብብ (ድምፅ የለውም)'
                            : 'Read lyrics (no audio)'
                        }
                      >
                        {isThisPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : hasAudio ? (
                          <Play className="h-5 w-5 ml-0.5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </Button>

                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-bold text-foreground truncate">
                          {m.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground truncate">
                          {m.singer || (locale === 'am' ? 'የሰንበት ት/ቤት መዘምራን' : 'Sunday School Choir')}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-1">
                          {m.category && (
                            <span className="inline-block text-[11px] font-semibold text-secondary">
                              {locale === 'am' ? m.category.nameAm : m.category.nameEn || m.category.nameAm}
                            </span>
                          )}
                          {hasAudio ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                              <Volume2 className="h-2.5 w-2.5" />
                              <span>{locale === 'am' ? 'ድምፅ ያለው' : 'Audio'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              <FileText className="h-2.5 w-2.5" />
                              <span>{locale === 'am' ? 'ግጥም ብቻ' : 'Lyrics only'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {m.lyrics && (
                        <button
                          type="button"
                          onClick={() => setSelectedLyricsMezmur(m)}
                          className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
                          title={t('lyrics')}
                          aria-label={`View lyrics of ${m.title}`}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}

                      {user && (
                        <button
                          type="button"
                          onClick={() => favoriteMutation.mutate({ id: m.id, isFav: !!m.isFavorite })}
                          className={`p-2 rounded-lg transition-colors ${
                            m.isFavorite
                              ? 'text-red-600 fill-red-600'
                              : 'text-muted-foreground hover:text-red-600'
                          }`}
                          aria-label="Add to favorites"
                        >
                          <Heart className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </CardHeader>

                  {/* Built-in player on card if audio is available */}
                  <div className="px-4 pb-3.5 pt-0">
                    {hasAudio ? (
                      <div className="rounded-xl bg-muted/40 p-2 border border-border/50">
                        <audio
                          controls
                          preload="none"
                          src={resolveMediaUrl(m.audioUrl)}
                          className="w-full h-8"
                          onPlay={() => {
                            setActiveMezmur(m);
                            setIsPlaying(true);
                          }}
                          onPause={() => {
                            if (activeMezmur?.id === m.id) {
                              setIsPlaying(false);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground border border-dashed border-border/60">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{locale === 'am' ? 'የድምፅ ቅጂ አልተካተተም' : 'No audio recording yet'}</span>
                        </span>
                        {m.lyrics && (
                          <button
                            type="button"
                            onClick={() => setSelectedLyricsMezmur(m)}
                            className="text-primary hover:underline text-[11px] font-semibold shrink-0 ml-2"
                          >
                            {locale === 'am' ? 'ግጥም አንብብ →' : 'Lyrics →'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Lyrics Modal / Drawer */}
        {selectedLyricsMezmur && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <span className="text-xs font-semibold text-primary block">
                    {locale === 'am' ? 'የመዝሙር ግጥም' : 'Sacred Lyrics'}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedLyricsMezmur.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedLyricsMezmur.singer}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLyricsMezmur(null)}
                  className="rounded-xl"
                >
                  {t('closeLyrics')}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-sm leading-relaxed whitespace-pre-wrap font-ethiopic text-foreground/90">
                {selectedLyricsMezmur.lyrics || (locale === 'am' ? 'ምንም ግጥም አልተገኘም።' : 'No lyrics recorded.')}
              </div>

              <div className="pt-2 border-t border-border flex flex-col gap-3">
                {selectedLyricsMezmur.audioUrl ? (
                  <div className="w-full rounded-2xl bg-muted/40 p-2.5 border border-border">
                    <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                      <span>{locale === 'am' ? 'የመዝሙር ድምፅ አጫውት' : 'Listen to Audio'}</span>
                    </p>
                    <audio
                      controls
                      autoPlay
                      src={resolveMediaUrl(selectedLyricsMezmur.audioUrl)}
                      className="w-full h-9"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        {locale === 'am'
                          ? 'ይህ መዝሙር የድምፅ ቅጂ (Audio) የለውም'
                          : 'No audio recording for this hymn'}
                      </p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {locale === 'am'
                          ? 'እስካሁን የተመዘገበው ግጥሙ ብቻ ነው። የድምፅ ቅጂውን በአስተዳዳሪ ክፍል (Admin Dashboard) ማከል ይችላሉ።'
                          : 'Only sacred lyrics are recorded so far. You can upload an audio file in the Admin Dashboard.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedLyricsMezmur(null)}
                    className="min-h-[40px] rounded-xl"
                  >
                    {locale === 'am' ? 'ዝጋ' : 'Close'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
