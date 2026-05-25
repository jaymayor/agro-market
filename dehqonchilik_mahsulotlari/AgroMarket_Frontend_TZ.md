# AGRO MARKET - FRONTEND TEXNIK ZADACHA

## Dehqonchilik mahsulotlarini online sotish platformasi
**Versiya:** 1.0  
**Sana:** 2025-yil  
**Backend:** Python + Django + DRF

---

## 1. UMUMIY MA'LUMOTLAR

### 1.1. Loyiha tavsifi
Agro Market - dehqonchilik mahsulotlarini online sotish platformasi. Ushbu platforma orqali dehqonlar o'z mahsulotlarini sotish va xaridorlar yangi, sifatli dehqonchilik mahsulotlarini sotib olishlari mumkin.

### 1.2. Maqsadli auditoriya
- **Sotuvchilar (Dehqonlar):** Mahsulotlarini online sotishni istagan dehqonlar
- **Xaridorlar:** Yangi, sifatli dehqonchilik mahsulotlarini sotib olmoqchi bo'lgan shaxslar
- **Adminlar:** Platformani boshqaruvchilar

### 1.3. Texnologiya stack
| Komponent | Texnologiya |
|-----------|-------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Kit | shadcn/ui |
| State Management | Zustand |
| Query | TanStack Query (React Query) |
| Form | React Hook Form + Zod |
| HTTP Client | Axios |
| Auth | JWT (access/refresh tokens) |
| Maps | Yandex Maps / Google Maps |
| Charts | Recharts |
| Icons | Lucide React |

---

## 2. FUNKSIYONAL TALABLAR

### 2.1. Autentifikatsiya moduli

#### 2.1.1. Ro'yxatdan o'tish (Register)
- Telefon raqami orqali ro'yxatdan o'tish
- SMS orqali tasdiqlash kodi (OTP)
- Parol yaratish
- Foydalanuvchi roli tanlash (Sotuvchi / Xaridor)

#### 2.1.2. Kirish (Login)
- Telefon raqami + parol
- JWT tokenlarni saqlash (httpOnly cookie)
- Token yangilash (refresh)

#### 2.1.3. Parolni tiklash
- SMS orqali tasdiqlash
- Yangi parol yaratish

### 2.2. Umumiy interfeys (Barcha foydalanuvchilar uchun)

#### 2.2.1. Bosh sahifa (Home)
- Hero section (asl banner)
- Kategoriyalar ro'yxati
- Tavsiya etilgan mahsulotlar
- Eng ko'p sotilgan mahsulotlar
- Yangi qo'shilgan mahsulotlar
- Top do'konlar

#### 2.2.2. Kategoriyalar
- Kategoriya daraxti (parent/child)
- Kategoriya bo'yicha filtrlash
- Kategoriya ikonkalari

#### 2.2.3. Mahsulotlar katalogi
- Grid / List ko'rinishi
- Filtrlash:
  - Narx (min/max)
  - Kategoriya
  - Viloyat
  - Organik (ha/yo'q)
  - Reyting
- Saralash:
  - Narx (o'sish/kamayish)
  - Yangilik
  - Reyting
  - Mashhurlik
- Pagination yoki infinite scroll
- Mahsulot kartochkalari:
  - Rasm
  - Nomi
  - Narx (chegirma bo'lsa eski narxni chizib qo'yish)
  - Do'kon nomi
  - Reyting
  - Joylashuv (viloyat)

#### 2.2.4. Mahsulot detali (Product Detail)
- Galereya (bir nechta rasmlar)
- Mahsulot nomi va tavsifi
- Narx va chegirma
- Sotuvchi ma'lumotlari
- Joylashuv (xarita)
- Yetkazib berish haqida ma'lumot
- Sharhlar va reytinglar
- O'xshash mahsulotlar
- "Savatga qo'shish" tugmasi

#### 2.2.5. Do'konlar katalogi
- Do'kon kartochkalari:
  - Logo
  - Nomi
  - Reyting
  - Mahsulotlar soni
  - Joylashuv
- Filtrlash (viloyat, reyting)

#### 2.2.6. Do'kon detali
- Do'kon haqida ma'lumot
- Barcha mahsulotlar
- Do'kon reytingi
- Aloqa ma'lumotlari
- Xarita

#### 2.2.7. Qidiruv
- Real-time qidiruv (Elasticsearch)
- Avtomatik to'ldirish (suggestions)
- Qidiruv natijalari filtrlash

### 2.3. Xaridor (Buyer) interfeysi

#### 2.3.1. Savat (Cart)
- Mahsulotlar ro'yxati
- Miqdorni o'zgartirish
- Mahsulotni o'chirish
- Umumiy narx
- Buyurtma berish tugmasi

#### 2.3.2. Buyurtma berish (Checkout)
- Yetkazib berish manzilini tanlash/yaratish
- To'lov usulini tanlash (Click, Payme, Naqd)
- Buyurtma tasdiqlash
- To'lov oynasi (integratsiya)

#### 2.3.3. Buyurtmalar tarixi
- Buyurtmalar ro'yxati
- Statuslar:
  - Yangi
  - Tasdiqlandi
  - Tayyorlanmoqda
  - Yo'lda
  - Yetkazildi
  - Yakunlandi
  - Bekor qilindi
- Buyurtma detali
- Takroriy buyurtma

#### 2.3.4. Profil
- Shaxsiy ma'lumotlarni tahrirlash
- Telefon raqami
- Profil rasmi
- Manzillarni boshqarish

#### 2.3.5. Sevimlilar (Wishlist)
- Sevimli mahsulotlar ro'yxati
- Savatga qo'shish
- O'chirish

#### 2.3.6. Sharhlar
- O'z buyurtmalari uchun sharh qoldirish
- Reyting qo'yish
- Rasmlar yuklash

### 2.4. Sotuvchi (Seller/Dehqon) interfeysi

#### 2.4.1. Do'kon boshqaruvi
- Do'kon ma'lumotlarini tahrirlash
- Logotip va banner yuklash
- Joylashuvni xaritada belgilash
- Do'kon statistikasi:
  - Jami sotuvlar
  - Daromad
  - Reyting

#### 2.4.2. Mahsulotlar boshqaruvi
- Mahsulot qo'shish
- Mahsulot tahrirlash
- Mahsulot o'chirish
- Status boshqaruvi (Faol/Yashirin)
- Zaxira boshqaruvi

#### 2.4.3. Buyurtmalarni boshqarish
- Kelgan buyurtmalar
- Status yangilash
- Yetkazib berish kuzatuvi
- Xaridor bilan aloqa

#### 2.4.4. Moliya
- Hisobotlar
- To'lovlar tarixi
- Komissiya hisoboti
- Balans

### 2.5. Admin interfeysi

#### 2.5.1. Dashboard
- Umumiy statistika:
  - Foydalanuvchilar soni
  - Do'konlar soni
  - Mahsulotlar soni
  - Buyurtmalar soni
  - Daromad
- Grafiklar (kun/hafta/oy/yil)

#### 2.5.2. Foydalanuvchilar boshqaruvi
- Foydalanuvchilar ro'yxati
- Rol o'zgartirish
- Bloklash/unbloklash
- Profil ko'rish

#### 2.5.3. Do'konlar moderatsiyasi
- Yangi do'kon arizalari
- Do'konni tasdiqlash/rad etish
- Do'konlarni bloklash

#### 2.5.4. Mahsulotlar moderatsiyasi
- Yangi mahsulotlar tekshiruvi
- Tasdiqlash/rad etish
- Kategoriyalarni boshqarish

#### 2.5.5. Buyurtmalarni kuzatuv
- Barcha buyurtmalar
- Statuslarni boshqarish
- To'lovlar statusi

#### 2.5.6. Content boshqaruvi
- Bannerlarni boshqarish
- Tavsiflar (FAQ, About, Terms)

---

## 3. UI/UX TALABLAR

### 3.1. Dizayn talablari
- **Ranglar:**
  - Asosiy: Yashil (#22C55E) - dehqonchilik temasi
  - Ikkilamchi: To'q ko'k (#1E3A5F)
  - Fon: Oq (#FFFFFF)
  - Matn: Qora (#1F2937)
  - Xato: Qizil (#EF4444)
  - Ogohlantirish: Sariq (#F59E0B)
  - Muvaffaqiyat: Yashil (#10B981)

### 3.2. Responsive talablar
- **Mobile:** 320px - 767px
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px+

### 3.3. Animatsiyalar
- Sahifa o'tishlari: 300ms ease-in-out
- Hover effektlar: 200ms
- Loading skeletons
- Toast notifications (slide-in)

### 3.4. Til qo'llab-quvvatlash
- O'zbek (lotin)
- Rus
- (Keyinchalik ingliz tili qo'shilishi mumkin)

---

## 4. INTEGRATSIYALAR

### 4.1. Backend API
- **Base URL:** `http://localhost:8000/api/v1/`
- **Auth:** JWT (Bearer token)
- **Content-Type:** application/json

### 4.2. To'lov tizimlari
- **Click:** Widget integratsiyasi
- **Payme:** Widget integratsiyasi

### 4.3. Xarita
- **Yandex Maps:** Do'konlar joylashuvi
- Geolokatsiya qo'llab-quvvatlash

### 4.4. SMS
- Eskiz SMS (backend orqali)

---

## 5. FOLDER STRUCTURE

```
agromarket-frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth layout
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (main)/              # Main layout
│   │   ├── page.tsx         # Home
│   │   ├── products/
│   │   ├── categories/
│   │   ├── shops/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── profile/
│   │   └── search/
│   ├── seller/              # Seller dashboard
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── shop/
│   │   └── finance/
│   ├── admin/               # Admin panel
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── shops/
│   │   ├── products/
│   │   └── orders/
│   ├── api/                 # API routes (Next.js)
│   ├── layout.tsx
│   └── globals.css
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── common/              # Common components
│   ├── forms/               # Form components
│   ├── product/             # Product components
│   ├── shop/                # Shop components
│   ├── cart/                # Cart components
│   ├── order/               # Order components
│   └── layout/              # Layout components
├── lib/                     # Utilities
│   ├── api/                 # API clients
│   ├── hooks/               # Custom hooks
│   ├── store/               # Zustand stores
│   ├── utils/               # Helper functions
│   └── constants/           # Constants
├── types/                   # TypeScript types
├── public/                  # Static files
└── middleware.ts            # Next.js middleware
```

---

## 6. API ENDPOINTLAR (Backend bilan integratsiya)

### 6.1. Auth
- `POST /auth/register/` - Ro'yxatdan o'tish
- `POST /auth/login/` - Kirish
- `POST /auth/logout/` - Chiqish
- `POST /auth/token/refresh/` - Token yangilash
- `POST /auth/send-otp/` - SMS yuborish
- `POST /auth/verify-otp/` - SMS tasdiqlash
- `POST /auth/change-password/` - Parol o'zgartirish
- `GET /auth/me/` - Joriy foydalanuvchi

### 6.2. Mahsulotlar
- `GET /products/` - Barcha mahsulotlar
- `GET /products/{slug}/` - Mahsulot detali
- `GET /products/{slug}/reviews/` - Sharhlar
- `POST /products/{slug}/add-image/` - Rasm qo'shish (seller)
- `DELETE /products/{slug}/remove-image/{image_id}/` - Rasm o'chirish

### 6.3. Kategoriyalar
- `GET /products/categories/` - Kategoriyalar
- `GET /products/categories/{slug}/` - Kategoriya detali

### 6.4. Do'konlar
- `GET /shops/` - Barcha do'konlar
- `GET /shops/{slug}/` - Do'kon detali
- `GET /shops/{slug}/products/` - Do'kon mahsulotlari
- `GET /shops/my-shop/` - Mening do'konim (seller)
- `POST /shops/` - Do'kon yaratish (seller)
- `PATCH /shops/{slug}/update-status/` - Status yangilash (admin)

### 6.5. Buyurtmalar
- `GET /orders/` - Mening buyurtmalarim
- `POST /orders/` - Buyurtma yaratish
- `GET /orders/{id}/` - Buyurtma detali
- `PATCH /orders/{id}/update-status/` - Status yangilash
- `POST /orders/{id}/cancel/` - Bekor qilish

### 6.6. To'lovlar
- `GET /payments/` - To'lovlar tarixi
- `POST /payments/initiate/` - To'lovni boshlash
- `POST /payments/click/{action}/` - Click webhook
- `POST /payments/payme/` - Payme webhook

### 6.7. Sharhlar
- `GET /reviews/` - Barcha sharhlar
- `POST /reviews/` - Sharh qoldirish
- `POST /reviews/{id}/reply/` - Javob yozish (seller)

---

## 7. SECURITY TALABLARI

- HTTPS qo'llab-quvvatlash
- XSS va CSRS himoyasi
- JWT tokenlarini xavfsiz saqlash (httpOnly cookies)
- Rate limiting (404, 429 xatolari uchun)
- Input validatsiya (Zod)

---

## 8. PRODUCTION TALABLARI

- SEO optimallashtirish (Next.js metadata API)
- Performance optimallashtirish (Image optimization, Code splitting)
- Caching (React Query, Service Worker)
- Error tracking (Sentry)
- Analytics (Google Analytics / Yandex Metrica)

---

## 9. BOSQICHLAR (MVP)

### Bosqich 1: Asosiy funksiyalar (2 hafta)
- Auth (login, register, OTP)
- Bosh sahifa
- Mahsulotlar katalogi
- Mahsulot detali
- Savat

### Bosqich 2: Buyurtma va to'lov (1 hafta)
- Checkout
- Buyurtmalar tarixi
- To'lov integratsiyasi

### Bosqich 3: Sotuvchi kabineti (1 hafta)
- Do'kon boshqaruvi
- Mahsulotlar boshqaruvi
- Buyurtmalarni boshqarish

### Bosqich 4: Admin panel (1 hafta)
- Dashboard
- Moderatsiya
- Foydalanuvchilar boshqaruvi

---

**Tayyor:** _____________  
**Tekshiruvchi:** _____________  
**Sana:** _____________
