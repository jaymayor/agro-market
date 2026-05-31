import { prisma } from '../../lib/prisma';

export const analyticsService = {
  async sellerDashboard(ownerId: string) {
    const shop = await prisma.shop.findUnique({ where: { owner_id: ownerId }, select: { id: true } });
    if (!shop) return null;

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [todaySales, weekSales, monthSales, pendingOrders, activeProducts, lowStockProducts, expiringProducts, wallet] =
      await prisma.$transaction([
        prisma.order.aggregate({
          where: { shop_id: shop.id, status: 'completed', created_at: { gte: todayStart } },
          _sum: { total_amount: true }, _count: true,
        }),
        prisma.order.aggregate({
          where: { shop_id: shop.id, status: 'completed', created_at: { gte: weekStart } },
          _sum: { total_amount: true }, _count: true,
        }),
        prisma.order.aggregate({
          where: { shop_id: shop.id, status: 'completed', created_at: { gte: monthStart } },
          _sum: { total_amount: true }, _count: true,
        }),
        prisma.order.count({ where: { shop_id: shop.id, status: { in: ['new', 'confirmed', 'preparing'] } } }),
        prisma.product.count({ where: { shop_id: shop.id, status: 'active', is_deleted: false } }),
        prisma.product.findMany({
          where: { shop_id: shop.id, status: 'active', is_deleted: false, stock_qty: { lte: prisma.product.fields.low_stock_alert_qty } },
          select: { id: true, name_uz: true, stock_qty: true, unit: true },
          take: 5,
        }),
        prisma.product.findMany({
          where: {
            shop_id: shop.id, status: 'active', is_deleted: false, is_perishable: true,
            expiry_date: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
          },
          select: { id: true, name_uz: true, expiry_date: true },
          take: 5,
        }),
        prisma.sellerWallet.findUnique({ where: { shop_id: shop.id }, select: { balance: true, pending_balance: true } }),
      ]);

    const topProducts = await prisma.orderItem.groupBy({
      by: ['product_id'],
      where: { order: { shop_id: shop.id, created_at: { gte: monthStart } } },
      _sum: { quantity: true, total_price: true },
      orderBy: { _sum: { total_price: 'desc' } },
      take: 5,
    });

    return {
      today: { revenue: todaySales._sum.total_amount ?? 0, orders: todaySales._count },
      week: { revenue: weekSales._sum.total_amount ?? 0, orders: weekSales._count },
      month: { revenue: monthSales._sum.total_amount ?? 0, orders: monthSales._count },
      pendingOrders,
      activeProducts,
      lowStockProducts,
      expiringProducts,
      wallet,
      topProducts,
    };
  },

  async sellerSales(ownerId: string, query: { from?: string; to?: string }) {
    const shop = await prisma.shop.findUnique({ where: { owner_id: ownerId }, select: { id: true } });
    if (!shop) return null;

    const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();

    const orders = await prisma.order.findMany({
      where: { shop_id: shop.id, status: 'completed', created_at: { gte: from, lte: to } },
      include: { items: { include: { product: { select: { name_uz: true } } } } },
      orderBy: { created_at: 'desc' },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalCommission = orders.reduce((sum, o) => sum + Number(o.platform_commission), 0);
    const sellerEarnings = orders.reduce((sum, o) => sum + Number(o.seller_amount), 0);

    return { from, to, totalRevenue, totalCommission, sellerEarnings, ordersCount: orders.length, orders };
  },

  async adminPlatform() {
    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const prevMonthStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [currentGmv, prevGmv, paymentBreakdown, regionStats, topComplaints, cancelledStats] =
      await prisma.$transaction([
        prisma.order.aggregate({ where: { status: 'completed', created_at: { gte: monthStart } }, _sum: { total_amount: true, platform_commission: true } }),
        prisma.order.aggregate({ where: { status: 'completed', created_at: { gte: prevMonthStart, lt: monthStart } }, _sum: { total_amount: true } }),
        prisma.payment.groupBy({ by: ['provider'], _count: true, _sum: { amount: true }, orderBy: { _count: { provider: 'desc' } } }),
        prisma.shop.groupBy({ by: ['region'], _count: true, orderBy: { _count: { region: 'desc' } } }),
        prisma.shop.findMany({
          where: { warning_count: { gt: 0 } },
          orderBy: { warning_count: 'desc' },
          take: 10,
          select: { id: true, name: true, warning_count: true, status: true },
        }),
        prisma.order.count({ where: { status: 'cancelled', created_at: { gte: monthStart } } }),
      ]);

    return {
      thisMonth: { gmv: currentGmv._sum.total_amount ?? 0, commission: currentGmv._sum.platform_commission ?? 0 },
      lastMonth: { gmv: prevGmv._sum.total_amount ?? 0 },
      paymentBreakdown,
      regionStats,
      topComplaints,
      cancelledOrders: cancelledStats,
    };
  },

  async adminDashboard() {
    const now = new Date();
    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalGmv, totalOrders, totalSellers, totalBuyers, pendingShops, pendingProducts, commissionEarned] =
      await prisma.$transaction([
        prisma.order.aggregate({ where: { status: 'completed' }, _sum: { total_amount: true } }),
        prisma.order.count(),
        prisma.user.count({ where: { role: 'seller' } }),
        prisma.user.count({ where: { role: 'buyer' } }),
        prisma.shop.count({ where: { status: 'pending' } }),
        prisma.product.count({ where: { status: 'pending' } }),
        prisma.order.aggregate({ where: { status: 'completed', created_at: { gte: monthStart } }, _sum: { platform_commission: true } }),
      ]);

    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    const topShops = await prisma.shop.findMany({
      where: { status: 'active' },
      orderBy: { total_sales: 'desc' },
      take: 5,
      select: { id: true, name: true, total_sales: true, rating: true },
    });

    return {
      gmv: { total: totalGmv._sum.total_amount ?? 0, monthlyCommission: commissionEarned._sum.platform_commission ?? 0 },
      users: { sellers: totalSellers, buyers: totalBuyers },
      pending: { shops: pendingShops, products: pendingProducts },
      orders: { total: totalOrders, byStatus: ordersByStatus },
      topShops,
    };
  },
};
