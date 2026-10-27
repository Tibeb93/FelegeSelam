import { z } from 'zod';

export type SectionType =
  | 'hero'
  | 'richText'
  | 'imageWithText'
  | 'featureCards'
  | 'gallery'
  | 'statsCounter'
  | 'postsFeed'
  | 'mezmurList'
  | 'coursesList'
  | 'eventsList'
  | 'ethiopianCalendar'
  | 'faqAccordion'
  | 'contactAndMap'
  | 'formEmbed'
  | 'videoEmbed'
  | 'linkButtons'
  | 'announcementBanner'
  | 'memberCallToAction'
  | 'spacerDivider'
  | 'customHtml';

export type SectionAudience = 'everyone' | 'guests' | 'members' | 'staff';

export interface SectionStyle {
  background: 'transparent' | 'primary' | 'secondary' | 'muted' | 'card' | 'custom';
  customBackground?: string;
  overlay?: string;
  padding: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  width: 'narrow' | 'default' | 'wide' | 'full';
  align: 'left' | 'center' | 'right';
  rounded?: boolean;
}

export interface Localized<T> {
  am: T;
  en: T;
}

export interface SectionRegistryEntry<TContent = any, TConfig = any> {
  type: SectionType;
  titleAm: string;
  titleEn: string;
  descriptionAm: string;
  descriptionEn: string;
  icon: string;
  previewImage?: string;
  category: 'header' | 'content' | 'media' | 'feeds' | 'interactive' | 'layout';
  contentSchema: z.ZodType<Localized<TContent>>;
  configSchema: z.ZodType<TConfig>;
  defaultContent: Localized<TContent>;
  defaultConfig: TConfig;
  defaultStyle: SectionStyle;
  superAdminOnly?: boolean;
}

export interface CmsPageSectionDto {
  id?: string;
  type: SectionType;
  orderNo: number;
  visible: boolean;
  content: { am: Record<string, any>; en: Record<string, any> };
  config: Record<string, any>;
  style: SectionStyle;
  audience: SectionAudience;
}

export interface CmsPageDto {
  id?: string;
  slug: string;
  titleAm: string;
  titleEn: string;
  status: 'draft' | 'scheduled' | 'published';
  publishAt?: string | null;
  seo?: {
    titleAm?: string;
    titleEn?: string;
    descAm?: string;
    descEn?: string;
    ogImageId?: string;
  } | null;
  isSystem?: boolean;
  version?: number;
  sections?: CmsPageSectionDto[];
}

export interface MenuItemDto {
  id: string;
  labelAm: string;
  labelEn: string;
  target: {
    type: 'page' | 'url' | 'form';
    pageId?: string;
    url?: string;
    formId?: string;
  };
  visible: boolean;
  audience: SectionAudience;
  children?: MenuItemDto[];
}

export interface CmsMenuDto {
  location: 'header' | 'footer';
  items: MenuItemDto[];
}
