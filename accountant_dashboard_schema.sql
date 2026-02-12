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
