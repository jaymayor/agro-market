import { prisma } from '../../lib/prisma';
import { getPagination, buildMeta } from '../../utils/paginate';

export const notificationService = {
  async send(userId: string, type: string, title: string, body: string, data: object = {}) {
    return prisma.notification.create({
      data: { user_id: userId, type, title, body, data, channels: ['in_app'] },
    });
  },

  async getList(userId: string, query: any) {
    const { page, limit, skip } = getPagination(query);
    const where = { user_id: userId };
    const [data, total, unread] = await prisma.$transaction([
      prisma.notification.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { user_id: userId, is_read: false } }),
    ]);
    return { data, meta: { ...buildMeta(total, page, limit), unread } };
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({ where: { id, user_id: userId }, data: { is_read: true } });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { user_id: userId, is_read: false }, data: { is_read: true } });
  },
};
