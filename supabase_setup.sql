-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id bigint NOT NULL,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    color text,
    icon text,
    budget double precision,
    budget_type text DEFAULT 'monthly',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT categories_pkey PRIMARY KEY (id, user_id)
);

-- Enable Row Level Security (RLS) on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Users can manage their own categories" 
    ON public.categories 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- 2. Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id bigint NOT NULL,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    amount double precision NOT NULL,
    date timestamp with time zone NOT NULL,
    note text,
    category_id bigint,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    currency text NOT NULL DEFAULT 'LKR' CHECK (currency IN ('USD', 'LKR')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT transactions_pkey PRIMARY KEY (id, user_id),
    CONSTRAINT fk_category FOREIGN KEY (category_id, user_id) REFERENCES public.categories (id, user_id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS) on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Users can manage their own transactions" 
    ON public.transactions 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
