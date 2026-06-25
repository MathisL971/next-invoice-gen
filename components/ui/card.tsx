import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  actions?: React.ReactNode;
  accent?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className = "", title, actions, accent = true, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`overflow-hidden rounded-xl border border-white/80 bg-white/90 shadow-lg shadow-teal-900/5 ring-1 ring-teal-900/5 backdrop-blur-sm dark:border-stone-700/80 dark:bg-stone-900/90 dark:shadow-none dark:ring-teal-500/10 ${className}`}
        {...props}
      >
        {accent && (
          <div className="h-0.5 bg-gradient-to-r from-[#d4846a]/80 via-teal-600/80 to-[#1a454f]/80" />
        )}
        {(title || actions) && (
          <div className="flex items-center justify-between border-b border-teal-900/5 px-6 py-4 dark:border-teal-500/10">
            {title && (
              <h3 className="text-lg font-semibold text-[#1a454f] dark:text-teal-50">
                {title}
              </h3>
            )}
            {actions && <div>{actions}</div>}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
