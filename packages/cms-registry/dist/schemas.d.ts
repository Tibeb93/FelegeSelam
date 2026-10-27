import { z } from 'zod';
export declare const styleSchema: z.ZodObject<{
    background: z.ZodDefault<z.ZodEnum<["transparent", "primary", "secondary", "muted", "card", "custom"]>>;
    customBackground: z.ZodOptional<z.ZodString>;
    overlay: z.ZodOptional<z.ZodString>;
    padding: z.ZodDefault<z.ZodEnum<["none", "sm", "md", "lg", "xl"]>>;
    width: z.ZodDefault<z.ZodEnum<["narrow", "default", "wide", "full"]>>;
    align: z.ZodDefault<z.ZodEnum<["left", "center", "right"]>>;
    rounded: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    background: "transparent" | "primary" | "secondary" | "muted" | "card" | "custom";
    padding: "none" | "sm" | "md" | "lg" | "xl";
    width: "narrow" | "default" | "wide" | "full";
    align: "left" | "center" | "right";
    rounded: boolean;
    customBackground?: string | undefined;
    overlay?: string | undefined;
}, {
    background?: "transparent" | "primary" | "secondary" | "muted" | "card" | "custom" | undefined;
    customBackground?: string | undefined;
    overlay?: string | undefined;
    padding?: "none" | "sm" | "md" | "lg" | "xl" | undefined;
    width?: "narrow" | "default" | "wide" | "full" | undefined;
    align?: "left" | "center" | "right" | undefined;
    rounded?: boolean | undefined;
}>;
export declare const localized: <T extends z.ZodTypeAny>(schema: T) => z.ZodObject<{
    am: T;
    en: T;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    am: T;
    en: T;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    am: T;
    en: T;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const heroContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodDefault<z.ZodString>;
    tagline: z.ZodOptional<z.ZodString>;
    primaryCtaText: z.ZodOptional<z.ZodString>;
    primaryCtaLink: z.ZodOptional<z.ZodString>;
    secondaryCtaText: z.ZodOptional<z.ZodString>;
    secondaryCtaLink: z.ZodOptional<z.ZodString>;
    bgImageUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subtitle: string;
    tagline?: string | undefined;
    primaryCtaText?: string | undefined;
    primaryCtaLink?: string | undefined;
    secondaryCtaText?: string | undefined;
    secondaryCtaLink?: string | undefined;
    bgImageUrl?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    tagline?: string | undefined;
    primaryCtaText?: string | undefined;
    primaryCtaLink?: string | undefined;
    secondaryCtaText?: string | undefined;
    secondaryCtaLink?: string | undefined;
    bgImageUrl?: string | undefined;
}>;
export declare const heroContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodDefault<z.ZodString>;
        tagline: z.ZodOptional<z.ZodString>;
        primaryCtaText: z.ZodOptional<z.ZodString>;
        primaryCtaLink: z.ZodOptional<z.ZodString>;
        secondaryCtaText: z.ZodOptional<z.ZodString>;
        secondaryCtaLink: z.ZodOptional<z.ZodString>;
        bgImageUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle: string;
        tagline?: string | undefined;
        primaryCtaText?: string | undefined;
        primaryCtaLink?: string | undefined;
        secondaryCtaText?: string | undefined;
        secondaryCtaLink?: string | undefined;
        bgImageUrl?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        tagline?: string | undefined;
        primaryCtaText?: string | undefined;
        primaryCtaLink?: string | undefined;
        secondaryCtaText?: string | undefined;
        secondaryCtaLink?: string | undefined;
        bgImageUrl?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodDefault<z.ZodString>;
        tagline: z.ZodOptional<z.ZodString>;
        primaryCtaText: z.ZodOptional<z.ZodString>;
        primaryCtaLink: z.ZodOptional<z.ZodString>;
        secondaryCtaText: z.ZodOptional<z.ZodString>;
        secondaryCtaLink: z.ZodOptional<z.ZodString>;
        bgImageUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle: string;
        tagline?: string | undefined;
        primaryCtaText?: string | undefined;
        primaryCtaLink?: string | undefined;
        secondaryCtaText?: string | undefined;
        secondaryCtaLink?: string | undefined;
        bgImageUrl?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        tagline?: string | undefined;
        primaryCtaText?: string | undefined;
        primaryCtaLink?: string | undefined;
        secondaryCtaText?: string | undefined;
        secondaryCtaLink?: string | undefined;
        bgImageUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        subtitle: string;
        tagline?: string | undefined;
        primaryCtaText?: string | undefined;
        primaryCtaLink?: string | undefined;
        secondaryCtaText?: string | undefined;
        secondaryCtaLink?: string | undefined;
        bgImageUrl?: string | undefined;
    };
    en: {
        title: string;
        subtitle: string;
        tagline?: string | undefined;
        primaryCtaText?: string | undefined;
        primaryCtaLink?: string | undefined;
        secondaryCtaText?: string | undefined;
        secondaryCtaLink?: string | undefined;
        bgImageUrl?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        tagline?: string | undefined;
        primaryCtaText?: string | undefined;
        primaryCtaLink?: string | undefined;
        secondaryCtaText?: string | undefined;
        secondaryCtaLink?: string | undefined;
        bgImageUrl?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        tagline?: string | undefined;
        primaryCtaText?: string | undefined;
        primaryCtaLink?: string | undefined;
        secondaryCtaText?: string | undefined;
        secondaryCtaLink?: string | undefined;
        bgImageUrl?: string | undefined;
    };
}>;
export declare const heroConfigSchema: z.ZodObject<{
    height: z.ZodDefault<z.ZodEnum<["auto", "screen", "large", "medium"]>>;
    overlayOpacity: z.ZodDefault<z.ZodNumber>;
    textAlignment: z.ZodDefault<z.ZodEnum<["left", "center", "right"]>>;
    showLogo: z.ZodDefault<z.ZodBoolean>;
    showBadges: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    height: "auto" | "screen" | "large" | "medium";
    overlayOpacity: number;
    textAlignment: "left" | "center" | "right";
    showLogo: boolean;
    showBadges: boolean;
}, {
    height?: "auto" | "screen" | "large" | "medium" | undefined;
    overlayOpacity?: number | undefined;
    textAlignment?: "left" | "center" | "right" | undefined;
    showLogo?: boolean | undefined;
    showBadges?: boolean | undefined;
}>;
export declare const richTextContentItemSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    html: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    html: string;
    title?: string | undefined;
    subtitle?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    html?: string | undefined;
}>;
export declare const richTextContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        html: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        html: string;
        title?: string | undefined;
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        html?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        html: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        html: string;
        title?: string | undefined;
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        html?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        html: string;
        title?: string | undefined;
        subtitle?: string | undefined;
    };
    en: {
        html: string;
        title?: string | undefined;
        subtitle?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        html?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        html?: string | undefined;
    };
}>;
export declare const richTextConfigSchema: z.ZodObject<{
    proseWidth: z.ZodDefault<z.ZodEnum<["narrow", "normal", "full"]>>;
    dropCap: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    proseWidth: "narrow" | "full" | "normal";
    dropCap: boolean;
}, {
    proseWidth?: "narrow" | "full" | "normal" | undefined;
    dropCap?: boolean | undefined;
}>;
export declare const imageWithTextContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    bodyHtml: z.ZodDefault<z.ZodString>;
    imageUrl: z.ZodDefault<z.ZodString>;
    imageAlt: z.ZodOptional<z.ZodString>;
    badgeText: z.ZodOptional<z.ZodString>;
    buttonText: z.ZodOptional<z.ZodString>;
    buttonLink: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    bodyHtml: string;
    imageUrl: string;
    subtitle?: string | undefined;
    imageAlt?: string | undefined;
    badgeText?: string | undefined;
    buttonText?: string | undefined;
    buttonLink?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    bodyHtml?: string | undefined;
    imageUrl?: string | undefined;
    imageAlt?: string | undefined;
    badgeText?: string | undefined;
    buttonText?: string | undefined;
    buttonLink?: string | undefined;
}>;
export declare const imageWithTextContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        bodyHtml: z.ZodDefault<z.ZodString>;
        imageUrl: z.ZodDefault<z.ZodString>;
        imageAlt: z.ZodOptional<z.ZodString>;
        badgeText: z.ZodOptional<z.ZodString>;
        buttonText: z.ZodOptional<z.ZodString>;
        buttonLink: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        bodyHtml: string;
        imageUrl: string;
        subtitle?: string | undefined;
        imageAlt?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        bodyHtml?: string | undefined;
        imageUrl?: string | undefined;
        imageAlt?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        bodyHtml: z.ZodDefault<z.ZodString>;
        imageUrl: z.ZodDefault<z.ZodString>;
        imageAlt: z.ZodOptional<z.ZodString>;
        badgeText: z.ZodOptional<z.ZodString>;
        buttonText: z.ZodOptional<z.ZodString>;
        buttonLink: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        bodyHtml: string;
        imageUrl: string;
        subtitle?: string | undefined;
        imageAlt?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        bodyHtml?: string | undefined;
        imageUrl?: string | undefined;
        imageAlt?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        bodyHtml: string;
        imageUrl: string;
        subtitle?: string | undefined;
        imageAlt?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    };
    en: {
        title: string;
        bodyHtml: string;
        imageUrl: string;
        subtitle?: string | undefined;
        imageAlt?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        bodyHtml?: string | undefined;
        imageUrl?: string | undefined;
        imageAlt?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        bodyHtml?: string | undefined;
        imageUrl?: string | undefined;
        imageAlt?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    };
}>;
export declare const imageWithTextConfigSchema: z.ZodObject<{
    imagePosition: z.ZodDefault<z.ZodEnum<["left", "right"]>>;
    imageRatio: z.ZodDefault<z.ZodEnum<["16:9", "4:3", "1:1", "portrait"]>>;
}, "strip", z.ZodTypeAny, {
    imagePosition: "left" | "right";
    imageRatio: "16:9" | "4:3" | "1:1" | "portrait";
}, {
    imagePosition?: "left" | "right" | undefined;
    imageRatio?: "16:9" | "4:3" | "1:1" | "portrait" | undefined;
}>;
export declare const featureCardItemSchema: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    title: z.ZodDefault<z.ZodString>;
    description: z.ZodDefault<z.ZodString>;
    icon: z.ZodDefault<z.ZodString>;
    link: z.ZodOptional<z.ZodString>;
    badge: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    id: string;
    description: string;
    icon: string;
    link?: string | undefined;
    badge?: string | undefined;
}, {
    title?: string | undefined;
    id?: string | undefined;
    description?: string | undefined;
    icon?: string | undefined;
    link?: string | undefined;
    badge?: string | undefined;
}>;
export declare const featureCardsContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodDefault<z.ZodString>;
        title: z.ZodDefault<z.ZodString>;
        description: z.ZodDefault<z.ZodString>;
        icon: z.ZodDefault<z.ZodString>;
        link: z.ZodOptional<z.ZodString>;
        badge: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        id: string;
        description: string;
        icon: string;
        link?: string | undefined;
        badge?: string | undefined;
    }, {
        title?: string | undefined;
        id?: string | undefined;
        description?: string | undefined;
        icon?: string | undefined;
        link?: string | undefined;
        badge?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    cards: {
        title: string;
        id: string;
        description: string;
        icon: string;
        link?: string | undefined;
        badge?: string | undefined;
    }[];
    subtitle?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    cards?: {
        title?: string | undefined;
        id?: string | undefined;
        description?: string | undefined;
        icon?: string | undefined;
        link?: string | undefined;
        badge?: string | undefined;
    }[] | undefined;
}>;
export declare const featureCardsContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodDefault<z.ZodString>;
            title: z.ZodDefault<z.ZodString>;
            description: z.ZodDefault<z.ZodString>;
            icon: z.ZodDefault<z.ZodString>;
            link: z.ZodOptional<z.ZodString>;
            badge: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            id: string;
            description: string;
            icon: string;
            link?: string | undefined;
            badge?: string | undefined;
        }, {
            title?: string | undefined;
            id?: string | undefined;
            description?: string | undefined;
            icon?: string | undefined;
            link?: string | undefined;
            badge?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        cards: {
            title: string;
            id: string;
            description: string;
            icon: string;
            link?: string | undefined;
            badge?: string | undefined;
        }[];
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        cards?: {
            title?: string | undefined;
            id?: string | undefined;
            description?: string | undefined;
            icon?: string | undefined;
            link?: string | undefined;
            badge?: string | undefined;
        }[] | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        cards: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodDefault<z.ZodString>;
            title: z.ZodDefault<z.ZodString>;
            description: z.ZodDefault<z.ZodString>;
            icon: z.ZodDefault<z.ZodString>;
            link: z.ZodOptional<z.ZodString>;
            badge: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            id: string;
            description: string;
            icon: string;
            link?: string | undefined;
            badge?: string | undefined;
        }, {
            title?: string | undefined;
            id?: string | undefined;
            description?: string | undefined;
            icon?: string | undefined;
            link?: string | undefined;
            badge?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        cards: {
            title: string;
            id: string;
            description: string;
            icon: string;
            link?: string | undefined;
            badge?: string | undefined;
        }[];
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        cards?: {
            title?: string | undefined;
            id?: string | undefined;
            description?: string | undefined;
            icon?: string | undefined;
            link?: string | undefined;
            badge?: string | undefined;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        cards: {
            title: string;
            id: string;
            description: string;
            icon: string;
            link?: string | undefined;
            badge?: string | undefined;
        }[];
        subtitle?: string | undefined;
    };
    en: {
        title: string;
        cards: {
            title: string;
            id: string;
            description: string;
            icon: string;
            link?: string | undefined;
            badge?: string | undefined;
        }[];
        subtitle?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        cards?: {
            title?: string | undefined;
            id?: string | undefined;
            description?: string | undefined;
            icon?: string | undefined;
            link?: string | undefined;
            badge?: string | undefined;
        }[] | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        cards?: {
            title?: string | undefined;
            id?: string | undefined;
            description?: string | undefined;
            icon?: string | undefined;
            link?: string | undefined;
            badge?: string | undefined;
        }[] | undefined;
    };
}>;
export declare const featureCardsConfigSchema: z.ZodObject<{
    columns: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>>;
    cardStyle: z.ZodDefault<z.ZodEnum<["bordered", "flat", "elevated"]>>;
}, "strip", z.ZodTypeAny, {
    columns: 4 | 3 | 2;
    cardStyle: "flat" | "bordered" | "elevated";
}, {
    columns?: 4 | 3 | 2 | undefined;
    cardStyle?: "flat" | "bordered" | "elevated" | undefined;
}>;
export declare const galleryImageSchema: z.ZodObject<{
    url: z.ZodString;
    alt: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    alt?: string | undefined;
    caption?: string | undefined;
}, {
    url: string;
    alt?: string | undefined;
    caption?: string | undefined;
}>;
export declare const galleryContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    images: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodOptional<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        alt?: string | undefined;
        caption?: string | undefined;
    }, {
        url: string;
        alt?: string | undefined;
        caption?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    images: {
        url: string;
        alt?: string | undefined;
        caption?: string | undefined;
    }[];
    subtitle?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    images?: {
        url: string;
        alt?: string | undefined;
        caption?: string | undefined;
    }[] | undefined;
}>;
export declare const galleryContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        images: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            alt: z.ZodOptional<z.ZodString>;
            caption: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }, {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        images: {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }[];
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        images?: {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }[] | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        images: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            alt: z.ZodOptional<z.ZodString>;
            caption: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }, {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        images: {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }[];
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        images?: {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        images: {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }[];
        subtitle?: string | undefined;
    };
    en: {
        title: string;
        images: {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }[];
        subtitle?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        images?: {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }[] | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        images?: {
            url: string;
            alt?: string | undefined;
            caption?: string | undefined;
        }[] | undefined;
    };
}>;
export declare const galleryConfigSchema: z.ZodObject<{
    layout: z.ZodDefault<z.ZodEnum<["grid", "masonry", "carousel"]>>;
    columns: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>>;
    enableLightbox: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    layout: "grid" | "masonry" | "carousel";
    columns: 4 | 3 | 2;
    enableLightbox: boolean;
}, {
    layout?: "grid" | "masonry" | "carousel" | undefined;
    columns?: 4 | 3 | 2 | undefined;
    enableLightbox?: boolean | undefined;
}>;
export declare const statItemSchema: z.ZodObject<{
    number: z.ZodDefault<z.ZodString>;
    label: z.ZodDefault<z.ZodString>;
    suffix: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    number: string;
    label: string;
    icon?: string | undefined;
    suffix?: string | undefined;
}, {
    number?: string | undefined;
    icon?: string | undefined;
    label?: string | undefined;
    suffix?: string | undefined;
}>;
export declare const statsCounterContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
        number: z.ZodDefault<z.ZodString>;
        label: z.ZodDefault<z.ZodString>;
        suffix: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        number: string;
        label: string;
        icon?: string | undefined;
        suffix?: string | undefined;
    }, {
        number?: string | undefined;
        icon?: string | undefined;
        label?: string | undefined;
        suffix?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    stats: {
        number: string;
        label: string;
        icon?: string | undefined;
        suffix?: string | undefined;
    }[];
    subtitle?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    stats?: {
        number?: string | undefined;
        icon?: string | undefined;
        label?: string | undefined;
        suffix?: string | undefined;
    }[] | undefined;
}>;
export declare const statsCounterContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
            number: z.ZodDefault<z.ZodString>;
            label: z.ZodDefault<z.ZodString>;
            suffix: z.ZodOptional<z.ZodString>;
            icon: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            number: string;
            label: string;
            icon?: string | undefined;
            suffix?: string | undefined;
        }, {
            number?: string | undefined;
            icon?: string | undefined;
            label?: string | undefined;
            suffix?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        stats: {
            number: string;
            label: string;
            icon?: string | undefined;
            suffix?: string | undefined;
        }[];
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        stats?: {
            number?: string | undefined;
            icon?: string | undefined;
            label?: string | undefined;
            suffix?: string | undefined;
        }[] | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        stats: z.ZodDefault<z.ZodArray<z.ZodObject<{
            number: z.ZodDefault<z.ZodString>;
            label: z.ZodDefault<z.ZodString>;
            suffix: z.ZodOptional<z.ZodString>;
            icon: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            number: string;
            label: string;
            icon?: string | undefined;
            suffix?: string | undefined;
        }, {
            number?: string | undefined;
            icon?: string | undefined;
            label?: string | undefined;
            suffix?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        stats: {
            number: string;
            label: string;
            icon?: string | undefined;
            suffix?: string | undefined;
        }[];
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        stats?: {
            number?: string | undefined;
            icon?: string | undefined;
            label?: string | undefined;
            suffix?: string | undefined;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        stats: {
            number: string;
            label: string;
            icon?: string | undefined;
            suffix?: string | undefined;
        }[];
        subtitle?: string | undefined;
    };
    en: {
        title: string;
        stats: {
            number: string;
            label: string;
            icon?: string | undefined;
            suffix?: string | undefined;
        }[];
        subtitle?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        stats?: {
            number?: string | undefined;
            icon?: string | undefined;
            label?: string | undefined;
            suffix?: string | undefined;
        }[] | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        stats?: {
            number?: string | undefined;
            icon?: string | undefined;
            label?: string | undefined;
            suffix?: string | undefined;
        }[] | undefined;
    };
}>;
export declare const statsCounterConfigSchema: z.ZodObject<{
    columns: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>>;
    animated: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    columns: 4 | 3 | 2;
    animated: boolean;
}, {
    columns?: 4 | 3 | 2 | undefined;
    animated?: boolean | undefined;
}>;
export declare const postsFeedContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    viewAllText: z.ZodOptional<z.ZodString>;
    viewAllLink: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subtitle?: string | undefined;
    viewAllText?: string | undefined;
    viewAllLink?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    viewAllText?: string | undefined;
    viewAllLink?: string | undefined;
}>;
export declare const postsFeedContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        viewAllText: z.ZodOptional<z.ZodString>;
        viewAllLink: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
        viewAllLink?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
        viewAllLink?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        viewAllText: z.ZodOptional<z.ZodString>;
        viewAllLink: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
        viewAllLink?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
        viewAllLink?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
        viewAllLink?: string | undefined;
    };
    en: {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
        viewAllLink?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
        viewAllLink?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
        viewAllLink?: string | undefined;
    };
}>;
export declare const postsFeedConfigSchema: z.ZodObject<{
    postType: z.ZodDefault<z.ZodEnum<["all", "sinksar", "news", "urgent", "event", "teaching"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    layout: z.ZodDefault<z.ZodEnum<["cards", "list", "banner"]>>;
    showDates: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    layout: "cards" | "list" | "banner";
    postType: "all" | "sinksar" | "news" | "urgent" | "event" | "teaching";
    limit: number;
    showDates: boolean;
}, {
    layout?: "cards" | "list" | "banner" | undefined;
    postType?: "all" | "sinksar" | "news" | "urgent" | "event" | "teaching" | undefined;
    limit?: number | undefined;
    showDates?: boolean | undefined;
}>;
export declare const mezmurListContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    viewAllText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subtitle?: string | undefined;
    viewAllText?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    viewAllText?: string | undefined;
}>;
export declare const mezmurListContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        viewAllText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        viewAllText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
    en: {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
}>;
export declare const mezmurListConfigSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    category: z.ZodDefault<z.ZodString>;
    layout: z.ZodDefault<z.ZodEnum<["compact", "cards", "player"]>>;
}, "strip", z.ZodTypeAny, {
    layout: "cards" | "compact" | "player";
    limit: number;
    category: string;
}, {
    layout?: "cards" | "compact" | "player" | undefined;
    limit?: number | undefined;
    category?: string | undefined;
}>;
export declare const coursesListContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    viewAllText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subtitle?: string | undefined;
    viewAllText?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    viewAllText?: string | undefined;
}>;
export declare const coursesListContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        viewAllText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        viewAllText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
    en: {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
}>;
export declare const coursesListConfigSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["open", "closed", "all"]>>;
    columns: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>]>>;
}, "strip", z.ZodTypeAny, {
    status: "all" | "open" | "closed";
    columns: 3 | 2;
    limit: number;
}, {
    status?: "all" | "open" | "closed" | undefined;
    columns?: 3 | 2 | undefined;
    limit?: number | undefined;
}>;
export declare const eventsListContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    viewAllText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subtitle?: string | undefined;
    viewAllText?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    viewAllText?: string | undefined;
}>;
export declare const eventsListContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        viewAllText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        viewAllText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
    en: {
        title: string;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        viewAllText?: string | undefined;
    };
}>;
export declare const eventsListConfigSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    showRsvpButton: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    showRsvpButton: boolean;
}, {
    limit?: number | undefined;
    showRsvpButton?: boolean | undefined;
}>;
export declare const ethiopianCalendarContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subtitle?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
}>;
export declare const ethiopianCalendarContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        subtitle?: string | undefined;
    };
    en: {
        title: string;
        subtitle?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
    };
}>;
export declare const ethiopianCalendarConfigSchema: z.ZodObject<{
    showUpcomingEvents: z.ZodDefault<z.ZodBoolean>;
    initialView: z.ZodDefault<z.ZodEnum<["month", "year"]>>;
}, "strip", z.ZodTypeAny, {
    showUpcomingEvents: boolean;
    initialView: "month" | "year";
}, {
    showUpcomingEvents?: boolean | undefined;
    initialView?: "month" | "year" | undefined;
}>;
export declare const faqItemSchema: z.ZodObject<{
    question: z.ZodDefault<z.ZodString>;
    answerHtml: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    question: string;
    answerHtml: string;
}, {
    question?: string | undefined;
    answerHtml?: string | undefined;
}>;
export declare const faqAccordionContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        question: z.ZodDefault<z.ZodString>;
        answerHtml: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        question: string;
        answerHtml: string;
    }, {
        question?: string | undefined;
        answerHtml?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    items: {
        question: string;
        answerHtml: string;
    }[];
    subtitle?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    items?: {
        question?: string | undefined;
        answerHtml?: string | undefined;
    }[] | undefined;
}>;
export declare const faqAccordionContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        items: z.ZodDefault<z.ZodArray<z.ZodObject<{
            question: z.ZodDefault<z.ZodString>;
            answerHtml: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            question: string;
            answerHtml: string;
        }, {
            question?: string | undefined;
            answerHtml?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        items: {
            question: string;
            answerHtml: string;
        }[];
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        items?: {
            question?: string | undefined;
            answerHtml?: string | undefined;
        }[] | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        items: z.ZodDefault<z.ZodArray<z.ZodObject<{
            question: z.ZodDefault<z.ZodString>;
            answerHtml: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            question: string;
            answerHtml: string;
        }, {
            question?: string | undefined;
            answerHtml?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        items: {
            question: string;
            answerHtml: string;
        }[];
        subtitle?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        items?: {
            question?: string | undefined;
            answerHtml?: string | undefined;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        items: {
            question: string;
            answerHtml: string;
        }[];
        subtitle?: string | undefined;
    };
    en: {
        title: string;
        items: {
            question: string;
            answerHtml: string;
        }[];
        subtitle?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        items?: {
            question?: string | undefined;
            answerHtml?: string | undefined;
        }[] | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        items?: {
            question?: string | undefined;
            answerHtml?: string | undefined;
        }[] | undefined;
    };
}>;
export declare const faqAccordionConfigSchema: z.ZodObject<{
    allowMultipleOpen: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    allowMultipleOpen: boolean;
}, {
    allowMultipleOpen?: boolean | undefined;
}>;
export declare const contactAndMapContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    churchName: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    mapUrl: z.ZodOptional<z.ZodString>;
    scheduleTitle: z.ZodOptional<z.ZodString>;
    scheduleText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subtitle?: string | undefined;
    churchName?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    mapUrl?: string | undefined;
    scheduleTitle?: string | undefined;
    scheduleText?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    churchName?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    mapUrl?: string | undefined;
    scheduleTitle?: string | undefined;
    scheduleText?: string | undefined;
}>;
export declare const contactAndMapContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        churchName: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        mapUrl: z.ZodOptional<z.ZodString>;
        scheduleTitle: z.ZodOptional<z.ZodString>;
        scheduleText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        churchName?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        email?: string | undefined;
        mapUrl?: string | undefined;
        scheduleTitle?: string | undefined;
        scheduleText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        churchName?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        email?: string | undefined;
        mapUrl?: string | undefined;
        scheduleTitle?: string | undefined;
        scheduleText?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        churchName: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        mapUrl: z.ZodOptional<z.ZodString>;
        scheduleTitle: z.ZodOptional<z.ZodString>;
        scheduleText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        churchName?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        email?: string | undefined;
        mapUrl?: string | undefined;
        scheduleTitle?: string | undefined;
        scheduleText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        churchName?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        email?: string | undefined;
        mapUrl?: string | undefined;
        scheduleTitle?: string | undefined;
        scheduleText?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        subtitle?: string | undefined;
        churchName?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        email?: string | undefined;
        mapUrl?: string | undefined;
        scheduleTitle?: string | undefined;
        scheduleText?: string | undefined;
    };
    en: {
        title: string;
        subtitle?: string | undefined;
        churchName?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        email?: string | undefined;
        mapUrl?: string | undefined;
        scheduleTitle?: string | undefined;
        scheduleText?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        churchName?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        email?: string | undefined;
        mapUrl?: string | undefined;
        scheduleTitle?: string | undefined;
        scheduleText?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        churchName?: string | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        email?: string | undefined;
        mapUrl?: string | undefined;
        scheduleTitle?: string | undefined;
        scheduleText?: string | undefined;
    };
}>;
export declare const contactAndMapConfigSchema: z.ZodObject<{
    showForm: z.ZodDefault<z.ZodBoolean>;
    showMap: z.ZodDefault<z.ZodBoolean>;
    mapHeight: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    showForm: boolean;
    showMap: boolean;
    mapHeight: number;
}, {
    showForm?: boolean | undefined;
    showMap?: boolean | undefined;
    mapHeight?: number | undefined;
}>;
export declare const formEmbedContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    successMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subtitle?: string | undefined;
    successMessage?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    successMessage?: string | undefined;
}>;
export declare const formEmbedContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        successMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        successMessage?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        successMessage?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        successMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle?: string | undefined;
        successMessage?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        successMessage?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        subtitle?: string | undefined;
        successMessage?: string | undefined;
    };
    en: {
        title: string;
        subtitle?: string | undefined;
        successMessage?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        successMessage?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        successMessage?: string | undefined;
    };
}>;
export declare const formEmbedConfigSchema: z.ZodObject<{
    formId: z.ZodOptional<z.ZodString>;
    formKey: z.ZodDefault<z.ZodString>;
    layout: z.ZodDefault<z.ZodEnum<["card", "inline"]>>;
}, "strip", z.ZodTypeAny, {
    layout: "card" | "inline";
    formKey: string;
    formId?: string | undefined;
}, {
    layout?: "card" | "inline" | undefined;
    formId?: string | undefined;
    formKey?: string | undefined;
}>;
export declare const videoEmbedContentItemSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    videoUrl: z.ZodDefault<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    videoUrl: string;
    title?: string | undefined;
    subtitle?: string | undefined;
    caption?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    caption?: string | undefined;
    videoUrl?: string | undefined;
}>;
export declare const videoEmbedContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        videoUrl: z.ZodDefault<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        videoUrl: string;
        title?: string | undefined;
        subtitle?: string | undefined;
        caption?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        caption?: string | undefined;
        videoUrl?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        videoUrl: z.ZodDefault<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        videoUrl: string;
        title?: string | undefined;
        subtitle?: string | undefined;
        caption?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        caption?: string | undefined;
        videoUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        videoUrl: string;
        title?: string | undefined;
        subtitle?: string | undefined;
        caption?: string | undefined;
    };
    en: {
        videoUrl: string;
        title?: string | undefined;
        subtitle?: string | undefined;
        caption?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        caption?: string | undefined;
        videoUrl?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        caption?: string | undefined;
        videoUrl?: string | undefined;
    };
}>;
export declare const videoEmbedConfigSchema: z.ZodObject<{
    aspectRatio: z.ZodDefault<z.ZodEnum<["16:9", "4:3"]>>;
    autoplay: z.ZodDefault<z.ZodBoolean>;
    controls: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    aspectRatio: "16:9" | "4:3";
    autoplay: boolean;
    controls: boolean;
}, {
    aspectRatio?: "16:9" | "4:3" | undefined;
    autoplay?: boolean | undefined;
    controls?: boolean | undefined;
}>;
export declare const linkButtonItemSchema: z.ZodObject<{
    text: z.ZodDefault<z.ZodString>;
    link: z.ZodDefault<z.ZodString>;
    variant: z.ZodDefault<z.ZodEnum<["primary", "accent", "outline", "ghost"]>>;
    icon: z.ZodOptional<z.ZodString>;
    target: z.ZodDefault<z.ZodEnum<["_self", "_blank"]>>;
}, "strip", z.ZodTypeAny, {
    link: string;
    text: string;
    variant: "primary" | "accent" | "outline" | "ghost";
    target: "_self" | "_blank";
    icon?: string | undefined;
}, {
    icon?: string | undefined;
    link?: string | undefined;
    text?: string | undefined;
    variant?: "primary" | "accent" | "outline" | "ghost" | undefined;
    target?: "_self" | "_blank" | undefined;
}>;
export declare const linkButtonsContentItemSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    buttons: z.ZodDefault<z.ZodArray<z.ZodObject<{
        text: z.ZodDefault<z.ZodString>;
        link: z.ZodDefault<z.ZodString>;
        variant: z.ZodDefault<z.ZodEnum<["primary", "accent", "outline", "ghost"]>>;
        icon: z.ZodOptional<z.ZodString>;
        target: z.ZodDefault<z.ZodEnum<["_self", "_blank"]>>;
    }, "strip", z.ZodTypeAny, {
        link: string;
        text: string;
        variant: "primary" | "accent" | "outline" | "ghost";
        target: "_self" | "_blank";
        icon?: string | undefined;
    }, {
        icon?: string | undefined;
        link?: string | undefined;
        text?: string | undefined;
        variant?: "primary" | "accent" | "outline" | "ghost" | undefined;
        target?: "_self" | "_blank" | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    buttons: {
        link: string;
        text: string;
        variant: "primary" | "accent" | "outline" | "ghost";
        target: "_self" | "_blank";
        icon?: string | undefined;
    }[];
    title?: string | undefined;
}, {
    title?: string | undefined;
    buttons?: {
        icon?: string | undefined;
        link?: string | undefined;
        text?: string | undefined;
        variant?: "primary" | "accent" | "outline" | "ghost" | undefined;
        target?: "_self" | "_blank" | undefined;
    }[] | undefined;
}>;
export declare const linkButtonsContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        buttons: z.ZodDefault<z.ZodArray<z.ZodObject<{
            text: z.ZodDefault<z.ZodString>;
            link: z.ZodDefault<z.ZodString>;
            variant: z.ZodDefault<z.ZodEnum<["primary", "accent", "outline", "ghost"]>>;
            icon: z.ZodOptional<z.ZodString>;
            target: z.ZodDefault<z.ZodEnum<["_self", "_blank"]>>;
        }, "strip", z.ZodTypeAny, {
            link: string;
            text: string;
            variant: "primary" | "accent" | "outline" | "ghost";
            target: "_self" | "_blank";
            icon?: string | undefined;
        }, {
            icon?: string | undefined;
            link?: string | undefined;
            text?: string | undefined;
            variant?: "primary" | "accent" | "outline" | "ghost" | undefined;
            target?: "_self" | "_blank" | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        buttons: {
            link: string;
            text: string;
            variant: "primary" | "accent" | "outline" | "ghost";
            target: "_self" | "_blank";
            icon?: string | undefined;
        }[];
        title?: string | undefined;
    }, {
        title?: string | undefined;
        buttons?: {
            icon?: string | undefined;
            link?: string | undefined;
            text?: string | undefined;
            variant?: "primary" | "accent" | "outline" | "ghost" | undefined;
            target?: "_self" | "_blank" | undefined;
        }[] | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        buttons: z.ZodDefault<z.ZodArray<z.ZodObject<{
            text: z.ZodDefault<z.ZodString>;
            link: z.ZodDefault<z.ZodString>;
            variant: z.ZodDefault<z.ZodEnum<["primary", "accent", "outline", "ghost"]>>;
            icon: z.ZodOptional<z.ZodString>;
            target: z.ZodDefault<z.ZodEnum<["_self", "_blank"]>>;
        }, "strip", z.ZodTypeAny, {
            link: string;
            text: string;
            variant: "primary" | "accent" | "outline" | "ghost";
            target: "_self" | "_blank";
            icon?: string | undefined;
        }, {
            icon?: string | undefined;
            link?: string | undefined;
            text?: string | undefined;
            variant?: "primary" | "accent" | "outline" | "ghost" | undefined;
            target?: "_self" | "_blank" | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        buttons: {
            link: string;
            text: string;
            variant: "primary" | "accent" | "outline" | "ghost";
            target: "_self" | "_blank";
            icon?: string | undefined;
        }[];
        title?: string | undefined;
    }, {
        title?: string | undefined;
        buttons?: {
            icon?: string | undefined;
            link?: string | undefined;
            text?: string | undefined;
            variant?: "primary" | "accent" | "outline" | "ghost" | undefined;
            target?: "_self" | "_blank" | undefined;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        buttons: {
            link: string;
            text: string;
            variant: "primary" | "accent" | "outline" | "ghost";
            target: "_self" | "_blank";
            icon?: string | undefined;
        }[];
        title?: string | undefined;
    };
    en: {
        buttons: {
            link: string;
            text: string;
            variant: "primary" | "accent" | "outline" | "ghost";
            target: "_self" | "_blank";
            icon?: string | undefined;
        }[];
        title?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        buttons?: {
            icon?: string | undefined;
            link?: string | undefined;
            text?: string | undefined;
            variant?: "primary" | "accent" | "outline" | "ghost" | undefined;
            target?: "_self" | "_blank" | undefined;
        }[] | undefined;
    };
    en: {
        title?: string | undefined;
        buttons?: {
            icon?: string | undefined;
            link?: string | undefined;
            text?: string | undefined;
            variant?: "primary" | "accent" | "outline" | "ghost" | undefined;
            target?: "_self" | "_blank" | undefined;
        }[] | undefined;
    };
}>;
export declare const linkButtonsConfigSchema: z.ZodObject<{
    alignment: z.ZodDefault<z.ZodEnum<["left", "center", "right"]>>;
    size: z.ZodDefault<z.ZodEnum<["sm", "md", "lg"]>>;
}, "strip", z.ZodTypeAny, {
    alignment: "left" | "center" | "right";
    size: "sm" | "md" | "lg";
}, {
    alignment?: "left" | "center" | "right" | undefined;
    size?: "sm" | "md" | "lg" | undefined;
}>;
export declare const announcementBannerContentItemSchema: z.ZodObject<{
    message: z.ZodDefault<z.ZodString>;
    linkText: z.ZodOptional<z.ZodString>;
    linkUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    linkText?: string | undefined;
    linkUrl?: string | undefined;
}, {
    message?: string | undefined;
    linkText?: string | undefined;
    linkUrl?: string | undefined;
}>;
export declare const announcementBannerContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        message: z.ZodDefault<z.ZodString>;
        linkText: z.ZodOptional<z.ZodString>;
        linkUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        linkText?: string | undefined;
        linkUrl?: string | undefined;
    }, {
        message?: string | undefined;
        linkText?: string | undefined;
        linkUrl?: string | undefined;
    }>;
    en: z.ZodObject<{
        message: z.ZodDefault<z.ZodString>;
        linkText: z.ZodOptional<z.ZodString>;
        linkUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        linkText?: string | undefined;
        linkUrl?: string | undefined;
    }, {
        message?: string | undefined;
        linkText?: string | undefined;
        linkUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        message: string;
        linkText?: string | undefined;
        linkUrl?: string | undefined;
    };
    en: {
        message: string;
        linkText?: string | undefined;
        linkUrl?: string | undefined;
    };
}, {
    am: {
        message?: string | undefined;
        linkText?: string | undefined;
        linkUrl?: string | undefined;
    };
    en: {
        message?: string | undefined;
        linkText?: string | undefined;
        linkUrl?: string | undefined;
    };
}>;
export declare const announcementBannerConfigSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<["info", "warning", "success", "urgent"]>>;
    dismissible: z.ZodDefault<z.ZodBoolean>;
    sticky: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "urgent" | "info" | "warning" | "success";
    dismissible: boolean;
    sticky: boolean;
}, {
    type?: "urgent" | "info" | "warning" | "success" | undefined;
    dismissible?: boolean | undefined;
    sticky?: boolean | undefined;
}>;
export declare const memberCallToActionContentItemSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    subtitle: z.ZodDefault<z.ZodString>;
    buttonText: z.ZodDefault<z.ZodString>;
    buttonLink: z.ZodDefault<z.ZodString>;
    badgeText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    badgeText?: string | undefined;
}, {
    title?: string | undefined;
    subtitle?: string | undefined;
    badgeText?: string | undefined;
    buttonText?: string | undefined;
    buttonLink?: string | undefined;
}>;
export declare const memberCallToActionContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodDefault<z.ZodString>;
        buttonText: z.ZodDefault<z.ZodString>;
        buttonLink: z.ZodDefault<z.ZodString>;
        badgeText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle: string;
        buttonText: string;
        buttonLink: string;
        badgeText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    }>;
    en: z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        subtitle: z.ZodDefault<z.ZodString>;
        buttonText: z.ZodDefault<z.ZodString>;
        buttonLink: z.ZodDefault<z.ZodString>;
        badgeText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        subtitle: string;
        buttonText: string;
        buttonLink: string;
        badgeText?: string | undefined;
    }, {
        title?: string | undefined;
        subtitle?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        title: string;
        subtitle: string;
        buttonText: string;
        buttonLink: string;
        badgeText?: string | undefined;
    };
    en: {
        title: string;
        subtitle: string;
        buttonText: string;
        buttonLink: string;
        badgeText?: string | undefined;
    };
}, {
    am: {
        title?: string | undefined;
        subtitle?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    };
    en: {
        title?: string | undefined;
        subtitle?: string | undefined;
        badgeText?: string | undefined;
        buttonText?: string | undefined;
        buttonLink?: string | undefined;
    };
}>;
export declare const memberCallToActionConfigSchema: z.ZodObject<{
    backgroundStyle: z.ZodDefault<z.ZodEnum<["gradient", "solid", "image"]>>;
    buttonVariant: z.ZodDefault<z.ZodEnum<["accent", "primary"]>>;
}, "strip", z.ZodTypeAny, {
    backgroundStyle: "gradient" | "solid" | "image";
    buttonVariant: "primary" | "accent";
}, {
    backgroundStyle?: "gradient" | "solid" | "image" | undefined;
    buttonVariant?: "primary" | "accent" | undefined;
}>;
export declare const spacerDividerContentItemSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const spacerDividerContentSchema: z.ZodObject<{
    am: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
    en: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
}, "strip", z.ZodTypeAny, {
    am: {};
    en: {};
}, {
    am: {};
    en: {};
}>;
export declare const spacerDividerConfigSchema: z.ZodObject<{
    height: z.ZodDefault<z.ZodNumber>;
    showDividerLine: z.ZodDefault<z.ZodBoolean>;
    lineStyle: z.ZodDefault<z.ZodEnum<["solid", "dashed", "dotted"]>>;
    lineColor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    height: number;
    showDividerLine: boolean;
    lineStyle: "solid" | "dashed" | "dotted";
    lineColor?: string | undefined;
}, {
    height?: number | undefined;
    showDividerLine?: boolean | undefined;
    lineStyle?: "solid" | "dashed" | "dotted" | undefined;
    lineColor?: string | undefined;
}>;
export declare const customHtmlContentItemSchema: z.ZodObject<{
    html: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    html: string;
}, {
    html?: string | undefined;
}>;
export declare const customHtmlContentSchema: z.ZodObject<{
    am: z.ZodObject<{
        html: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        html: string;
    }, {
        html?: string | undefined;
    }>;
    en: z.ZodObject<{
        html: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        html: string;
    }, {
        html?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    am: {
        html: string;
    };
    en: {
        html: string;
    };
}, {
    am: {
        html?: string | undefined;
    };
    en: {
        html?: string | undefined;
    };
}>;
export declare const customHtmlConfigSchema: z.ZodObject<{
    restrictedRole: z.ZodDefault<z.ZodLiteral<"super_admin">>;
}, "strip", z.ZodTypeAny, {
    restrictedRole: "super_admin";
}, {
    restrictedRole?: "super_admin" | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map