import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "primary", size = "md", children, ...props },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-teal-800 text-white shadow-sm shadow-teal-900/15 hover:bg-teal-900 focus:ring-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 dark:focus:ring-teal-500",
      secondary:
        "border border-teal-900/10 bg-white/80 text-[#1a454f] hover:bg-teal-50/80 focus:ring-teal-700 dark:border-teal-500/20 dark:bg-stone-800/80 dark:text-teal-100 dark:hover:bg-stone-800",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      ghost:
        "text-stone-600 hover:bg-teal-50/60 hover:text-teal-900 dark:text-stone-400 dark:hover:bg-stone-800/60 dark:hover:text-teal-200",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
