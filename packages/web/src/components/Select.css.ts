import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css.js';

export const selectWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['1'],
});

export const label = style({
  fontSize: vars.fontSize.sm,
  fontWeight: '500',
  color: vars.color.textSecondary,
});

export const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space['2'],
  fontFamily: vars.font.sans,
  fontSize: vars.fontSize.md,
  color: vars.color.textPrimary,
  backgroundColor: vars.color.bgWhite,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  padding: `${vars.space['2']} ${vars.space['3']}`,
  cursor: 'pointer',
  outline: 'none',
  width: '100%',
  height: '40px',
  ':focus': {
    borderColor: vars.color.borderFocus,
    boxShadow: `0 0 0 3px ${vars.color.primaryLight}`,
  },
});

export const content = style({
  backgroundColor: vars.color.bgWhite,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.md,
  zIndex: 50,
  overflow: 'hidden',
});

export const item = style({
  fontSize: vars.fontSize.md,
  color: vars.color.textPrimary,
  padding: `${vars.space['2']} ${vars.space['3']}`,
  cursor: 'pointer',
  outline: 'none',
  userSelect: 'none',
  ':hover': {
    backgroundColor: vars.color.primaryLight,
    color: vars.color.primary,
  },
  selectors: {
    '&[data-highlighted]': {
      backgroundColor: vars.color.primaryLight,
      color: vars.color.primary,
    },
  },
});
