import React from 'react';
import { CmsPageSectionDto } from '@felegeselam/cms-registry';
import { SectionContainer } from './SectionContainer';

// Import all 20 section components
import { HeroSection } from './sections/HeroSection';
import { RichTextSection } from './sections/RichTextSection';
import { ImageWithTextSection } from './sections/ImageWithTextSection';
import { FeatureCardsSection } from './sections/FeatureCardsSection';
import { GallerySection } from './sections/GallerySection';
import { StatsCounterSection } from './sections/StatsCounterSection';
import { PostsFeedSection } from './sections/PostsFeedSection';
import { MezmurListSection } from './sections/MezmurListSection';
import { CoursesListSection } from './sections/CoursesListSection';
import { EventsListSection } from './sections/EventsListSection';
import { EthiopianCalendarSection } from './sections/EthiopianCalendarSection';
import { FaqAccordionSection } from './sections/FaqAccordionSection';
import { ContactAndMapSection } from './sections/ContactAndMapSection';
import { FormEmbedSection } from './sections/FormEmbedSection';
import { VideoEmbedSection } from './sections/VideoEmbedSection';
import { LinkButtonsSection } from './sections/LinkButtonsSection';
import { AnnouncementBannerSection } from './sections/AnnouncementBannerSection';
import { MemberCtaSection } from './sections/MemberCtaSection';
import { SpacerDividerSection } from './sections/SpacerDividerSection';
import { CustomHtmlSection } from './sections/CustomHtmlSection';

interface SectionRendererProps {
  section: CmsPageSectionDto;
  locale: string;
}

/**
 * Merges localized content with fallback to the alternative language
 * if specific strings are missing in the requested locale.
 */
function resolveLocalizedContent(
  rawContent: { am?: Record<string, any>; en?: Record<string, any> } | any,
  locale: string,
): Record<string, any> {
  if (!rawContent || typeof rawContent !== 'object') return {};

  const primaryLang = locale === 'am' ? 'am' : 'en';
  const fallbackLang = primaryLang === 'am' ? 'en' : 'am';

  const primary = rawContent[primaryLang] || {};
  const fallback = rawContent[fallbackLang] || {};

  const merged: Record<string, any> = { ...fallback };

  for (const [key, value] of Object.entries(primary)) {
    if (value !== undefined && value !== null && value !== '') {
      merged[key] = value;
    }
  }

  return merged;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({ section, locale }) => {
  if (!section || section.visible === false) {
    return null;
  }

  const content = resolveLocalizedContent(section.content, locale);
  const config = section.config || {};
  const style = section.style || {};

  let Component: React.ReactNode = null;

  switch (section.type) {
    case 'hero':
      Component = <HeroSection content={content as any} config={config} locale={locale} />;
      break;
    case 'richText':
      Component = <RichTextSection content={content as any} config={config} />;
      break;
    case 'imageWithText':
      Component = (
        <ImageWithTextSection content={content as any} config={config} locale={locale} />
      );
      break;
    case 'featureCards':
      Component = (
        <FeatureCardsSection content={content as any} config={config} locale={locale} />
      );
      break;
    case 'gallery':
      Component = <GallerySection content={content as any} config={config} />;
      break;
    case 'statsCounter':
      Component = <StatsCounterSection content={content as any} config={config} />;
      break;
    case 'postsFeed':
      Component = <PostsFeedSection content={content as any} config={config} locale={locale} />;
      break;
    case 'mezmurList':
      Component = <MezmurListSection content={content as any} config={config} locale={locale} />;
      break;
    case 'coursesList':
      Component = <CoursesListSection content={content as any} config={config} locale={locale} />;
      break;
    case 'eventsList':
      Component = <EventsListSection content={content as any} config={config} locale={locale} />;
      break;
    case 'ethiopianCalendar':
      Component = (
        <EthiopianCalendarSection content={content as any} config={config} locale={locale} />
      );
      break;
    case 'faqAccordion':
      Component = <FaqAccordionSection content={content as any} config={config} />;
      break;
    case 'contactAndMap':
      Component = <ContactAndMapSection content={content as any} config={config} />;
      break;
    case 'formEmbed':
      Component = <FormEmbedSection content={content as any} config={config} />;
      break;
    case 'videoEmbed':
      Component = <VideoEmbedSection content={content as any} config={config} />;
      break;
    case 'linkButtons':
      Component = <LinkButtonsSection content={content as any} config={config} locale={locale} />;
      break;
    case 'announcementBanner':
      Component = (
        <AnnouncementBannerSection content={content as any} config={config} locale={locale} />
      );
      break;
    case 'memberCallToAction':
      Component = <MemberCtaSection content={content as any} config={config} locale={locale} />;
      break;
    case 'spacerDivider':
      Component = <SpacerDividerSection config={config} />;
      break;
    case 'customHtml':
      Component = <CustomHtmlSection content={content as any} />;
      break;
    default:
      return null;
  }

  // Hero, AnnouncementBanner and SpacerDivider handle their own wrapper widths or full bleed
  const bypassContainer = ['hero', 'announcementBanner'].includes(section.type);

  if (bypassContainer) {
    return (
      <div id={section.id} className="w-full">
        {Component}
      </div>
    );
  }

  return (
    <SectionContainer id={section.id} style={style}>
      {Component}
    </SectionContainer>
  );
};
