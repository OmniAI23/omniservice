-- ==========================================
-- Database Schema Setup for Bot Application
-- ==========================================

-- 1. PROFILES TABLE (Mirrors Auth Users for Email Searching)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for Profiles
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" ON public.profiles 
        FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    CREATE POLICY "Admins can view all profiles" ON public.profiles
        FOR SELECT USING (auth.jwt() ->> 'email' = 'placidusagukwe21@gmail.com');
END $$;


-- 2. AUTH SYNC TRIGGER
-- --------------------------------------------------------
-- This function inserts a row into public.profiles whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. BOTS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description VARCHAR(255),
    is_published BOOLEAN DEFAULT FALSE,
    public_id UUID UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for Bots
DO $$ 
BEGIN
    -- Allow users full access to their own bots
    DROP POLICY IF EXISTS "Users can manage their own bots" ON public.bots;
    CREATE POLICY "Users can manage their own bots" ON public.bots
        FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    -- Allow anyone to see published bots (for public chat feature)
    DROP POLICY IF EXISTS "Public can view published bots" ON public.bots;
    CREATE POLICY "Public can view published bots" ON public.bots
        FOR SELECT USING (is_published = TRUE);

    -- Admin overrides
    DROP POLICY IF EXISTS "Admins can view all bots" ON public.bots;
    CREATE POLICY "Admins can view all bots" ON public.bots
        FOR SELECT USING (auth.jwt() ->> 'email' = 'placidusagukwe21@gmail.com');
END $$;


-- 4. UPDATED_AT TRIGGER
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_bots_updated_at ON public.bots;
CREATE TRIGGER update_bots_updated_at
    BEFORE UPDATE ON public.bots
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- END OF SETUP
-- ==========================================
