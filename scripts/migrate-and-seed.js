import fs from "fs";
import path from "path";
import pg from "pg";

const connectionString = "postgresql://postgres:snuptN7cg57qoswN@db.llvszoblxpblvwzmlkeq.supabase.co:5432/postgres";

async function run() {
  console.log("⚡ Connecting to Supabase Postgres database...");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected successfully!");

  // 1. Read and run DDL schema
  const schemaPath = path.join(process.cwd(), "supabase", "migrations", "20260722020000_real_estate_schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  console.log("📜 Executing Real Estate Schema DDL Migration...");
  await client.query(schemaSql);
  console.log("✅ Schema created successfully!");

  // 2. Insert Sample Properties
  console.log("🌱 Inserting Sample Data...");

  const propRes = await client.query(`
    INSERT INTO public.properties (name, type, description, city, district, location, floors_count, total_area, year_built, amenities, status, image_url)
    VALUES
    ('برج الياسمين الفاخر', 'building', 'برج سكني متميز يتكون من ٦ طوابق في موقع استراتيجي.', 'الرياض', 'حي الياسمين', 'طريق الملك سلمان، الرياض', 6, 1200, 2023, ARRAY['مواقف سفلية', 'مصعد ذكي', 'حراسة 24/7', 'كاميرات مراقبة'], 'active', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'),
    ('مجمع الملقا التجاري', 'commercial', 'مجمع مكاتب ومعارض تجارية حديثة بمواجهات زجاجية.', 'الرياض', 'حي الملقا', 'طريق انس بن مالك، الرياض', 4, 2500, 2024, ARRAY['مواقف عملاء', 'مكيفات مركزية', 'مصاعد بانورامية'], 'active', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'),
    ('فيلا الوفاء المودرن', 'villa', 'فيلا مستقلا بتشطيبات سوبر ديلوكس مع مسبح وحديقة خاصة.', 'جدة', 'حي الشاطئ', 'حي الشاطئ، بالقرب من الكورنيش', 2, 600, 2022, ARRAY['مسبح خاص', 'حديقة', 'كراج سيارتين', 'ملحق خارجي'], 'active', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'),
    ('عمارة النزهة السكنية', 'apartment_complex', 'عمارة شقق سكنية عائلية هادئة وقريبة من الخدمات.', 'الرياض', 'حي النزهة', 'شارع الامير مقرن، الرياض', 3, 950, 2021, ARRAY['مصعد', 'مواقف مظللة', 'صيانة دورية'], 'active', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80')
    RETURNING id, name;
  `);

  const propMap = {};
  propRes.rows.forEach(r => propMap[r.name] = r.id);

  // 3. Insert Units
  const unitRes = await client.query(`
    INSERT INTO public.units (property_id, unit_number, type, floor, area, rooms, bathrooms, furnished, rent_price, deposit_amount, status)
    VALUES
    ('${propMap['برج الياسمين الفاخر']}', 'A-101', 'apartment', 1, 145, 3, 2, 'semi_furnished', 45000, 3000, 'rented'),
    ('${propMap['برج الياسمين الفاخر']}', 'A-102', 'apartment', 1, 160, 4, 3, 'unfurnished', 52000, 3500, 'available'),
    ('${propMap['برج الياسمين الفاخر']}', 'A-201', 'apartment', 2, 145, 3, 2, 'furnished', 60000, 4000, 'rented'),
    ('${propMap['برج الياسمين الفاخر']}', 'A-202', 'apartment', 2, 160, 4, 3, 'unfurnished', 54000, 3500, 'available'),
    ('${propMap['مجمع الملقا التجاري']}', 'Shop-01', 'shop', 0, 90, 1, 1, 'unfurnished', 90000, 5000, 'rented'),
    ('${propMap['مجمع الملقا التجاري']}', 'Office-101', 'office', 1, 120, 3, 2, 'semi_furnished', 75000, 5000, 'available'),
    ('${propMap['مجمع الملقا التجاري']}', 'Office-102', 'office', 1, 150, 4, 2, 'unfurnished', 85000, 5000, 'rented'),
    ('${propMap['فيلا الوفاء المودرن']}', 'VILLA-MAIN', 'villa', 1, 600, 6, 5, 'furnished', 180000, 10000, 'rented'),
    ('${propMap['عمارة النزهة السكنية']}', '101', 'apartment', 1, 130, 3, 2, 'unfurnished', 42000, 2500, 'available'),
    ('${propMap['عمارة النزهة السكنية']}', '102', 'apartment', 1, 130, 3, 2, 'unfurnished', 42000, 2500, 'available')
    RETURNING id, unit_number;
  `);

  const unitMap = {};
  unitRes.rows.forEach(u => unitMap[u.unit_number] = u.id);

  // 4. Insert Tenants
  const tenantRes = await client.query(`
    INSERT INTO public.tenants (name, phone, email, id_number, id_type, address, nationality, notes)
    VALUES
    ('عبد الله بن فهد القحطاني', '0501234567', 'abdullah@example.com', '1089234123', 'national_id', 'الرياض، حي النفل', 'سعودي', 'مستأجر ممتاز ومواظب على السداد.'),
    ('د. سارة بنت محمد العتيبي', '0559876543', 'sara@example.com', '1045612389', 'national_id', 'الرياض، حي الياسمين', 'سعودية', 'طبيبة بأسنان الملك خالد.'),
    ('م. خالد عبد الرحمن السليمان', '0534567890', 'khaled@example.com', '1078901234', 'national_id', 'جدة، حي الشاطئ', 'سعودي', 'عقد طويل الأجل.'),
    ('شركة الأفق للتكنولوجيا والحلول', '0112345678', 'info@horizonteck.sa', '1010998877', 'commercial_reg', 'الرياض، طريق أنس بن مالك', 'شركة سعودية', 'عقد تجاري مكتب.')
    RETURNING id, name;
  `);

  const tenantMap = {};
  tenantRes.rows.forEach(t => tenantMap[t.name] = t.id);

  // 5. Insert Contracts
  const contractRes = await client.query(`
    INSERT INTO public.contracts (contract_number, tenant_id, unit_id, start_date, end_date, duration_months, rent_amount, deposit_amount, payment_cycle, payment_timing, status, auto_renew, notes)
    VALUES
    ('CNT-2026-8801', '${tenantMap['عبد الله بن فهد القحطاني']}', '${unitMap['A-101']}', '2026-01-01', '2026-12-31', 12, 45000, 3000, 'quarterly', 'advance', 'active', true, 'يدفع كل 3 أشهر (11,250 ر.س لكل دفعة).'),
    ('CNT-2026-8802', '${tenantMap['د. سارة بنت محمد العتيبي']}', '${unitMap['A-201']}', '2026-02-01', '2027-01-31', 12, 60000, 4000, 'monthly', 'advance', 'active', false, 'سداد شهري 5,000 ر.س.'),
    ('CNT-2026-8803', '${tenantMap['م. خالد عبد الرحمن السليمان']}', '${unitMap['VILLA-MAIN']}', '2026-03-01', '2027-02-28', 12, 180000, 10000, 'semi_annual', 'advance', 'active', true, 'دفعتين سنوية 90,000 ر.س.'),
    ('CNT-2026-8804', '${tenantMap['شركة الأفق للتكنولوجيا والحلول']}', '${unitMap['Shop-01']}', '2026-01-15', '2027-01-14', 12, 90000, 5000, 'quarterly', 'advance', 'active', true, 'عقد تجاري معرض.')
    RETURNING id, contract_number;
  `);

  const contractMap = {};
  contractRes.rows.forEach(c => contractMap[c.contract_number] = c.id);

  // 6. Insert Dues
  const duesRes = await client.query(`
    INSERT INTO public.dues (contract_id, due_date, amount, paid_amount, status, title)
    VALUES
    ('${contractMap['CNT-2026-8801']}', '2026-01-01', 11250, 11250, 'paid', 'الدفعة الأولى (Q1)'),
    ('${contractMap['CNT-2026-8801']}', '2026-04-01', 11250, 11250, 'paid', 'الدفعة الثانية (Q2)'),
    ('${contractMap['CNT-2026-8801']}', '2026-07-01', 11250, 5000, 'partially_paid', 'الدفعة الثالثة (Q3)'),
    ('${contractMap['CNT-2026-8801']}', '2026-10-01', 11250, 0, 'pending', 'الدفعة الرابعة (Q4)'),

    ('${contractMap['CNT-2026-8802']}', '2026-02-01', 5000, 5000, 'paid', 'إيجار شهر فبراير'),
    ('${contractMap['CNT-2026-8802']}', '2026-03-01', 5000, 5000, 'paid', 'إيجار شهر مارس'),
    ('${contractMap['CNT-2026-8802']}', '2026-04-01', 5000, 5000, 'paid', 'إيجار شهر أبريل'),
    ('${contractMap['CNT-2026-8802']}', '2026-05-01', 5000, 5000, 'paid', 'إيجار شهر مايو'),
    ('${contractMap['CNT-2026-8802']}', '2026-06-01', 5000, 5000, 'paid', 'إيجار شهر يونيو'),
    ('${contractMap['CNT-2026-8802']}', '2026-07-01', 5000, 0, 'overdue', 'إيجار شهر يوليو (متأخر)'),

    ('${contractMap['CNT-2026-8803']}', '2026-03-01', 90000, 90000, 'paid', 'الدفعة الأولى (النصف الأول)'),
    ('${contractMap['CNT-2026-8803']}', '2026-09-01', 90000, 0, 'pending', 'الدفعة الثانية (النصف الثاني)')
    RETURNING id, title;
  `);

  const duesList = duesRes.rows;

  // 7. Insert Payments
  await client.query(`
    INSERT INTO public.payments (contract_id, tenant_id, due_id, amount, payment_date, payment_method, receipt_number, notes)
    VALUES
    ('${contractMap['CNT-2026-8801']}', '${tenantMap['عبد الله بن فهد القحطاني']}', '${duesList[0].id}', 11250, '2026-01-01 10:00:00+00', 'transfer', 'REC-2026-1001', 'تحويل على الراجحي - دفعة Q1'),
    ('${contractMap['CNT-2026-8801']}', '${tenantMap['عبد الله بن فهد القحطاني']}', '${duesList[1].id}', 11250, '2026-04-02 11:30:00+00', 'transfer', 'REC-2026-1002', 'تحويل بنكي - دفعة Q2'),
    ('${contractMap['CNT-2026-8802']}', '${tenantMap['د. سارة بنت محمد العتيبي']}', '${duesList[4].id}', 5000, '2026-02-01 09:15:00+00', 'card', 'REC-2026-1003', 'دفع عبر مدى'),
    ('${contractMap['CNT-2026-8803']}', '${tenantMap['م. خالد عبد الرحمن السليمان']}', '${duesList[10].id}', 90000, '2026-03-01 14:00:00+00', 'cheque', 'REC-2026-1004', 'شيك مصدق رقم 449201')
  `);

  // 8. Insert Expenses
  await client.query(`
    INSERT INTO public.expenses (property_id, category, amount, description, expense_date, vendor, notes)
    VALUES
    ('${propMap['برج الياسمين الفاخر']}', 'maintenance', 1400, 'صيانة وتغيير زيوت المصعد الرئيسي', '2026-06-10', 'شركة أطلس للمصاعد', 'صيانة دورية كل 6 أشهر'),
    ('${propMap['برج الياسمين الفاخر']}', 'electricity', 850, 'فاتورة كهرباء خدمات العمارة والممرات', '2026-07-05', 'شركة الكهرباء السعودية', 'فاتورة شهر يونيو'),
    ('${propMap['مجمع الملقا التجاري']}', 'cleaning', 2200, 'عقد نظافة المجمع التجاري وغسيل الواجهات الزجاجية', '2026-07-01', 'مؤسسة النظافة الفائقة', 'غسيل الواجهات الخارجية')
  `);

  // 9. Insert Maintenance Requests
  await client.query(`
    INSERT INTO public.maintenance_requests (property_id, unit_id, tenant_id, title, description, category, priority, status, cost, notes)
    VALUES
    ('${propMap['برج الياسمين الفاخر']}', '${unitMap['A-101']}', '${tenantMap['عبد الله بن فهد القحطاني']}', 'تسريب مياه بسيط في حمام الماستر', 'يوجد تنقيط تحت المغسلة يحتاج تغيير جلبه وصنبور.', 'plumbing', 'medium', 'in_progress', 150, 'تم إرسال السباك'),
    ('${propMap['مجمع الملقا التجاري']}', '${unitMap['Shop-01']}', '${tenantMap['شركة الأفق للتكنولوجيا والحلول']}', 'صيانة مكيف المعرض التجاري', 'المكيف المباشر لا يبرد بالشكل المطلوب.', 'hvac', 'high', 'new', 400, 'في انتظار موافقة الفني')
  `);

  // 10. Insert Utility Readings
  await client.query(`
    INSERT INTO public.utility_readings (unit_id, type, previous_reading, current_reading, price_per_unit, total_amount, reading_date, billed_to_tenant, notes)
    VALUES
    ('${unitMap['A-101']}', 'electricity', 12400, 13150, 0.18, 135, '2026-07-01', true, 'استهلاك 750 ك.و.س'),
    ('${unitMap['A-101']}', 'water', 340, 365, 6.0, 150, '2026-07-01', true, 'استهلاك 25 متر مكعب')
  `);

  // 11. Insert Notifications
  await client.query(`
    INSERT INTO public.notifications (kind, title, body, created_at)
    VALUES
    ('contract_created', 'عقد إيجار جديد', 'تم إبرام العقد CNT-2026-8801 للمستأجر عبد الله بن فهد القحطاني بقيمة 45,000 ر.س', NOW()),
    ('payment_received', 'تم استلام دفعة إيجار', 'تم استلام مبلغ 11,250 ر.س من المستأجر عبد الله بن فهد القحطاني - سند رقم REC-2026-1001', NOW() - INTERVAL '1 day'),
    ('due_overdue', 'تنبيه: دفعة متأخرة', 'دفعة إيجار شهر يوليو للمستأجر د. سارة بنت محمد العتيبي متأخرة بمبلغ 5,000 ر.س', NOW() - INTERVAL '2 days')
  `);

  console.log("🎉 ALL MIGRATIONS & SAMPLE SEED DATA POPULATED SUCCESSFULLY!");
  await client.end();
}

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
