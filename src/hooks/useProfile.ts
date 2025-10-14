import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import { useAuth } from './useAuth'

export const useProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    getProfile()
  }, [user])

  const getProfile = async () => {
    console.log('getProfile called, user:', user)
    console.log('User ID for query:', user?.id)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      console.log('Profile query result:', { data, error })

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        console.log('Setting profile data:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: new Error('No user or profile') }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { error }
      }

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const isAdmin = profile?.role === 'admin'

  return {
    profile,
    loading,
    updateProfile,
    getProfile,
    isAdmin
  }
}