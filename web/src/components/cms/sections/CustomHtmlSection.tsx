import React from 'react';

interface CustomHtmlSectionProps {
  content: {
    html?: string;
  };
}

export const CustomHtmlSection: React.FC<CustomHtmlSectionProps> = ({ content }) => {
  const { html = '' } = content;

  if (!html) return null;

  return (
    <div
      className="w-full custom-html-wrapper"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
