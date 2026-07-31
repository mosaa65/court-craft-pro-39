const SUPABASE_URL = "https://llvszoblxpblvwzmlkeq.supabase.co";
const SUPABASE_KEY = "sb_publishable_QIPUB5wfg5zerYs1eu0tkA_0vPth1me";

async function post(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[Error inserting into ${table}]:`, errText);
    return null;
  }
  return await res.json();
}

async function seed() {
  console.log("🌱 Starting Real Estate Seed Data Insertion...");

  // 1. Insert Properties
  const propertiesData = [
    {
      name: "برج الياسمين الفاخر",
      type: "building",
      description: "برج سكني فاخر يتكون من ٦ طوابق في موقع استراتيجي بقرب طريق الملك سلمان.",
      city: "الرياض",
      district: "حي الياسمين",
      location: "طريق الملك سلمان، الرياض",
      floors_count: 6,
      total_area: 1200,
      year_built: 2023,
      amenities: ["مواقف سفلية", "مصعد ذكي", "حراسة 24/7", "كاميرات مراقبة"],
      status: "active",
      image_url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
    },
    {
      name: "مجمع الملقا التجاري",
      type: "commercial",
      description: "مجمع مكاتب ومعارض تجارية حديثة بمواجهات زجاجية وتصميم عصري.",
      city: "الرياض",
      district: "حي الملقا",
      location: "طريق انس بن مالك، الرياض",
      floors_count: 4,
      total_area: 2500,
      year_built: 2024,
      amenities: ["مواقف عملاء", "مكيفات مركزية", "مصاعد بانورامية"],
      status: "active",
      image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
    },
    {
      name: "فيلا الوفاء المودرن",
      type: "villa",
      description: "فيلا مستقلا بتشطيبات سوبر ديلوكس مع مسبح وحديقة خاصة.",
      city: "جدة",
      district: "حي الشاطئ",
      location: "حي الشاطئ، بالقرب من الكورنيش",
      floors_count: 2,
      total_area: 600,
      year_built: 2022,
      amenities: ["مسبح خاص", "حديقة", "كراج سيارتين", "ملحق خارجي"],
      status: "active",
      image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
    },
    {
      name: "عمارة النزهة السكنية",
      type: "apartment_complex",
      description: "عمارة شقق سكنية عائلية هادئة وقريبة من جميع الخدمات والتسوق.",
      city: "الرياض",
      district: "حي النزهة",
      location: "شارع الامير مقرن، الرياض",
      floors_count: 3,
      total_area: 950,
      year_built: 2021,
      amenities: ["مصعد", "مواقف مظللة", "صيانة دورية"],
      status: "active",
      image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"
    }
  ];

  const props = await post("properties", propertiesData);
  if (!props || props.length === 0) {
    console.error("Failed to seed properties.");
    return;
  }
  console.log(`✅ Seeded ${props.length} Properties.`);

  const [prop1, prop2, prop3, prop4] = props;

  // 2. Insert Units
  const unitsData = [
    // Prop 1 (برج الياسمين)
    { property_id: prop1.id, unit_number: "A-101", type: "apartment", floor: 1, area: 145, rooms: 3, bathrooms: 2, furnished: "semi_furnished", rent_price: 45000, deposit_amount: 3000, status: "rented" },
    { property_id: prop1.id, unit_number: "A-102", type: "apartment", floor: 1, area: 160, rooms: 4, bathrooms: 3, furnished: "unfurnished", rent_price: 52000, deposit_amount: 3500, status: "available" },
    { property_id: prop1.id, unit_number: "A-201", type: "apartment", floor: 2, area: 145, rooms: 3, bathrooms: 2, furnished: "furnished", rent_price: 60000, deposit_amount: 4000, status: "rented" },
    { property_id: prop1.id, unit_number: "A-202", type: "apartment", floor: 2, area: 160, rooms: 4, bathrooms: 3, furnished: "unfurnished", rent_price: 54000, deposit_amount: 3500, status: "available" },

    // Prop 2 (مجمع الملقا)
    { property_id: prop2.id, unit_number: "Shop-01", type: "shop", floor: 0, area: 90, rooms: 1, bathrooms: 1, furnished: "unfurnished", rent_price: 90000, deposit_amount: 5000, status: "rented" },
    { property_id: prop2.id, unit_number: "Office-101", type: "office", floor: 1, area: 120, rooms: 3, bathrooms: 2, furnished: "semi_furnished", rent_price: 75000, deposit_amount: 5000, status: "available" },
    { property_id: prop2.id, unit_number: "Office-102", type: "office", floor: 1, area: 150, rooms: 4, bathrooms: 2, furnished: "unfurnished", rent_price: 85000, deposit_amount: 5000, status: "rented" },

    // Prop 3 (فيلا الوفاء)
    { property_id: prop3.id, unit_number: "VILLA-MAIN", type: "villa", floor: 1, area: 600, rooms: 6, bathrooms: 5, furnished: "furnished", rent_price: 180000, deposit_amount: 10000, status: "rented" },

    // Prop 4 (عمارة النزهة)
    { property_id: prop4.id, unit_number: "101", type: "apartment", floor: 1, area: 130, rooms: 3, bathrooms: 2, furnished: "unfurnished", rent_price: 42000, deposit_amount: 2500, status: "available" },
    { property_id: prop4.id, unit_number: "102", type: "apartment", floor: 1, area: 130, rooms: 3, bathrooms: 2, furnished: "unfurnished", rent_price: 42000, deposit_amount: 2500, status: "available" }
  ];

  const units = await post("units", unitsData);
  console.log(`✅ Seeded ${units ? units.length : 0} Units.`);

  // 3. Insert Tenants
  const tenantsData = [
    {
      name: "عبد الله بن فهد القحطاني",
      phone: "0501234567",
      email: "abdullah@example.com",
      id_number: "1089234123",
      id_type: "national_id",
      address: "الرياض، حي النفل",
      nationality: "سعودي",
      notes: "مستأجر ممتاز ومواظب على السداد."
    },
    {
      name: "د. سارة بنت محمد العتيبي",
      phone: "0559876543",
      email: "sara@example.com",
      id_number: "1045612389",
      id_type: "national_id",
      address: "الرياض، حي الياسمين",
      nationality: "سعودية",
      notes: "طبيبة بأسنان الملك خالد."
    },
    {
      name: "م. خالد عبد الرحمن السليمان",
      phone: "0534567890",
      email: "khaled@example.com",
      id_number: "1078901234",
      id_type: "national_id",
      address: "جدة، حي الشاطئ",
      nationality: "سعودي",
      notes: "عقد طويل الأجل."
    },
    {
      name: "شركة الأفق للتكنولوجيا والحلول",
      phone: "0112345678",
      email: "info@horizonteck.sa",
      id_number: "1010998877",
      id_type: "commercial_reg",
      address: "الرياض، طريق أنس بن مالك",
      nationality: "شركة سعودية",
      notes: "عقد تجاري مكتب."
    }
  ];

  const tenants = await post("tenants", tenantsData);
  console.log(`✅ Seeded ${tenants ? tenants.length : 0} Tenants.`);

  if (!units || !tenants || units.length === 0 || tenants.length === 0) return;

  // Rented units
  const rentedUnits = units.filter(u => u.status === "rented");

  // 4. Create Contracts
  const contractsData = [
    {
      contract_number: "CNT-2026-8801",
      tenant_id: tenants[0].id,
      unit_id: rentedUnits[0].id, // A-101
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      duration_months: 12,
      rent_amount: 45000,
      deposit_amount: 3000,
      payment_cycle: "quarterly",
      payment_timing: "advance",
      status: "active",
      auto_renew: true,
      notes: "يدفع كل 3 أشهر (11,250 ر.س لكل دفعة)."
    },
    {
      contract_number: "CNT-2026-8802",
      tenant_id: tenants[1].id,
      unit_id: rentedUnits[1].id, // A-201
      start_date: "2026-02-01",
      end_date: "2027-01-31",
      duration_months: 12,
      rent_amount: 60000,
      deposit_amount: 4000,
      payment_cycle: "monthly",
      payment_timing: "advance",
      status: "active",
      auto_renew: false,
      notes: "سداد شهري 5,000 ر.س."
    },
    {
      contract_number: "CNT-2026-8803",
      tenant_id: tenants[2].id,
      unit_id: rentedUnits[3].id, // Villa Main
      start_date: "2026-03-01",
      end_date: "2027-02-28",
      duration_months: 12,
      rent_amount: 180000,
      deposit_amount: 10000,
      payment_cycle: "semi_annual",
      payment_timing: "advance",
      status: "active",
      auto_renew: true,
      notes: "دفعتين سنوية 90,000 ر.س."
    },
    {
      contract_number: "CNT-2026-8804",
      tenant_id: tenants[3].id,
      unit_id: rentedUnits[2].id, // Shop-01
      start_date: "2026-01-15",
      end_date: "2027-01-14",
      duration_months: 12,
      rent_amount: 90000,
      deposit_amount: 5000,
      payment_cycle: "quarterly",
      payment_timing: "advance",
      status: "active",
      auto_renew: true,
      notes: "عقد تجاري معرض."
    }
  ];

  const contracts = await post("contracts", contractsData);
  console.log(`✅ Seeded ${contracts ? contracts.length : 0} Contracts.`);

  if (!contracts) return;

  // 5. Insert Dues for Contracts
  const duesData = [
    // Contract 1 (Quarterly 11,250)
    { contract_id: contracts[0].id, due_date: "2026-01-01", amount: 11250, paid_amount: 11250, status: "paid", title: "الدفعة الأولى (Q1)" },
    { contract_id: contracts[0].id, due_date: "2026-04-01", amount: 11250, paid_amount: 11250, status: "paid", title: "الدفعة الثانية (Q2)" },
    { contract_id: contracts[0].id, due_date: "2026-07-01", amount: 11250, paid_amount: 5000, status: "partially_paid", title: "الدفعة الثالثة (Q3)" },
    { contract_id: contracts[0].id, due_date: "2026-10-01", amount: 11250, paid_amount: 0, status: "pending", title: "الدفعة الرابعة (Q4)" },

    // Contract 2 (Monthly 5,000)
    { contract_id: contracts[1].id, due_date: "2026-02-01", amount: 5000, paid_amount: 5000, status: "paid", title: "إيجار شهر فبراير" },
    { contract_id: contracts[1].id, due_date: "2026-03-01", amount: 5000, paid_amount: 5000, status: "paid", title: "إيجار شهر مارس" },
    { contract_id: contracts[1].id, due_date: "2026-04-01", amount: 5000, paid_amount: 5000, status: "paid", title: "إيجار شهر أبريل" },
    { contract_id: contracts[1].id, due_date: "2026-05-01", amount: 5000, paid_amount: 5000, status: "paid", title: "إيجار شهر مايو" },
    { contract_id: contracts[1].id, due_date: "2026-06-01", amount: 5000, paid_amount: 5000, status: "paid", title: "إيجار شهر يونيو" },
    { contract_id: contracts[1].id, due_date: "2026-07-01", amount: 5000, paid_amount: 0, status: "overdue", title: "إيجار شهر يوليو (متأخر)" },

    // Contract 3 (Semi-annual 90,000)
    { contract_id: contracts[2].id, due_date: "2026-03-01", amount: 90000, paid_amount: 90000, status: "paid", title: "الدفعة الأولى (النصف الأول)" },
    { contract_id: contracts[2].id, due_date: "2026-09-01", amount: 90000, paid_amount: 0, status: "pending", title: "الدفعة الثانية (النصف الثاني)" }
  ];

  const dues = await post("dues", duesData);
  console.log(`✅ Seeded ${dues ? dues.length : 0} Dues.`);

  // 6. Insert Payments (Receipts)
  const paymentsData = [
    {
      contract_id: contracts[0].id,
      tenant_id: tenants[0].id,
      due_id: dues ? dues[0].id : null,
      amount: 11250,
      payment_date: "2026-01-01T10:00:00Z",
      payment_method: "transfer",
      receipt_number: "REC-2026-1001",
      notes: "تحويل على الراجحي - دفعة Q1"
    },
    {
      contract_id: contracts[0].id,
      tenant_id: tenants[0].id,
      due_id: dues ? dues[1].id : null,
      amount: 11250,
      payment_date: "2026-04-02T11:30:00Z",
      payment_method: "transfer",
      receipt_number: "REC-2026-1002",
      notes: "تحويل بنكي - دفعة Q2"
    },
    {
      contract_id: contracts[1].id,
      tenant_id: tenants[1].id,
      due_id: dues ? dues[4].id : null,
      amount: 5000,
      payment_date: "2026-02-01T09:15:00Z",
      payment_method: "card",
      receipt_number: "REC-2026-1003",
      notes: "دفع عبر مدى"
    },
    {
      contract_id: contracts[2].id,
      tenant_id: tenants[2].id,
      due_id: dues ? dues[10].id : null,
      amount: 90000,
      payment_date: "2026-03-01T14:00:00Z",
      payment_method: "cheque",
      receipt_number: "REC-2026-1004",
      notes: "شيك مصدق رقم 449201"
    }
  ];

  await post("payments", paymentsData);
  console.log("✅ Seeded Payments.");

  // 7. Insert Expenses
  const expensesData = [
    {
      property_id: prop1.id,
      category: "maintenance",
      amount: 1400,
      description: "صيانة وتغيير زيوت المصعد الرئيسي",
      expense_date: "2026-06-10",
      vendor: "شركة أطلس للمصاعد",
      notes: "صيانة دورية كل 6 أشهر"
    },
    {
      property_id: prop1.id,
      category: "electricity",
      amount: 850,
      description: "فاتورة كهرباء خدمات العمارة والممرات",
      expense_date: "2026-07-05",
      vendor: "شركة الكهرباء السعودية",
      notes: "فاتورة شهر يونيو"
    },
    {
      property_id: prop2.id,
      category: "cleaning",
      amount: 2200,
      description: "عقد نظافة المجمع التجاري وغسيل الواجهات الزجاجية",
      expense_date: "2026-07-01",
      vendor: "مؤسسة النظافة الفائقة",
      notes: "غسيل الواجهات الخارجية"
    }
  ];

  await post("expenses", expensesData);
  console.log("✅ Seeded Expenses.");

  // 8. Insert Maintenance Requests
  const maintenanceData = [
    {
      property_id: prop1.id,
      unit_id: units[0].id,
      tenant_id: tenants[0].id,
      title: "تسريب مياه بسيط في حمام الماستر",
      description: "يوجد تنقيط تحت المغسلة يحتاج تغيير جلبه وصنبور.",
      category: "plumbing",
      priority: "medium",
      status: "in_progress",
      cost: 150,
      notes: "تم إرسال السباك"
    },
    {
      property_id: prop2.id,
      unit_id: units[4].id,
      tenant_id: tenants[3].id,
      title: "صيانة مكيف المعرض التجاري",
      description: "المكيف المباشر لا يبرد بالشكل المطلوب.",
      category: "hvac",
      priority: "high",
      status: "new",
      cost: 400,
      notes: "في انتظار موافقة الفني"
    }
  ];

  await post("maintenance_requests", maintenanceData);
  console.log("✅ Seeded Maintenance Requests.");

  // 9. Insert Utility Readings
  const utilityData = [
    {
      unit_id: units[0].id,
      type: "electricity",
      previous_reading: 12400,
      current_reading: 13150,
      price_per_unit: 0.18,
      total_amount: 135,
      reading_date: "2026-07-01",
      billed_to_tenant: true,
      notes: "استهلاك 750 ك.و.س"
    },
    {
      unit_id: units[0].id,
      type: "water",
      previous_reading: 340,
      current_reading: 365,
      price_per_unit: 6.0,
      total_amount: 150,
      reading_date: "2026-07-01",
      billed_to_tenant: true,
      notes: "استهلاك 25 متر مكعب"
    }
  ];

  await post("utility_readings", utilityData);
  console.log("✅ Seeded Utility Readings.");

  // 10. Insert Notifications
  const notificationsData = [
    {
      kind: "contract_created",
      title: "عقد إيجار جديد",
      body: "تم إبرام العقد CNT-2026-8801 للمستأجر عبد الله بن فهد القحطاني بقيمة 45,000 ر.س",
      created_at: new Date().toISOString()
    },
    {
      kind: "payment_received",
      title: "تم استلام دفعة إيجار",
      body: "تم استلام مبلغ 11,250 ر.س من المستأجر عبد الله بن فهد القحطاني - سند رقم REC-2026-1001",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      kind: "due_overdue",
      title: "تنبيه: دفعة متأخرة",
      body: "دفعة إيجار شهر يوليو للمستأجر د. سارة بنت محمد العتيبي متأخرة بمبلغ 5,000 ر.س",
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ];

  await post("notifications", notificationsData);
  console.log("✅ Seeded Notifications.");

  console.log("🎉 Real Estate Database Seed Completed Successfully!");
}

seed().catch(console.error);
