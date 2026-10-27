import React from 'react';

interface SpacerDividerSectionProps {
  config?: {
    height?: number;
    showDividerLine?: boolean;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    lineColor?: string;
  };
}

export const SpacerDividerSection: React.FC<SpacerDividerSectionProps> = ({
  config = {},
}) => {
  const {
    height = 48,
    showDividerLine = false,
    lineStyle = 'solid',
    lineColor,
  } = config;

  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      {showDividerLine && (
        <hr
          className="w-full border-t border-border"
          style={{
            borderStyle: lineStyle,
            borderColor: lineColor || undefined,
          }}
        />
      )}
    </div>
  );
};
