import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css.js';

export const metaHintBox = style({
  marginTop: vars.space['3'],
  padding: `${vars.space['3']} ${vars.space['4']}`,
  backgroundColor: vars.color.primaryLight,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.primary}`,
  fontSize: vars.fontSize.sm,
  color: vars.color.textSecondary,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['2'],
});

export const metaHintHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space['2'],
});

export const metaHintTitle = style({
  fontWeight: '600',
  color: vars.color.primary,
  fontSize: vars.fontSize.sm,
  margin: 0,
  flex: '1',
});

export const metaHintList = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['1'],
});

export const metaHintItem = style({
  fontFamily: 'monospace',
  fontSize: vars.fontSize.sm,
});

export const metaHintEmpty = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  fontStyle: 'italic',
});

export const metaHintFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space['2'],
  paddingTop: vars.space['1'],
  borderTop: `1px solid ${vars.color.border}`,
  flexWrap: 'wrap',
});

export const metaHintNote = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  fontStyle: 'italic',
});

export const questionBtn = style({
  flexShrink: 0,
  background: 'none',
  border: `1px solid ${vars.color.primary}`,
  cursor: 'pointer',
  color: vars.color.primary,
  fontSize: vars.fontSize.xs,
  fontWeight: '700',
  lineHeight: '1',
  width: '18px',
  height: '18px',
  borderRadius: vars.radius.full,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  ':hover': {
    backgroundColor: vars.color.primary,
    color: '#fff',
  },
});

export const copyMetaBtn = style({
  background: 'none',
  border: `1px solid ${vars.color.primary}`,
  cursor: 'pointer',
  color: vars.color.primary,
  fontSize: vars.fontSize.xs,
  fontWeight: '600',
  padding: `2px ${vars.space['2']}`,
  borderRadius: vars.radius.sm,
  whiteSpace: 'nowrap',
  ':hover': {
    backgroundColor: vars.color.primary,
    color: '#fff',
  },
});