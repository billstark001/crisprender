import { buttonRecipe } from './Button.css.js';
import type { RecipeVariants } from '@vanilla-extract/recipes';

type ButtonVariants = RecipeVariants<typeof buttonRecipe>;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  children: React.ReactNode;
}

export function Button({ variant, size, children, className, ...props }: ButtonProps) {
  return (
    <button className={`${buttonRecipe({ variant, size })}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </button>
  );
}
