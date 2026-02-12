-- Add scheduling fields to interventions
ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS scheduled_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  message text not null,
  read boolean default false,
  type text default 'info', -- info, success, warning, error
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: System/Admins can insert notifications (simplified for now, anyone can insert for logic triggers)
CREATE POLICY "Anyone can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);
-- Add rental_id to interventions table to link detailed mission execution to a specific rental
ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS rental_id uuid references public.rentals(id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_interventions_rental_id ON public.interventions(rental_id);
-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  size numeric not null,
  unit text check (unit in ('hectares', 'casiers')) default 'hectares',
  department text,
  locality text,
  village text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  USING ( auth.uid() = owner_id );

CREATE POLICY "Users can insert their own properties"
  ON properties FOR INSERT
  WITH CHECK ( auth.uid() = owner_id );

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  USING ( auth.uid() = owner_id );

CREATE POLICY "Users can delete their own properties"
  ON properties FOR DELETE
  USING ( auth.uid() = owner_id );

-- Add property_id to rentals table and link to properties
ALTER TABLE public.rentals 
ADD COLUMN IF NOT EXISTS property_id uuid references public.properties(id);

-- Note: We generally refer to the table as 'properties', but the relationship name via PostgREST 
-- defaults to the table name if not aliased.
-- However, if the column is 'property_id', PostgREST often infers the relationship 'property' (singular) for the foreign key.
-- Let's explicitly define a comment to suggest to PostGUI/Users, but PostgREST inference works on constraint names usually.
-- Using 'property_id' usually allows selecting 'property' or 'properties' depending on cardinality.
-- Since rental -> property is N:1, it should be 'property'.

-- Add property_id to rentals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'property_id') THEN
        ALTER TABLE public.rentals ADD COLUMN property_id uuid references public.properties(id);
    END IF;
END $$;
-- Add missing columns to rentals table
ALTER TABLE public.rentals 
ADD COLUMN IF NOT EXISTS payment_status text check (payment_status in ('pending', 'paid', 'failed')) default 'pending',
ADD COLUMN IF NOT EXISTS prestation_type text,
ADD COLUMN IF NOT EXISTS planned_area numeric;

-- Comment on columns
COMMENT ON COLUMN public.rentals.payment_status IS 'Status of the payment for the rental';
COMMENT ON COLUMN public.rentals.prestation_type IS 'Type of service provided (e.g. Labour, Recolte)';
COMMENT ON COLUMN public.rentals.planned_area IS 'Area in hectares planned for the service';
-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  category text CHECK (category IN ('equipment', 'personnel', 'service')) NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL,
  reference text, -- Invoice or order reference
  expense_date date NOT NULL,
  status text CHECK (status IN ('pending', 'approved', 'paid')) DEFAULT 'pending',
  created_by uuid REFERENCES public.profiles(id),
  approved_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies for expenses
-- Accountants and Admins can view all expenses
CREATE POLICY "Accountants and Admins can view all expenses"
  ON public.expenses FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('accountant', 'admin', 'super_admin')
    )
  );

-- Accountants and Admins can insert expenses
CREATE POLICY "Accountants and Admins can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('accountant', 'admin', 'super_admin')
    )
  );

-- Accountants and Admins can update expenses
CREATE POLICY "Accountants and Admins can update expenses"
  ON public.expenses FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('accountant', 'admin', 'super_admin')
    )
  );

-- Accountants and Admins can delete expenses
CREATE POLICY "Accountants and Admins can delete expenses"
  ON public.expenses FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('accountant', 'admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

-- Create a view for financial summary (optional but helpful for easy access)
-- This view aggregates daily income (from payments) and expenses
CREATE OR REPLACE VIEW public.financial_daily_summary AS
SELECT
  COALESCE(i.date, e.date) as date,
  COALESCE(i.total_income, 0) as income,
  COALESCE(e.total_expense, 0) as expense,
  (COALESCE(i.total_income, 0) - COALESCE(e.total_expense, 0)) as balance
FROM
  (SELECT 
     date(created_at) as date, 
     SUM(amount) as total_income 
   FROM public.payment_transactions 
   GROUP BY date(created_at)) i
FULL OUTER JOIN
  (SELECT 
     expense_date as date, 
     SUM(amount) as total_expense 
   FROM public.expenses 
   WHERE status = 'paid'
   GROUP BY expense_date) e
ON i.date = e.date
ORDER BY date DESC;
-- Payment Methods and Harvest Recording System
-- This migration adds support for multiple payment methods (Cash, Credit, Mobile Money)
-- and harvest recording by property

-- ============================================
-- PAYMENT TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  rental_id uuid REFERENCES public.rentals(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'credit', 'mobile_money')) NOT NULL,
  transaction_reference text, -- For mobile money transactions (CinetPay reference)
  payment_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for payment_transactions
CREATE POLICY "Users can view their own payment transactions"
  ON payment_transactions FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.rentals
      WHERE rentals.id = payment_transactions.rental_id
      AND rentals.renter_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- ============================================
-- CREDITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.credits (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  rental_id uuid REFERENCES public.rentals(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.profiles(id) NOT NULL,
  total_amount numeric NOT NULL,
  amount_paid numeric DEFAULT 0 NOT NULL,
  amount_remaining numeric GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  due_date date,
  installments integer DEFAULT 1,
  interest_rate numeric DEFAULT 0,
  status text CHECK (status IN ('active', 'paid', 'overdue', 'cancelled')) DEFAULT 'active',
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for credits
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Policies for credits
CREATE POLICY "Users can view their own credits"
  ON credits FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Users can create their own credits"
  ON credits FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own credits"
  ON credits FOR UPDATE
  USING (auth.uid() = client_id);

-- ============================================
-- HARVESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.harvests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  farmer_id uuid REFERENCES public.profiles(id) NOT NULL,
  harvest_date date NOT NULL,
  crop_type text NOT NULL,
  quantity_bags integer NOT NULL, -- Nombre de sacs
  weight_kg numeric NOT NULL, -- Poids en kilogrammes
  kg_per_bag numeric GENERATED ALWAYS AS (
    CASE 
      WHEN quantity_bags > 0 THEN weight_kg / quantity_bags 
      ELSE 0 
    END
  ) STORED,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for harvests
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;

-- Policies for harvests
CREATE POLICY "Users can view their own harvests"
  ON harvests FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Users can create their own harvests"
  ON harvests FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Users can update their own harvests"
  ON harvests FOR UPDATE
  USING (auth.uid() = farmer_id);

CREATE POLICY "Users can delete their own harvests"
  ON harvests FOR DELETE
  USING (auth.uid() = farmer_id);

-- ============================================
-- RENTALS TABLE UPDATES
-- ============================================

-- Add payment method to rentals (if not exists)
ALTER TABLE public.rentals 
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cash', 'credit', 'mobile_money'));

-- Add credit terms as JSONB for flexibility
ALTER TABLE public.rentals
ADD COLUMN IF NOT EXISTS credit_terms jsonb;

-- Add partial payment tracking
ALTER TABLE public.rentals
ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;

ALTER TABLE public.rentals
ADD COLUMN IF NOT EXISTS amount_remaining numeric;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_transactions_rental_id ON public.payment_transactions(rental_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_by ON public.payment_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_credits_client_id ON public.credits(client_id);
CREATE INDEX IF NOT EXISTS idx_credits_property_id ON public.credits(property_id);
CREATE INDEX IF NOT EXISTS idx_credits_status ON public.credits(status);
CREATE INDEX IF NOT EXISTS idx_harvests_property_id ON public.harvests(property_id);
CREATE INDEX IF NOT EXISTS idx_harvests_farmer_id ON public.harvests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_harvests_harvest_date ON public.harvests(harvest_date);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for credits
DROP TRIGGER IF EXISTS update_credits_updated_at ON public.credits;
CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for harvests
DROP TRIGGER IF EXISTS update_harvests_updated_at ON public.harvests;
CREATE TRIGGER update_harvests_updated_at
  BEFORE UPDATE ON public.harvests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.payment_transactions IS 'Records all payment transactions for rentals';
COMMENT ON TABLE public.credits IS 'Tracks credit purchases and payment schedules';
COMMENT ON TABLE public.harvests IS 'Records harvest data by property with bag and kilogram measurements';

COMMENT ON COLUMN public.rentals.payment_method IS 'Payment method used: cash, credit, or mobile_money';
COMMENT ON COLUMN public.rentals.credit_terms IS 'JSON object containing credit terms (due_date, installments, interest_rate)';
COMMENT ON COLUMN public.credits.amount_remaining IS 'Automatically calculated remaining balance';
COMMENT ON COLUMN public.harvests.kg_per_bag IS 'Automatically calculated average weight per bag';
