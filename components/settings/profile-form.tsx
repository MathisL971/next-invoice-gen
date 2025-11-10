'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'

interface Profile {
  id: string
  company_name?: string
  address?: string
  phone?: string
  email?: string
  banking_info?: {
    bank_name?: string
    RIB?: string
    IBAN?: string
    BIC?: string
  }
}

interface ProfileFormData {
  company_name?: string
  address?: string
  phone?: string
  email?: string
  banking_info?: {
    bank_name?: string
    RIB?: string
    IBAN?: string
    BIC?: string
  }
}

interface ProfileFormProps {
  profile: Profile
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ProfileFormData>({
    company_name: profile.company_name || '',
    address: profile.address || '',
    phone: profile.phone || '',
    email: profile.email || '',
    banking_info: profile.banking_info || {
      bank_name: '',
      RIB: '',
      IBAN: '',
      BIC: '',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      toast.error('You must be logged in')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          company_name: formData.company_name || null,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          banking_info: formData.banking_info,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success('Profile updated successfully')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Failed to update profile', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Card title="Company Information">
        <div className="space-y-4">
          <Input
            label="Company Name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </Card>

      <Card title="Banking Information">
        <div className="space-y-4">
          <Input
            label="Bank Name"
            value={formData.banking_info?.bank_name || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                banking_info: {
                  ...formData.banking_info,
                  bank_name: e.target.value,
                },
              })
            }
          />

          <Input
            label="RIB"
            value={formData.banking_info?.RIB || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                banking_info: {
                  ...formData.banking_info,
                  RIB: e.target.value,
                },
              })
            }
          />

          <Input
            label="IBAN"
            value={formData.banking_info?.IBAN || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                banking_info: {
                  ...formData.banking_info,
                  IBAN: e.target.value,
                },
              })
            }
          />

          <Input
            label="BIC"
            value={formData.banking_info?.BIC || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                banking_info: {
                  ...formData.banking_info,
                  BIC: e.target.value,
                },
              })
            }
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

