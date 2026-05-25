import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from products.models import Product, Category

def seed():
    print("Clearing old products...")
    Product.objects.all().delete()
    Category.objects.all().delete()

    print("Creating categories...")
    sabzavotlar = Category.objects.create(title="Sabzavotlar", slug="sabzavotlar")
    mevalar = Category.objects.create(title="Mevalar", slug="mevalar")

    print("Creating products...")
    products = [
        {
            "name": "Sifatli Qizil Pomidor",
            "price": 12000,
            "description": "Yangi uzilgan, shirin va mazzali pomidorlar. To'g'ridan-to'g'ri dehqonlardan.",
            "category": sabzavotlar,
            "image": "product_images/pomidor.png"
        },
        {
            "name": "Yangi Kartoshka",
            "price": 5000,
            "description": "Yuqori sifatli, yirik va tozalanmagan yangi kartoshka. Qovurish va qaynatish uchun ajoyib.",
            "category": sabzavotlar,
            "image": "product_images/kartoshka.png"
        },
        {
            "name": "Shirin Sabzi",
            "price": 4000,
            "description": "Vitaminlarga boy, sersuv va shirin sabzi. Palov va salatlar uchun.",
            "category": sabzavotlar,
            "image": "product_images/sabzi.png"
        },
        {
            "name": "Qarsilldoq Qizil Olma",
            "price": 15000,
            "description": "Shirin, qarsilldoq va suvli yirik qizil olmalar. Eng yaxshi bog'lardan.",
            "category": mevalar,
            "image": "product_images/olma.png"
        }
    ]

    for p_data in products:
        Product.objects.create(**p_data)

    print("Seeding complete! Added 4 high quality products.")

if __name__ == '__main__':
    seed()
