'use client'

import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${sizes[size]} overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-2xl shadow-teal-900/10 ring-1 ring-teal-900/5 dark:border-stone-700 dark:bg-stone-900/95 dark:ring-teal-500/10`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-0.5 bg-gradient-to-r from-[#d4846a]/80 via-teal-600/80 to-[#1a454f]/80" />
        {title && (
          <div className="flex items-center justify-between border-b border-teal-900/5 px-6 py-4 dark:border-teal-500/10">
            <h3 className="text-lg font-semibold text-[#1a454f] dark:text-teal-50">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-teal-50/80 hover:text-teal-900 dark:hover:bg-stone-800 dark:hover:text-teal-100"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return null
}
