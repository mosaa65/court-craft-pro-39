
-- Enum
CREATE TYPE public.booking_status AS ENUM ('confirmed','pending','training','maintenance','cancelled');

-- Courts
CREATE TABLE public.courts (
  id text PRIMARY KEY,
  name text NOT NULL,
  sport text NOT NULL,
  sport_label text NOT NULL,
  surface text NOT NULL,
  price_per_hour numeric NOT NULL DEFAULT 0,
  image_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courts TO anon, authenticated;
GRANT ALL ON public.courts TO service_role;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read courts" ON public.courts FOR SELECT USING (true);
CREATE POLICY "public write courts" ON public.courts FOR INSERT WITH CHECK (true);
CREATE POLICY "public update courts" ON public.courts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete courts" ON public.courts FOR DELETE USING (true);

-- Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id text NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL DEFAULT '',
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  price numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "public update bookings" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete bookings" ON public.bookings FOR DELETE USING (true);

CREATE INDEX bookings_start_at_idx ON public.bookings (start_at);
CREATE INDEX bookings_court_id_idx ON public.bookings (court_id);
CREATE INDEX bookings_status_idx ON public.bookings (status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
