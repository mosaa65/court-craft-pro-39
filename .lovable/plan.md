## الهدف
تحويل نظام الحجوزات من بيانات وهمية إلى نظام حقيقي متكامل مربوط بقاعدة بيانات، مع صفحة قائمة حجوزات احترافية، صفحة تفاصيل، وإمكانية تعديل/إلغاء.

---

## 1) تفعيل Lovable Cloud (Backend)
تفعيل الـ Backend المدمج لتوفير:
- قاعدة بيانات PostgreSQL
- Row Level Security
- Server Functions

## 2) مخطط قاعدة البيانات

**جدول `courts`** — الملاعب
- `id`, `name`, `sport`, `sport_label`, `surface`, `price_per_hour`, `image_key`, `created_at`

**جدول `bookings`** — الحجوزات
- `id` (uuid)
- `court_id` → courts
- `customer_name`, `customer_phone`
- `start_at` (timestamptz), `end_at` (timestamptz)
- `status` enum: `confirmed | pending | training | maintenance | cancelled`
- `price` (numeric)
- `notes` (text)
- `created_at`, `updated_at`

**بيانات أولية:** إدراج نفس الملاعب الحالية + حجوزات اليوم كـ seed data عبر migration.

**RLS مؤقتاً (MVP بدون auth):** السماح للجميع بالقراءة والكتابة (سنطبّق الأدوار في مرحلة لاحقة عند إضافة تسجيل الدخول).

## 3) طبقة الخادم (Server Functions)
ملف `src/lib/bookings.functions.ts`:
- `listBookings({ date, courtId?, status?, search?, minDuration?, maxDuration? })`
- `getBooking({ id })`
- `createBooking({ ... })`
- `updateBooking({ id, ... })`
- `cancelBooking({ id })`

ملف `src/lib/courts.functions.ts`:
- `listCourts()`

كلها تستخدم Server Publishable Client (بدون auth للـ MVP).

## 4) طبقة العميل — TanStack Query
- `queryOptions` لكل استعلام (bookings list, single booking, courts).
- `useMutation` مع `invalidateQueries` بعد كل create/update/cancel لتحديث فوري في التقويم وقائمة الحجوزات.
- `Skeleton` أثناء التحميل (بديل احترافي بتأثير shimmer).

## 5) الشاشات

### أ) صفحة قائمة الحجوزات `/bookings` (جديدة)
- شريط بحث (اسم العميل / رقم الجوال)
- Chips تصفية: الحالة (الكل / مؤكد / بانتظار / تدريب / صيانة / ملغى)
- Chips تصفية: الملعب
- Slider أو chips للمدة (< ساعة / ساعة / > ساعة)
- بطاقات حجوزات مع Skeleton أثناء التحميل
- Empty state احترافي
- إضافة تبويب "الحجوزات" في bottom nav

### ب) صفحة تفاصيل الحجز `/bookings/$id`
- Header بصورة الملعب
- بيانات كاملة: الوقت، المدة، الملعب، العميل، الجوال، السعر، الحالة، الملاحظات
- أزرار: **تعديل** / **إلغاء الحجز** / رجوع
- Toast نجاح/فشل واضح

### ج) تعديل الحجز
Sheet/Modal بنفس تصميم `booking-sheet` مع تعبئة البيانات الحالية.

### د) إلغاء الحجز
`AlertDialog` تأكيد ("هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع") → يحدّث الحالة إلى `cancelled`.

### هـ) ربط التقويم والداشبورد
استبدال البيانات الوهمية بـ `useSuspenseQuery`، مع فتح تفاصيل الحجز عند الضغط على أي فترة محجوزة في التقويم.

## 6) حالات النجاح/الفشل
- `sonner` toasts موحّدة: نجاح (أخضر primary)، فشل (أحمر destructive).
- Optimistic updates حيث يناسب (إلغاء).
- Error boundaries لكل route مع notFoundComponent.

## 7) التنفيذ التقني (مختصر للفريق الفني)

```
src/
  lib/
    bookings.functions.ts     ← createServerFn (list/get/create/update/cancel)
    courts.functions.ts       ← createServerFn (list)
    bookings.queries.ts       ← queryOptions للـ TanStack Query
  components/
    booking-card.tsx          ← بطاقة موحّدة
    booking-filters.tsx       ← بحث + chips
    booking-skeleton.tsx      ← shimmer
    booking-edit-sheet.tsx    ← يعيد استخدام booking-sheet
    cancel-booking-dialog.tsx ← تأكيد
  routes/
    bookings.tsx              ← القائمة
    bookings.$id.tsx          ← التفاصيل
    (تحديث calendar.tsx, index.tsx لاستخدام queries)
```

- Migration واحد ينشئ الجدولين + enum + RLS policies + seed data.
- `courts` تبقى الصور من `@/assets` عبر `image_key` mapping في الفرونت.

---

## ما سيبقى للمرحلة القادمة (خارج نطاق هذا التنفيذ)
- تسجيل دخول المدير + أدوار
- الإشعارات (SMS/WhatsApp)
- التقارير المالية
- إدارة عدة فروع

هل تريد أن أبدأ التنفيذ بهذا الشكل؟
