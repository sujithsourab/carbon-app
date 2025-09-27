import { cn } from "../../utils/cn";
import { ComponentPropsWithoutRef, forwardRef } from "react";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary-500 text-white hover:bg-primary-600": variant === "primary",
            "bg-earth-500 text-white hover:bg-earth-600": variant === "secondary",
            "border border-primary-500 bg-transparent text-primary-500 hover:bg-primary-50":
              variant === "outline",
            "bg-transparent text-primary-500 hover:bg-primary-50": variant === "ghost",
            "bg-transparent text-primary-500 underline-offset-4 hover:underline p-0 h-auto":
              variant === "link",
            "h-9 px-3 text-sm": size === "sm",
            "h-10 px-4 text-base": size === "md",
            "h-12 px-6 text-lg": size === "lg",
            "w-full": fullWidth,
          },
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };