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
