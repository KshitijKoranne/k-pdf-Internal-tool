'use client';

import React, { forwardRef, HTMLAttributes } from 'react';

export type CardSize = 'sm' | 'md' | 'lg';
export type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: CardSize;
  variant?: CardVariant;
  hover?: boolean;
  clickable?: boolean;
}

const sizeStyles: Record<CardSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[hsl(var(--kpdf-card))]
    border border-[hsl(var(--kpdf-border))]
    text-[hsl(var(--kpdf-card-fg))]
  `,
  elevated: `
    bg-[hsl(var(--kpdf-card))]
    text-[hsl(var(--kpdf-card-fg))]
    shadow-lg
  `,
  outlined: `
    bg-transparent
    border-2 border-[hsl(var(--kpdf-border))]
    text-[hsl(var(--kpdf-card-fg))]
  `,
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      size = 'md',
      variant = 'default',
      hover = false,
      clickable = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      rounded-[var(--kpdf-radius-lg)]
      transition-all duration-200
    `;

    const hoverStyles = hover
      ? `
        hover:shadow-lg
        hover:border-[hsl(var(--kpdf-primary))]
        hover:-translate-y-0.5
      `
      : '';

    const clickableStyles = clickable
      ? `
        cursor-pointer
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-[hsl(var(--kpdf-ring))]
        focus-visible:ring-offset-2
      `
      : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${hoverStyles} ${clickableStyles} ${className}`.trim()}
        tabIndex={clickable ? 0 : undefined}
        role={clickable ? 'button' : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card subcomponents for structured content
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`mb-3 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, as: Component = 'h3', className = '', ...props }, ref) => (
    <Component
      ref={ref}
      className={`text-lg font-semibold text-[hsl(var(--kpdf-card-fg))] ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
);

CardTitle.displayName = 'CardTitle';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`text-[hsl(var(--kpdf-muted-fg))] ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`mt-4 pt-3 border-t border-[hsl(var(--kpdf-border))] ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export default Card;
