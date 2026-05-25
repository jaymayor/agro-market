# Agro Market - Django Backend

Dehqonchilik mahsulotlarini online sotish platformasi (Backend)

## Texnologiyalar

- **Python 3.12+**
- **Django 5.x**
- **Django REST Framework 3.15+**
- **PostgreSQL 16+**
- **Redis 7+**
- **Celery 5.x**

## O'rnatish

### 1. Virtual muhit yaratish

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 2. Kerakli paketlarni o'rnatish

```bash
pip install -r requirements/base.txt
```

### 3. .env faylini sozlash

```bash
cp .env.example .env
# .env faylini tahrirlang
```

### 4. Ma'lumotlar bazasini yaratish

```bash
python manage.py migrate
```

### 5. Superuser yaratish

```bash
python manage.py createsuperuser
```

### 6. Serverni ishga tushirish

```bash
python manage.py runserver
```

## API Endpointlar

| Endpoint | Tavsif |
|----------|--------|
| `/api/v1/auth/` | Autentifikatsiya |
| `/api/v1/products/` | Mahsulotlar |
| `/api/v1/categories/` | Kategoriyalar |
| `/api/v1/shops/` | Do'konlar |
| `/api/v1/orders/` | Buyurtmalar |
| `/api/v1/payments/` | To'lovlar |
| `/api/v1/reviews/` | Sharhlar |
| `/api/docs/` | Swagger UI |
| `/api/redoc/` | ReDoc |
| `/admin/` | Django Admin |

## Foydalanuvchi rollari

- **Admin**: Barcha huquqlar
- **Seller**: Do'kon va mahsulotlarni boshqarish
- **Buyer**: Mahsulot sotib olish, sharhlar yozish

## To'lov tizimlari

- Click
- Payme

## Lisenziya

© 2025 Agro Market
