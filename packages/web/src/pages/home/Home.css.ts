import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css.js';

export const hero = style({
  textAlign: 'center',
  paddingBottom: vars.space['4'],
});

export const heroTitle = style({
  fontSize: vars.fontSize['3xl'],
  fontWeight: '700',
  color: vars.color.textPrimary,
  marginBottom: vars.space['2'],
});

export const heroSubtitle = style({
  fontSize: vars.fontSize.lg,
  color: vars.color.textSecondary,
});

export const footer = style({
  textAlign: 'center',
  padding: `${vars.space['6']} ${vars.space['4']}`,
  borderTop: `1px solid ${vars.color.border}`,
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
});

export const page = style({
  minHeight: '100vh',
  backgroundColor: vars.color.bgBase,
  display: 'flex',
  flexDirection: 'column',
});

export const main = style({
  flex: '1',
  maxWidth: '1200px',
  width: '100%',
  margin: '0 auto',
  padding: `${vars.space['8']} ${vars.space['4']}`,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['6'],
});

export const adsenseArea = style({
  width: '100%',
  minHeight: '90px',
  backgroundColor: vars.color.bgMuted,
  borderRadius: vars.radius.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.textMuted,
  fontSize: vars.fontSize.xs,
  border: `1px dashed ${vars.color.border}`,
});