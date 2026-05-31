# AGRO MARKET — TO'LIQ TIZIM WORKFLOW
## Bitiruv Malakaviy Ishi | Express.js Backend

---

## 1. TIZIM ARXITEKTURASI

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│         Web (React/Next.js)  │  Mobile (React Native)       │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
┌─────────────────▼───────────────────────▼───────────────────┐
│                     API GATEWAY (Nginx)                      │
│              Rate limiting / SSL / Load balancing            │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                  EXPRESS.JS REST API                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Auth    │ │ Products │ │  Orders  │ │   Payments    │  │
│  │  Module  │ │  Module  │ │  Module  │ │   Module      │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Delivery │ │  Shops   │ │Complaints│ │  Analytics    │  │
│  │  Module  │ │  Module  │ │  Module  │ │   Module      │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      DATA LAYER                              │
│  PostgreSQL (main)  │  Redis (cache/sessions)               │
│  Cloudinary (media) │  Bull Queue (jobs)                    │
└─────────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Sequelize ORM
- **Cache**: Redis (sessions, product cache, rate limits)
- **Queue**: Bull + Redis (notification jobs, expiry checks)
- **Auth**: JWT (access 15min) + Refresh Token (30 days)
- **SMS**: Eskiz.uz / Play Mobile (OTP)
- **Payment**: Click + Payme (webhook-based)
- **Media**: Cloudinary
- **Real-time**: Socket.IO (order tracking, notifications)

---

## 2. FOYDALANUVCHI ROLLARI VA RUXSATLAR

### 2.1 Rollar

| Rol | Vakolatlar |
|-----|-----------|
| **SUPER_ADMIN** | Hamma narsani boshqaradi, komissiya o'rnatadi, seller tasdiqlaydi |
| **MODERATOR** | Mahsulotlarni tasdiqlaydi/rad etadi, shikoyatlarni ko'radi |
| **SELLER** | Do'kon ochadi, mahsulot qo'shadi, buyurtmalarni boshqaradi |
| **BUYER** | Mahsulot sotib oladi, sharh qoldiradi, shikoyat beradi |
| **DELIVERY_MAN** | O'ziga biriktirilgan buyurtmalarni ko'radi, yetkazadi |

### 2.2 JWT Strategiya

```
Access Token:  15 min (qisqa umr - xavfsizlik)
Refresh Token: 30 kun (DB da saqlanadi, revoke qilish mumkin)
OTP:           5 min amal qiladi, 3 marta kiritish huquqi
```

### 2.3 Blok/Ban holatlari

- Seller 3 marta shikoyat olsa → auto SUSPENDED, admin ko'rib chiqadi
- Buyer qaytarish firibgarligi aniqlansa → BANNED
- OTP 5 marta noto'g'ri kiritilsa → 30 daqiqa blok

---

## 3. MAHSULOT TURLARI VA AYNIYDIGAN VAQTLAR

### 3.1 Mahsulot kategoriyalari

```
is_perishable: boolean
shelf_life_days: number (null = uzoq muddatli)
storage_temp_min: number (°C)
storage_temp_max: number (°C)
requires_cold_chain: boolean
```

### 3.2 Ayniydigan mahsulotlar (perishable) — o'rtacha saqlash muddati

| Mahsulot | Omborda | Yetkazish vaqti chegarasi |
|----------|---------|--------------------------|
| Yashil o't, ukrop, ko'k piyoz | 1-2 kun | Buyurtma kuni yoki ertasi |
| Pomidor, bodring | 3-5 kun | 2 kun ichida |
| Qulupnay, gilos | 1-3 kun | 24 soat ichida |
| Olma, nok | 30-90 kun | 5 kun ichida |
| Kartoshka, sabzi, piyoz | 60-180 kun | 7 kun ichida |
| Limon, apelsin | 14-30 kun | 5 kun ichida |
| Qovun, tarvuz | 14-21 kun | 7 kun ichida |
| Sut (pasterizatsiya qilinmagan) | 1 kun | Buyurtma kuni |
| Tuxum | 7-10 kun | 3 kun ichida |
| Go'sht (sovutilgan) | 3-5 kun | 24-48 soat |
| Baliq (yangi) | 1-2 kun | 24 soat |
| Qatiq, ayran | 3-7 kun | 2 kun ichida |
| Asal | 365+ kun | Muddatsiz |
| Quritilgan mevalar | 180-365 kun | Muddatsiz |
| Un, don mahsulotlari | 180-365 kun | Muddatsiz |

### 3.3 Oldindan buyurtma (Pre-order) qoidalari

```
Qisqa muddatli mahsulotlar (< 5 kun shelf life):
  → Max 2 kun oldin pre-order qilsa bo'ladi

O'rta muddatli (5-30 kun):
  → Max 7 kun oldin

Uzoq muddatli (> 30 kun):
  → Max 30 kun oldin

Harvest pre-order (hali yig'ilmagan):
  → expected_harvest_date ko'rsatilishi shart
  → Seller kamida 48 soat oldin tasdiqlashi kerak
  → Agar harvest kechiksa → customer'ga bildiriladi, bekor qilish imkoni beriladi
```

---

## 4. MAHSULOT BOSHQARUVI (Product Module)

### 4.1 Mahsulot qo'shish flow'i

```
SELLER mahsulot qo'shadi
  → status: DRAFT
  → Rasm yuklaydi (min 1, max 10)
  → "Moderatsiyaga yuborish" bosadi
  → status: PENDING

MODERATOR ko'rib chiqadi (max 24 soat SLA)
  ├─ Tasdiqlasa → status: ACTIVE
  └─ Rad etsa → status: REJECTED + sabab yozadi
       → Seller'ga notification

SELLER mahsulotni yashirishi mumkin → status: HIDDEN
```

### 4.2 Stock boshqaruvi va race condition

```
stock_qty omborda decimal saqlansa ham,
buyurtma paytida optimistic lock ishlatiladi:

UPDATE products
SET stock_qty = stock_qty - :qty
WHERE id = :id AND stock_qty >= :qty
RETURNING *;

Agar 0 row qaytsa → "Mahsulot tugadi" xatosi
```

### 4.3 Mahsulot holat o'zgarishi triggerlari

```
stock_qty <= 0                → auto: status = OUT_OF_STOCK + seller'ga alert
stock_qty <= low_stock_alert  → seller'ga "Kam qoldi" notification
expiry_date - today <= 3      → seller'ga "Muddat tugayapti" ogohlantirish
expiry_date < today           → auto: status = EXPIRED, buyurtma qilib bo'lmaydi
```

### 4.4 Narx volatility himoyasi

```
Seller 24 soat ichida narxni 50%+ oshira olmaydi
  (mavjud tasdiqlangan buyurtmalarga eski narx tatbiq etiladi)

Tasdiqlangan buyurtmadagi narx o'zgarmas (snapshot saqlanadi)
```

---

## 5. QIDIRUV VA FILTRLAR

### 5.1 Search parametrlari

```
GET /api/products?
  q=pomidor              (full-text search, UZ + RU)
  category=sabzavotlar
  region=toshkent
  price_min=1000
  price_max=50000
  unit=kg
  is_organic=true
  is_perishable=false
  in_stock=true
  rating_min=4
  sort=price_asc | price_desc | rating | newest | popular
  page=1
  limit=20
```

### 5.2 Geo-filter

```
lat=41.2995&lng=69.2401&radius=50km
→ Faqat 50km ichidagi fermerlar mahsulotlari
```

---

## 6. SAVAT (Cart Module)

### 6.1 Cart modeli

```
Cart (Redis + DB)
  user_id
  items: [
    {
      product_id
      quantity
      price_snapshot     ← buyurtma paytidagi narx (narx o'zgarsa alert)
      shop_id
      is_available       ← real-time tekshiriladi
    }
  ]
  expires_at: +7 kun (inactive cart tozalanadi)
```

### 6.2 Ko'p do'kondan buyurtma

```
Bir savatchada turli do'kon mahsulotlari bo'lishi mumkin.
Checkout paytida:
  → Har bir do'kon uchun alohida Order yaratiladi
  → Har biri alohida to'lov va yetkazish
  → Yoki: birlashtirilgan to'lov, seller'larga pul taqsimlanadi
```

### 6.3 Savatdagi narx o'zgarishi

```
Foydalanuvchi savatga qo'shgandan keyin narx o'zgarse:
  → Checkout paytida ogohlantirish chiqadi
  → "Narx o'zgardi: 5000 → 6000 so'm. Davom etasizmi?"
  → Foydalanuvchi tasdiqlasa yangi narx bilan davom etadi
```

---

## 7. BUYURTMA FLOW'I (Order Module)

### 7.1 To'liq holat diagrammasi

```
                    ┌──────────────┐
                    │     NEW      │ ← Buyer checkout qildi
                    └──────┬───────┘
                           │ (seller 1 soat ichida javob berishi kerak)
                    ┌──────▼───────┐
              ┌─────│   CONFIRMED  │─────┐
              │     └──────┬───────┘     │
              │            │             │
         SELLER           │          BUYER/SELLER
         rad etsa    Mahsulot         bekor qilsa
              │      tayyorlanadi         │
              ▼            │              ▼
         CANCELLED  ┌──────▼───────┐  CANCELLED
                    │  PREPARING   │  (agar CONFIRMED
                    └──────┬───────┘   dan oldin)
                           │
                    ┌──────▼───────┐
                    │   SHIPPED    │ ← Yetkazuvchiga topshirildi
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  DELIVERED   │ ← Buyer qabul qildi
                    └──────┬───────┘
                           │ (48 soat ichida complaint yo'q bo'lsa)
                    ┌──────▼───────┐
                    │  COMPLETED   │ ← Pul seller'ga o'tadi
                    └──────────────┘
```

### 7.2 Bekor qilish qoidalari

| Holat | Kim bekor qila oladi | Qaytarish |
|-------|---------------------|-----------|
| NEW | Buyer va Seller | To'liq qaytariladi |
| CONFIRMED | Buyer (to PREPARING'ga o'tguncha) | To'liq |
| PREPARING | Seller ruxsati bilan | Admin ko'rib chiqadi |
| SHIPPED | Mumkin emas | Yetkazilgandan keyin qaytarish |
| DELIVERED | Mumkin emas | Complaint orqali |

### 7.3 Seller javob bermasa (1 soat timeout)

```
Buyurtma NEW holatida 1 soat o'tsa:
  → Seller'ga push notification + SMS
  → 30 daqiqa yana o'tsa → auto CANCELLED
  → Seller'ga ogohlantirish: "Siz 3 marta javob bermagansiz"
  → 5 marta bo'lsa → seller account SUSPENDED
```

### 7.4 Pre-order uchun qo'shimcha flow

```
Buyer pre-order qiladi
  → status: PRE_ORDER (alohida holat)
  → Pul bloklanadi (to'lab qo'yilmaydi, faqat rezerv qilinadi)
  → expected_delivery_date ko'rsatiladi

Yig'im kuni kelganda seller tasdiqlaydi:
  → Mavjud bo'lsa → CONFIRMED ga o'tadi → to'lov amalga oshiriladi
  → Mavjud bo'lmasa → CANCELLED + pul to'liq qaytariladi + sabab yoziladi

Buyer pre-order'ni harvest_date 24 soat oldinigacha bekor qila oladi
```

---

## 8. TO'LOV TIZIMI (Payment Module)

### 8.1 To'lov holatlari

```
PENDING   → To'lov boshlanmagan
INITIATED → Gateway'ga yo'naltirilgan
PROCESSING → Gateway qayta ishlayapti
PAID      → Muvaffaqiyatli to'landi
FAILED    → Muvaffaqiyatsiz
REFUNDED  → To'liq qaytarildi
PARTIAL_REFUNDED → Qisman qaytarildi
EXPIRED   → Vaqt tugadi (15 daqiqa)
```

### 8.2 Webhook xavfsizligi

```
Click va Payme webhook'larida:
  1. IP whitelist tekshiruvi
  2. Signature verification (HMAC)
  3. Idempotency key (duplicate webhook'larni bloklash)
  4. DB'ga log yoziladi (barcha so'rovlar)

Muvaffaqiyatli webhook → order status yangilanadi
Muvaffaqiyatsiz webhook → retry queue (3 marta, exponential backoff)
```

### 8.3 Pul seller'ga o'tish (Escrow model)

```
Buyer to'laydi → Platform escrow'da ushlab turadi
  ↓
Order COMPLETED bo'lganda:
  seller_amount = total - commission
  platform_amount = commission (default 5%)

Seller withdrawal qilishi mumkin (har haftada avtomatik yoki manual)
  Min withdrawal: 10,000 so'm
  Bank transfer yoki Click/Payme
```

### 8.4 Qaytarish (Refund) qoidalari

```
To'liq qaytarish:
  - Seller javob bermagan (auto cancel)
  - Pre-order harvest bo'lmagan
  - Buyurtma CONFIRMED'dan oldin bekor qilingan

Qisman qaytarish:
  - Mahsulot sifati past (moderator qaror qiladi)
  - Yetkazilmagan pozitsiyalar

Qaytarish muddati:
  - Click/Payme: 3-5 ish kuni
  - Naqd: yetkazuvchi orqali
```

---

## 9. YETKAZISH TIZIMI (Delivery Module)

### 9.1 Yetkazish turlari

```
1. SELLER_DELIVERY  → Seller o'zi yetkazadi
2. PLATFORM_DELIVERY → Platformning yetkazuvchisi
3. PICKUP           → Buyer o'zi olib ketadi (do'kon manzili)
```

### 9.2 Yetkazish zonalari va narx hisoblash

```
DeliveryZone:
  name, region, district
  base_fee (masalan 10,000 so'm)
  per_km_fee (masalan 500 so'm/km)
  min_order_for_free (masalan 200,000 so'mdan yuqori — bepul)
  max_delivery_days (masalan 2 kun)
  is_cold_chain_available (ayniydigan mahsulotlar uchun)

Yetkazish zonasida bo'lmasa:
  → "Sizning hududingizga yetkazish mavjud emas"
  → Pickup taklif qilinadi
```

### 9.3 Cold chain (sovuq zanjir) talabi

```
Agar mahsulot requires_cold_chain = true bo'lsa:
  → Faqat is_cold_chain_available = true bo'lgan zonalarga yetkaziladi
  → Yetkazish vaqti mahsulotning qolgan shelf_life'idan kam bo'lishi kerak
  → Aks holda buyurtma qabul qilinmaydi

Misol: Buyurtma joyi 3 kunlik yo'l, mahsulot 2 kunlik shelf_life
  → BLOKLANGAN: "Bu mahsulot siz hududingizga aynimasdan yetib bormaydi"
```

### 9.4 Yetkazuvchi tracking

```
DeliveryTracking:
  order_id
  driver_id
  current_lat, current_lng  ← har 30 soniyada yangilanadi (Socket.IO)
  status: ASSIGNED | PICKED_UP | IN_TRANSIT | ARRIVED | DELIVERED
  photo_on_delivery  ← qabul qilish paytida rasm olish majburiy
  signature          ← digital imzo (opsional)
  delivered_at
```

---

## 10. QAYTARISH VA SHIKOYAT (Return & Complaint Module)

### 10.1 Complaint turlari

```
1. PRODUCT_QUALITY   → Mahsulot sifati past (chirik, ezilgan)
2. WRONG_PRODUCT     → Boshqa mahsulot yetkazilgan
3. WRONG_QUANTITY    → Kam miqdor yetkazilgan
4. NOT_DELIVERED     → Yetkazilmadi, lekin yetkazildi deb belgilandi
5. LATE_DELIVERY     → Juda kech yetkazildi (ayniydigan uchun kritik)
6. PAYMENT_ISSUE     → To'lov muammosi
7. SELLER_FRAUD      → Firibgarlik
```

### 10.2 Complaint flow'i

```
Buyer complaint beradi (DELIVERED dan 48 soat ichida):
  → Rasm/video yuklashi mumkin (majburiy PRODUCT_QUALITY uchun)
  → status: OPEN

Seller javob beradi (24 soat ichida):
  ├─ Qabul qilsa → REFUND_AGREED → qaytarish boshlanadi
  └─ Rad etsa → DISPUTED → Moderatorga o'tadi

Moderator ko'rib chiqadi (48 soat ichida):
  ├─ Buyer foydasiga → REFUND_APPROVED → qisman/to'liq qaytarish
  └─ Seller foydasiga → CLOSED_NO_REFUND
```

### 10.3 Ayniydigan mahsulotlar uchun maxsus qoida

```
Pomidor, yashil o't kabi mahsulotlar uchun:
  → Complaint muddati 48 soat emas, 24 soat
  → Yetkazilgandan keyingi 6 soat ichida rasm yuklash kerak
  → Aks holda complaint qabul qilinmaydi

Sababi: ayniydigan mahsulot tez buziladi, seller'ni himoya qilish uchun
```

---

## 11. REYTING VA SHARHLAR (Review Module)

### 11.1 Sharh qo'shish qoidalari

```
Faqat COMPLETED buyurtma bo'lsa sharh yozish mumkin
Bitta mahsulotga faqat 1 sharh (buyurtmaga bog'liq)
Sharh yozish muddati: yetkazilgandan 30 kun ichida

Rating: 1-5 yulduz
  + matn izohi (opsional, min 10 belgi)
  + rasm (opsional, max 5)
```

### 11.2 Seller javobi

```
Seller har bir sharh'ga 1 marta javob bera oladi
Javobi ham ko'rinadi
```

### 11.3 Reyting hisoblash

```
Product rating = so'nggi 90 kunlik sharhlar o'rtacha
Shop rating = so'nggi 90 kunlik barcha mahsulotlar o'rtacha
  (yangi sharhlar ko'proq og'irlikka ega — weighted average)
```

---

## 12. BILDIRISHNOMALAR (Notification Module)

### 12.1 Notification kanallari

```
1. IN_APP     → Real-time (Socket.IO), DB da saqlanadi
2. SMS        → Eskiz.uz orqali (muhim holatlar)
3. PUSH       → Firebase (mobil ilova uchun)
```

### 12.2 Trigger → Notification xaritasi

| Trigger | Qabul qiluvchi | Kanal |
|---------|----------------|-------|
| Yangi buyurtma | Seller | Push + SMS |
| Buyurtma tasdiqlandi | Buyer | Push |
| Buyurtma yuborildi | Buyer | Push + SMS |
| Buyurtma yetkazildi | Buyer | Push + SMS |
| Buyurtma bekor qilindi | Buyer | Push + SMS |
| To'lov muvaffaqiyatli | Buyer | Push |
| To'lov muvaffaqiyatsiz | Buyer | Push + SMS |
| Mahsulot tasdiqlandi | Seller | Push |
| Mahsulot rad etildi | Seller | Push + SMS + sabab |
| Stock kam qoldi | Seller | Push |
| Mahsulot aynib bormoqda | Seller | Push + SMS |
| Yangi sharh | Seller | Push |
| Complaint | Seller + Moderator | Push + SMS |
| Complaint hal qilindi | Buyer + Seller | Push |
| Pul hisobga tushdi | Seller | Push + SMS |
| Pre-order reminder | Buyer | Push + SMS (1 kun oldin) |

---

## 13. ANALYTICS VA HISOBOTLAR (Analytics Module)

### 13.1 Seller uchun

```
Dashboard:
  - Bugungi savdo / haftalik / oylik
  - Ko'p sotilgan mahsulotlar TOP-10
  - Bekor qilingan buyurtmalar foizi
  - Complaint nisbati
  - Ombordagi mahsulotlar holati (ayniydigan)
  - Kutilayotgan pul chiqarish

Hisobotlar (export: Excel/PDF):
  - Sotuvlar hisobi
  - Tovarlar hisobi
  - Mijozlar hisobi
```

### 13.2 Admin uchun

```
Platform dashboard:
  - Umumiy aylanma (GMV)
  - Faol seller/buyer soni
  - Eng faol hududlar
  - Eng ko'p shikoyat qilingan seller'lar
  - To'lov usullari statistikasi
  - Komissiya daromadi
  - Ayniydigan mahsulotlar yo'qotishi (loss tracking)
```

---

## 14. RISKLAR VA YECHIMLAR

### 14.1 Mahsulot ayniydigan risklar

| Risk | Ehtimollik | Ta'sir | Yechim |
|------|-----------|--------|--------|
| Mahsulot buyurtmadan oldin aynigan | O'rta | Yuqori | expiry_date tekshiruvi, seller alert |
| Yetkazish kechikib mahsulot aynigan | O'rta | Yuqori | shelf_life vs delivery_time tekshiruvi |
| Seller eski stock qo'shishi | Past | O'rta | harvest_date majburiy, admin tekshiruvi |
| Sovuq zanjir buzilishi | Past | Juda yuqori | cold_chain flag, maxsus courier |
| Omborda noto'g'ri temperatura | Past | O'rta | Seller mas'uliyati, complaint mexanizmi |

### 14.2 Moliyaviy risklar

| Risk | Ehtimollik | Ta'sir | Yechim |
|------|-----------|--------|--------|
| Duplicate to'lov (double charge) | Past | Yuqori | Idempotency key, webhook deduplication |
| To'lov muvaffaqiyatsiz, buyurtma qoladi | O'rta | O'rta | Payment confirmation oldidan order yaratilmaydi |
| Seller pul ololmay qolishi | Past | Yuqori | Escrow, manual withdrawal + bank API |
| Buyer firibgarligi (goods + refund) | Past | O'rta | Rasm majburiy, moderator ko'rib chiqishi |
| Platform komissiya yo'qotishi | O'rta | O'rta | Escrow — komissiya avval ajratiladi |
| Narx manipulyatsiyasi | Past | O'rta | 50% narx chegarasi, audit log |

### 14.3 Operatsion risklar

| Risk | Ehtimollik | Ta'sir | Yechim |
|------|-----------|--------|--------|
| Seller javob bermaydi | O'rta | O'rta | 1 soat timeout + auto cancel |
| Ombor ko'rsatkichi noto'g'ri (overselling) | O'rta | Yuqori | DB-level lock, atomic decrement |
| Bir mahsulotga 2 ta buyurtma | O'rta | Yuqori | Optimistic locking |
| Yetkazuvchi yo'qolib qolishi | Past | Yuqori | GPS tracking, timeout alert |
| Seller do'konini yopish + buyurtmalar | Past | Yuqori | CLOSED shop'dagi pending buyurtmalar avval hal qilinadi |

### 14.4 Texnik risklar

| Risk | Ehtimollik | Ta'sir | Yechim |
|------|-----------|--------|--------|
| DB connection pool exhaustion | Past | Kritik | Connection pool limit + queue |
| Redis down → session yo'qolishi | Past | Yuqori | Redis sentinel/cluster + DB fallback |
| Payment webhook yo'qolishi | O'rta | Yuqori | Webhook retry + manual check endpoint |
| Rasm yuklash limit oshishi | O'rta | Past | Cloudinary limits, compress before upload |
| OTP spam | O'rta | O'rta | Rate limit: 3 OTP/soat per phone |

### 14.5 Qonuniy va regulyatorlik risklari

| Risk | Yechim |
|------|--------|
| Sertifikatsiz mahsulot sotish | Seller sertifikat yuklashi (opsional, lekin admin belgilay oladi "Sertifikat talab qilinadi") |
| Sifat nazorati | Moderatsiya, complaint mexanizmi |
| Soliq masalalari | Seller'ga chek (check) mexanizmi (kelajakda) |
| Ma'lumotlar himoyasi | GDPR-ga o'xshash: user ma'lumotlarini o'chirish huquqi |

---

## 15. DATABASE SCHEMASI

### 15.1 Asosiy jadvallar

```sql
-- USERS
users:
  id (UUID, PK)
  phone (VARCHAR, UNIQUE)
  email (VARCHAR, nullable)
  full_name (VARCHAR)
  role (ENUM: super_admin, moderator, seller, buyer, delivery_man)
  status (ENUM: active, suspended, banned)
  is_verified (BOOLEAN)
  avatar_url (VARCHAR)
  otp_attempts (SMALLINT, default 0)
  otp_blocked_until (TIMESTAMP)
  created_at, updated_at

-- REFRESH TOKENS
refresh_tokens:
  id (UUID, PK)
  user_id (FK users)
  token (VARCHAR, UNIQUE, hashed)
  expires_at (TIMESTAMP)
  is_revoked (BOOLEAN)
  device_info (JSONB)

-- SHOPS
shops:
  id (UUID, PK)
  owner_id (FK users, UNIQUE)
  name (VARCHAR)
  slug (VARCHAR, UNIQUE)
  description (TEXT)
  logo_url, banner_url
  region, district, address
  lat, lng (DECIMAL)
  status (ENUM: pending, active, suspended, closed)
  rating (DECIMAL 3,2)
  total_sales (INT)
  commission_rate (DECIMAL 5,2, default 5.00)
  is_verified (BOOLEAN)
  bank_account (JSONB, encrypted)  ← pul chiqarish uchun
  warning_count (SMALLINT, default 0)

-- CATEGORIES
categories:
  id (UUID, PK)
  name_uz, name_ru
  slug (UNIQUE)
  parent_id (FK self, nullable)
  icon_url
  ordering (INT)
  is_active (BOOLEAN)

-- PRODUCTS
products:
  id (UUID, PK)
  shop_id (FK shops)
  category_id (FK categories)
  name_uz, name_ru
  description_uz, description_ru
  price (DECIMAL 12,2)
  discount_price (DECIMAL 12,2, nullable)
  unit (ENUM: kg, gramm, tonna, litr, dona, quti)
  min_order_qty (DECIMAL 10,2)
  stock_qty (DECIMAL 10,2)
  is_perishable (BOOLEAN, default false)
  shelf_life_days (INT, nullable)        ← saqlash muddati (kunlarda)
  storage_temp_min (DECIMAL 4,1)         ← -18°C ga qadar
  storage_temp_max (DECIMAL 4,1)
  requires_cold_chain (BOOLEAN, default false)
  harvest_date (DATE, nullable)
  expiry_date (DATE, nullable)
  origin_region (VARCHAR)
  is_organic (BOOLEAN)
  max_preorder_days (INT, default 0)     ← oldindan buyurtma qilish chegarasi
  low_stock_alert_qty (DECIMAL)          ← past chegara alert uchun
  status (ENUM: draft, pending, active, rejected, hidden, expired, out_of_stock)
  rejection_reason (TEXT, nullable)
  rating (DECIMAL 3,2)
  views_count (INT)
  sales_count (INT)
  slug (VARCHAR, UNIQUE)
  is_deleted (BOOLEAN, default false)    ← soft delete

-- PRODUCT_IMAGES
product_images:
  id (UUID, PK)
  product_id (FK products)
  url (VARCHAR)
  is_main (BOOLEAN)
  ordering (INT)

-- PRODUCT_CERTIFICATES
product_certificates:
  id (UUID, PK)
  product_id (FK products)
  cert_type (VARCHAR)  ← organic, halal, iso, etc.
  cert_url (VARCHAR)
  issued_at (DATE)
  expires_at (DATE)

-- CARTS (Redis'da ham saqlanadi, DB backup)
carts:
  id (UUID, PK)
  user_id (FK users, UNIQUE)
  expires_at (TIMESTAMP)

cart_items:
  id (UUID, PK)
  cart_id (FK carts)
  product_id (FK products)
  quantity (DECIMAL)
  price_snapshot (DECIMAL)    ← qo'shilgan paytdagi narx
  added_at (TIMESTAMP)

-- ORDERS
orders:
  id (UUID, PK)
  order_number (VARCHAR, UNIQUE)  ← ORD-2024-000001
  buyer_id (FK users)
  shop_id (FK shops)
  status (ENUM: new, pre_order, confirmed, preparing, shipped, delivered, completed, cancelled)
  type (ENUM: standard, pre_order)
  total_amount (DECIMAL 12,2)
  subtotal (DECIMAL 12,2)
  delivery_fee (DECIMAL 10,2)
  platform_commission (DECIMAL 10,2)
  seller_amount (DECIMAL 10,2)
  payment_method (ENUM: click, payme, uzcard, cash, card)
  payment_status (ENUM: pending, initiated, processing, paid, failed, refunded, partial_refunded, expired)
  delivery_type (ENUM: seller_delivery, platform_delivery, pickup)
  delivery_address (JSONB)
  delivery_zone_id (FK delivery_zones, nullable)
  expected_delivery_date (DATE)
  actual_delivery_date (DATE, nullable)
  notes (TEXT)
  cancel_reason (TEXT)
  cancelled_by (FK users, nullable)
  pre_order_harvest_date (DATE, nullable)
  delivered_at (TIMESTAMP)
  auto_complete_at (TIMESTAMP)  ← delivered + 48 soat

-- ORDER_ITEMS
order_items:
  id (UUID, PK)
  order_id (FK orders)
  product_id (FK products)
  product_name_snapshot (VARCHAR)  ← o'chib ketsa ham saqlanadi
  quantity (DECIMAL)
  unit_price (DECIMAL 12,2)        ← buyurtma paytidagi narx
  total_price (DECIMAL 12,2)

-- ORDER_STATUS_HISTORY (audit trail)
order_status_history:
  id (UUID, PK)
  order_id (FK orders)
  from_status (VARCHAR)
  to_status (VARCHAR)
  changed_by (FK users)
  reason (TEXT)
  created_at (TIMESTAMP)

-- PAYMENTS
payments:
  id (UUID, PK)
  order_id (FK orders)
  amount (DECIMAL 12,2)
  provider (ENUM: click, payme, uzcard, cash)
  provider_transaction_id (VARCHAR, nullable)
  provider_payment_url (VARCHAR, nullable)
  status (ENUM: pending, initiated, processing, paid, failed, refunded, expired)
  raw_response (JSONB)   ← provider'dan kelgan to'liq javob
  idempotency_key (VARCHAR, UNIQUE)  ← duplicate to'lovni bloklash
  created_at, updated_at

-- SELLER_WALLETS
seller_wallets:
  id (UUID, PK)
  shop_id (FK shops, UNIQUE)
  balance (DECIMAL 12,2, default 0)
  pending_balance (DECIMAL 12,2, default 0)  ← escrow'dagi pul
  total_earned (DECIMAL 12,2, default 0)
  total_withdrawn (DECIMAL 12,2, default 0)

-- WALLET_TRANSACTIONS
wallet_transactions:
  id (UUID, PK)
  wallet_id (FK seller_wallets)
  type (ENUM: credit, debit, refund_debit, commission)
  amount (DECIMAL 12,2)
  order_id (FK orders, nullable)
  description (TEXT)
  created_at (TIMESTAMP)

-- DELIVERY_ZONES
delivery_zones:
  id (UUID, PK)
  name (VARCHAR)
  region, district
  base_fee (DECIMAL 10,2)
  per_km_fee (DECIMAL 10,2)
  min_order_free_delivery (DECIMAL 12,2)
  max_delivery_days (INT)
  is_cold_chain_available (BOOLEAN)
  is_active (BOOLEAN)

-- DELIVERY_ORDERS
delivery_orders:
  id (UUID, PK)
  order_id (FK orders, UNIQUE)
  driver_id (FK users, nullable)
  status (ENUM: pending, assigned, picked_up, in_transit, arrived, delivered, failed)
  current_lat, current_lng (DECIMAL)
  pickup_photo_url (VARCHAR)   ← do'kondan olayotganda rasm
  delivery_photo_url (VARCHAR) ← yetkazganda rasm (majburiy)
  picked_up_at (TIMESTAMP)
  delivered_at (TIMESTAMP)
  failed_reason (TEXT)

-- COMPLAINTS
complaints:
  id (UUID, PK)
  order_id (FK orders)
  buyer_id (FK users)
  type (ENUM: product_quality, wrong_product, wrong_quantity, not_delivered, late_delivery, payment_issue, seller_fraud)
  description (TEXT)
  status (ENUM: open, seller_responded, disputed, refund_agreed, refund_approved, closed_no_refund, closed)
  refund_amount (DECIMAL 12,2, nullable)
  refund_type (ENUM: full, partial, none)
  moderator_id (FK users, nullable)
  moderator_decision (TEXT)
  seller_response (TEXT)
  created_at, updated_at
  resolved_at (TIMESTAMP)

-- COMPLAINT_EVIDENCES
complaint_evidences:
  id (UUID, PK)
  complaint_id (FK complaints)
  uploaded_by (FK users)
  file_url (VARCHAR)
  file_type (ENUM: image, video)

-- REVIEWS
reviews:
  id (UUID, PK)
  order_id (FK orders)
  user_id (FK users)
  product_id (FK products)
  rating (SMALLINT 1-5)
  comment (TEXT)
  images (JSONB)  ← array of urls
  seller_reply (TEXT)
  is_hidden (BOOLEAN, default false)  ← moderator yashirishi mumkin
  created_at, updated_at

-- NOTIFICATIONS
notifications:
  id (UUID, PK)
  user_id (FK users)
  type (VARCHAR)
  title (VARCHAR)
  body (TEXT)
  data (JSONB)   ← deep link, order_id va boshqalar
  is_read (BOOLEAN, default false)
  channels (JSONB)  ← ['in_app', 'sms', 'push']
  sent_via (JSONB)  ← yuborilgan kanallar
  created_at

-- WITHDRAWAL_REQUESTS
withdrawal_requests:
  id (UUID, PK)
  shop_id (FK shops)
  wallet_id (FK seller_wallets)
  amount (DECIMAL 12,2)
  bank_details (JSONB, encrypted)
  status (ENUM: pending, processing, completed, rejected)
  admin_note (TEXT)
  processed_by (FK users, nullable)
  created_at, processed_at
```

---

## 16. API ENDPOINTLAR

### 16.1 Auth

```
POST /api/auth/send-otp          → SMS OTP yuborish
POST /api/auth/verify-otp        → OTP tasdiqlash + token olish
POST /api/auth/refresh            → Access token yangilash
POST /api/auth/logout             → Refresh token revoke
GET  /api/auth/me                 → Joriy foydalanuvchi
PUT  /api/auth/profile            → Profil yangilash
```

### 16.2 Shops

```
GET    /api/shops                  → Ro'yxat (filter, paginate)
GET    /api/shops/:slug            → Bitta do'kon
POST   /api/shops                  → Do'kon ochish (seller)
PUT    /api/shops/:id              → Yangilash
PATCH  /api/shops/:id/status       → Admin: holat o'zgartirish
```

### 16.3 Products

```
GET    /api/products               → Qidiruv + filter + paginate
GET    /api/products/:slug         → Bitta mahsulot
POST   /api/products               → Qo'shish (seller)
PUT    /api/products/:id           → Yangilash
PATCH  /api/products/:id/status    → Moderator: tasdiqlash/rad etish
PATCH  /api/products/:id/stock     → Stock yangilash
DELETE /api/products/:id           → Soft delete
POST   /api/products/:id/images    → Rasm qo'shish
```

### 16.4 Cart

```
GET    /api/cart                   → Savat ko'rish
POST   /api/cart/items             → Mahsulot qo'shish
PATCH  /api/cart/items/:id         → Miqdor o'zgartirish
DELETE /api/cart/items/:id         → O'chirish
DELETE /api/cart                   → Savatni tozalash
POST   /api/cart/validate          → Checkout oldidan tekshirish
```

### 16.5 Orders

```
POST   /api/orders/checkout        → Buyurtma yaratish
GET    /api/orders                 → Ro'yxat (buyer/seller/admin)
GET    /api/orders/:id             → Bitta buyurtma
PATCH  /api/orders/:id/confirm     → Seller: tasdiqlash
PATCH  /api/orders/:id/prepare     → Seller: tayyorlanmoqda
PATCH  /api/orders/:id/ship        → Seller/driver: yuborildi
PATCH  /api/orders/:id/deliver     → Driver: yetkazildi
PATCH  /api/orders/:id/complete    → Buyer: qabul qildim
PATCH  /api/orders/:id/cancel      → Bekor qilish
GET    /api/orders/:id/history     → Holat tarixi
```

### 16.6 Payments

```
POST   /api/payments/:order_id/initiate   → To'lovni boshlash
GET    /api/payments/:order_id/status     → To'lov holati
POST   /api/payments/click/webhook        → Click webhook
POST   /api/payments/payme/webhook        → Payme webhook
POST   /api/payments/:order_id/refund     → Admin: qaytarish
```

### 16.7 Complaints

```
POST   /api/complaints             → Shikoyat berish
GET    /api/complaints             → Ro'yxat
GET    /api/complaints/:id         → Bitta shikoyat
POST   /api/complaints/:id/respond → Seller: javob berish
PATCH  /api/complaints/:id/resolve → Moderator: hal qilish
POST   /api/complaints/:id/evidences → Rasm/video qo'shish
```

### 16.8 Reviews

```
POST   /api/reviews                → Sharh yozish
GET    /api/products/:id/reviews   → Mahsulot sharhlari
PATCH  /api/reviews/:id/reply      → Seller: javob
PATCH  /api/reviews/:id/hide       → Moderator: yashirish
```

### 16.9 Notifications

```
GET    /api/notifications          → Ro'yxat
PATCH  /api/notifications/:id/read → O'qildi
PATCH  /api/notifications/read-all → Hammasini o'qildi
```

### 16.10 Seller wallet

```
GET    /api/wallet                 → Balans va tranzaktsiyalar
POST   /api/wallet/withdraw        → Pul chiqarish so'rovi
GET    /api/wallet/transactions    → Tarix
```

### 16.11 Analytics

```
GET    /api/analytics/seller/dashboard   → Seller dashboard
GET    /api/analytics/seller/sales       → Sotuvlar hisobi
GET    /api/analytics/admin/dashboard    → Admin dashboard
GET    /api/analytics/admin/platform     → Platform hisobi
```

---

## 17. BACKGROUND JOBS (Bull Queue)

```javascript
// Har 30 daqiqada ishga tushadigan joblar:

job: CHECK_EXPIRY_PRODUCTS
  → expiry_date <= today → EXPIRED
  → expiry_date <= today + 3 → seller'ga ogohlantirish

job: CHECK_LOW_STOCK
  → stock_qty <= low_stock_alert_qty → seller'ga notification

job: AUTO_CANCEL_PENDING_ORDERS
  → status = NEW, created_at + 1.5h < now → AUTO_CANCELLED

job: AUTO_COMPLETE_DELIVERED_ORDERS
  → status = DELIVERED, delivered_at + 48h < now → COMPLETED
  → Pul seller'ga o'tadi

job: PRE_ORDER_REMINDER
  → type = pre_order, expected_delivery - 1 day → buyer'ga SMS + push

job: CLEANUP_EXPIRED_CARTS
  → cart.expires_at < now → O'chirish

job: SEND_SELLER_WEEKLY_REPORT
  → Har dushanba → seller'ga haftalik hisobot SMS/email

job: PROCESS_SELLER_PAYMENTS
  → Har juma → pending withdrawal'larni avtomatik qayta ishlash
```

---

## 18. XAVFSIZLIK CHORALARI

```
1. Rate Limiting:
   - /api/auth/send-otp: 3 req/soat per IP + phone
   - /api/* : 100 req/daqiqa per user
   - /api/payments/*/webhook: IP whitelist only

2. Input Validation: joi yoki zod barcha endpointlarda

3. SQL Injection: Sequelize ORM, parametrized queries

4. XSS: Content sanitization, helmet.js

5. CORS: Faqat whitelist domenlardan

6. Secrets: .env, DB encrypted columns (bank details)

7. File Upload:
   - Faqat jpg/png/mp4
   - Max 5MB rasm, 50MB video
   - Cloudinary'ga yuklash, to'g'ridan-to'g'ri server'ga emas

8. Audit Log: Har bir muhim amal (order status, payment, admin action) loglanadi
```

---

## 19. LOYIHA PAPKA TUZILISHI (Express.js)

```
agro-market-backend/
├── src/
│   ├── config/
│   │   ├── database.js       (Sequelize)
│   │   ├── redis.js
│   │   ├── cloudinary.js
│   │   └── bull.js
│   ├── middlewares/
│   │   ├── auth.js           (JWT verify)
│   │   ├── authorize.js      (role-based)
│   │   ├── rateLimiter.js
│   │   ├── validate.js       (joi validation)
│   │   └── errorHandler.js
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── shops/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── delivery/
│   │   ├── complaints/
│   │   ├── reviews/
│   │   ├── notifications/
│   │   ├── wallet/
│   │   └── analytics/
│   ├── models/               (Sequelize models)
│   ├── jobs/                 (Bull queue workers)
│   ├── services/
│   │   ├── sms.service.js    (Eskiz.uz)
│   │   ├── push.service.js   (Firebase)
│   │   ├── payment/
│   │   │   ├── click.service.js
│   │   │   └── payme.service.js
│   │   └── socket.service.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── paginate.js
│   │   └── generateSlug.js
│   └── app.js
├── migrations/
├── seeders/
├── tests/
├── .env
├── .env.example
└── package.json
```

---

## 20. BITIRUV ISHI UCHUN HAKAMLAR SAVOL BEROLMAYDIGAN NUQTALAR

1. **Mahsulot ayniydigan muammo** — shelf_life_days, expiry_date, yetkazish vaqti bilan avtomatik tekshiruv

2. **Oldindan buyurtma** — harvest pre-order, pul bloklanishi, otmena holatlari

3. **Overselling** — DB-level atomic decrement, race condition himoyasi

4. **Moliyaviy xavfsizlik** — Escrow model, komissiya avval ajratiladi, seller pul ololmay qolmaydi

5. **Complaint 48 soat** (ayniydigan — 24 soat), rasm majburiy

6. **Seller javob bermasa** — 1 soat timeout, 5 marta — SUSPENDED

7. **Cold chain** — delivery zone va mahsulot flaglari mosligini tekshirish

8. **Webhook idempotency** — duplicate to'lov bloklash

9. **Audit trail** — barcha holat o'zgarishlari tarixi

10. **Geo-filtering** — xaridor hududiga yetkazish imkoni tekshiruvi
