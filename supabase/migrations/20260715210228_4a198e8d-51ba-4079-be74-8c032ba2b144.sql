
-- 1) Recurrence link for weekly bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS recurrence_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_bookings_recurrence_group
  ON public.bookings(recurrence_group_id)
  WHERE recurrence_group_id IS NOT NULL;

-- 2) Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_phone
  ON public.customers(phone)
  WHERE phone <> '';

CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "public write customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "public update customers" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete customers" ON public.customers FOR DELETE USING (true);

CREATE TRIGGER trg_customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
