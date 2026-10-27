import { z } from 'zod';

export const styleSchema = z.object({
  background: z.enum(['transparent', 'primary', 'secondary', 'muted', 'card', 'custom']).default('transparent'),
  customBackground: z.string().optional(),
  overlay: z.string().optional(),
  padding: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  width: z.enum(['narrow', 'default', 'wide', 'full']).default('default'),
  align: z.enum(['left', 'center', 'right']).default('left'),
  rounded: z.boolean().default(false),
});

// Helper for localized object
export const localized = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    am: schema,
    en: schema,
  });

// 1. HERO
export const heroContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().default(''),
  tagline: z.string().optional(),
  primaryCtaText: z.string().optional(),
  primaryCtaLink: z.string().optional(),
  secondaryCtaText: z.string().optional(),
  secondaryCtaLink: z.string().optional(),
  bgImageUrl: z.string().optional(),
});
export const heroContentSchema = localized(heroContentItemSchema);
export const heroConfigSchema = z.object({
  height: z.enum(['auto', 'screen', 'large', 'medium']).default('large'),
  overlayOpacity: z.number().min(0).max(100).default(60),
  textAlignment: z.enum(['left', 'center', 'right']).default('center'),
  showLogo: z.boolean().default(true),
  showBadges: z.boolean().default(true),
});

// 2. RICHTEXT
export const richTextContentItemSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  html: z.string().default(''),
});
export const richTextContentSchema = localized(richTextContentItemSchema);
export const richTextConfigSchema = z.object({
  proseWidth: z.enum(['narrow', 'normal', 'full']).default('normal'),
  dropCap: z.boolean().default(false),
});

// 3. IMAGE WITH TEXT
export const imageWithTextContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  bodyHtml: z.string().default(''),
  imageUrl: z.string().default(''),
  imageAlt: z.string().optional(),
  badgeText: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
});
export const imageWithTextContentSchema = localized(imageWithTextContentItemSchema);
export const imageWithTextConfigSchema = z.object({
  imagePosition: z.enum(['left', 'right']).default('left'),
  imageRatio: z.enum(['16:9', '4:3', '1:1', 'portrait']).default('4:3'),
});

// 4. FEATURE CARDS
export const featureCardItemSchema = z.object({
  id: z.string().default(''),
  title: z.string().default(''),
  description: z.string().default(''),
  icon: z.string().default('Star'),
  link: z.string().optional(),
  badge: z.string().optional(),
});
export const featureCardsContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  cards: z.array(featureCardItemSchema).default([]),
});
export const featureCardsContentSchema = localized(featureCardsContentItemSchema);
export const featureCardsConfigSchema = z.object({
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  cardStyle: z.enum(['bordered', 'flat', 'elevated']).default('bordered'),
});

// 5. GALLERY
export const galleryImageSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});
export const galleryContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  images: z.array(galleryImageSchema).default([]),
});
export const galleryContentSchema = localized(galleryContentItemSchema);
export const galleryConfigSchema = z.object({
  layout: z.enum(['grid', 'masonry', 'carousel']).default('grid'),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  enableLightbox: z.boolean().default(true),
});

// 6. STATS COUNTER
export const statItemSchema = z.object({
  number: z.string().default('0'),
  label: z.string().default(''),
  suffix: z.string().optional(),
  icon: z.string().optional(),
});
export const statsCounterContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  stats: z.array(statItemSchema).default([]),
});
export const statsCounterContentSchema = localized(statsCounterContentItemSchema);
export const statsCounterConfigSchema = z.object({
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(4),
  animated: z.boolean().default(true),
});

// 7. POSTS FEED (Today's Sinksar, News, Urgent)
export const postsFeedContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  viewAllText: z.string().optional(),
  viewAllLink: z.string().optional(),
});
export const postsFeedContentSchema = localized(postsFeedContentItemSchema);
export const postsFeedConfigSchema = z.object({
  postType: z.enum(['all', 'sinksar', 'news', 'urgent', 'event', 'teaching']).default('all'),
  limit: z.number().min(1).max(24).default(6),
  layout: z.enum(['cards', 'list', 'banner']).default('cards'),
  showDates: z.boolean().default(true),
});

// 8. MEZMUR LIST
export const mezmurListContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  viewAllText: z.string().optional(),
});
export const mezmurListContentSchema = localized(mezmurListContentItemSchema);
export const mezmurListConfigSchema = z.object({
  limit: z.number().min(1).max(30).default(6),
  category: z.string().default('all'),
  layout: z.enum(['compact', 'cards', 'player']).default('cards'),
});

// 9. COURSES LIST
export const coursesListContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  viewAllText: z.string().optional(),
});
export const coursesListContentSchema = localized(coursesListContentItemSchema);
export const coursesListConfigSchema = z.object({
  limit: z.number().min(1).max(20).default(6),
  status: z.enum(['open', 'closed', 'all']).default('open'),
  columns: z.union([z.literal(2), z.literal(3)]).default(3),
});

// 10. EVENTS LIST
export const eventsListContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  viewAllText: z.string().optional(),
});
export const eventsListContentSchema = localized(eventsListContentItemSchema);
export const eventsListConfigSchema = z.object({
  limit: z.number().min(1).max(12).default(4),
  showRsvpButton: z.boolean().default(true),
});

// 11. ETHIOPIAN CALENDAR
export const ethiopianCalendarContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
});
export const ethiopianCalendarContentSchema = localized(ethiopianCalendarContentItemSchema);
export const ethiopianCalendarConfigSchema = z.object({
  showUpcomingEvents: z.boolean().default(true),
  initialView: z.enum(['month', 'year']).default('month'),
});

// 12. FAQ ACCORDION
export const faqItemSchema = z.object({
  question: z.string().default(''),
  answerHtml: z.string().default(''),
});
export const faqAccordionContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  items: z.array(faqItemSchema).default([]),
});
export const faqAccordionContentSchema = localized(faqAccordionContentItemSchema);
export const faqAccordionConfigSchema = z.object({
  allowMultipleOpen: z.boolean().default(false),
});

// 13. CONTACT AND MAP
export const contactAndMapContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  churchName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  mapUrl: z.string().optional(),
  scheduleTitle: z.string().optional(),
  scheduleText: z.string().optional(),
});
export const contactAndMapContentSchema = localized(contactAndMapContentItemSchema);
export const contactAndMapConfigSchema = z.object({
  showForm: z.boolean().default(true),
  showMap: z.boolean().default(true),
  mapHeight: z.number().default(400),
});

// 14. FORM EMBED
export const formEmbedContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional(),
  successMessage: z.string().optional(),
});
export const formEmbedContentSchema = localized(formEmbedContentItemSchema);
export const formEmbedConfigSchema = z.object({
  formId: z.string().optional(),
  formKey: z.string().default('contact'),
  layout: z.enum(['card', 'inline']).default('card'),
});

// 15. VIDEO EMBED
export const videoEmbedContentItemSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  videoUrl: z.string().default(''),
  caption: z.string().optional(),
});
export const videoEmbedContentSchema = localized(videoEmbedContentItemSchema);
export const videoEmbedConfigSchema = z.object({
  aspectRatio: z.enum(['16:9', '4:3']).default('16:9'),
  autoplay: z.boolean().default(false),
  controls: z.boolean().default(true),
});

// 16. LINK BUTTONS
export const linkButtonItemSchema = z.object({
  text: z.string().default(''),
  link: z.string().default('#'),
  variant: z.enum(['primary', 'accent', 'outline', 'ghost']).default('primary'),
  icon: z.string().optional(),
  target: z.enum(['_self', '_blank']).default('_self'),
});
export const linkButtonsContentItemSchema = z.object({
  title: z.string().optional(),
  buttons: z.array(linkButtonItemSchema).default([]),
});
export const linkButtonsContentSchema = localized(linkButtonsContentItemSchema);
export const linkButtonsConfigSchema = z.object({
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
});

// 17. ANNOUNCEMENT BANNER
export const announcementBannerContentItemSchema = z.object({
  message: z.string().default(''),
  linkText: z.string().optional(),
  linkUrl: z.string().optional(),
});
export const announcementBannerContentSchema = localized(announcementBannerContentItemSchema);
export const announcementBannerConfigSchema = z.object({
  type: z.enum(['info', 'warning', 'success', 'urgent']).default('info'),
  dismissible: z.boolean().default(true),
  sticky: z.boolean().default(false),
});

// 18. MEMBER CALL TO ACTION
export const memberCallToActionContentItemSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().default(''),
  buttonText: z.string().default(''),
  buttonLink: z.string().default('/register'),
  badgeText: z.string().optional(),
});
export const memberCallToActionContentSchema = localized(memberCallToActionContentItemSchema);
export const memberCallToActionConfigSchema = z.object({
  backgroundStyle: z.enum(['gradient', 'solid', 'image']).default('gradient'),
  buttonVariant: z.enum(['accent', 'primary']).default('accent'),
});

// 19. SPACER DIVIDER
export const spacerDividerContentItemSchema = z.object({});
export const spacerDividerContentSchema = localized(spacerDividerContentItemSchema);
export const spacerDividerConfigSchema = z.object({
  height: z.number().min(8).max(200).default(48),
  showDividerLine: z.boolean().default(false),
  lineStyle: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  lineColor: z.string().optional(),
});

// 20. CUSTOM HTML (Super admin only, sanitized)
export const customHtmlContentItemSchema = z.object({
  html: z.string().default(''),
});
export const customHtmlContentSchema = localized(customHtmlContentItemSchema);
export const customHtmlConfigSchema = z.object({
  restrictedRole: z.literal('super_admin').default('super_admin'),
});
