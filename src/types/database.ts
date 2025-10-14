export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  phone: string | null
  specialties: string[]
  hourly_rate: number | null
  experience_years: number | null
  is_profile_public: boolean
  is_available: boolean
  show_contact_info: boolean
  show_rates: boolean
  profile_views_count: number
  last_active_at: string | null
  onboarding_completed: boolean
  user_type: 'artist' | 'client' | 'both' | null
  has_home_studio: boolean | null
  company_name: string | null
  industry: string | null
  project_types: string[]
  budget_range: string | null
  role: 'user' | 'admin'
  last_login_at: string | null
  last_login_ip: string | null
  failed_login_count: number
  account_locked_until: string | null
  password_changed_at: string | null
  is_active: boolean
  deactivated_by: string | null
  deactivated_at: string | null
  deactivation_reason: string | null
  subscription_plan_id: string | null
  subscription_status: 'active' | 'cancelled' | 'expired' | 'trial' | 'suspended'
  subscription_started_at: string | null
  subscription_expires_at: string | null
  billing_cycle: 'monthly' | 'yearly' | 'one_time' | 'free'
  vo_count: number
  storage_used_gb: number
  created_at: string
  updated_at: string
}

export interface InviteCode {
  id: string
  code: string
  created_by: string | null
  used_by: string | null
  is_used: boolean
  expires_at: string
  max_uses: number
  current_uses: number
  created_by_ip: string | null
  used_by_ip: string | null
  notes: string | null
  created_at: string
  used_at: string | null
  recipient_name: string | null
  recipient_email: string | null
  recipient_company: string | null
  email_status: 'not_sent' | 'pending' | 'delivered' | 'failed' | 'used' | 'expired' | 'cancelled'
  email_sent_at: string | null
  email_sent_by: string | null
}

export interface AdminLog {
  id: string
  admin_id: string | null
  admin_email: string
  admin_name: string | null
  action_type: 'invite_code_generated' | 'invite_code_deleted' | 'user_role_changed' | 'user_profile_updated' | 'admin_login' | 'admin_logout' | 'bulk_invite_generated' | 'system_settings_changed'
  action_description: string
  target_resource_type: 'invite_code' | 'user_profile' | 'system_setting' | 'admin_session' | null
  target_resource_id: string | null
  target_resource_details: any | null
  metadata: any | null
  ip_address: string | null
  user_agent: string | null
  success: boolean
  error_message: string | null
  created_at: string
}

export interface SecurityLog {
  id: string
  user_id: string | null
  event_type: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_token' | 'unauthorized_access' | 'sql_injection_attempt' | 'xss_attempt' | 'idor_attempt' | 'brute_force_attempt' | 'privilege_escalation_attempt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  ip_address: string | null
  user_agent: string | null
  request_path: string | null
  request_method: string | null
  request_payload: any | null
  blocked: boolean
  created_at: string
}

export interface SystemSetting {
  id: string
  setting_key: string
  setting_value: any
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'array'
  description: string | null
  is_public: boolean
  is_sensitive: boolean
  updated_by: string | null
  updated_at: string
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  ip_address: string | null
  user_agent: string | null
  is_admin_session: boolean
  last_activity: string
  expires_at: string
  is_active: boolean
  created_at: string
}

export interface UserAnalytics {
  id: string
  date: string
  total_users: number
  new_registrations: number
  active_users: number
  admin_users: number
  invite_codes_generated: number
  invite_codes_used: number
  failed_login_attempts: number
  security_incidents: number
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  plan_name: string
  plan_display_name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  max_vos: number
  max_storage_gb: number
  features: string[]
  is_active: boolean
  is_free: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SubscriptionPlanChange {
  id: string
  user_id: string
  old_plan_id: string | null
  new_plan_id: string | null
  changed_by: string | null
  change_reason: string | null
  is_admin_override: boolean
  change_type: 'upgrade' | 'downgrade' | 'trial' | 'cancellation' | 'admin_override' | 'system_change'
  effective_date: string
  created_at: string
}

export interface VOProfile {
  id: string
  user_id: string
  title: string
  description: string | null
  audio_file_url: string | null
  cover_image_url: string | null
  tags: string[]
  is_active: boolean
  is_featured: boolean
  view_count: number
  like_count: number
  share_count: number
  created_at: string
  updated_at: string
}

export interface ProfileAnalytics {
  id: string
  user_id: string
  vo_profile_id: string | null
  event_type: 'profile_view' | 'audio_play' | 'download' | 'share' | 'like' | 'contact_request'
  visitor_ip: string | null
  visitor_country: string | null
  visitor_city: string | null
  user_agent: string | null
  referrer: string | null
  session_id: string | null
  metadata: any
  created_at: string
}

export interface Opportunity {
  id: string
  user_id: string
  title: string
  description: string | null
  company_name: string | null
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  status: 'new' | 'viewed' | 'applied' | 'shortlisted' | 'hired' | 'declined' | 'expired'
  tags: string[]
  contact_email: string | null
  contact_phone: string | null
  project_type: 'commercial' | 'narration' | 'character' | 'audiobook' | 'podcast' | 'e-learning' | 'other' | null
  experience_level: 'beginner' | 'intermediate' | 'expert' | 'any' | null
  match_score: number
  is_premium: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      invite_codes: {
        Row: InviteCode
        Insert: Omit<InviteCode, 'id' | 'created_at' | 'used_at'>
        Update: Partial<Omit<InviteCode, 'id' | 'created_at'>>
      }
      admin_logs: {
        Row: AdminLog
        Insert: Omit<AdminLog, 'id' | 'created_at'>
        Update: Partial<Omit<AdminLog, 'id' | 'created_at'>>
      }
      security_logs: {
        Row: SecurityLog
        Insert: Omit<SecurityLog, 'id' | 'created_at'>
        Update: Partial<Omit<SecurityLog, 'id' | 'created_at'>>
      }
      system_settings: {
        Row: SystemSetting
        Insert: Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SystemSetting, 'id' | 'created_at'>>
      }
      user_sessions: {
        Row: UserSession
        Insert: Omit<UserSession, 'id' | 'created_at'>
        Update: Partial<Omit<UserSession, 'id' | 'created_at'>>
      }
      user_analytics: {
        Row: UserAnalytics
        Insert: Omit<UserAnalytics, 'id' | 'created_at'>
        Update: Partial<Omit<UserAnalytics, 'id' | 'created_at'>>
      }
      subscription_plans: {
        Row: SubscriptionPlan
        Insert: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>>
      }
      subscription_plan_changes: {
        Row: SubscriptionPlanChange
        Insert: Omit<SubscriptionPlanChange, 'id' | 'created_at'>
        Update: Partial<Omit<SubscriptionPlanChange, 'id' | 'created_at'>>
      }
      vo_profiles: {
        Row: VOProfile
        Insert: Omit<VOProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<VOProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      profile_analytics: {
        Row: ProfileAnalytics
        Insert: Omit<ProfileAnalytics, 'id' | 'created_at'>
        Update: Partial<Omit<ProfileAnalytics, 'id' | 'created_at'>>
      }
      opportunities: {
        Row: Opportunity
        Insert: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Functions: {
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      use_invite_code: {
        Args: {
          invite_code: string
          user_id: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_admin_id: string
          p_admin_email: string
          p_admin_name: string
          p_action_type: string
          p_action_description: string
          p_target_resource_type?: string
          p_target_resource_id?: string
          p_target_resource_details?: any
          p_metadata?: any
          p_ip_address?: string
          p_user_agent?: string
          p_success?: boolean
          p_error_message?: string
        }
        Returns: string
      }
      get_admin_activity_summary: {
        Args: {
          days_back?: number
        }
        Returns: {
          action_type: string
          action_count: number
          unique_admins: number
          latest_action: string
        }[]
      }
      log_security_event: {
        Args: {
          p_user_id?: string
          p_event_type: string
          p_severity: string
          p_description: string
          p_ip_address?: string
          p_user_agent?: string
          p_request_path?: string
          p_request_method?: string
          p_request_payload?: any
          p_blocked?: boolean
        }
        Returns: string
      }
      sanitize_input: {
        Args: {
          input_text: string
        }
        Returns: string
      }
      generate_bulk_invite_codes: {
        Args: {
          p_count: number
          p_created_by: string
          p_expires_days?: number
          p_max_uses?: number
          p_notes?: string
        }
        Returns: {
          code: string
          id: string
        }[]
      }
      search_users_secure: {
        Args: {
          p_search_term?: string
          p_role_filter?: string
          p_status_filter?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          email: string
          full_name: string
          role: string
          is_active: boolean
          last_login_at: string
          created_at: string
        }[]
      }
      calculate_daily_analytics: {
        Args: {
          target_date?: string
        }
        Returns: any
      }
      debug_user_counts: {
        Args: Record<PropertyKey, never>
        Returns: any
      }
      recalculate_recent_analytics: {
        Args: Record<PropertyKey, never>
        Returns: any
      }
      get_user_subscription_details: {
        Args: {
          p_user_id: string
        }
        Returns: any
      }
      admin_change_user_plan: {
        Args: {
          p_user_id: string
          p_new_plan_id: string
          p_admin_id: string
          p_change_reason?: string
          p_billing_cycle?: string
        }
        Returns: any
      }
      get_subscription_plans: {
        Args: Record<PropertyKey, never>
        Returns: SubscriptionPlan[]
      }
      get_user_dashboard_stats: {
        Args: {
          p_user_id: string
        }
        Returns: any
      }
      get_user_vo_profiles: {
        Args: {
          p_user_id: string
        }
        Returns: VOProfile[]
      }
      track_profile_view: {
        Args: {
          p_user_id: string
          p_vo_profile_id?: string
          p_visitor_ip?: string
          p_user_agent?: string
          p_referrer?: string
        }
        Returns: string
      }
      create_sample_opportunities: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      clear_sample_opportunities: {
        Args: {
          p_user_id: string
        }
        Returns: any
      }
      clear_all_sample_opportunities: {
        Args: Record<PropertyKey, never>
        Returns: any
      }
      debug_opportunities_count: {
        Args: {
          p_user_id: string
        }
        Returns: any
      }
      get_profile_stats: {
        Args: {
          p_user_id: string
        }
        Returns: {
          total_views: number
          total_likes: number
          total_shares: number
          monthly_views: number
          monthly_likes: number
          monthly_shares: number
        }
      }
    }
  }
}