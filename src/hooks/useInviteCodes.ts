import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { InviteCode } from '@/types/database'
import { useProfile } from './useProfile'

export const useInviteCodes = (logCallback?: {
  logInviteCodeGenerated: (codeId: string, code: string) => void
  logInviteCodeDeleted: (codeId: string, code: string) => void
}) => {
  const { isAdmin } = useProfile()
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      loadInviteCodes()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const loadInviteCodes = async () => {
    if (!isAdmin) return

    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading invite codes:', error)
      } else {
        setInviteCodes(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateInviteCode = async () => {
    if (!isAdmin) return { error: new Error('Unauthorized') }

    try {
      // First generate the unique code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_invite_code')

      if (codeError) {
        return { error: codeError }
      }

      // Then create the invite code record
      const { data, error } = await supabase
        .from('invite_codes')
        .insert({
          code: codeData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          is_used: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select()
        .single()

      if (error) {
        return { error }
      }

      // Refresh the list
      await loadInviteCodes()

      // Log the action
      if (logCallback?.logInviteCodeGenerated) {
        logCallback.logInviteCodeGenerated(data.id, data.code)
      }

      return { data, error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const validateInviteCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error) {
        return { valid: false, error }
      }

      return { valid: true, data, error: null }
    } catch (error) {
      return { valid: false, error: error as Error }
    }
  }

  const useInviteCode = async (code: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('use_invite_code', {
          invite_code: code.toUpperCase(),
          user_id: userId
        })

      return { success: data, error }
    } catch (error) {
      return { success: false, error: error as Error }
    }
  }

  const deleteInviteCode = async (id: string) => {
    if (!isAdmin) return { error: new Error('Unauthorized') }

    try {
      // Get the code details before deleting for logging
      const codeToDelete = inviteCodes.find(code => code.id === id)

      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', id)

      if (error) {
        return { error }
      }

      // Log the action
      if (codeToDelete && logCallback?.logInviteCodeDeleted) {
        logCallback.logInviteCodeDeleted(id, codeToDelete.code)
      }

      // Refresh the list
      await loadInviteCodes()
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  return {
    inviteCodes,
    loading,
    generateInviteCode,
    validateInviteCode,
    useInviteCode,
    deleteInviteCode,
    loadInviteCodes
  }
}