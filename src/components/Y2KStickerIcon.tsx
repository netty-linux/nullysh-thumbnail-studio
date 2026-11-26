import React from 'react';
import type { Y2KStickerType } from '../types/thumbnail';

interface Y2KStickerIconProps {
  type: Y2KStickerType;
  className?: string;
}

export const Y2KStickerIcon: React.FC<Y2KStickerIconProps> = ({
  type,
  className = 'w-6 h-6',
}) => {
  const gradId = `chrome-ico-${type}`;

  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#8CC5E8" />
          <stop offset="52%" stopColor="#1F3A52" />
          <stop offset="75%" stopColor="#E5F4FD" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>

      {type === 'star-3d' && (
        <path
          d="M24 5L29.2 16.4L41.5 17.8L32.3 26.2L34.8 38.5L24 32.3L13.2 38.5L15.7 26.2L6.5 17.8L18.8 16.4L24 5Z"
          fill={`url(#${gradId})`}
          stroke="#1F3A52"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}

      {type === 'heart-chrome' && (
        <path
          d="M24 40C24 40 7 29.5 7 17.5C7 11.8 11.5 8 16.5 8C19.8 8 22.5 9.8 24 12.2C25.5 9.8 28.2 8 31.5 8C36.5 8 41 11.8 41 17.5C41 29.5 24 40 24 40Z"
          fill={`url(#${gradId})`}
          stroke="#1F3A52"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}

      {type === 'spark-burst' && (
        <path
          d="M24 4C25.5 18 30 22.5 44 24C30 25.5 25.5 30 24 44C22.5 30 18 25.5 4 24C18 22.5 22.5 18 24 4Z"
          fill={`url(#${gradId})`}
          stroke="#1F3A52"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      )}

      {type === 'glyph-orbit' && (
        <>
          <ellipse
            cx="24"
            cy="24"
            rx="19"
            ry="6.5"
            transform="rotate(-24 24 24)"
            stroke={`url(#${gradId})`}
            strokeWidth="3.5"
          />
          <circle
            cx="24"
            cy="24"
            r="8.5"
            fill={`url(#${gradId})`}
            stroke="#1F3A52"
            strokeWidth="2.2"
          />
        </>
      )}

      {type === 'glyph-cross' && (
        <path
          d="M24 4L27.5 18.5L38 10L29.5 20.5L44 24L29.5 27.5L38 38L27.5 29.5L24 44L20.5 29.5L10 38L18.5 27.5L4 24L18.5 20.5L10 10L20.5 18.5L24 4Z"
          fill={`url(#${gradId})`}
          stroke="#1F3A52"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      )}

      {type === 'lightning-chrome' && (
        <path
          d="M27 4L11 25H23L19 44L37 22H25L27 4Z"
          fill={`url(#${gradId})`}
          stroke="#1F3A52"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      )}

      {type === 'cd-disc' && (
        <>
          <circle
            cx="24"
            cy="24"
            r="18"
            fill={`url(#${gradId})`}
            stroke="#1F3A52"
            strokeWidth="2.5"
          />
          <circle cx="24" cy="24" r="5" fill="#0D0E12" stroke="#1F3A52" strokeWidth="2" />
        </>
      )}

      {type === 'butterfly-chrome' && (
        <path
          d="M24 19C19 9 7 11 9 22C7 31 16 37 24 30C32 37 41 31 39 22C41 11 29 9 24 19Z"
          fill={`url(#${gradId})`}
          stroke="#1F3A52"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
