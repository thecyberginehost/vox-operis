import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { AdminLog } from '@/types/database'
import { useProfile } from './useProfile'
import { useAuth } from './useAuth'

export const useAdminLogs = () => {
  const { profile, isAdmin } = useProfile()
  const { user } = useAuth()
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activitySummary, setActivitySummary] = useState<any[]>([])

  useEffect(() => {
    if (isAdmin) {
      loadLogs()
      loadActivitySummary()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const loadLogs = async (limit = 50) => {
    if (!isAdmin) return

    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error loading admin logs:', error)
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivitySummary = async (daysBack = 7) => {
    if (!isAdmin) return

    try {
      const { data, error } = await supabase
        .rpc('get_admin_activity_summary', { days_back: daysBack })

      if (error) {
        console.error('Error loading activity summary:', error)
      } else {
        setActivitySummary(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const logAction = async (
    actionType: AdminLog['action_type'],
    description: string,
    targetResourceType?: AdminLog['target_resource_type'],
    targetResourceId?: string,
    targetResourceDetails?: any,
    metadata?: any,
    success = true,
    errorMessage?: string
  ) => {
    if (!user || !profile) {
      console.warn('Cannot log action: No user or profile available')
      return
    }

    try {
      // Get user agent and IP info
      const userAgent = navigator.userAgent

      const { data, error } = await supabase.rpc('log_admin_action', {
        p_admin_id: user.id,
        p_admin_email: profile.email,
        p_admin_name: profile.full_name || profile.email,
        p_action_type: actionType,
        p_action_description: description,
        p_target_resource_type: targetResourceType,
        p_target_resource_id: targetResourceId,
        p_target_resource_details: targetResourceDetails,
        p_metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          browser: userAgent
        },
        p_user_agent: userAgent,
        p_success: success,
        p_error_message: errorMessage
      })

      if (error) {
        console.error('Error logging admin action:', error)
      } else {
        // Refresh logs to show the new entry
        await loadLogs()
      }

      return { data, error }
    } catch (error) {
      console.error('Error:', error)
      return { data: null, error: error as Error }
    }
  }

  // Convenience methods for common actions
  const logInviteCodeGenerated = (codeId: string, code: string) => {
    return logAction(
      'invite_code_generated',
      `Generated new invite code: ${code}`,
      'invite_code',
      codeId,
      { code },
      { action: 'generate', code_length: code.length }
    )
  }

  const logInviteCodeDeleted = (codeId: string, code: string) => {
    return logAction(
      'invite_code_deleted',
      `Deleted invite code: ${code}`,
      'invite_code',
      codeId,
      { code },
      { action: 'delete' }
    )
  }

  const logUserRoleChanged = (userId: string, userEmail: string, oldRole: string, newRole: string) => {
    return logAction(
      'user_role_changed',
      `Changed user role for ${userEmail} from ${oldRole} to ${newRole}`,
      'user_profile',
      userId,
      { email: userEmail, old_role: oldRole, new_role: newRole },
      { action: 'role_change', user_email: userEmail }
    )
  }

  const logAdminLogin = () => {
    return logAction(
      'admin_login',
      `Admin logged in: ${profile?.email}`,
      'admin_session',
      user?.id,
      { email: profile?.email, name: profile?.full_name },
      { action: 'login', session_start: new Date().toISOString() }
    )
  }

  const logAdminLogout = () => {
    return logAction(
      'admin_logout',
      `Admin logged out: ${profile?.email}`,
      'admin_session',
      user?.id,
      { email: profile?.email, name: profile?.full_name },
      { action: 'logout', session_end: new Date().toISOString() }
    )
  }

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getActionIcon = (actionType: string) => {
    const iconMap: Record<string, string> = {
      invite_code_generated: '🎫',
      invite_code_deleted: '🗑️',
      user_role_changed: '👤',
      user_profile_updated: '✏️',
      admin_login: '🔐',
      admin_logout: '🚪',
      bulk_invite_generated: '🎟️',
      system_settings_changed: '⚙️'
    }
    return iconMap[actionType] || '📋'
  }

  return {
    logs,
    loading,
    activitySummary,
    logAction,
    logInviteCodeGenerated,
    logInviteCodeDeleted,
    logUserRoleChanged,
    logAdminLogin,
    logAdminLogout,
    loadLogs,
    loadActivitySummary,
    formatActionType,
    getActionIcon
  }
}