import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Users } from 'lucide-react';

interface CoursesListSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    viewAllText?: string;
  };
  config?: {
    limit?: number;
    status?: 'open' | 'closed' | 'all';
    columns?: 2 | 3;
  };
  locale: string;
}

export const CoursesListSection: React.FC<CoursesListSectionProps> = ({
  content,
  config: _config = {},
  locale,
}) => {
  const {
    title = 'Spiritual Courses',
    subtitle = '',
    viewAllText = 'Browse All Courses',
  } = content;

  const sampleCourses = [
    {
      id: '1',
      title: 'የነገረ መለኮት መሠረታዊ ትምህርት',
      description: 'የኦርቶዶክስ ተዋሕዶ እምነት መሠረተ እምነት፣ ዶግማና ቀኖና ጥናት',
      duration: '3 ወራት',
      instructor: 'ዲ/ን ተስፋዬ',
      slug: 'theology-basics',
    },
    {
      id: '2',
      title: 'የመጽሐፍ ቅዱስ ጥናት',
      description: 'የብሉይና የሐዲስ ኪዳናት መጻሕፍት ትንታኔ እና መንፈሳዊ ትርጓሜ',
      duration: '4 ወራት',
      instructor: 'ቀሲስ ዮሐንስ',
      slug: 'bible-study',
    },
    {
      id: '3',
      title: 'የግዕዝ ቋንቋና የዜማ ስልጠና',
      description: 'የግዕዝ ፊደላት፣ ሰዋስው፣ ንባብ እና የቅዱስ ያሬድ ዜማዎች መግቢያ',
      duration: '6 ወራት',
      instructor: 'መሪጌታ ሰለሞን',
      slug: 'geez-language',
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
            href={`/${locale}/courses`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/85 transition-colors self-start sm:self-auto"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleCourses.map((c) => (
          <div
            key={c.id}
            className="group p-6 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-sm flex flex-col justify-between transition-all duration-300"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>

              <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {c.title}
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                {c.description}
              </p>
            </div>

            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{c.duration}</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{c.instructor}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
