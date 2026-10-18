'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post, PostType } from '@/types/api';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  BookOpen,
  Calendar,
  Sparkles,
  Newspaper,
  GraduationCap,
  Bell,
  Clock,
} from 'lucide-react';

interface PostCalendarViewProps {
  posts: Post[];
  locale: string;
}

const TYPE_CONFIG: Record<
  PostType,
  { labelAm: string; labelEn: string; icon: any; colorClass: string }
> = {
  sinksar: {
    labelAm: 'ስንክሳር',
    labelEn: 'Sinksar',
    icon: Sparkles,
    colorClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
  },
  bible_reading: {
    labelAm: 'የዕለቱ ንባብ',
    labelEn: 'Reading',
    icon: BookOpen,
    colorClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300',
  },
  saint_of_day: {
    labelAm: 'የዕለቱ ቅዱስ',
    labelEn: 'Saint',
    icon: Sparkles,
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  urgent: {
    labelAm: 'አስቸኳይ',
    labelEn: 'Urgent',
    icon: Flame,
    colorClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 font-bold',
  },
  event: {
    labelAm: 'መርሐ-ግብር',
    labelEn: 'Event',
    icon: Calendar,
    colorClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300',
  },
  news: {
    labelAm: 'ዜና',
    labelEn: 'News',
    icon: Newspaper,
    colorClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300',
  },
  teaching: {
    labelAm: 'ትምህርት',
    labelEn: 'Teaching',
    icon: GraduationCap,
    colorClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300',
  },
};

export function PostCalendarView({ posts, locale }: PostCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const monthNames =
    locale === 'am'
      ? [
          'ጃንዋሪ / ጥር',
          'ፌብሩዋሪ / የካቲት',
          'ማርች / መጋቢት',
          'ኤፕሪል / ሚያዝያ',
          'ሜይ / ግንቦት',
          'ጁን / ሰኔ',
          'ጁላይ / ሐምሌ',
          'ኦገስት / ነሐሴ',
          'ሴፕቴምበር / መስከረም',
          'ኦክቶበር / ጥቅምት',
          'ኖቬምበር / ኅዳር',
          'ዲሴምበር / ታኅሣሥ',
        ]
      : [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

  const weekDayHeaders =
    locale === 'am'
      ? ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map posts into date keys YYYY-MM-DD
  const postsByDate: Record<string, Post[]> = {};
  for (const post of posts) {
    if (post.publishAt) {
      const d = new Date(post.publishAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      if (!postsByDate[key]) postsByDate[key] = [];
      postsByDate[key].push(post);
    }
  }

  // Generate calendar grid cells (42 cells: 6 weeks x 7 days)
  const calendarCells = [];

  // 1. Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateString: '',
      posts: [] as Post[],
    });
  }

  // 2. Current month days
  const now = new Date();
  const isThisMonth = now.getFullYear() === year && now.getMonth() === month;
  const todayDate = now.getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      isToday: isThisMonth && d === todayDate,
      dateString: key,
      posts: postsByDate[key] || [],
    });
  }

  // 3. Next month leading days to complete full grid
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      dateString: '',
      posts: [] as Post[],
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border p-4 gap-3 bg-muted/20">
        <div className="flex items-center gap-3">
          <h2 className="text-base md:text-lg font-bold text-foreground">
            {monthNames[month]} {year}
          </h2>
          <button
            type="button"
            onClick={today}
            className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
          >
            {locale === 'am' ? 'ዛሬ' : 'Today'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground py-2">
        {weekDayHeaders.map((header, idx) => (
          <div key={idx} className={idx === 0 ? 'text-secondary font-bold' : ''}>
            {header}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
        {calendarCells.map((cell, idx) => (
          <div
            key={idx}
            className={`min-h-[105px] md:min-h-[125px] p-1.5 md:p-2 transition-colors flex flex-col justify-between ${
              cell.isCurrentMonth
                ? cell.isToday
                  ? 'bg-primary/5 dark:bg-primary/10'
                  : 'bg-card hover:bg-muted/10'
                : 'bg-muted/25 text-muted-foreground/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  cell.isToday
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : cell.isCurrentMonth
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                {cell.day}
              </span>

              {cell.posts.length > 0 && (
                <span className="text-[10px] font-bold text-muted-foreground px-1">
                  {cell.posts.length} {cell.posts.length === 1 ? 'post' : 'posts'}
                </span>
              )}
            </div>

            {/* Posts Chips on this day */}
            <div className="space-y-1 overflow-y-auto max-h-20">
              {cell.posts.map((post) => {
                const config = TYPE_CONFIG[post.type] || TYPE_CONFIG.news;
                const Icon = config.icon;
                const timeString = new Date(post.publishAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <Link
                    key={post.id}
                    href={`/${locale}/admin/posts/${post.id}/edit`}
                    className={`block rounded-md border p-1 text-[11px] leading-tight transition-transform hover:scale-[1.02] shadow-xs ${config.colorClass}`}
                    title={`${post.title} (${timeString})`}
                  >
                    <div className="flex items-center gap-1 font-semibold truncate">
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{post.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] opacity-80 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{timeString}</span>
                      </span>
                      {post.isUrgent && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          !
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
