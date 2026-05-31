# Fermer (Seller) Panel — To'liq Workflow

## API Endpointlar ro'yxati

| Method | Endpoint | Rol | Tavsif |
|--------|----------|-----|--------|
| POST | `/auth/send-otp` | Hammaga | OTP yuborish |
| POST | `/auth/verify-otp` | Hammaga | OTP tasdiqlash + user yaratish (role: buyer\|seller) |
| GET | `/auth/me` | Auth | Joriy foydalanuvchi |
| PUT | `/auth/profile` | Auth | Profil yangilash |
| POST | `/shops` | seller | Do'kon yaratish (status: pending) |
| GET | `/shops/my` | seller | O'z do'konini ko'rish |
| PUT | `/shops/my` | seller | Do'konni yangilash |
| PATCH | `/shops/:id/status` | admin | Do'kon statusini o'zgartirish |
| GET | `/products/my` | seller | O'z mahsulotlari |
| POST | `/products` | seller | Mahsulot yaratish (status: pending) |
| PUT | `/products/:id` | seller | Mahsulotni yangilash |
| DELETE | `/products/:id` | seller | Mahsulotni o'chirish |
| POST | `/products/:id/images` | seller | Rasm yuklash |
| PATCH | `/products/:id/approve` | admin | Mahsulotni tasdiqlash |
| PATCH | `/products/:id/reject` | admin | Mahsulotni rad etish |
| GET | `/orders` | seller/buyer | Buyurtmalar ro'yxati |
| PATCH | `/orders/:id/confirm` | seller | Buyurtmani tasdiqlash |
| PATCH | `/orders/:id/prepare` | seller | Tayyorlanmoqda |
| PATCH | `/orders/:id/ship` | seller | Jo'natildi |
| GET | `/analytics/seller/dashboard` | seller | Dashboard statistikasi |
| GET | `/analytics/seller/sales` | seller | Sotuv grafiği |
| GET | `/wallet` | seller | Hamyon holati |
| GET | `/wallet/transactions` | seller | Tranzaksiyalar |
| POST | `/wallet/withdraw` | seller | Pul yechish |

---

## Fermer Workflow (Ketma-ket)

### 1. RO'YXATDAN O'TISH
```
/auth → telefon raqam → OTP → role: "seller" tanlash → OTP tasdiqlash
  → isNew=true → /seller/onboarding
  → isNew=false → /seller (agar shop active) | /seller/pending (agar pending)
```

### 2. ONBOARDING (Do'kon yaratish)
```
/seller/onboarding
  → Do'kon nomi, hudud, tuman, manzil kiritish
  → POST /shops → status: "pending"
  → /seller/pending (admin tasdiqlashini kutish)
```

### 3. ADMIN TASDIQLASHI
```
Admin panel: /shops/:id/status → "active"
  → Fermarga xabar yuboriladi
  → Fermer endi /seller dashboard ga kira oladi
```

### 4. MAHSULOT QO'SHISH
```
/seller/products/new
  → Nom, kategoriya, narx, miqdor, rasm
  → POST /products → status: "pending"
  → Admin: PATCH /products/:id/approve → status: "active"
  → Mahsulot buyer sahifasida ko'rinadi
```

### 5. BUYURTMA BOSHQARUVI
```
Yangi buyurtma → Tasdiqlash (confirm) → Tayyorlash (prepare) → Jo'natish (ship)
```

---

## Frontend Sahifalar

### Auth
- [x] `/auth` — Telefon + OTP + Rol tanlash (buyer/seller)

### Seller Panel
- [ ] `/seller/onboarding` — Do'kon yaratish formasi
- [ ] `/seller/pending` — Admin tasdiqlashini kutish
- [ ] `/seller` — Dashboard (real statistika)
- [ ] `/seller/products` — Mahsulotlar ro'yxati
- [ ] `/seller/products/new` — Yangi mahsulot qo'shish
- [ ] `/seller/products/[id]/edit` — Mahsulotni tahrirlash
- [ ] `/seller/orders` — Buyurtmalar boshqaruvi
- [ ] `/seller/shop` — Do'kon sozlamalari
- [ ] `/seller/wallet` — Hamyon va to'lovlar

---

## Backend O'zgarishlar

### auth.schema.ts
- `verifyOtpSchema`ga `role: z.enum(['buyer','seller']).default('buyer')` qo'shish

### auth.service.ts
- `verifyOtp`da user yaratishda `role` ishlatish

---

## Komponentlar (SRP)

```
src/components/agro/seller/
├── dashboard/
│   ├── stats-cards.tsx       — Bugungi/haftalik statistika kartalar
│   ├── recent-orders.tsx     — So'nggi buyurtmalar
│   └── low-stock-alert.tsx   — Kam qolgan mahsulotlar
├── products/
│   ├── product-list.tsx      — Mahsulotlar jadvali
│   ├── product-form.tsx      — Yaratish/tahrirlash formasi
│   └── product-status-badge.tsx — Status badge
├── orders/
│   ├── orders-table.tsx      — Buyurtmalar jadvali
│   └── order-actions.tsx     — Status o'zgartirish tugmalari
├── shop/
│   └── shop-form.tsx         — Do'kon ma'lumotlari formasi
└── wallet/
    ├── wallet-balance.tsx    — Balans ko'rsatish
    └── transactions-list.tsx — Tranzaksiyalar
```
