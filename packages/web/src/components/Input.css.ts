import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css.js';

export const inputWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['1'],
});

export const label = style({
  fontSize: vars.fontSize.sm,
  fontWeight: '500',
  color: vars.color.textSecondary,
});

export const input = style({
  fontFamily: vars.font.sans,
  fontSize: vars.fontSize.md,
  color: vars.color.textPrimary,
  backgroundColor: vars.color.bgWhite,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  padding: `${vars.space['2']} ${vars.space['3']}`,
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  width: '100%',
  ':focus': {
    borderColor: vars.color.borderFocus,
    boxShadow: `0 0 0 3px ${vars.color.primaryLight}`,
  },
});

export const textarea = style([input, {
  resize: 'vertical',
  minHeight: '120px',
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.sm,
}]);
