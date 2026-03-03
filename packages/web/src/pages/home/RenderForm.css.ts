import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css.js';

export const resultArea = style({
  padding: vars.space['4'],
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.bgMuted,
  border: `1px solid ${vars.color.border}`,
});

export const errorText = style({
  color: vars.color.danger,
  fontSize: vars.fontSize.sm,
});

export const successLink = style({
  color: vars.color.primary,
  fontWeight: '600',
  fontSize: vars.fontSize.md,
  textDecoration: 'underline',
  cursor: 'pointer',
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['4'],
});

export const formLayout = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space['6'],
  alignItems: 'start',
  '@media': {
    '(max-width: 800px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const formSide = style({
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