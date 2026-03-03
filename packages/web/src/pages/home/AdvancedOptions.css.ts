import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css.js';

export const advancedToggle = style({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: vars.color.primary,
  fontSize: vars.fontSize.sm,
  padding: 0,
  textAlign: 'left',
  ':hover': {
    textDecoration: 'underline',
  },
});

export const advancedSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['4'],
});

export const row = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space['4'],
  '@media': {
    '(max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
});