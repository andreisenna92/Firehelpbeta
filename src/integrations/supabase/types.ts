export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          resolved: boolean
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          resolved?: boolean
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          resolved?: boolean
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      fire_report_images: {
        Row: {
          created_at: string
          fire_report_id: string
          id: string
          image_url: string
        }
        Insert: {
          created_at?: string
          fire_report_id: string
          id?: string
          image_url: string
        }
        Update: {
          created_at?: string
          fire_report_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fire_report_images_fire_report_id_fkey"
            columns: ["fire_report_id"]
            isOneToOne: false
            referencedRelation: "fire_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      fire_reports: {
        Row: {
          address: string | null
          description: string | null
          id: string
          is_demo: boolean
          latitude: number
          longitude: number
          protocol: string
          reported_at: string
          severity: Database["public"]["Enums"]["fire_severity"]
          status: Database["public"]["Enums"]["fire_status"]
          type: Database["public"]["Enums"]["fire_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          latitude: number
          longitude: number
          protocol?: string
          reported_at?: string
          severity: Database["public"]["Enums"]["fire_severity"]
          status?: Database["public"]["Enums"]["fire_status"]
          type: Database["public"]["Enums"]["fire_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          latitude?: number
          longitude?: number
          protocol?: string
          reported_at?: string
          severity?: Database["public"]["Enums"]["fire_severity"]
          status?: Database["public"]["Enums"]["fire_status"]
          type?: Database["public"]["Enums"]["fire_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fire_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          fire_report_id: string
          id: string
          new_status: Database["public"]["Enums"]["fire_status"]
          old_status: Database["public"]["Enums"]["fire_status"] | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          fire_report_id: string
          id?: string
          new_status: Database["public"]["Enums"]["fire_status"]
          old_status?: Database["public"]["Enums"]["fire_status"] | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          fire_report_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["fire_status"]
          old_status?: Database["public"]["Enums"]["fire_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fire_status_history_fire_report_id_fkey"
            columns: ["fire_report_id"]
            isOneToOne: false
            referencedRelation: "fire_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_name: string | null
          category: Database["public"]["Enums"]["forum_category"]
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_demo: boolean
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          category?: Database["public"]["Enums"]["forum_category"]
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_demo?: boolean
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          category?: Database["public"]["Enums"]["forum_category"]
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_demo?: boolean
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: Database["public"]["Enums"]["news_category"]
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_demo: boolean
          published: boolean
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: Database["public"]["Enums"]["news_category"]
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_demo?: boolean
          published?: boolean
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: Database["public"]["Enums"]["news_category"]
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_demo?: boolean
          published?: boolean
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          last_seen_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          last_seen_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          last_seen_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin"
      fire_severity: "pequeno" | "medio" | "grande" | "emergencia"
      fire_status:
        | "pending"
        | "verified"
        | "active"
        | "resolved"
        | "false_report"
      fire_type:
        | "florestal"
        | "residencial"
        | "comercial"
        | "veicular"
        | "queimada"
        | "outro"
      forum_category:
        | "incendios"
        | "meio_ambiente"
        | "prevencao"
        | "seguranca"
        | "alertas"
        | "comunidade"
        | "geral"
      news_category:
        | "prevencao"
        | "incendios"
        | "meio_ambiente"
        | "seguranca"
        | "alertas"
        | "comunidade"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "moderator", "admin"],
      fire_severity: ["pequeno", "medio", "grande", "emergencia"],
      fire_status: [
        "pending",
        "verified",
        "active",
        "resolved",
        "false_report",
      ],
      fire_type: [
        "florestal",
        "residencial",
        "comercial",
        "veicular",
        "queimada",
        "outro",
      ],
      forum_category: [
        "incendios",
        "meio_ambiente",
        "prevencao",
        "seguranca",
        "alertas",
        "comunidade",
        "geral",
      ],
      news_category: [
        "prevencao",
        "incendios",
        "meio_ambiente",
        "seguranca",
        "alertas",
        "comunidade",
      ],
    },
  },
} as const
