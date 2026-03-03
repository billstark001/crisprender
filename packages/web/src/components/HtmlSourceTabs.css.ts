import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css.js';

export const tabsRoot = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
});

export const tabsList = style({
  display: 'flex',
  borderBottom: `1px solid ${vars.color.border}`,
  marginBottom: vars.space['4'],
  gap: vars.space['1'],
});

export const tabsTrigger = style({
  padding: `${vars.space['2']} ${vars.space['3']}`,
  fontSize: vars.fontSize.sm,
  fontWeight: '500',
  color: vars.color.textSecondary,
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  borderRadius: `${vars.radius.sm} ${vars.radius.sm} 0 0`,
  transition: 'color 0.15s, border-color 0.15s',
  marginBottom: '-1px',
  ':hover': {
    color: vars.color.textPrimary,
  },
  selectors: {
    '&[data-state="active"]': {
      color: vars.color.primary,
      borderBottomColor: vars.color.primary,
      backgroundColor: vars.color.primaryLight,
    },
  },
});

export const tabsContent = style({
  outline: 'none',
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
});


export const fileUpload = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space['2'],
  padding: `${vars.space['5']} ${vars.space['4']}`,
  border: `2px dashed ${vars.color.border}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.bgMuted,
  cursor: 'pointer',
  transition: 'border-color 0.15s, background-color 0.15s',
  ':hover': {
    borderColor: vars.color.primary,
    backgroundColor: vars.color.primaryLight,
  },
});

export const fileUploadActive = style({
  borderColor: vars.color.primary,
  backgroundColor: vars.color.primaryLight,
});

export const fileUploadText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textSecondary,
  pointerEvents: 'none',
});

export const fileUploadHint = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  pointerEvents: 'none',
});

export const fileUploadName = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.primary,
  fontWeight: '500',
  pointerEvents: 'none',
});
