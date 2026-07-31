-- Real Estate Management System Database Schema

-- Types / Enums
CREATE TYPE public.property_type AS ENUM ('building', 'villa', 'apartment_complex', 'commercial', 'land');
CREATE TYPE public.property_status AS ENUM ('active', 'inactive', 'under_maintenance');

CREATE TYPE public.unit_type AS ENUM ('apartment', 'room', 'shop', 'office', 'studio', 'floor', 'villa');
CREATE TYPE public.unit_status AS ENUM ('available', 'reserved', 'rented', 'under_maintenance', 'unavailable');
CREATE TYPE public.furnished_type AS ENUM ('furnished', 'semi_furnished', 'unfurnished');

CREATE TYPE public.contract_status AS ENUM ('active', 'expired', 'terminated', 'cancelled', 'renewed');
CREATE TYPE public.payment_cycle AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual', 'custom');
CREATE TYPE public.payment_timing AS ENUM ('advance', 'arrears');

CREATE TYPE public.due_status AS ENUM ('pending', 'paid', 'partially_paid', 'overdue');
CREATE TYPE public.payment_method AS ENUM ('cash', 'transfer', 'card', 'cheque', 'other');

CREATE TYPE public.expense_category AS ENUM ('maintenance', 'electricity', 'water', 'cleaning', 'services', 'fees', 'other');
CREATE TYPE public.maintenance_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE public.maintenance_status AS ENUM ('new', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.utility_type AS ENUM ('electricity', 'water');

-- 1) Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.property_type NOT NULL DEFAULT 'building',
  description text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  floors_count integer NOT NULL DEFAULT 1,
  total_area numeric NOT NULL DEFAULT 0,
  year_built integer,
  amenities text[] DEFAULT '{}',
  status public.property_status NOT NULL DEFAULT 'active',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Units Table
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  type public.unit_type NOT NULL DEFAULT 'apartment',
  floor integer NOT NULL DEFAULT 0,
  area numeric NOT NULL DEFAULT 0,
  rooms integer NOT NULL DEFAULT 1,
  bathrooms integer NOT NULL DEFAULT 1,
  furnished public.furnished_type NOT NULL DEFAULT 'unfurnished',
  rent_price numeric NOT NULL DEFAULT 0,
  deposit_amount numeric NOT NULL DEFAULT 0,
  status public.unit_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  id_number text NOT NULL DEFAULT '',
  id_type text NOT NULL DEFAULT 'national_id',
  address text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT '',
  emergency_contact text NOT NULL DEFAULT '',
  emergency_phone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Contracts Table
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text NOT NULL UNIQUE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_months integer NOT NULL DEFAULT 12,
  rent_amount numeric NOT NULL DEFAULT 0,
  deposit_amount numeric NOT NULL DEFAULT 0,
  payment_cycle public.payment_cycle NOT NULL DEFAULT 'monthly',
  payment_timing public.payment_timing NOT NULL DEFAULT 'advance',
  custom_months integer,
  status public.contract_status NOT NULL DEFAULT 'active',
  auto_renew boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Dues Table (Payment Schedules)
CREATE TABLE IF NOT EXISTS public.dues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status public.due_status NOT NULL DEFAULT 'pending',
  title text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Payments Table (Receipts)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  due_id uuid REFERENCES public.dues(id) ON DELETE SET NULL,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_method public.payment_method NOT NULL DEFAULT 'transfer',
  receipt_number text NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7) Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  category public.expense_category NOT NULL DEFAULT 'maintenance',
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  vendor text NOT NULL DEFAULT '',
  receipt_url text,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8) Maintenance Requests Table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  priority public.maintenance_priority NOT NULL DEFAULT 'medium',
  status public.maintenance_status NOT NULL DEFAULT 'new',
  cost numeric NOT NULL DEFAULT 0,
  images text[] DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9) Utility Readings Table
CREATE TABLE IF NOT EXISTS public.utility_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  type public.utility_type NOT NULL DEFAULT 'electricity',
  previous_reading numeric NOT NULL DEFAULT 0,
  current_reading numeric NOT NULL DEFAULT 0,
  price_per_unit numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  reading_date date NOT NULL DEFAULT CURRENT_DATE,
  billed_to_tenant boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10) Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE,
  due_id uuid REFERENCES public.dues(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Grants & RLS Policies
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_properties" ON public.properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_units" ON public.units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tenants" ON public.tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_dues" ON public.dues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_maintenance" ON public.maintenance_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_utilities" ON public.utility_readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
