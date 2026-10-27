"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECTION_REGISTRY = exports.defaultSectionStyle = void 0;
exports.getSectionDefinition = getSectionDefinition;
exports.getAllSectionDefinitions = getAllSectionDefinitions;
exports.validateSection = validateSection;
const schemas = __importStar(require("./schemas"));
exports.defaultSectionStyle = {
    background: 'transparent',
    padding: 'md',
    width: 'default',
    align: 'left',
    rounded: false,
};
exports.SECTION_REGISTRY = {
    // 1. HERO
    hero: {
        type: 'hero',
        titleAm: 'ዋና ባነር (Hero)',
        titleEn: 'Hero Banner',
        descriptionAm: 'የገጹ ዋና መግቢያ ምስል፣ ርእስ እና ዋና ጥሪ ቁልፎች',
        descriptionEn: 'Main intro header with title, subtitle, CTA buttons and background image',
        icon: 'Sparkles',
        category: 'header',
        contentSchema: schemas.heroContentSchema,
        configSchema: schemas.heroConfigSchema,
        defaultContent: {
            am: {
                title: 'እንኳን ወደ አዕማደ ሰላም ሰንበት ት/ቤት በደህና መጡ',
                subtitle: 'የኦርቶዶክስ ተዋሕዶ እምነት፣ ሥርዓትና ትውፊት ማዕከል',
                tagline: 'ፍቅር፣ ሰላም እና እውነት',
                primaryCtaText: 'ይመዝገቡ',
                primaryCtaLink: '/register',
                secondaryCtaText: 'ስለ እኛ',
                secondaryCtaLink: '/about',
                bgImageUrl: '/images/hero-bg.jpg',
            },
            en: {
                title: 'Welcome to Aemade Selam Sunday School',
                subtitle: 'Center for Orthodox Tewahedo Faith, Order, and Tradition',
                tagline: 'Love, Peace, and Truth',
                primaryCtaText: 'Register Now',
                primaryCtaLink: '/register',
                secondaryCtaText: 'Learn More',
                secondaryCtaLink: '/about',
                bgImageUrl: '/images/hero-bg.jpg',
            },
        },
        defaultConfig: {
            height: 'large',
            overlayOpacity: 60,
            textAlignment: 'center',
            showLogo: true,
            showBadges: true,
        },
        defaultStyle: {
            ...exports.defaultSectionStyle,
            padding: 'xl',
            width: 'full',
            align: 'center',
        },
    },
    // 2. RICHTEXT
    richText: {
        type: 'richText',
        titleAm: 'የተብራራ ጽሑፍ (Rich Text)',
        titleEn: 'Rich Text',
        descriptionAm: 'ረጅም አንቀጾች፣ ርእሶች እና የተቀረጹ ጽሑፎች',
        descriptionEn: 'Long-form formatted text, headings, and paragraphs',
        icon: 'FileText',
        category: 'content',
        contentSchema: schemas.richTextContentSchema,
        configSchema: schemas.richTextConfigSchema,
        defaultContent: {
            am: {
                title: 'ርዕስ',
                subtitle: 'ንዑስ ርዕስ',
                html: '<p>ዝርዝር መረጃ እዚህ ይጻፉ...</p>',
            },
            en: {
                title: 'Section Heading',
                subtitle: 'Section Subtitle',
                html: '<p>Write formatted content here...</p>',
            },
        },
        defaultConfig: {
            proseWidth: 'normal',
            dropCap: false,
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 3. IMAGE WITH TEXT
    imageWithText: {
        type: 'imageWithText',
        titleAm: 'ምስል ከጽሑፍ ጋር',
        titleEn: 'Image with Text',
        descriptionAm: 'ጎን ለጎን የሚቀመጥ ምስል እና ገላጭ ጽሑፍ',
        descriptionEn: 'Side-by-side featured image and descriptive story with CTA',
        icon: 'Image',
        category: 'content',
        contentSchema: schemas.imageWithTextContentSchema,
        configSchema: schemas.imageWithTextConfigSchema,
        defaultContent: {
            am: {
                title: 'ታሪካችንና ራዕያችን',
                subtitle: 'ከ1980 ዓ.ም ጀምሮ',
                bodyHtml: '<p>ሰንበት ትምህርት ቤታችን በርካታ ትውልዶችን በእምነትና በሥነ-ምግባር አንጾ አሳድጓል።</p>',
                imageUrl: '/images/history.jpg',
                imageAlt: 'ሰንበት ትምህርት ቤት',
                badgeText: 'ታሪክ',
                buttonText: 'ተጨማሪ ያንብቡ',
                buttonLink: '/about',
            },
            en: {
                title: 'Our History & Vision',
                subtitle: 'Since 1988',
                bodyHtml: '<p>Our Sunday school has nurtured generations in faith, wisdom, and moral virtue.</p>',
                imageUrl: '/images/history.jpg',
                imageAlt: 'Sunday School history',
                badgeText: 'History',
                buttonText: 'Read More',
                buttonLink: '/about',
            },
        },
        defaultConfig: {
            imagePosition: 'left',
            imageRatio: '4:3',
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 4. FEATURE CARDS
    featureCards: {
        type: 'featureCards',
        titleAm: 'የአገልግሎት ካርዶች',
        titleEn: 'Feature Cards',
        descriptionAm: 'የአገልግሎት ዘርፎች ወይም ክፍሎች በካርድ መልክ',
        descriptionEn: 'Grid of service departments or feature highlight cards',
        icon: 'Grid',
        category: 'content',
        contentSchema: schemas.featureCardsContentSchema,
        configSchema: schemas.featureCardsConfigSchema,
        defaultContent: {
            am: {
                title: 'የአገልግሎት ክፍሎቻችን',
                subtitle: 'በሰንበት ትምህርት ቤታችን የሚሰጡ ልዩ ልዩ መንፈሳዊ አገልግሎቶች',
                cards: [
                    { id: '1', title: 'ትምህርት ክፍል', description: 'የነገረ መለኮት፣ የመጽሐፍ ቅዱስ እና የሥርዓተ ቤተክርስቲያን ትምህርቶች', icon: 'BookOpen', link: '/courses' },
                    { id: '2', title: 'ዝማሬ ክፍል', description: 'የቅዱስ ያሬድ ዜማዎች፣ ወረብና መዝሙራት ስልጠና', icon: 'Music', link: '/mezmur' },
                    { id: '3', title: 'ኪነ-ጥበብ ክፍል', description: 'መንፈሳዊ ድራማ፣ ግጥምና ሥነ-ጽሑፍ ዝግጅት', icon: 'Film', link: '/about' },
                ],
            },
            en: {
                title: 'Our Ministry Departments',
                subtitle: 'Diverse spiritual services offered by our Sunday school',
                cards: [
                    { id: '1', title: 'Education Dept', description: 'Theology, Bible study, and Church canon courses', icon: 'BookOpen', link: '/courses' },
                    { id: '2', title: 'Hymnody Dept', description: 'St. Yared chants, Wereb, and choral training', icon: 'Music', link: '/mezmur' },
                    { id: '3', title: 'Arts & Literature', description: 'Spiritual drama, poetry, and literature', icon: 'Film', link: '/about' },
                ],
            },
        },
        defaultConfig: {
            columns: 3,
            cardStyle: 'bordered',
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 5. GALLERY
    gallery: {
        type: 'gallery',
        titleAm: 'የፎቶ ማዕከለ-ስዕላት',
        titleEn: 'Photo Gallery',
        descriptionAm: 'የፎቶዎች ፍርግርግ ወይም ተንቀሳቃሽ ምስሎች',
        descriptionEn: 'Grid or masonry showcase of photos with lightbox',
        icon: 'Camera',
        category: 'media',
        contentSchema: schemas.galleryContentSchema,
        configSchema: schemas.galleryConfigSchema,
        defaultContent: {
            am: {
                title: 'የሥዕል ማዕከል',
                subtitle: 'የበዓላትና የአገልግሎት ትውስታዎች',
                images: [
                    { url: '/images/gallery-1.jpg', alt: 'የበዓለ ጥምቀት አከባበር', caption: 'የጥምቀት በዓል' },
                    { url: '/images/gallery-2.jpg', alt: 'የዝማሬ አገልግሎት', caption: 'የዝማሬ አገልግሎት' },
                    { url: '/images/gallery-3.jpg', alt: 'የወጣቶች መርሐ-ግብር', caption: 'የወጣቶች ጉባኤ' },
                ],
            },
            en: {
                title: 'Photo Gallery',
                subtitle: 'Memories of feast days and fellowship',
                images: [
                    { url: '/images/gallery-1.jpg', alt: 'Timket Celebration', caption: 'Epiphany Celebration' },
                    { url: '/images/gallery-2.jpg', alt: 'Choir Ministry', caption: 'Choir presentation' },
                    { url: '/images/gallery-3.jpg', alt: 'Youth Conference', caption: 'Youth Gathering' },
                ],
            },
        },
        defaultConfig: {
            layout: 'grid',
            columns: 3,
            enableLightbox: true,
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 6. STATS COUNTER
    statsCounter: {
        type: 'statsCounter',
        titleAm: 'የስታቲስቲክስ ቆጣሪ',
        titleEn: 'Stats Counter',
        descriptionAm: 'ቁጥሮች፣ አባላት እና ስኬቶችን የሚያሳይ ቁጥር ቆጣሪ',
        descriptionEn: 'Impact numbers, members, and achievements counter',
        icon: 'TrendingUp',
        category: 'content',
        contentSchema: schemas.statsCounterContentSchema,
        configSchema: schemas.statsCounterConfigSchema,
        defaultContent: {
            am: {
                title: 'በቁጥር ሲገለጽ',
                subtitle: 'የሰንበት ትምህርት ቤታችን ተደራሽነት',
                stats: [
                    { number: '1500+', label: 'ንቁ አባላት', icon: 'Users' },
                    { number: '12', label: 'የአገልግሎት ክፍሎች', icon: 'Layers' },
                    { number: '40+', label: 'ዓመታት በአገልግሎት', icon: 'Clock' },
                    { number: '350+', label: 'የተመዘገቡ መዛሙር', icon: 'Music' },
                ],
            },
            en: {
                title: 'Impact in Numbers',
                subtitle: 'Sunday school reach and milestones',
                stats: [
                    { number: '1500+', label: 'Active Members', icon: 'Users' },
                    { number: '12', label: 'Ministry Departments', icon: 'Layers' },
                    { number: '40+', label: 'Years of Service', icon: 'Clock' },
                    { number: '350+', label: 'Hymns Recorded', icon: 'Music' },
                ],
            },
        },
        defaultConfig: {
            columns: 4,
            animated: true,
        },
        defaultStyle: {
            ...exports.defaultSectionStyle,
            background: 'muted',
        },
    },
    // 7. POSTS FEED
    postsFeed: {
        type: 'postsFeed',
        titleAm: 'የዜና እና የስንክሳር ምግብ',
        titleEn: 'Posts Feed (Sinksar, News, Urgent)',
        descriptionAm: 'የዛሬው ስንክሳር፣ የቅርብ ጊዜ ዜናዎች እና አስቸኳይ ማስታወቂያዎች',
        descriptionEn: "Live feed of today's Sinksar, recent articles, news and announcements",
        icon: 'Radio',
        category: 'feeds',
        contentSchema: schemas.postsFeedContentSchema,
        configSchema: schemas.postsFeedConfigSchema,
        defaultContent: {
            am: {
                title: 'የዛሬው ስንክሳርና ዜናዎች',
                subtitle: 'ዕለታዊ መንፈሳዊ ንባብ እና ወቅታዊ ማስታወቂያዎች',
                viewAllText: 'ሁሉንም ይመልከቱ',
                viewAllLink: '/news',
            },
            en: {
                title: "Today's Synaxarium & News",
                subtitle: 'Daily spiritual readings and timely parish updates',
                viewAllText: 'View All',
                viewAllLink: '/news',
            },
        },
        defaultConfig: {
            postType: 'all',
            limit: 6,
            layout: 'cards',
            showDates: true,
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 8. MEZMUR LIST
    mezmurList: {
        type: 'mezmurList',
        titleAm: 'የመዝሙራት ዝርዝር',
        titleEn: 'Mezmur List',
        descriptionAm: 'የተመረጡ ኦርቶዶክሳዊ መዝሙራት ማጫወቻና ዝርዝር',
        descriptionEn: 'Curated Ethiopian Orthodox hymns with audio playback',
        icon: 'Headphones',
        category: 'feeds',
        contentSchema: schemas.mezmurListContentSchema,
        configSchema: schemas.mezmurListConfigSchema,
        defaultContent: {
            am: {
                title: 'የተመረጡ መዝሙራት',
                subtitle: 'በሰንበት ትምህርት ቤታችን ዝማሬ ክፍል የተዘጋጁ',
                viewAllText: 'ሁሉንም መዝሙራት ያዳምጡ',
            },
            en: {
                title: 'Featured Mezmur Hymns',
                subtitle: 'Recorded and preserved by our choir ministry',
                viewAllText: 'Listen to All Hymns',
            },
        },
        defaultConfig: {
            limit: 6,
            category: 'all',
            layout: 'cards',
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 9. COURSES LIST
    coursesList: {
        type: 'coursesList',
        titleAm: 'የትምህርት ኮርሶች',
        titleEn: 'Courses List',
        descriptionAm: 'ክፍት የነገረ-መለኮትና መንፈሳዊ ኮርሶች ማሳያ',
        descriptionEn: 'Spiritual education and theology courses list',
        icon: 'Book',
        category: 'feeds',
        contentSchema: schemas.coursesListContentSchema,
        configSchema: schemas.coursesListConfigSchema,
        defaultContent: {
            am: {
                title: 'መንፈሳዊ ኮርሶች',
                subtitle: 'የመጽሐፍ ቅዱስ፣ ሥርዓተ ቤተክርስቲያን እና የግዕዝ ቋንቋ ትምህርቶች',
                viewAllText: 'ሁሉንም ኮርሶች ይመልከቱ',
            },
            en: {
                title: 'Spiritual Courses',
                subtitle: 'Bible study, Church order, and Ge\'ez language classes',
                viewAllText: 'Browse All Courses',
            },
        },
        defaultConfig: {
            limit: 6,
            status: 'open',
            columns: 3,
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 10. EVENTS LIST
    eventsList: {
        type: 'eventsList',
        titleAm: 'የክንውኖች ዝርዝር',
        titleEn: 'Events List',
        descriptionAm: 'መጪ በዓላት፣ ጉባኤያትና መርሐ-ግብራት',
        descriptionEn: 'Upcoming feasts, conferences, and parish gatherings',
        icon: 'CalendarDays',
        category: 'feeds',
        contentSchema: schemas.eventsListContentSchema,
        configSchema: schemas.eventsListConfigSchema,
        defaultContent: {
            am: {
                title: 'መጪ መርሐ-ግብራት',
                subtitle: 'በሰንበት ትምህርት ቤታችን የሚከናወኑ ልዩ ዝግጅቶች',
                viewAllText: 'የመርሐ-ግብር ቀን መቁጠሪያ',
            },
            en: {
                title: 'Upcoming Events',
                subtitle: 'Special gatherings and liturgical celebrations',
                viewAllText: 'Full Events Calendar',
            },
        },
        defaultConfig: {
            limit: 4,
            showRsvpButton: true,
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 11. ETHIOPIAN CALENDAR
    ethiopianCalendar: {
        type: 'ethiopianCalendar',
        titleAm: 'የኢትዮጵያ ዘመን አቆጣጠር',
        titleEn: 'Ethiopian Calendar',
        descriptionAm: 'የኢትዮጵያ ባሕረ ሐሳብና አጽዋማት/በዓላት መቁጠሪያ',
        descriptionEn: 'Interactive Ethiopian calendar with fasts and holy days',
        icon: 'Calendar',
        category: 'interactive',
        contentSchema: schemas.ethiopianCalendarContentSchema,
        configSchema: schemas.ethiopianCalendarConfigSchema,
        defaultContent: {
            am: {
                title: 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ አቆጣጠር',
                subtitle: 'ዕለታዊ ቅዱሳን፣ አጽዋማት እና በዓላት',
            },
            en: {
                title: 'Ethiopian Orthodox Calendar',
                subtitle: 'Daily saints commemorations, fasts, and feast days',
            },
        },
        defaultConfig: {
            showUpcomingEvents: true,
            initialView: 'month',
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 12. FAQ ACCORDION
    faqAccordion: {
        type: 'faqAccordion',
        titleAm: 'ተደጋግመው የሚጠየቁ ጥያቄዎች (FAQ)',
        titleEn: 'FAQ Accordion',
        descriptionAm: 'ለተለመዱ ጥያቄዎች የሚሰጡ አጫጭር መልሶች',
        descriptionEn: 'Accordion answering frequently asked questions',
        icon: 'HelpCircle',
        category: 'interactive',
        contentSchema: schemas.faqAccordionContentSchema,
        configSchema: schemas.faqAccordionConfigSchema,
        defaultContent: {
            am: {
                title: 'ተደጋግመው የሚጠየቁ ጥያቄዎች',
                subtitle: 'ስለ አባልነትና አገልግሎቶች ማብራሪያ',
                items: [
                    { question: 'የሰንበት ት/ቤት አባል እንዴት መሆን እችላለሁ?', answerHtml: '<p>በድረ-ገጻችን የመመዝገቢያ ቅጽ በመሙላት ወይም በግንባር በመምጣት መመዝገብ ይችላሉ።</p>' },
                    { question: 'የትምህርት መርሐ-ግብሩ በየትኞቹ ቀናት ይሰጣል?', answerHtml: '<p>ቅዳሜ ከሰዓት እና እሑድ ጠዋት ከቅዳሴ በኋላ ይሰጣል።</p>' },
                ],
            },
            en: {
                title: 'Frequently Asked Questions',
                subtitle: 'Common questions about membership and participation',
                items: [
                    { question: 'How can I become a Sunday School member?', answerHtml: '<p>You can register online through our registration form or visit our office in person.</p>' },
                    { question: 'When are classes held?', answerHtml: '<p>Classes take place on Saturday afternoons and Sunday mornings following Divine Liturgy.</p>' },
                ],
            },
        },
        defaultConfig: {
            allowMultipleOpen: false,
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 13. CONTACT AND MAP
    contactAndMap: {
        type: 'contactAndMap',
        titleAm: 'አድራሻ እና ካርታ',
        titleEn: 'Contact and Map',
        descriptionAm: 'የቤተክርስቲያኑ አድራሻ፣ ስልክ፣ ኢሜይል እና ካርታ',
        descriptionEn: 'Parish address, phone, email, contact form, and Google Map',
        icon: 'MapPin',
        category: 'interactive',
        contentSchema: schemas.contactAndMapContentSchema,
        configSchema: schemas.contactAndMapConfigSchema,
        defaultContent: {
            am: {
                title: 'ያግኙን',
                subtitle: 'በማንኛውም ጊዜ መልእክትዎን ይላኩልን',
                churchName: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰ/ት/ቤት',
                address: 'አዲስ አበባ፣ ኢትዮጵያ',
                phone: '+251 11 000 0000',
                email: 'info@felegeselam.org',
                mapUrl: 'https://maps.google.com',
                scheduleTitle: 'የአገልግሎት ሰዓታት',
                scheduleText: 'ከሰኞ እስከ እሁድ፡ ከጠዋቱ 2:00 - ከሰዓት 11:00',
            },
            en: {
                title: 'Contact Us',
                subtitle: 'Reach out to our leadership or ministry teams',
                churchName: 'Felege Selam St. George Cathedral Aemade Selam Sunday School',
                address: 'Addis Ababa, Ethiopia',
                phone: '+251 11 000 0000',
                email: 'info@felegeselam.org',
                mapUrl: 'https://maps.google.com',
                scheduleTitle: 'Office Hours',
                scheduleText: 'Monday to Sunday: 8:00 AM - 5:00 PM',
            },
        },
        defaultConfig: {
            showForm: true,
            showMap: true,
            mapHeight: 400,
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 14. FORM EMBED
    formEmbed: {
        type: 'formEmbed',
        titleAm: 'የቅጽ ማካተቻ (Form Embed)',
        titleEn: 'Form Embed',
        descriptionAm: 'የአባልነት፣ የአስተያየት ወይም የክፍያ ቅጽ በገጹ ላይ ማስገባት',
        descriptionEn: 'Embed a dynamic configurable form on the page',
        icon: 'FormInput',
        category: 'interactive',
        contentSchema: schemas.formEmbedContentSchema,
        configSchema: schemas.formEmbedConfigSchema,
        defaultContent: {
            am: {
                title: 'ቅጽ ይሙሉ',
                subtitle: 'እባክዎ መረጃዎን በትክክል ያስገቡ',
                successMessage: 'መልእክትዎ በተሳካ ሁኔታ ደርሶናል!',
            },
            en: {
                title: 'Submit Information',
                subtitle: 'Please complete the requested fields accurately',
                successMessage: 'Thank you! Your submission has been received.',
            },
        },
        defaultConfig: {
            formKey: 'contact',
            layout: 'card',
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 15. VIDEO EMBED
    videoEmbed: {
        type: 'videoEmbed',
        titleAm: 'የቪዲዮ ማጫወቻ',
        titleEn: 'Video Embed',
        descriptionAm: 'ዩቲዩብ ወይም ቀጥታ ቪዲዮ በገጽ ላይ ማጫወት',
        descriptionEn: 'Embed YouTube or hosted video with responsive player',
        icon: 'Video',
        category: 'media',
        contentSchema: schemas.videoEmbedContentSchema,
        configSchema: schemas.videoEmbedConfigSchema,
        defaultContent: {
            am: {
                title: 'ተለይቶ የቀረበ ቪዲዮ',
                subtitle: 'የስብከተ ወንጌል እና የዝማሬ ቪዲዮ',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                caption: 'የሰንበት ትምህርት ቤት ጉባኤ',
            },
            en: {
                title: 'Featured Video',
                subtitle: 'Sermon and choir presentation',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                caption: 'Sunday School Assembly',
            },
        },
        defaultConfig: {
            aspectRatio: '16:9',
            autoplay: false,
            controls: true,
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 16. LINK BUTTONS
    linkButtons: {
        type: 'linkButtons',
        titleAm: 'የአቋራጭ አዝራሮች',
        titleEn: 'Link Buttons',
        descriptionAm: 'ፈጣን የአቋራጭ ቁልፎች ዝርዝር',
        descriptionEn: 'Quick link buttons group for portals, channels, or resources',
        icon: 'ExternalLink',
        category: 'interactive',
        contentSchema: schemas.linkButtonsContentSchema,
        configSchema: schemas.linkButtonsConfigSchema,
        defaultContent: {
            am: {
                title: 'ጠቃሚ አቋራጮች',
                buttons: [
                    { text: 'የቴሌግራም ቻናል', link: 'https://t.me/felegeselam', variant: 'primary', target: '_blank' },
                    { text: 'የዩቲዩብ ቻናል', link: 'https://youtube.com/@felegeselam', variant: 'accent', target: '_blank' },
                    { text: 'የፌስቡክ ገጽ', link: 'https://facebook.com/felegeselam', variant: 'outline', target: '_blank' },
                ],
            },
            en: {
                title: 'Quick Links',
                buttons: [
                    { text: 'Telegram Channel', link: 'https://t.me/felegeselam', variant: 'primary', target: '_blank' },
                    { text: 'YouTube Channel', link: 'https://youtube.com/@felegeselam', variant: 'accent', target: '_blank' },
                    { text: 'Facebook Page', link: 'https://facebook.com/felegeselam', variant: 'outline', target: '_blank' },
                ],
            },
        },
        defaultConfig: {
            alignment: 'center',
            size: 'md',
        },
        defaultStyle: exports.defaultSectionStyle,
    },
    // 17. ANNOUNCEMENT BANNER
    announcementBanner: {
        type: 'announcementBanner',
        titleAm: 'የማስታወቂያ ባነር',
        titleEn: 'Announcement Banner',
        descriptionAm: 'አስቸኳይ ወይም ትኩረት የሚስብ አጭር ማስታወቂያ',
        descriptionEn: 'Eye-catching announcement alert strip with link',
        icon: 'AlertTriangle',
        category: 'header',
        contentSchema: schemas.announcementBannerContentSchema,
        configSchema: schemas.announcementBannerConfigSchema,
        defaultContent: {
            am: {
                message: 'ለ2017 ዓ.ም አዲስ የትምህርት ዘመን ምዝገባ ተጀምሯል!',
                linkText: 'አሁን ይመዝገቡ',
                linkUrl: '/register',
            },
            en: {
                message: 'Registration for the new academic year is now open!',
                linkText: 'Register Now',
                linkUrl: '/register',
            },
        },
        defaultConfig: {
            type: 'info',
            dismissible: true,
            sticky: false,
        },
        defaultStyle: {
            ...exports.defaultSectionStyle,
            padding: 'sm',
            width: 'full',
        },
    },
    // 18. MEMBER CALL TO ACTION
    memberCallToAction: {
        type: 'memberCallToAction',
        titleAm: 'የአባልነት ጥሪ',
        titleEn: 'Member Call To Action',
        descriptionAm: 'አባላትን ለመቀላቀል የሚጋብዝ ደማቅ ጥሪ',
        descriptionEn: 'Prominent invitation banner encouraging visitor registration',
        icon: 'UserPlus',
        category: 'content',
        contentSchema: schemas.memberCallToActionContentSchema,
        configSchema: schemas.memberCallToActionConfigSchema,
        defaultContent: {
            am: {
                title: 'የአዕማደ ሰላም ቤተሰብ ይሁኑ',
                subtitle: 'በመንፈሳዊ እውቀት ያድጉ፤ በአገልግሎት ይሳተፉ፤ ከወንድም እህቶች ጋር በኅብረት ይኑሩ',
                buttonText: 'የአባልነት ቅጽ ይሙሉ',
                buttonLink: '/register',
                badgeText: 'እንኳን ደህና መጡ',
            },
            en: {
                title: 'Become Part of Our Sunday School Family',
                subtitle: 'Grow in spiritual knowledge, serve with zeal, and fellowship with brothers and sisters',
                buttonText: 'Complete Registration Form',
                buttonLink: '/register',
                badgeText: 'Join Us Today',
            },
        },
        defaultConfig: {
            backgroundStyle: 'gradient',
            buttonVariant: 'accent',
        },
        defaultStyle: {
            ...exports.defaultSectionStyle,
            background: 'primary',
            padding: 'lg',
            align: 'center',
        },
    },
    // 19. SPACER DIVIDER
    spacerDivider: {
        type: 'spacerDivider',
        titleAm: 'ክፍተት እና መስመር',
        titleEn: 'Spacer and Divider',
        descriptionAm: 'በክፍሎች መካከል የሚቀመጥ ባዶ ቦታ ወይም መለያያ መስመር',
        descriptionEn: 'Configurable vertical whitespace gap or decorative dividing line',
        icon: 'Minus',
        category: 'layout',
        contentSchema: schemas.spacerDividerContentSchema,
        configSchema: schemas.spacerDividerConfigSchema,
        defaultContent: {
            am: {},
            en: {},
        },
        defaultConfig: {
            height: 48,
            showDividerLine: false,
            lineStyle: 'solid',
        },
        defaultStyle: {
            ...exports.defaultSectionStyle,
            padding: 'none',
        },
    },
    // 20. CUSTOM HTML
    customHtml: {
        type: 'customHtml',
        titleAm: 'ልዩ ኤችቲኤምኤል (Custom HTML)',
        titleEn: 'Custom HTML (Sanitized)',
        descriptionAm: 'ለዋና አስተዳዳሪዎች ብቻ የሚፈቀድ ልዩ ኮድ ማስገቢያ',
        descriptionEn: 'Direct HTML markup embedding (Restricted to super admin)',
        icon: 'Code',
        category: 'content',
        contentSchema: schemas.customHtmlContentSchema,
        configSchema: schemas.customHtmlConfigSchema,
        defaultContent: {
            am: {
                html: '<div class="p-4 bg-muted/40 rounded-lg text-center">ልዩ ኮድ እዚህ ያስገቡ</div>',
            },
            en: {
                html: '<div class="p-4 bg-muted/40 rounded-lg text-center">Insert custom HTML here</div>',
            },
        },
        defaultConfig: {
            restrictedRole: 'super_admin',
        },
        defaultStyle: exports.defaultSectionStyle,
        superAdminOnly: true,
    },
};
function getSectionDefinition(type) {
    return exports.SECTION_REGISTRY[type];
}
function getAllSectionDefinitions() {
    return Object.values(exports.SECTION_REGISTRY);
}
function validateSection(section) {
    const definition = getSectionDefinition(section.type);
    if (!definition) {
        return { success: false, errors: [`Unknown section type: "${section.type}"`] };
    }
    const errors = [];
    const contentParsed = definition.contentSchema.safeParse(section.content);
    if (!contentParsed.success) {
        for (const issue of contentParsed.error.issues) {
            errors.push(`Content error at ${issue.path.join('.')}: ${issue.message}`);
        }
    }
    const configParsed = definition.configSchema.safeParse(section.config);
    if (!configParsed.success) {
        for (const issue of configParsed.error.issues) {
            errors.push(`Config error at ${issue.path.join('.')}: ${issue.message}`);
        }
    }
    if (section.style) {
        const styleParsed = schemas.styleSchema.safeParse(section.style);
        if (!styleParsed.success) {
            for (const issue of styleParsed.error.issues) {
                errors.push(`Style error at ${issue.path.join('.')}: ${issue.message}`);
            }
        }
    }
    return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
    };
}
