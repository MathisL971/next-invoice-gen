import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  actions?: React.ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', title, actions, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg bg-white dark:bg-zinc-900 shadow ${className}`}
        {...props}
      >
        {(title || actions) && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {actions && <div>{actions}</div>}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card

