import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css.js';

export const card = style({
  backgroundColor: vars.color.bgWhite,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  padding: vars.space['6'],
  boxShadow: vars.shadow.sm,
});
