import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css.js';

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['2'],
});

export const sectionTitle = style({
  fontWeight: '700',
  color: vars.color.textPrimary,
  fontSize: vars.fontSize.sm,
  margin: 0,
});

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.fontSize.xs,
  fontFamily: vars.font.mono,
});

export const th = style({
  textAlign: 'left',
  padding: `${vars.space['1']} ${vars.space['2']}`,
  backgroundColor: vars.color.bgMuted,
  color: vars.color.textSecondary,
  fontFamily: vars.font.sans,
  fontWeight: '600',
  borderBottom: `1px solid ${vars.color.border}`,
});

export const td = style({
  padding: `${vars.space['1']} ${vars.space['2']}`,
  borderBottom: `1px solid ${vars.color.border}`,
  color: vars.color.textPrimary,
});

export const codeBlock = style({
  backgroundColor: vars.color.bgMuted,
  borderRadius: vars.radius.md,
  padding: vars.space['3'],
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  color: vars.color.textPrimary,
  overflowX: 'auto',
  whiteSpace: 'pre',
  lineHeight: '1.7',
  border: `1px solid ${vars.color.border}`,
});

export const noteText = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  fontStyle: 'italic',
});
