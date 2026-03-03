import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css.js';

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