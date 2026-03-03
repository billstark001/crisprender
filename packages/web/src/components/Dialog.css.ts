import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css.js';

export const overlay = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  zIndex: 1000,
});

export const dialogBox = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: vars.color.bgWhite,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.lg,
  padding: vars.space['6'],
  maxWidth: '580px',
  width: '90vw',
  maxHeight: '82vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['4'],
  zIndex: 1001,
});

export const dialogCloseBtn = style({
  position: 'absolute',
  top: vars.space['3'],
  right: vars.space['3'],
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: vars.fontSize.lg,
  color: vars.color.textMuted,
  lineHeight: '1',
  padding: `${vars.space['1']} ${vars.space['2']}`,
  borderRadius: vars.radius.sm,
  ':hover': {
    backgroundColor: vars.color.bgMuted,
    color: vars.color.textPrimary,
  },
});

export const dialogBody = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textSecondary,
  lineHeight: '1.7',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['4'],
});
