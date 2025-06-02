-- Fix data types and ensure proper column structure
DO $$ 
BEGIN
    -- Drop and recreate companies table columns with correct types
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'balance') THEN
        ALTER TABLE public.companies DROP COLUMN balance;
    END IF;
    
    -- Add custody-related columns with correct types
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'custody_account_id') THEN
        ALTER TABLE public.companies ADD COLUMN custody_account_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'custody_account_name') THEN
        ALTER TABLE public.companies ADD COLUMN custody_account_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'nowpayments_account_id') THEN
        ALTER TABLE public.companies ADD COLUMN nowpayments_account_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'balance_id') THEN
        ALTER TABLE public.companies ADD COLUMN balance_id VARCHAR(255);
    END IF;
END $$;

-- Create custody_transactions table with proper structure
CREATE TABLE IF NOT EXISTS public.custody_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    custody_account_id VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer')),
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(20) NOT NULL,
    crypto_currency VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    nowpayments_payment_id VARCHAR(255),
    withdrawal_address TEXT,
    withdrawal_extra_id VARCHAR(255),
    payment_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custody_transactions_company_id ON public.custody_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_custody_transactions_status ON public.custody_transactions(status);
CREATE INDEX IF NOT EXISTS idx_custody_transactions_created_at ON public.custody_transactions(created_at);

-- Enable RLS
ALTER TABLE public.custody_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for custody_transactions
DROP POLICY IF EXISTS "Companies can manage their own custody transactions" ON public.custody_transactions;
CREATE POLICY "Companies can manage their own custody transactions" ON public.custody_transactions
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM public.companies c
            JOIN public.users u ON u.company_id = c.id
            WHERE u.id = auth.uid()
        )
    );

-- Fix join_requests table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'join_requests') THEN
        -- Drop existing foreign key constraints
        ALTER TABLE public.join_requests DROP CONSTRAINT IF EXISTS join_requests_user_id_fkey;
        
        -- Add correct foreign key constraint
        ALTER TABLE public.join_requests 
        ADD CONSTRAINT join_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update trigger for custody_transactions
CREATE OR REPLACE FUNCTION update_custody_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custody_transactions_updated_at ON public.custody_transactions;
CREATE TRIGGER update_custody_transactions_updated_at
    BEFORE UPDATE ON public.custody_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_custody_transactions_updated_at();
