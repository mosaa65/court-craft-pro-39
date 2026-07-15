
## ما سأنفّذه

### 1. تنسيق الوقت 12 ساعة في كل النظام
- إضافة `formatTime12(iso | "HH:MM")` في `src/lib/mock.ts` تُرجع "٠٧:٠٠ ص" / "١٠:٣٠ م" بالأرقام العربية.
- تحديث كل مكان يعرض الوقت: بطاقة الحجز، صفحة تفاصيل الحجز، التقويم (عمود الساعات وبطاقاته)، لوحة التحكم (شريحة "التالي")، sheet الحجز.
- إصلاح **hydration mismatch**: الآن الرئيسية تحسب "التالي" اعتمادًا على `Date.now()` — سنمرّر الوقت الحالي مرة واحدة من useState + useEffect حتى لا يختلف SSR عن العميل.

### 2. أيام الأسبوع في التقويم بشكل دائري
- في `calendar.tsx`: تحويل شرائح الأيام من مستطيل rounded إلى دوائر كاملة (`size-14 rounded-full`)، مع طبقة فخمة: يوم اليوم بطوق `ring-2 ring-primary/40`، اليوم النشط بخلفية `bg-ink` وحلقة toned، خط سفلي نقطي للأيام التي فيها حجوزات.
- ترقية شريط "أسبوع" ليعرض 7 أيام دائرية بتمرير أفقي أنيق + سهم للأمام/الخلف.

### 3. تصفح الحجوزات بأي تاريخ
- إضافة شريط تاريخ فوق شرائح الحالة في `/bookings`: أزرار سريعة "أمس / اليوم / غدًا" + منتقي تاريخ (Popover + Calendar من shadcn) + زر "كل التواريخ".
- تمرير `date` (أو غيابه) إلى `bookingsQuery` — الـ server function `listBookings` تدعم الفلتر أصلًا؛ سنجعله اختياريًا فعلاً بحيث بدون تاريخ يرجع الكل مرتبًا تنازليًا.

### 4. حجز دائم (أسبوعي)
- في `BookingSheet`: مفتاح Toggle "حجز دائم — يتكرر أسبوعيًا" + حقل "عدد الأسابيع" (1–52، افتراضي 8).
- server fn جديد `createRecurringBookingFn` يستقبل: courtId, customer, phone, startAt, endAt, weeks, status, price, notes.
  - يفحص التعارض لكل أسبوع؛ إذا وُجد تعارض في أي أسبوع يُرجع قائمة الأسابيع المتعارضة ولا يحجز شيئًا (all-or-nothing).
  - يضيف عمود `recurrence_group_id uuid` على جدول `bookings` (nullable) لربط الحجوزات المتكررة.
- في تفاصيل الحجز: إظهار شارة "متكرر أسبوعيًا" مع خيار "إلغاء هذا فقط" أو "إلغاء كل المتكررة".

### 5. حالات الحجز الكاملة عند الإنشاء/التعديل
- في `BookingSheet` (خطوة الملخص): إضافة اختيار الحالة (مؤكد / بانتظار الدفع / تدريب / صيانة) بشرائح ملوّنة مطابقة لألوان `statusMeta`.
- "صيانة" تُخفي حقول العميل/الهاتف/السعر تلقائيًا وتضع customer_name = "صيانة".
- "تدريب" تسمح باسم مدرّب/فريق بدون هاتف إلزامي.
- تحديث `bookings.functions.ts` (`createBookingFn`, `updateBookingFn`) بحيث تقبل `status` كاملًا وتُخفف التحقق للحالات الخاصة.

### 6. الملاعب — تفاصيل + إضافة + تعديل
- روت جديد `courts.$id.tsx`: صفحة تفاصيل ملعب فاخرة (صورة كبيرة، سعر/ساعة، سطح، نوع رياضة، KPIs: حجوزات اليوم / إشغال الأسبوع / إيراد الأسبوع، وقائمة الحجوزات القادمة على هذا الملعب، أزرار "تعديل" و"إضافة حجز على هذا الملعب").
- `court-form-sheet.tsx`: sheet لإضافة/تعديل الملعب (name, sport, surface, price_per_hour, image_key).
- زر "+" في صفحة الملاعب لإضافة ملعب جديد.
- server fns: `createCourtFn`, `updateCourtFn`, `getCourtFn`.

### 7. العملاء — وحدة جديدة
- جدول جديد `customers` (id, name, phone unique, notes, created_at, updated_at).
- server fns: `listCustomersFn(search?)`, `getCustomerFn`, `createCustomerFn`, `updateCustomerFn`, `deleteCustomerFn`, وأيضًا `listBookingsForCustomerFn` (يبحث بالهاتف).
- روت `/customers` (قائمة + بحث + إضافة) و `customers.$id.tsx` (بروفايل: بياناته، إجمالي حجوزاته، آخر الحجوزات، زر "حجز جديد لهذا العميل").
- في `BookingSheet` بجانب حقل اسم العميل: زر أيقونة يفتح "اختر عميلًا" (Sheet داخلي مع بحث فوري) — يُعبّئ الاسم والهاتف تلقائيًا.
- زر "حجز سريع" داخل بطاقة العميل يفتح `BookingSheet` مع القيم مملوءة مسبقًا.

### 8. إعادة ترتيب التنقل السفلي
- استبدال زر "الملاعب" في الفوتر بزر **"الإدارة"** (أيقونة LayoutGrid).
- روت جديد `/manage` كصفحة hub فيها تبويبات علوية أنيقة: **الملاعب | العملاء | الإعدادات**.
- الفوتر النهائي: الرئيسية · التقويم · [+ FAB] · الحجوزات · الإدارة · المزيد (5 tabs + FAB).
- روتات `/courts` و `/customers` تبقى قابلة للوصول مباشرة (deep-link)، لكن الوصول اليومي عبر `/manage`.

### 9. إصلاح hydration في `index.tsx`
تأجيل حساب "التالي" و"الساعة الحالية" حتى بعد mount عبر `useState(() => null) + useEffect`.

---

## الملفات

**جديدة**
- `src/routes/manage.tsx`, `src/routes/customers.tsx`, `src/routes/customers.$id.tsx`, `src/routes/courts.$id.tsx`
- `src/components/court-form-sheet.tsx`, `src/components/customer-form-sheet.tsx`, `src/components/customer-picker-sheet.tsx`, `src/components/date-picker-inline.tsx`
- `src/lib/customers.functions.ts`, `src/lib/courts.functions.ts` (توسيع)، `src/lib/customers.queries.ts`

**معدّلة**
- `src/lib/mock.ts` (formatTime12)
- `src/lib/bookings.functions.ts` (recurrence + status الكامل + date فلتر اختياري)
- `src/lib/bookings.queries.ts`
- `src/components/app-shell.tsx` (استبدال الملاعب بالإدارة)
- `src/components/booking-sheet.tsx` (customer picker, recurrence, status chips)
- `src/components/booking-card.tsx`, `src/routes/bookings.$id.tsx` (شارة متكرر + إلغاء المجموعة)
- `src/routes/bookings.tsx` (شريط تاريخ)
- `src/routes/calendar.tsx` (أيام دائرية + 12h)
- `src/routes/courts.tsx` (زر إضافة + بطاقات قابلة للنقر)
- `src/routes/index.tsx` (12h + إصلاح hydration)

**Migration واحد**
1. `ALTER TABLE bookings ADD COLUMN recurrence_group_id uuid`
2. `CREATE INDEX` عليه
3. `CREATE TABLE customers` مع GRANT + RLS (سياسات مفتوحة الآن كوضع MVP مثل بقية الجداول)
4. Trigger `updated_at` على `customers`

---

## ترتيب التنفيذ
1. الـ migration (خارج بقية الأدوات).
2. بعد الموافقة: تعديل الأدوات المشتركة (`mock.ts`, `bookings.functions.ts`, queries).
3. المكونات الجديدة + إعادة الترتيب.
4. الصفحات الجديدة (`manage`, `customers`, `courts.$id`).
5. فحص نهائي على المعاينة.
