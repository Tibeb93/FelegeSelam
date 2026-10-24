'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  Music,
  Play,
  Pause,
  Trash2,
  FileText,
  Volume2,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { Mezmur } from '@/types/api';

export default function PortalFavoritesPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('Portal');
  const tWeb = useTranslations('Website');

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [activeLyricsMezmur, setActiveLyricsMezmur] = useState<Mezmur | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mezmur_favorites');
      if (stored) {
        setFavoriteIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse favorites', e);
    }
  }, []);

  // Fetch all Mezmurs
  const { data: mezmursData, isLoading } = useQuery<{ items: Mezmur[] } | Mezmur[]>({
    queryKey: ['mezmurs', 'all'],
    queryFn: () => apiRequest('/mezmurs', { params: { limit: 100 } }),
  });

  const allMezmurs: Mezmur[] = Array.isArray(mezmursData)
    ? mezmursData
    : (mezmursData as any)?.items || [];

  const favoriteMezmurs = allMezmurs.filter((m) => favoriteIds.includes(m.id));

  const removeFavorite = (id: string) => {
    const updated = favoriteIds.filter((favId) => favId !== id);
    setFavoriteIds(updated);
    try {
      localStorage.setItem('mezmur_favorites', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (playingId === id && audioElement) {
      audioElement.pause();
      setPlayingId(null);
    }
  };

  const handlePlayAudio = (m: Mezmur) => {
    if (!m.audioUrl) return;

    if (playingId === m.id) {
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(m.audioUrl);
    audio.play();
    audio.onended = () => setPlayingId(null);
    setAudioElement(audio);
    setPlayingId(m.id);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-ethiopic">
            {t('favorites')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal collection of saved sacred hymns, spiritual chants, and liturgical mezmurs.
          </p>
        </div>
        <Link
          href={`/${locale}/mezmur`}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted shadow-xs transition-colors"
        >
          <span>Browse Mezmur Library</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Empty State */}
      {favoriteMezmurs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-3" />
          <h3 className="text-lg font-bold text-foreground font-ethiopic">
            ምንም የተመረጡ መዝሙራት የሉም
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
            You have not added any hymns to your favorites yet. Explore the Mezmur library and click the heart icon to save them here.
          </p>
          <Link
            href={`/${locale}/mezmur`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-secondary shadow-md hover:bg-primary-hover"
          >
            <span>Explore Mezmurs</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteMezmurs.map((m) => {
            const isPlaying = playingId === m.id;
            return (
              <div
                key={m.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/50"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-bold text-secondary-dark">
                      {m.category?.nameAm || m.category?.nameEn || 'Mezmur'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFavorite(m.id)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-foreground font-ethiopic line-clamp-1">
                    {m.title}
                  </h3>
                  {m.lyrics && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 font-ethiopic italic">
                      {m.lyrics}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(m)}
                    disabled={!m.audioUrl}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                      isPlaying
                        ? 'bg-secondary text-primary'
                        : 'bg-primary text-secondary hover:bg-primary-hover disabled:opacity-40'
                    }`}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
                  </button>

                  {m.lyrics && (
                    <button
                      type="button"
                      onClick={() => setActiveLyricsMezmur(m)}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Lyrics</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lyrics Modal */}
      {activeLyricsMezmur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <span className="text-xs font-semibold text-primary">Sacred Lyrics</span>
                <h3 className="text-lg font-bold text-foreground font-ethiopic">
                  {activeLyricsMezmur.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLyricsMezmur(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-foreground font-ethiopic pr-2">
              {activeLyricsMezmur.lyrics}
            </div>

            <div className="mt-5 flex justify-end border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setActiveLyricsMezmur(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-secondary hover:bg-primary-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
