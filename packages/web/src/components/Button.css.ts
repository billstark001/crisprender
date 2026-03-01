import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../styles/theme.css.js';

export const buttonRecipe = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: vars.font.sans,
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, opacity 0.15s ease',
    borderRadius: vars.radius.md,
    ':disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: vars.color.primary,
        color: '#fff',
        ':hover': { backgroundColor: vars.color.primaryHover },
      },
      secondary: {
        backgroundColor: vars.color.bgMuted,
        color: vars.color.textPrimary,
        border: `1px solid ${vars.color.border}`,
        ':hover': { backgroundColor: vars.color.border },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: vars.color.primary,
        ':hover': { backgroundColor: vars.color.primaryLight },
      },
    },
    size: {
      sm: { fontSize: vars.fontSize.sm, padding: `${vars.space['1']} ${vars.space['3']}`, height: '32px' },
      md: { fontSize: vars.fontSize.md, padding: `${vars.space['2']} ${vars.space['4']}`, height: '40px' },
      lg: { fontSize: vars.fontSize.lg, padding: `${vars.space['3']} ${vars.space['6']}`, height: '48px' },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});
