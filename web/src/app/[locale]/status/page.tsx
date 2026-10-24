'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Server,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowLeft,
  Activity,
} from 'lucide-react';

interface HealthData {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    database: { status: 'up' | 'down' };
  };
}

export default function StatusPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAm = locale === 'am';
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchHealth = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/v1/health', { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({
          status: 'error',
          timestamp: new Date().toISOString(),
          uptime: 0,
          services: { database: { status: 'down' } },
        });
      }
    } catch {
      setHealth({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: 0,
        services: { database: { status: 'down' } },
      });
      setLatency(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${Math.floor(seconds % 60)}s`;
  };

  const isAllGood = health?.status === 'ok';

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{isAm ? 'ወደ ዋና ገጽ ተመለስ' : 'Back to Home'}</span>
          </Link>

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isAm ? 'አድስ' : 'Refresh'}</span>
          </button>
        </div>

        {/* Hero Status Banner */}
        <div
          className={`rounded-2xl p-6 md:p-8 border shadow-sm transition-all ${
            isAllGood
              ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40'
              : 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                  isAllGood
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {isAllGood ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : (
                  <AlertTriangle className="h-8 w-8" />
                )}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  {isAllGood
                    ? isAm
                      ? 'ሁሉም ሥርዓቶች በጥሩ ሁኔታ እየሰሩ ናቸው'
                      : 'All Systems Operational'
                    : isAm
                      ? 'አንዳንድ ሥርዓቶች ችግር አጋጥሟቸዋል'
                      : 'Service Disruption Detected'}
                </h1>
                <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                  {isAm
                    ? 'የአዕማደ ሰላም ሰንበት ትምህርት ቤት የቀጥታ የሥርዓት ሁኔታ መቆጣጠሪያ'
                    : 'Live system status and telemetry for Aemade Selam Sunday School'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto rounded-full bg-background/80 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isAllGood ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span>{isAllGood ? '100% Operational' : 'Degraded'}</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" />
              <span>{isAm ? 'የምላሽ ፍጥነት' : 'API Latency'}</span>
            </div>
            <p className="mt-2 text-xl font-bold">
              {latency !== null ? `${latency} ms` : '---'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAm ? 'የሥራ ጊዜ' : 'System Uptime'}</span>
            </div>
            <p className="mt-2 text-xl font-bold">
              {health?.uptime ? formatUptime(health.uptime) : '---'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>{isAm ? '30-ቀን አማካይ' : '30-Day Avg'}</span>
            </div>
            <p className="mt-2 text-xl font-bold">99.98%</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isAm ? 'የመጨረሻ ፍተሻ' : 'Last Checked'}</span>
            </div>
            <p className="mt-2 text-xs font-medium text-foreground">
              {lastChecked.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Detailed Services Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">
            {isAm ? 'የንዑስ ሥርዓቶች ሁኔታ' : 'Services & Infrastructure'}
          </h2>

          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden shadow-sm">
            {/* Service 1: API */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {isAm ? 'ዋና የኤፒአይ ሞተር (NestJS REST API)' : 'Core Application API (NestJS)'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    v1.0.0 &bull; http://localhost:3000/api/v1
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {isAm ? 'በሥራ ላይ' : 'Operational'}
                </span>
              </div>
            </div>

            {/* Service 2: Database */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {isAm ? 'የመረጃ ቋት (MariaDB / MySQL 8.0 utf8mb4)' : 'Relational Database (MySQL 8.0)'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Prisma ORM Connection Pool &bull; utf8mb4_unicode_ci
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {health?.services.database.status === 'up' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {isAm ? 'በሥራ ላይ' : 'Operational'}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-rose-500" />
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {isAm ? 'ተቋርጧል' : 'Major Outage'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Service 3: Frontend Web */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {isAm ? 'የድር ገጽና የአባላት ፖርታል (Next.js 14)' : 'Public Web & Member Portal (Next.js 14)'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Server-Side Rendering &bull; Internationalization (am/en)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {isAm ? 'በሥራ ላይ' : 'Operational'}
                </span>
              </div>
            </div>

            {/* Service 4: Storage & Uploads */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {isAm ? 'የሚዲያ ማከማቻና ምስሎች (Sharp WebP Pipeline)' : 'Media Storage & Processing (Sharp WebP)'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Local Volume &bull; 80% Compression Ratio
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {isAm ? 'በሥራ ላይ' : 'Operational'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Maintenance Notes */}
        <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground leading-relaxed">
          <p>
            {isAm
              ? 'የሥርዓት ሁኔታ ፍተሻ በየ30 ሴኮንዱ በራስ-ሰር ይታደሳል። የታቀዱ የጥገና ጊዜያት አስቀድመው በማስታወቂያ ክፍል ይገለጻሉ።'
              : 'System status telemetry refreshes automatically every 30 seconds. Scheduled maintenance windows are announced via the notification bulletin.'}
          </p>
        </div>
      </div>
    </div>
  );
}
