'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center">
          <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
            Invoice Manager
          </h1>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
            {user.email}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md px-2 lg:px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

