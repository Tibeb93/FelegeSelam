'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  FileText,
  X,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Loader2,
  Disc,
} from 'lucide-react';
import { MezmurItem } from '@/types/api';
import { resolveMediaUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface AudioPlayerProps {
  mezmur: MezmurItem | null;
  onClose: () => void;
  onOpenLyrics?: (mezmur: MezmurItem) => void;
  locale?: string;
}

export function AudioPlayer({
  mezmur,
  onClose,
  onOpenLyrics,
  locale = 'am',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeUrl, setActiveUrl] = useState<string>('');

  // Mobile expandable bottom sheet state
  const [isExpanded, setIsExpanded] = useState(false);

  // Load saved speed preference
  useEffect(() => {
    try {
      const savedRate = localStorage.getItem('mezmur_playback_speed');
      if (savedRate) {
        const rate = parseFloat(savedRate);
        if ([0.75, 1.0, 1.25, 1.5, 2.0].includes(rate)) {
          setPlaybackRate(rate);
        }
      }
    } catch {}
  }, []);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Sync active URL on mezmur change
  useEffect(() => {
    if (!mezmur) {
      setIsPlaying(false);
      setActiveUrl('');
      return;
    }

    setErrorMsg(null);
    setRetryCount(0);
    setIsBuffering(false);
    setIsLoading(true);

    const initialUrl = resolveMediaUrl(mezmur.audioUrl);
    setActiveUrl(initialUrl);

    // Initial duration from metadata if present
    if (mezmur.audioDurationSeconds && mezmur.audioDurationSeconds > 0) {
      setDuration(mezmur.audioDurationSeconds);
    } else {
      setDuration(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mezmur?.id, mezmur?.audioUrl, mezmur?.audioDurationSeconds]);

  // Restore saved position once duration is known
  const restoreSavedPosition = useCallback((id: string, dur: number) => {
    try {
      const savedPosKey = `audio_pos_${id}`;
      const savedPos = localStorage.getItem(savedPosKey);
      if (savedPos && audioRef.current) {
        const pos = parseFloat(savedPos);
        if (!isNaN(pos) && pos > 0 && pos < dur - 3) {
          audioRef.current.currentTime = pos;
          setCurrentTime(pos);
        }
      }
    } catch {}
  }, []);

  // Save playback position periodically
  const currentSec = Math.floor(currentTime);
  useEffect(() => {
    if (!mezmur?.id || currentSec <= 0) return;
    try {
      localStorage.setItem(`audio_pos_${mezmur.id}`, String(currentSec));
    } catch {}
  }, [mezmur?.id, currentSec]);

  // Refresh URL and retry playback
  const refreshUrlAndRetry = useCallback(async () => {
    if (!mezmur?.id) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // Request fresh playback URL from API
      const res = await apiClient.get<any>(`/mezmurs/${mezmur.id}/playback-url`);
      const newUrl = res?.audioUrl || res?.data?.audioUrl;

      if (newUrl) {
        const resolved = resolveMediaUrl(newUrl);
        setActiveUrl(resolved);
        if (audioRef.current) {
          audioRef.current.src = resolved;
          audioRef.current.load();
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } else {
        throw new Error('No audio URL returned');
      }
    } catch {
      setErrorMsg(
        locale === 'am'
          ? 'የድምፅ ፋይሉን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።'
          : 'Failed to load audio. Please tap Retry.',
      );
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [mezmur?.id, locale]);

  // Audio element events
  const handleLoadedMetadata = () => {
    if (!audioRef.current || !mezmur) return;
    const audioDur = audioRef.current.duration;
    if (!isNaN(audioDur) && audioDur > 0) {
      setDuration(audioDur);
      restoreSavedPosition(mezmur.id, audioDur);
    }
    setIsLoading(false);
    audioRef.current.playbackRate = playbackRate;
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setErrorMsg(null);
      setIsLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
          // If playback failed, attempt automatic URL refresh
          if (retryCount < 2) {
            setRetryCount((prev) => prev + 1);
            refreshUrlAndRetry();
          } else {
            setErrorMsg(
              locale === 'am'
                ? 'ድምፁን ማጫወት አልተቻለም።'
                : 'Unable to play audio.',
            );
          }
        });
    }
  };

  const handleSeek = (newTime: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    try {
      localStorage.setItem('mezmur_playback_speed', String(speed));
    } catch {}
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const handleError = () => {
    setIsPlaying(false);
    setIsBuffering(false);
    setIsLoading(false);

    // Auto-retry with fresh URL if token expired (401/403/410)
    if (retryCount < 2) {
      setRetryCount((prev) => prev + 1);
      refreshUrlAndRetry();
    } else {
      setErrorMsg(
        locale === 'am'
          ? 'የድምፅ ፋይሉ በአገልጋዩ ላይ አልተገኘም ወይም ሊንኩ አልቋል።'
          : 'Audio file not found or expired link.',
      );
    }
  };

  if (!mezmur || !activeUrl) {
    return null;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Hidden HTML5 Audio Element with preload=metadata and NO autoplay */}
      <audio
        ref={audioRef}
        src={activeUrl}
        preload="metadata"
        autoPlay={false}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={handleError}
      />

      {/* ============================================================== */}
      {/* 1. MOBILE MINI-PLAYER (Screens < 768px)                       */}
      {/* Fixed at bottom with tap-to-expand drawer                     */}
      {/* ============================================================== */}
      <div className="block md:hidden">
        {/* Collapsed Mini Player Bar */}
        {!isExpanded && (
          <div
            onClick={() => setIsExpanded(true)}
            data-testid="mobile-mini-player"
            className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl safe-area-pb transition-all cursor-pointer"
            role="region"
            aria-label="Mini audio player"
          >
            {/* Top Micro Progress Bar */}
            <div className="w-full bg-muted/60 h-1 relative overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5 gap-2.5">
              {/* Disc & Track Details */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Disc
                    className={`h-5 w-5 ${isPlaying && !isBuffering ? 'animate-spin' : ''}`}
                  />
                  {(isLoading || isBuffering) && (
                    <Loader2 className="absolute h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">
                    {mezmur.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {mezmur.singer ||
                      (locale === 'am' ? 'የሰንበት ት/ቤት መዘምራን' : 'Sunday School Choir')}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handlePlayPause}
                  disabled={isLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-transform"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading || isBuffering ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  data-testid="expand-player-btn"
                  onClick={() => setIsExpanded(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Expand player"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expanded Full Mobile Sheet */}
        {isExpanded && (
          <div
            data-testid="expanded-player-drawer"
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Audio player sheet"
          >
            <div className="w-full bg-card rounded-t-3xl border-t border-border p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 safe-area-pb max-h-[85vh] overflow-y-auto">
              {/* Header Bar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  data-testid="collapse-player-btn"
                  onClick={() => setIsExpanded(false)}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span>{locale === 'am' ? 'አሳንስ' : 'Minimize'}</span>
                </button>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {locale === 'am' ? 'መዝሙር አጫዋች' : 'Mezmur Player'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onClose();
                  }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Album / Artwork Visual */}
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                  <Disc
                    className={`h-12 w-12 ${isPlaying && !isBuffering ? 'animate-spin' : ''}`}
                  />
                  {(isLoading || isBuffering) && (
                    <Loader2 className="absolute h-8 w-8 animate-spin text-primary" />
                  )}
                </div>
                <div className="max-w-xs px-2">
                  <h3 className="text-base font-bold text-foreground line-clamp-1">
                    {mezmur.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {mezmur.singer ||
                      (locale === 'am' ? 'የሰንበት ት/ቤት መዘምራን' : 'Sunday School Choir')}
                  </p>
                </div>
              </div>

              {/* Error Alert with Retry Button */}
              {errorMsg && (
                <div className="flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-destructive text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="truncate">{errorMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={refreshUrlAndRetry}
                    className="ml-2 font-bold underline shrink-0 hover:opacity-80"
                  >
                    {locale === 'am' ? 'ደግመህ ሞክር' : 'Retry'}
                  </button>
                </div>
              )}

              {/* Seek Bar */}
              <div className="space-y-1">
                <input
                  type="range"
                  data-testid="audio-scrubber"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  aria-label="Seek time"
                />
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Primary Controls */}
              <div className="flex items-center justify-center gap-6 py-1">
                <button
                  type="button"
                  onClick={() => handleSkip(-10)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Rewind 10 seconds"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={handlePlayPause}
                  disabled={isLoading}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading || isBuffering ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-7 w-7" />
                  ) : (
                    <Play className="h-7 w-7 ml-1 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSkip(10)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Forward 10 seconds"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
              </div>

              {/* Secondary Options: Speed Selector & Lyrics */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                {/* Speed buttons */}
                <div className="flex items-center gap-1">
                  {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      data-testid="player-speed-btn"
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        playbackRate === speed
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                {/* Lyrics Button */}
                {mezmur.lyrics && onOpenLyrics && (
                  <button
                    type="button"
                    onClick={() => onOpenLyrics(mezmur)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-xs font-semibold hover:bg-secondary/20 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{locale === 'am' ? 'ግጥም' : 'Lyrics'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. TABLET & DESKTOP FLOATING PLAYER (Screens >= 768px)         */}
      {/* Fixed bottom floating bar with full controls                   */}
      {/* ============================================================== */}
      <div
        className="hidden md:flex fixed bottom-5 left-6 right-6 lg:left-12 lg:right-12 z-50 rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-md px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-4 items-center justify-between gap-6"
        role="region"
        aria-label="Desktop audio player"
      >
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-[200px] max-w-[280px]">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Disc
              className={`h-6 w-6 ${isPlaying && !isBuffering ? 'animate-spin' : ''}`}
            />
            {(isLoading || isBuffering) && (
              <Loader2 className="absolute h-5 w-5 animate-spin text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
              {mezmur.title}
            </h4>
            <p className="text-[11px] text-muted-foreground truncate">
              {mezmur.singer ||
                (locale === 'am' ? 'የሰንበት ት/ቤት መዘምራን' : 'Sunday School Choir')}
            </p>
          </div>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5">
          {/* Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Rewind 10s"
              aria-label="Rewind 10s"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handlePlayPause}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading || isBuffering ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Forward 10s"
              aria-label="Forward 10s"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          {/* Scrubber & Time */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="Seek time"
              />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Error Banner with Retry Button */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-[11px] font-medium text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={refreshUrlAndRetry}
                className="font-bold underline hover:opacity-80 ml-1"
              >
                {locale === 'am' ? 'ደግመህ ሞክር' : 'Retry'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Speed, Volume, Lyrics & Close */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Speed Selector */}
          <select
            value={playbackRate}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground focus:outline-none"
            title="Playback Speed"
            aria-label="Playback speed"
          >
            <option value="0.75">0.75x</option>
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>

          {/* Volume Slider */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              aria-label="Volume slider"
            />
          </div>

          {/* Lyrics Button */}
          {mezmur.lyrics && onOpenLyrics && (
            <button
              type="button"
              onClick={() => onOpenLyrics(mezmur)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary text-xs font-semibold hover:bg-secondary/20 transition-colors"
              title="Lyrics"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{locale === 'am' ? 'ግጥም' : 'Lyrics'}</span>
            </button>
          )}

          {/* Close Player */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
            title="Close Player"
            aria-label="Close Player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

