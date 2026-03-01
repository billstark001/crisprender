import { globalStyle } from '@vanilla-extract/css';
import { vars } from './theme.css.js';

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
});

globalStyle('html, body', {
  fontFamily: vars.font.sans,
  fontSize: vars.fontSize.md,
  color: vars.color.textPrimary,
  backgroundColor: vars.color.bgBase,
  lineHeight: '1.5',
  WebkitFontSmoothing: 'antialiased',
});

globalStyle('a', {
  color: vars.color.primary,
  textDecoration: 'none',
});

globalStyle('a:hover', {
  textDecoration: 'underline',
});
