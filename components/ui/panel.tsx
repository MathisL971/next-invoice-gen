import { HTMLAttributes, forwardRef } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  padding?: boolean;
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      className = "",
      accent = false,
      padding = true,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`overflow-hidden rounded-xl border border-white/80 bg-white/90 shadow-lg shadow-teal-900/5 ring-1 ring-teal-900/5 backdrop-blur-sm dark:border-stone-700/80 dark:bg-stone-900/90 dark:shadow-none dark:ring-teal-500/10 ${className}`}
        {...props}
      >
        {accent && (
          <div className="h-1 bg-gradient-to-r from-[#d4846a] via-teal-600 to-[#1a454f]" />
        )}
        <div className={padding ? "p-6" : undefined}>{children}</div>
      </div>
    );
  }
);

Panel.displayName = "Panel";

export default Panel;
