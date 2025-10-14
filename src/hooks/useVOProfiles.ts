import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface VOProfile {
  id: string
  user_id: string
  title: string
  description: string | null
  audio_file_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  cover_image_url: string | null
  tags: string[]
  recording_type: 'video' | 'audio'
  recording_style: 'professional' | 'conversational' | 'creative' | null
  duration_seconds: number | null
  file_size_bytes: number | null
  is_active: boolean
  is_featured: boolean
  view_count: number
  like_count: number
  share_count: number
  created_at: string
  updated_at: string
}

export interface CreateVOProfileData {
  title: string
  description?: string
  video_url?: string
  audio_file_url?: string
  thumbnail_url?: string
  cover_image_url?: string
  tags?: string[]
  recording_type: 'video' | 'audio'
  recording_style?: 'professional' | 'conversational' | 'creative'
  duration_seconds?: number
  file_size_bytes?: number
  is_active?: boolean
}

export interface UpdateVOProfileData {
  title?: string
  description?: string
  video_url?: string
  audio_file_url?: string
  thumbnail_url?: string
  cover_image_url?: string
  tags?: string[]
  recording_type?: 'video' | 'audio'
  recording_style?: 'professional' | 'conversational' | 'creative'
  duration_seconds?: number
  file_size_bytes?: number
  is_active?: boolean
  is_featured?: boolean
}

export const useVOProfiles = () => {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<VOProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadProfiles()
    } else {
      setProfiles([])
      setLoading(false)
    }
  }, [user])

  const loadProfiles = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Try using the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_vo_profiles', {
        p_user_id: user.id
      })

      if (!rpcError && rpcData) {
        setProfiles(rpcData)
        return
      }

      // Fallback to direct query if RPC fails
      const { data, error: queryError } = await supabase
        .from('vo_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (queryError) throw queryError

      setProfiles(data || [])
    } catch (err) {
      console.error('Error loading VO profiles:', err)
      setError(err instanceof Error ? err.message : 'Failed to load VO profiles')
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async (data: CreateVOProfileData) => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      setError(null)

      const { data: newProfile, error: createError } = await supabase
        .from('vo_profiles')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          video_url: data.video_url || null,
          audio_file_url: data.audio_file_url || null,
          thumbnail_url: data.thumbnail_url || null,
          cover_image_url: data.cover_image_url || null,
          tags: data.tags || [],
          recording_type: data.recording_type,
          recording_style: data.recording_style || null,
          duration_seconds: data.duration_seconds || null,
          file_size_bytes: data.file_size_bytes || null,
          is_active: data.is_active ?? true,
          is_featured: false,
          view_count: 0,
          like_count: 0,
          share_count: 0
        })
        .select()
        .single()

      if (createError) throw createError

      // Reload profiles to get the updated list
      await loadProfiles()

      return { data: newProfile, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create VO profile'
      setError(errorMessage)
      return { error: new Error(errorMessage) }
    }
  }

  const updateProfile = async (profileId: string, updates: UpdateVOProfileData) => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      setError(null)

      const { data: updatedProfile, error: updateError } = await supabase
        .from('vo_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .eq('user_id', user.id) // Ensure user owns the profile
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      setProfiles(prev =>
        prev.map(p => (p.id === profileId ? updatedProfile : p))
      )

      return { data: updatedProfile, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update VO profile'
      setError(errorMessage)
      return { error: new Error(errorMessage) }
    }
  }

  const deleteProfile = async (profileId: string) => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('vo_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id) // Ensure user owns the profile

      if (deleteError) throw deleteError

      // Update local state
      setProfiles(prev => prev.filter(p => p.id !== profileId))

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete VO profile'
      setError(errorMessage)
      return { error: new Error(errorMessage) }
    }
  }

  const getProfileById = async (profileId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('vo_profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (fetchError) throw fetchError

      return { data, error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to fetch VO profile') }
    }
  }

  const incrementViewCount = async (profileId: string) => {
    try {
      await supabase.rpc('track_profile_view', {
        p_user_id: user?.id,
        p_vo_profile_id: profileId
      })
    } catch (err) {
      console.error('Error tracking profile view:', err)
    }
  }

  return {
    profiles,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileById,
    incrementViewCount,
    reloadProfiles: loadProfiles
  }
}
