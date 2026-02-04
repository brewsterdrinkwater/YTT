import React, { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * Walt-tab Button Component
 * Brutalist style: high contrast, minimal decoration
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary: Black background, white text (main CTA)
        primary:
          'bg-black hover:bg-charcoal text-white rounded-sm active:scale-[0.98]',
        // Secondary: White background, black text, black border
        secondary:
          'bg-white hover:bg-concrete text-black border-2 border-black rounded-sm active:scale-[0.98]',
        // Accent: Red background (use sparingly)
        accent:
          'bg-tab-red hover:bg-red-600 text-white rounded-sm active:scale-[0.98]',
        // Danger: For destructive actions
        danger:
          'bg-danger hover:bg-red-600 text-white rounded-sm active:scale-[0.98]',
        // Ghost: Transparent with hover
        ghost:
          'bg-transparent hover:bg-concrete text-charcoal rounded-sm',
        // Outline: Border only
        outline:
          'border-2 border-black text-black hover:bg-black hover:text-white rounded-sm active:scale-[0.98]',
        // Link: Text only, underline on hover
        link:
          'text-black underline-offset-4 hover:underline hover:text-tab-red p-0 h-auto',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-13 px-8 text-lg',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
