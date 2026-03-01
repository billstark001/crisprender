import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css.js';

export const page = style({
  minHeight: '100vh',
  backgroundColor: vars.color.bgBase,
  display: 'flex',
  flexDirection: 'column',
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${vars.space['4']} ${vars.space['8']}`,
  borderBottom: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.bgWhite,
  boxShadow: vars.shadow.sm,
});

export const logo = style({
  fontSize: vars.fontSize['2xl'],
  fontWeight: '700',
  color: vars.color.primary,
  letterSpacing: '-0.02em',
});

export const main = style({
  flex: '1',
  maxWidth: '800px',
  width: '100%',
  margin: '0 auto',
  padding: `${vars.space['8']} ${vars.space['4']}`,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['6'],
});

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

export const form = style({
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

export const divider = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space['3'],
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
  '::before': {
    content: '""',
    flex: '1',
    height: '1px',
    backgroundColor: vars.color.border,
  },
  '::after': {
    content: '""',
    flex: '1',
    height: '1px',
    backgroundColor: vars.color.border,
  },
});

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

export const footer = style({
  textAlign: 'center',
  padding: `${vars.space['6']} ${vars.space['4']}`,
  borderTop: `1px solid ${vars.color.border}`,
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
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

export const langSelector = style({
  display: 'flex',
  gap: vars.space['2'],
  alignItems: 'center',
});

export const langBtn = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textSecondary,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: `${vars.space['1']} ${vars.space['2']}`,
  borderRadius: vars.radius.sm,
  ':hover': {
    backgroundColor: vars.color.primaryLight,
    color: vars.color.primary,
  },
});

export const langBtnActive = style([langBtn, {
  color: vars.color.primary,
  fontWeight: '600',
  backgroundColor: vars.color.primaryLight,
}]);
