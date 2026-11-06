-- SkillWeave AI: Database Migration 001 - Security, RLS & Workspace Layout
-- Applies Row-Level Security, Encrypted Notes Support, and Persistent VS Code Workspace Settings

-- 1. Workspace Settings Table (Stores persistent panel sizes, themes, and open tabs per user)
CREATE TABLE IF NOT EXISTS public.workspace_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark',
    sidebar_width INTEGER NOT NULL DEFAULT 280,
    ai_panel_width INTEGER NOT NULL DEFAULT 360,
    terminal_height INTEGER NOT NULL DEFAULT 220,
    sidebar_collapsed BOOLEAN NOT NULL DEFAULT false,
    ai_panel_collapsed BOOLEAN NOT NULL DEFAULT false,
    terminal_collapsed BOOLEAN NOT NULL DEFAULT false,
    active_tab TEXT NOT NULL DEFAULT 'video',
    open_tabs JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_sidebar_view TEXT NOT NULL DEFAULT 'explorer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- 2. Notes Table Upgrade for Client-Side End-to-End Encryption
ALTER TABLE public.notes 
    ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS encryption_metadata JSONB DEFAULT NULL;

-- 3. Row-Level Security Policies for Workspace Settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'workspace_settings' 
          AND policyname = 'Users can view their own workspace settings'
    ) THEN
        CREATE POLICY "Users can view their own workspace settings"
            ON public.workspace_settings
            FOR SELECT
            TO authenticated
            USING ((SELECT auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'workspace_settings' 
          AND policyname = 'Users can insert their own workspace settings'
    ) THEN
        CREATE POLICY "Users can insert their own workspace settings"
            ON public.workspace_settings
            FOR INSERT
            TO authenticated
            WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'workspace_settings' 
          AND policyname = 'Users can update their own workspace settings'
    ) THEN
        CREATE POLICY "Users can update their own workspace settings"
            ON public.workspace_settings
            FOR UPDATE
            TO authenticated
            USING ((SELECT auth.uid()) = user_id)
            WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
END $$;
