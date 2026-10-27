import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Newspaper, AlertCircle, BookOpen } from 'lucide-react';

interface PostsFeedSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    viewAllText?: string;
    viewAllLink?: string;
  };
  config?: {
    postType?: 'all' | 'sinksar' | 'news' | 'urgent' | 'event' | 'teaching';
    limit?: number;
    layout?: 'cards' | 'list' | 'banner';
    showDates?: boolean;
  };
  locale: string;
}

export const PostsFeedSection: React.FC<PostsFeedSectionProps> = ({
  content,
  config = {},
  locale,
}) => {
  const {
    title = "Today's Synaxarium & News",
    subtitle = '',
    viewAllText = 'View All',
    viewAllLink = '/news',
  } = content;

  const { postType: _postType = 'all', showDates = true } = config;

  // Placeholder post items representing feed items from the system
  const samplePosts = [
    {
      id: '1',
      title: 'የዕለቱ ስንክሳር - ጥቅምት 17',
      excerpt: 'የቅዱስ ፊልጶስ ሐዋርያ እና የቅዱስ እስጢፋኖስ ሊቀ ዲያቆናት መታሰቢያ',
      type: 'sinksar',
      date: '2017-02-17',
      slug: 'sinksar-tikimt-17',
    },
    {
      id: '2',
      title: 'ለ2017 ዓ.ም አዲስ የሰንበት ት/ቤት ተማሪዎች ምዝገባ ተጀመረ',
      excerpt: 'የነገረ መለኮት፣ የመጽሐፍ ቅዱስ ጥናትና የዜማ ትምህርቶች ምዝገባ ክፍት ሆኗል።',
      type: 'news',
      date: '2017-02-15',
      slug: 'registration-open-2017',
    },
    {
      id: '3',
      title: 'አስቸኳይ ማስታወቂያ፡ የበጎ አድራጎት መርሐ-ግብር',
      excerpt: 'ለተቸገሩ ወገኖች የሚደረግ የዕርዳታ ማሰባሰቢያ ጥሪ።',
      type: 'urgent',
      date: '2017-02-14',
      slug: 'charity-drive',
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          {subtitle && (
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent mb-2 block">
              {subtitle}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {title}
          </h2>
        </div>

        {viewAllText && (
          <Link
            href={`/${locale}${viewAllLink.startsWith('/') ? viewAllLink : `/${viewAllLink}`}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/85 transition-colors self-start sm:self-auto"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {samplePosts.map((post) => {
          let badgeColor = 'bg-primary/10 text-primary border-primary/20';
          let BadgeIcon = Newspaper;
          if (post.type === 'sinksar') {
            badgeColor = 'bg-accent/20 text-accent border-accent/40';
            BadgeIcon = BookOpen;
          } else if (post.type === 'urgent') {
            badgeColor = 'bg-destructive/15 text-destructive border-destructive/30';
            BadgeIcon = AlertCircle;
          }

          return (
            <Link
              key={post.id}
              href={`/${locale}/news/${post.slug}`}
              className="group block p-6 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
                >
                  <BadgeIcon className="w-3.5 h-3.5" />
                  <span className="capitalize">{post.type}</span>
                </span>
                {showDates && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{post.date}</span>
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
