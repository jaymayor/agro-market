import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+998901234567' },
    update: {},
    create: { phone: '+998901234567', full_name: 'Super Admin', role: 'super_admin', is_verified: true },
  });

  // Kategoriyalar
  const categories = [
    { slug: 'sabzavotlar',       name_uz: 'Sabzavotlar',        name_ru: 'Овощи',             ordering: 1, icon_url: '🥦' },
    { slug: 'mevalar',           name_uz: 'Mevalar',            name_ru: 'Фрукты',             ordering: 2, icon_url: '🍎' },
    { slug: 'don-mahsulotlari',  name_uz: 'Don mahsulotlari',   name_ru: 'Зерновые',           ordering: 3, icon_url: '🌾' },
    { slug: 'gosht-va-baliq',    name_uz: "Go'sht va Baliq",    name_ru: 'Мясо и Рыба',        ordering: 4, icon_url: '🥩' },
    { slug: 'sut-mahsulotlari',  name_uz: 'Sut mahsulotlari',   name_ru: 'Молочные продукты',  ordering: 5, icon_url: '🥛' },
    { slug: 'asal-va-quritilgan',name_uz: 'Asal va Meva qurigi',name_ru: 'Мёд и Сухофрукты',  ordering: 6, icon_url: '🍯' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name_uz: cat.name_uz, name_ru: cat.name_ru, ordering: cat.ordering },
      create: cat,
    });
  }

  console.log('📦 Kategoriyalar yaratildi:', categories.map(c => c.name_uz).join(', '));

  // Yetkazish zonalari
  const zones = [
    { name: 'Toshkent shahar', region: 'Toshkent', district: 'Barcha tumanlar', base_fee: 15000, max_delivery_days: 1, is_cold_chain_available: true },
    { name: 'Toshkent viloyati', region: 'Toshkent viloyati', district: 'Barcha tumanlar', base_fee: 25000, max_delivery_days: 2, is_cold_chain_available: false },
    { name: 'Samarqand', region: 'Samarqand', district: 'Barcha tumanlar', base_fee: 40000, max_delivery_days: 3, is_cold_chain_available: false },
  ];

  for (const zone of zones) {
    await prisma.deliveryZone.create({ data: zone }).catch(() => {});
  }

  console.log('✅ Seed completed. Admin:', admin.phone);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
