import { DeliveryStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export const deliveryService = {
  async getZones() {
    return prisma.deliveryZone.findMany({ where: { is_active: true }, orderBy: { name: 'asc' } });
  },

  async getMyDeliveries(driverId: string) {
    return prisma.deliveryOrder.findMany({
      where: { driver_id: driverId, status: { notIn: ['delivered', 'failed'] } },
      include: {
        order: {
          select: {
            id: true, order_number: true, delivery_address: true,
            shop: { select: { name: true, address: true, lat: true, lng: true } },
            buyer: { select: { phone: true, full_name: true } },
          },
        },
      },
    });
  },

  async assignDriver(orderId: string, driverId: string) {
    const existing = await prisma.deliveryOrder.findUnique({ where: { order_id: orderId } });
    if (existing) {
      return prisma.deliveryOrder.update({ where: { order_id: orderId }, data: { driver_id: driverId, status: 'assigned' } });
    }
    return prisma.deliveryOrder.create({ data: { order_id: orderId, driver_id: driverId, status: 'assigned' } });
  },

  async updateLocation(orderId: string, driverId: string, lat: number, lng: number) {
    const delivery = await prisma.deliveryOrder.findFirst({ where: { order_id: orderId, driver_id: driverId } });
    if (!delivery) throw new ApiError(404, "Yetkazish topilmadi");
    return prisma.deliveryOrder.update({ where: { id: delivery.id }, data: { current_lat: lat, current_lng: lng } });
  },

  async updateStatus(orderId: string, driverId: string, status: DeliveryStatus, failedReason?: string, photoUrl?: string) {
    const delivery = await prisma.deliveryOrder.findFirst({ where: { order_id: orderId, driver_id: driverId } });
    if (!delivery) throw new ApiError(404, "Yetkazish topilmadi");

    if (status === 'delivered' && !photoUrl) throw new ApiError(400, "Yetkazish rasmi majburiy");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryOrder.update({
        where: { id: delivery.id },
        data: {
          status,
          failed_reason: failedReason,
          delivery_photo_url: photoUrl,
          ...(status === 'picked_up' && { picked_up_at: new Date() }),
          ...(status === 'delivered' && { delivered_at: new Date() }),
        },
      });

      if (status === 'delivered') {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'delivered', delivered_at: new Date(), auto_complete_at: new Date(Date.now() + 48 * 60 * 60 * 1000) },
        });
      }

      return updated;
    });
  },

  async getTracking(orderId: string) {
    return prisma.deliveryOrder.findUnique({
      where: { order_id: orderId },
      select: {
        status: true, current_lat: true, current_lng: true, picked_up_at: true, delivered_at: true,
        driver: { select: { full_name: true, phone: true } },
      },
    });
  },
};
