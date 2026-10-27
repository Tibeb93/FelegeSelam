"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoEmbedContentSchema = exports.videoEmbedContentItemSchema = exports.formEmbedConfigSchema = exports.formEmbedContentSchema = exports.formEmbedContentItemSchema = exports.contactAndMapConfigSchema = exports.contactAndMapContentSchema = exports.contactAndMapContentItemSchema = exports.faqAccordionConfigSchema = exports.faqAccordionContentSchema = exports.faqAccordionContentItemSchema = exports.faqItemSchema = exports.ethiopianCalendarConfigSchema = exports.ethiopianCalendarContentSchema = exports.ethiopianCalendarContentItemSchema = exports.eventsListConfigSchema = exports.eventsListContentSchema = exports.eventsListContentItemSchema = exports.coursesListConfigSchema = exports.coursesListContentSchema = exports.coursesListContentItemSchema = exports.mezmurListConfigSchema = exports.mezmurListContentSchema = exports.mezmurListContentItemSchema = exports.postsFeedConfigSchema = exports.postsFeedContentSchema = exports.postsFeedContentItemSchema = exports.statsCounterConfigSchema = exports.statsCounterContentSchema = exports.statsCounterContentItemSchema = exports.statItemSchema = exports.galleryConfigSchema = exports.galleryContentSchema = exports.galleryContentItemSchema = exports.galleryImageSchema = exports.featureCardsConfigSchema = exports.featureCardsContentSchema = exports.featureCardsContentItemSchema = exports.featureCardItemSchema = exports.imageWithTextConfigSchema = exports.imageWithTextContentSchema = exports.imageWithTextContentItemSchema = exports.richTextConfigSchema = exports.richTextContentSchema = exports.richTextContentItemSchema = exports.heroConfigSchema = exports.heroContentSchema = exports.heroContentItemSchema = exports.localized = exports.styleSchema = void 0;
exports.customHtmlConfigSchema = exports.customHtmlContentSchema = exports.customHtmlContentItemSchema = exports.spacerDividerConfigSchema = exports.spacerDividerContentSchema = exports.spacerDividerContentItemSchema = exports.memberCallToActionConfigSchema = exports.memberCallToActionContentSchema = exports.memberCallToActionContentItemSchema = exports.announcementBannerConfigSchema = exports.announcementBannerContentSchema = exports.announcementBannerContentItemSchema = exports.linkButtonsConfigSchema = exports.linkButtonsContentSchema = exports.linkButtonsContentItemSchema = exports.linkButtonItemSchema = exports.videoEmbedConfigSchema = void 0;
const zod_1 = require("zod");
exports.styleSchema = zod_1.z.object({
    background: zod_1.z.enum(['transparent', 'primary', 'secondary', 'muted', 'card', 'custom']).default('transparent'),
    customBackground: zod_1.z.string().optional(),
    overlay: zod_1.z.string().optional(),
    padding: zod_1.z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
    width: zod_1.z.enum(['narrow', 'default', 'wide', 'full']).default('default'),
    align: zod_1.z.enum(['left', 'center', 'right']).default('left'),
    rounded: zod_1.z.boolean().default(false),
});
// Helper for localized object
const localized = (schema) => zod_1.z.object({
    am: schema,
    en: schema,
});
exports.localized = localized;
// 1. HERO
exports.heroContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().default(''),
    tagline: zod_1.z.string().optional(),
    primaryCtaText: zod_1.z.string().optional(),
    primaryCtaLink: zod_1.z.string().optional(),
    secondaryCtaText: zod_1.z.string().optional(),
    secondaryCtaLink: zod_1.z.string().optional(),
    bgImageUrl: zod_1.z.string().optional(),
});
exports.heroContentSchema = (0, exports.localized)(exports.heroContentItemSchema);
exports.heroConfigSchema = zod_1.z.object({
    height: zod_1.z.enum(['auto', 'screen', 'large', 'medium']).default('large'),
    overlayOpacity: zod_1.z.number().min(0).max(100).default(60),
    textAlignment: zod_1.z.enum(['left', 'center', 'right']).default('center'),
    showLogo: zod_1.z.boolean().default(true),
    showBadges: zod_1.z.boolean().default(true),
});
// 2. RICHTEXT
exports.richTextContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    subtitle: zod_1.z.string().optional(),
    html: zod_1.z.string().default(''),
});
exports.richTextContentSchema = (0, exports.localized)(exports.richTextContentItemSchema);
exports.richTextConfigSchema = zod_1.z.object({
    proseWidth: zod_1.z.enum(['narrow', 'normal', 'full']).default('normal'),
    dropCap: zod_1.z.boolean().default(false),
});
// 3. IMAGE WITH TEXT
exports.imageWithTextContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    bodyHtml: zod_1.z.string().default(''),
    imageUrl: zod_1.z.string().default(''),
    imageAlt: zod_1.z.string().optional(),
    badgeText: zod_1.z.string().optional(),
    buttonText: zod_1.z.string().optional(),
    buttonLink: zod_1.z.string().optional(),
});
exports.imageWithTextContentSchema = (0, exports.localized)(exports.imageWithTextContentItemSchema);
exports.imageWithTextConfigSchema = zod_1.z.object({
    imagePosition: zod_1.z.enum(['left', 'right']).default('left'),
    imageRatio: zod_1.z.enum(['16:9', '4:3', '1:1', 'portrait']).default('4:3'),
});
// 4. FEATURE CARDS
exports.featureCardItemSchema = zod_1.z.object({
    id: zod_1.z.string().default(''),
    title: zod_1.z.string().default(''),
    description: zod_1.z.string().default(''),
    icon: zod_1.z.string().default('Star'),
    link: zod_1.z.string().optional(),
    badge: zod_1.z.string().optional(),
});
exports.featureCardsContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    cards: zod_1.z.array(exports.featureCardItemSchema).default([]),
});
exports.featureCardsContentSchema = (0, exports.localized)(exports.featureCardsContentItemSchema);
exports.featureCardsConfigSchema = zod_1.z.object({
    columns: zod_1.z.union([zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(4)]).default(3),
    cardStyle: zod_1.z.enum(['bordered', 'flat', 'elevated']).default('bordered'),
});
// 5. GALLERY
exports.galleryImageSchema = zod_1.z.object({
    url: zod_1.z.string(),
    alt: zod_1.z.string().optional(),
    caption: zod_1.z.string().optional(),
});
exports.galleryContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    images: zod_1.z.array(exports.galleryImageSchema).default([]),
});
exports.galleryContentSchema = (0, exports.localized)(exports.galleryContentItemSchema);
exports.galleryConfigSchema = zod_1.z.object({
    layout: zod_1.z.enum(['grid', 'masonry', 'carousel']).default('grid'),
    columns: zod_1.z.union([zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(4)]).default(3),
    enableLightbox: zod_1.z.boolean().default(true),
});
// 6. STATS COUNTER
exports.statItemSchema = zod_1.z.object({
    number: zod_1.z.string().default('0'),
    label: zod_1.z.string().default(''),
    suffix: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
});
exports.statsCounterContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    stats: zod_1.z.array(exports.statItemSchema).default([]),
});
exports.statsCounterContentSchema = (0, exports.localized)(exports.statsCounterContentItemSchema);
exports.statsCounterConfigSchema = zod_1.z.object({
    columns: zod_1.z.union([zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(4)]).default(4),
    animated: zod_1.z.boolean().default(true),
});
// 7. POSTS FEED (Today's Sinksar, News, Urgent)
exports.postsFeedContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    viewAllText: zod_1.z.string().optional(),
    viewAllLink: zod_1.z.string().optional(),
});
exports.postsFeedContentSchema = (0, exports.localized)(exports.postsFeedContentItemSchema);
exports.postsFeedConfigSchema = zod_1.z.object({
    postType: zod_1.z.enum(['all', 'sinksar', 'news', 'urgent', 'event', 'teaching']).default('all'),
    limit: zod_1.z.number().min(1).max(24).default(6),
    layout: zod_1.z.enum(['cards', 'list', 'banner']).default('cards'),
    showDates: zod_1.z.boolean().default(true),
});
// 8. MEZMUR LIST
exports.mezmurListContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    viewAllText: zod_1.z.string().optional(),
});
exports.mezmurListContentSchema = (0, exports.localized)(exports.mezmurListContentItemSchema);
exports.mezmurListConfigSchema = zod_1.z.object({
    limit: zod_1.z.number().min(1).max(30).default(6),
    category: zod_1.z.string().default('all'),
    layout: zod_1.z.enum(['compact', 'cards', 'player']).default('cards'),
});
// 9. COURSES LIST
exports.coursesListContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    viewAllText: zod_1.z.string().optional(),
});
exports.coursesListContentSchema = (0, exports.localized)(exports.coursesListContentItemSchema);
exports.coursesListConfigSchema = zod_1.z.object({
    limit: zod_1.z.number().min(1).max(20).default(6),
    status: zod_1.z.enum(['open', 'closed', 'all']).default('open'),
    columns: zod_1.z.union([zod_1.z.literal(2), zod_1.z.literal(3)]).default(3),
});
// 10. EVENTS LIST
exports.eventsListContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    viewAllText: zod_1.z.string().optional(),
});
exports.eventsListContentSchema = (0, exports.localized)(exports.eventsListContentItemSchema);
exports.eventsListConfigSchema = zod_1.z.object({
    limit: zod_1.z.number().min(1).max(12).default(4),
    showRsvpButton: zod_1.z.boolean().default(true),
});
// 11. ETHIOPIAN CALENDAR
exports.ethiopianCalendarContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
});
exports.ethiopianCalendarContentSchema = (0, exports.localized)(exports.ethiopianCalendarContentItemSchema);
exports.ethiopianCalendarConfigSchema = zod_1.z.object({
    showUpcomingEvents: zod_1.z.boolean().default(true),
    initialView: zod_1.z.enum(['month', 'year']).default('month'),
});
// 12. FAQ ACCORDION
exports.faqItemSchema = zod_1.z.object({
    question: zod_1.z.string().default(''),
    answerHtml: zod_1.z.string().default(''),
});
exports.faqAccordionContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.faqItemSchema).default([]),
});
exports.faqAccordionContentSchema = (0, exports.localized)(exports.faqAccordionContentItemSchema);
exports.faqAccordionConfigSchema = zod_1.z.object({
    allowMultipleOpen: zod_1.z.boolean().default(false),
});
// 13. CONTACT AND MAP
exports.contactAndMapContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    churchName: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().optional(),
    mapUrl: zod_1.z.string().optional(),
    scheduleTitle: zod_1.z.string().optional(),
    scheduleText: zod_1.z.string().optional(),
});
exports.contactAndMapContentSchema = (0, exports.localized)(exports.contactAndMapContentItemSchema);
exports.contactAndMapConfigSchema = zod_1.z.object({
    showForm: zod_1.z.boolean().default(true),
    showMap: zod_1.z.boolean().default(true),
    mapHeight: zod_1.z.number().default(400),
});
// 14. FORM EMBED
exports.formEmbedContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().optional(),
    successMessage: zod_1.z.string().optional(),
});
exports.formEmbedContentSchema = (0, exports.localized)(exports.formEmbedContentItemSchema);
exports.formEmbedConfigSchema = zod_1.z.object({
    formId: zod_1.z.string().optional(),
    formKey: zod_1.z.string().default('contact'),
    layout: zod_1.z.enum(['card', 'inline']).default('card'),
});
// 15. VIDEO EMBED
exports.videoEmbedContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    subtitle: zod_1.z.string().optional(),
    videoUrl: zod_1.z.string().default(''),
    caption: zod_1.z.string().optional(),
});
exports.videoEmbedContentSchema = (0, exports.localized)(exports.videoEmbedContentItemSchema);
exports.videoEmbedConfigSchema = zod_1.z.object({
    aspectRatio: zod_1.z.enum(['16:9', '4:3']).default('16:9'),
    autoplay: zod_1.z.boolean().default(false),
    controls: zod_1.z.boolean().default(true),
});
// 16. LINK BUTTONS
exports.linkButtonItemSchema = zod_1.z.object({
    text: zod_1.z.string().default(''),
    link: zod_1.z.string().default('#'),
    variant: zod_1.z.enum(['primary', 'accent', 'outline', 'ghost']).default('primary'),
    icon: zod_1.z.string().optional(),
    target: zod_1.z.enum(['_self', '_blank']).default('_self'),
});
exports.linkButtonsContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    buttons: zod_1.z.array(exports.linkButtonItemSchema).default([]),
});
exports.linkButtonsContentSchema = (0, exports.localized)(exports.linkButtonsContentItemSchema);
exports.linkButtonsConfigSchema = zod_1.z.object({
    alignment: zod_1.z.enum(['left', 'center', 'right']).default('center'),
    size: zod_1.z.enum(['sm', 'md', 'lg']).default('md'),
});
// 17. ANNOUNCEMENT BANNER
exports.announcementBannerContentItemSchema = zod_1.z.object({
    message: zod_1.z.string().default(''),
    linkText: zod_1.z.string().optional(),
    linkUrl: zod_1.z.string().optional(),
});
exports.announcementBannerContentSchema = (0, exports.localized)(exports.announcementBannerContentItemSchema);
exports.announcementBannerConfigSchema = zod_1.z.object({
    type: zod_1.z.enum(['info', 'warning', 'success', 'urgent']).default('info'),
    dismissible: zod_1.z.boolean().default(true),
    sticky: zod_1.z.boolean().default(false),
});
// 18. MEMBER CALL TO ACTION
exports.memberCallToActionContentItemSchema = zod_1.z.object({
    title: zod_1.z.string().default(''),
    subtitle: zod_1.z.string().default(''),
    buttonText: zod_1.z.string().default(''),
    buttonLink: zod_1.z.string().default('/register'),
    badgeText: zod_1.z.string().optional(),
});
exports.memberCallToActionContentSchema = (0, exports.localized)(exports.memberCallToActionContentItemSchema);
exports.memberCallToActionConfigSchema = zod_1.z.object({
    backgroundStyle: zod_1.z.enum(['gradient', 'solid', 'image']).default('gradient'),
    buttonVariant: zod_1.z.enum(['accent', 'primary']).default('accent'),
});
// 19. SPACER DIVIDER
exports.spacerDividerContentItemSchema = zod_1.z.object({});
exports.spacerDividerContentSchema = (0, exports.localized)(exports.spacerDividerContentItemSchema);
exports.spacerDividerConfigSchema = zod_1.z.object({
    height: zod_1.z.number().min(8).max(200).default(48),
    showDividerLine: zod_1.z.boolean().default(false),
    lineStyle: zod_1.z.enum(['solid', 'dashed', 'dotted']).default('solid'),
    lineColor: zod_1.z.string().optional(),
});
// 20. CUSTOM HTML (Super admin only, sanitized)
exports.customHtmlContentItemSchema = zod_1.z.object({
    html: zod_1.z.string().default(''),
});
exports.customHtmlContentSchema = (0, exports.localized)(exports.customHtmlContentItemSchema);
exports.customHtmlConfigSchema = zod_1.z.object({
    restrictedRole: zod_1.z.literal('super_admin').default('super_admin'),
});
