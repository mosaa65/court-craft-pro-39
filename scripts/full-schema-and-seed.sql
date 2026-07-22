-- ============================================================
--  نظام إدارة العقارات والإيجارات - سكربت كامل
--  انسخ هذا الملف بالكامل والصقه في SQL Editor في Supabase
-- ============================================================

-- ===================== الأنواع (ENUMS) =====================

DO $$ BEGIN CREATE TYPE public.property_type AS ENUM ('building','villa','apartment_complex','commercial','land'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.property_status AS ENUM ('active','inactive','under_maintenance'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.unit_type AS ENUM ('apartment','room','shop','office','studio','floor','villa'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.unit_status AS ENUM ('available','reserved','rented','under_maintenance','unavailable'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.furnished_type AS ENUM ('furnished','semi_furnished','unfurnished'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.contract_status AS ENUM ('active','expired','terminated','cancelled','renewed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.payment_cycle AS ENUM ('monthly','quarterly','semi_annual','annual','custom'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.payment_timing AS ENUM ('advance','arrears'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.due_status AS ENUM ('pending','paid','partially_paid','overdue'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method AS ENUM ('cash','transfer','card','cheque','other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.expense_category AS ENUM ('maintenance','electricity','water','cleaning','services','fees','other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.maintenance_priority AS ENUM ('urgent','high','medium','low'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.maintenance_status AS ENUM ('new','in_progress','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.utility_type AS ENUM ('electricity','water'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ===================== الجداول =====================

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

-- ===================== الصلاحيات =====================

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

-- ============================================================
--  البيانات التجريبية
-- ============================================================

DO $$
DECLARE
  prop1_id uuid;
  prop2_id uuid;
  prop3_id uuid;
  prop4_id uuid;
  unit_a101 uuid;
  unit_a102 uuid;
  unit_a201 uuid;
  unit_a202 uuid;
  unit_shop01 uuid;
  unit_off101 uuid;
  unit_off102 uuid;
  unit_villa uuid;
  unit_nz101 uuid;
  unit_nz102 uuid;
  tenant1_id uuid;
  tenant2_id uuid;
  tenant3_id uuid;
  tenant4_id uuid;
  contract1_id uuid;
  contract2_id uuid;
  contract3_id uuid;
  contract4_id uuid;
  due1_id uuid;
  due2_id uuid;
  due3_id uuid;
  due4_id uuid;
  due5_id uuid;
  due6_id uuid;
  due7_id uuid;
  due8_id uuid;
  due9_id uuid;
  due10_id uuid;
  due11_id uuid;
  due12_id uuid;
BEGIN

-- العقارات
INSERT INTO public.properties (name, type, description, city, district, location, floors_count, total_area, year_built, amenities, status, image_url)
VALUES ('برج الياسمين الفاخر', 'building', 'برج سكني متميز يتكون من ٦ طوابق في موقع استراتيجي بقرب طريق الملك سلمان. يضم شققاً فاخرة بتشطيبات عالية الجودة ومرافق حديثة.', 'الرياض', 'حي الياسمين', 'طريق الملك سلمان، الرياض', 6, 1200, 2023, ARRAY['مواقف سفلية','مصعد ذكي','حراسة 24/7','كاميرات مراقبة'], 'active', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80')
RETURNING id INTO prop1_id;

INSERT INTO public.properties (name, type, description, city, district, location, floors_count, total_area, year_built, amenities, status, image_url)
VALUES ('مجمع الملقا التجاري', 'commercial', 'مجمع مكاتب ومعارض تجارية حديثة بمواجهات زجاجية وتصميم عصري متميز في قلب حي الملقا.', 'الرياض', 'حي الملقا', 'طريق أنس بن مالك، الرياض', 4, 2500, 2024, ARRAY['مواقف عملاء','مكيفات مركزية','مصاعد بانورامية'], 'active', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80')
RETURNING id INTO prop2_id;

INSERT INTO public.properties (name, type, description, city, district, location, floors_count, total_area, year_built, amenities, status, image_url)
VALUES ('فيلا الوفاء المودرن', 'villa', 'فيلا مستقلة بتشطيبات سوبر ديلوكس مع مسبح خاص وحديقة وإطلالة قريبة من الكورنيش.', 'جدة', 'حي الشاطئ', 'حي الشاطئ، بالقرب من الكورنيش', 2, 600, 2022, ARRAY['مسبح خاص','حديقة','كراج سيارتين','ملحق خارجي'], 'active', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80')
RETURNING id INTO prop3_id;

INSERT INTO public.properties (name, type, description, city, district, location, floors_count, total_area, year_built, amenities, status, image_url)
VALUES ('عمارة النزهة السكنية', 'apartment_complex', 'عمارة شقق سكنية عائلية هادئة وقريبة من جميع الخدمات ومراكز التسوق والمدارس.', 'الرياض', 'حي النزهة', 'شارع الأمير مقرن، الرياض', 3, 950, 2021, ARRAY['مصعد','مواقف مظللة','صيانة دورية'], 'active', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80')
RETURNING id INTO prop4_id;

-- الوحدات
INSERT INTO public.units VALUES (gen_random_uuid(), prop1_id, 'A-101', 'apartment', 1, 145, 3, 2, 'semi_furnished', 45000, 3000, 'rented', now(), now()) RETURNING id INTO unit_a101;
INSERT INTO public.units VALUES (gen_random_uuid(), prop1_id, 'A-102', 'apartment', 1, 160, 4, 3, 'unfurnished', 52000, 3500, 'available', now(), now()) RETURNING id INTO unit_a102;
INSERT INTO public.units VALUES (gen_random_uuid(), prop1_id, 'A-201', 'apartment', 2, 145, 3, 2, 'furnished', 60000, 4000, 'rented', now(), now()) RETURNING id INTO unit_a201;
INSERT INTO public.units VALUES (gen_random_uuid(), prop1_id, 'A-202', 'apartment', 2, 160, 4, 3, 'unfurnished', 54000, 3500, 'available', now(), now()) RETURNING id INTO unit_a202;
INSERT INTO public.units VALUES (gen_random_uuid(), prop2_id, 'Shop-01', 'shop', 0, 90, 1, 1, 'unfurnished', 90000, 5000, 'rented', now(), now()) RETURNING id INTO unit_shop01;
INSERT INTO public.units VALUES (gen_random_uuid(), prop2_id, 'Office-101', 'office', 1, 120, 3, 2, 'semi_furnished', 75000, 5000, 'available', now(), now()) RETURNING id INTO unit_off101;
INSERT INTO public.units VALUES (gen_random_uuid(), prop2_id, 'Office-102', 'office', 1, 150, 4, 2, 'unfurnished', 85000, 5000, 'rented', now(), now()) RETURNING id INTO unit_off102;
INSERT INTO public.units VALUES (gen_random_uuid(), prop3_id, 'VILLA-MAIN', 'villa', 1, 600, 6, 5, 'furnished', 180000, 10000, 'rented', now(), now()) RETURNING id INTO unit_villa;
INSERT INTO public.units VALUES (gen_random_uuid(), prop4_id, '101', 'apartment', 1, 130, 3, 2, 'unfurnished', 42000, 2500, 'available', now(), now()) RETURNING id INTO unit_nz101;
INSERT INTO public.units VALUES (gen_random_uuid(), prop4_id, '102', 'apartment', 1, 130, 3, 2, 'unfurnished', 42000, 2500, 'available', now(), now()) RETURNING id INTO unit_nz102;

-- المستأجرين
INSERT INTO public.tenants (name, phone, email, id_number, id_type, address, nationality, notes)
VALUES ('عبد الله بن فهد القحطاني', '0501234567', 'abdullah@example.com', '1089234123', 'national_id', 'الرياض، حي النفل', 'سعودي', 'مستأجر ممتاز ومواظب على السداد.') RETURNING id INTO tenant1_id;
INSERT INTO public.tenants (name, phone, email, id_number, id_type, address, nationality, notes)
VALUES ('د. سارة بنت محمد العتيبي', '0559876543', 'sara@example.com', '1045612389', 'national_id', 'الرياض، حي الياسمين', 'سعودية', 'طبيبة في مستشفى الملك خالد الجامعي.') RETURNING id INTO tenant2_id;
INSERT INTO public.tenants (name, phone, email, id_number, id_type, address, nationality, notes)
VALUES ('م. خالد عبد الرحمن السليمان', '0534567890', 'khaled@example.com', '1078901234', 'national_id', 'جدة، حي الشاطئ', 'سعودي', 'مهندس معماري - عقد طويل الأجل.') RETURNING id INTO tenant3_id;
INSERT INTO public.tenants (name, phone, email, id_number, id_type, address, nationality, notes)
VALUES ('شركة الأفق للتكنولوجيا والحلول', '0112345678', 'info@horizonteck.sa', '1010998877', 'commercial_reg', 'الرياض، طريق أنس بن مالك', 'شركة سعودية', 'شركة تقنية - عقد تجاري معرض.') RETURNING id INTO tenant4_id;

-- العقود
INSERT INTO public.contracts (contract_number, tenant_id, unit_id, start_date, end_date, duration_months, rent_amount, deposit_amount, payment_cycle, payment_timing, status, auto_renew, notes)
VALUES ('CNT-2026-8801', tenant1_id, unit_a101, '2026-01-01', '2026-12-31', 12, 45000, 3000, 'quarterly', 'advance', 'active', true, 'يدفع كل ٣ أشهر (١١,٢٥٠ ر.س لكل دفعة).') RETURNING id INTO contract1_id;
INSERT INTO public.contracts (contract_number, tenant_id, unit_id, start_date, end_date, duration_months, rent_amount, deposit_amount, payment_cycle, payment_timing, status, auto_renew, notes)
VALUES ('CNT-2026-8802', tenant2_id, unit_a201, '2026-02-01', '2027-01-31', 12, 60000, 4000, 'monthly', 'advance', 'active', false, 'سداد شهري ٥,٠٠٠ ر.س.') RETURNING id INTO contract2_id;
INSERT INTO public.contracts (contract_number, tenant_id, unit_id, start_date, end_date, duration_months, rent_amount, deposit_amount, payment_cycle, payment_timing, status, auto_renew, notes)
VALUES ('CNT-2026-8803', tenant3_id, unit_villa, '2026-03-01', '2027-02-28', 12, 180000, 10000, 'semi_annual', 'advance', 'active', true, 'دفعتين سنوية ٩٠,٠٠٠ ر.س.') RETURNING id INTO contract3_id;
INSERT INTO public.contracts (contract_number, tenant_id, unit_id, start_date, end_date, duration_months, rent_amount, deposit_amount, payment_cycle, payment_timing, status, auto_renew, notes)
VALUES ('CNT-2026-8804', tenant4_id, unit_shop01, '2026-01-15', '2027-01-14', 12, 90000, 5000, 'quarterly', 'advance', 'active', true, 'عقد تجاري معرض.') RETURNING id INTO contract4_id;

-- الاستحقاقات
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract1_id, '2026-01-01', 11250, 11250, 'paid', 'دفعة الإيجار الأولى (Q1)') RETURNING id INTO due1_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract1_id, '2026-04-01', 11250, 11250, 'paid', 'دفعة الإيجار الثانية (Q2)') RETURNING id INTO due2_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract1_id, '2026-07-01', 11250, 5000, 'partially_paid', 'دفعة الإيجار الثالثة (Q3)') RETURNING id INTO due3_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract1_id, '2026-10-01', 11250, 0, 'pending', 'دفعة الإيجار الرابعة (Q4)') RETURNING id INTO due4_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract2_id, '2026-02-01', 5000, 5000, 'paid', 'إيجار شهر فبراير ٢٠٢٦') RETURNING id INTO due5_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract2_id, '2026-03-01', 5000, 5000, 'paid', 'إيجار شهر مارس ٢٠٢٦') RETURNING id INTO due6_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract2_id, '2026-04-01', 5000, 5000, 'paid', 'إيجار شهر أبريل ٢٠٢٦') RETURNING id INTO due7_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract2_id, '2026-05-01', 5000, 5000, 'paid', 'إيجار شهر مايو ٢٠٢٦') RETURNING id INTO due8_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract2_id, '2026-06-01', 5000, 5000, 'paid', 'إيجار شهر يونيو ٢٠٢٦') RETURNING id INTO due9_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract2_id, '2026-07-01', 5000, 0, 'overdue', 'إيجار شهر يوليو ٢٠٢٦ (متأخر!)') RETURNING id INTO due10_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract3_id, '2026-03-01', 90000, 90000, 'paid', 'دفعة النصف الأول من الإيجار') RETURNING id INTO due11_id;
INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title) VALUES (contract3_id, '2026-09-01', 90000, 0, 'pending', 'دفعة النصف الثاني من الإيجار') RETURNING id INTO due12_id;

-- سندات القبض
INSERT INTO public.payments (contract_id, tenant_id, due_id, amount, payment_date, payment_method, receipt_number, notes) VALUES
(contract1_id, tenant1_id, due1_id, 11250, '2026-01-01 10:00:00+03', 'transfer', 'REC-2026-10001', 'تحويل بنكي على الراجحي — دفعة الربع الأول'),
(contract1_id, tenant1_id, due2_id, 11250, '2026-04-02 11:30:00+03', 'transfer', 'REC-2026-10002', 'تحويل بنكي — دفعة الربع الثاني'),
(contract1_id, tenant1_id, due3_id, 5000,  '2026-07-05 09:00:00+03', 'cash',     'REC-2026-10003', 'سداد نقدي جزئي — ٥,٠٠٠ من أصل ١١,٢٥٠'),
(contract2_id, tenant2_id, due5_id, 5000,  '2026-02-01 09:15:00+03', 'card',     'REC-2026-10004', 'دفع عبر مدى — إيجار فبراير'),
(contract2_id, tenant2_id, due6_id, 5000,  '2026-03-01 10:00:00+03', 'transfer', 'REC-2026-10005', 'تحويل بنكي — إيجار مارس'),
(contract2_id, tenant2_id, due7_id, 5000,  '2026-04-01 10:20:00+03', 'transfer', 'REC-2026-10006', 'تحويل بنكي — إيجار أبريل'),
(contract2_id, tenant2_id, due8_id, 5000,  '2026-05-02 08:45:00+03', 'card',     'REC-2026-10007', 'دفع عبر مدى — إيجار مايو'),
(contract2_id, tenant2_id, due9_id, 5000,  '2026-06-01 11:00:00+03', 'transfer', 'REC-2026-10008', 'تحويل — إيجار يونيو'),
(contract3_id, tenant3_id, due11_id,90000, '2026-03-01 14:00:00+03', 'cheque',   'REC-2026-10009', 'شيك مصدق رقم ٤٤٩٢٠١ — دفعة نصفية أولى');

-- المصروفات
INSERT INTO public.expenses (property_id, category, amount, description, expense_date, vendor, notes) VALUES
(prop1_id, 'maintenance', 1400, 'صيانة وتغيير زيوت المصعد الرئيسي', '2026-06-10', 'شركة أطلس للمصاعد', 'صيانة دورية كل ٦ أشهر'),
(prop1_id, 'electricity', 850, 'فاتورة كهرباء خدمات العمارة والإنارة العامة', '2026-07-05', 'شركة الكهرباء السعودية', 'فاتورة شهر يونيو ٢٠٢٦'),
(prop2_id, 'cleaning', 2200, 'عقد نظافة المجمع التجاري وغسيل الواجهات الزجاجية', '2026-07-01', 'مؤسسة النظافة الفائقة', 'تنظيف شهري + غسيل خارجي'),
(prop3_id, 'maintenance', 3500, 'صيانة المسبح والفلاتر', '2026-05-15', 'شركة المسابح المتقدمة', 'فلاتر + تنظيف كيميائي'),
(prop1_id, 'water', 320, 'فاتورة مياه خدمات العمارة', '2026-07-10', 'شركة المياه الوطنية', 'فاتورة شهر يونيو');

-- بلاغات الصيانة
INSERT INTO public.maintenance_requests (property_id, unit_id, tenant_id, title, description, category, priority, status, cost, notes) VALUES
(prop1_id, unit_a101, tenant1_id, 'تسريب مياه بسيط في حمام الماستر', 'يوجد تنقيط مستمر تحت المغسلة يحتاج تغيير جلبة وصنبور.', 'plumbing', 'medium', 'in_progress', 150, 'تم إرسال السباك — موعد الإصلاح غداً'),
(prop2_id, unit_shop01, tenant4_id, 'صيانة مكيف المعرض التجاري', 'المكيف السبليت الرئيسي لا يبرد بالشكل الكافي ويصدر صوتاً.', 'hvac', 'high', 'new', 400, 'بلاغ جديد — بانتظار الفني');

-- قراءات العدادات
INSERT INTO public.utility_readings (unit_id, type, previous_reading, current_reading, price_per_unit, total_amount, reading_date, billed_to_tenant, notes) VALUES
(unit_a101, 'electricity', 12400, 13150, 0.18, 135, '2026-07-01', true, 'استهلاك ٧٥٠ كيلوواط ساعة — شهر يونيو'),
(unit_a101, 'water', 340, 365, 6.0, 150, '2026-07-01', true, 'استهلاك ٢٥ متر مكعب — شهر يونيو'),
(unit_a201, 'electricity', 8900, 9600, 0.18, 126, '2026-07-01', true, 'استهلاك ٧٠٠ كيلوواط ساعة');

-- الإشعارات
INSERT INTO public.notifications (kind, title, body, contract_id, tenant_id, read, created_at) VALUES
('contract_created', 'عقد إيجار جديد', 'تم إبرام العقد CNT-2026-8801 للمستأجر عبد الله بن فهد القحطاني — وحدة A-101 في برج الياسمين بقيمة ٤٥,٠٠٠ ر.س سنوياً.', contract1_id, tenant1_id, false, NOW()),
('payment_received', 'تم استلام دفعة إيجار', 'تم استلام مبلغ ١١,٢٥٠ ر.س من المستأجر عبد الله بن فهد القحطاني — سند قبض REC-2026-10001 (تحويل بنكي).', contract1_id, tenant1_id, false, NOW() - INTERVAL '1 day'),
('due_overdue', 'تنبيه: دفعة إيجار متأخرة!', 'دفعة إيجار شهر يوليو للمستأجرة د. سارة بنت محمد العتيبي متأخرة بمبلغ ٥,٠٠٠ ر.س — وحدة A-201 في برج الياسمين.', contract2_id, tenant2_id, false, NOW() - INTERVAL '2 days'),
('contract_created', 'عقد إيجار فيلا', 'تم إبرام العقد CNT-2026-8803 للمستأجر م. خالد عبد الرحمن السليمان — فيلا الوفاء المودرن في جدة بقيمة ١٨٠,٠٠٠ ر.س سنوياً.', contract3_id, tenant3_id, true, NOW() - INTERVAL '4 months'),
('payment_received', 'شيك مصدق — فيلا الوفاء', 'تم استلام شيك مصدق بمبلغ ٩٠,٠٠٠ ر.س من م. خالد السليمان — سند REC-2026-10009 (الدفعة النصفية الأولى).', contract3_id, tenant3_id, true, NOW() - INTERVAL '4 months');

END $$;
