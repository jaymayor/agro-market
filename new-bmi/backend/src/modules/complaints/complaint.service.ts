import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export const complaintService = {
  async create(buyerId: string, dto: { order_id: string; type: any; description: string }) {
    const order = await prisma.order.findFirst({ where: { id: dto.order_id, buyer_id: buyerId } });
    if (!order) throw new ApiError(404, 'Buyurtma topilmadi');
    if (!['delivered', 'completed'].includes(order.status)) {
      throw new ApiError(400, 'Faqat yetkazilgan buyurtmaga shikoyat beriladi');
    }

    // Ayniydigan mahsulotlar uchun 24 soat, qolganlar uchun 48 soat
    const hoursLimit = 48;
    const deliveredAt = order.delivered_at;
    if (deliveredAt && Date.now() - deliveredAt.getTime() > hoursLimit * 60 * 60 * 1000) {
      throw new ApiError(400, `Shikoyat muddati ${hoursLimit} soat o'tgan`);
    }

    const existing = await prisma.complaint.findFirst({ where: { order_id: dto.order_id, buyer_id: buyerId } });
    if (existing) throw new ApiError(409, 'Bu buyurtmaga allaqachon shikoyat berilgan');

    return prisma.complaint.create({ data: { ...dto, buyer_id: buyerId } });
  },

  async respond(complaintId: string, shopOwnerId: string, dto: { response: string; agree_refund: boolean }) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { order: { include: { shop: true } } },
    });
    if (!complaint) throw new ApiError(404, 'Shikoyat topilmadi');
    if (complaint.order.shop.owner_id !== shopOwnerId) throw new ApiError(403, "Ruxsat yo'q");
    if (complaint.status !== 'open') throw new ApiError(400, 'Shikoyat allaqachon javob berilgan');

    return prisma.complaint.update({
      where: { id: complaintId },
      data: {
        seller_response: dto.response,
        status: dto.agree_refund ? 'refund_agreed' : 'disputed',
      },
    });
  },

  async resolve(complaintId: string, moderatorId: string, dto: { decision: string; refund_type: any; refund_amount?: number }) {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new ApiError(404, 'Shikoyat topilmadi');

    return prisma.complaint.update({
      where: { id: complaintId },
      data: {
        moderator_id: moderatorId,
        moderator_decision: dto.decision,
        refund_type: dto.refund_type,
        refund_amount: dto.refund_amount,
        status: dto.refund_type === 'none' ? 'closed_no_refund' : 'refund_approved',
        resolved_at: new Date(),
      },
    });
  },

  async getList(userId: string, role: string) {
    const where =
      role === 'buyer' ? { buyer_id: userId }
      : role === 'seller' ? { order: { shop: { owner_id: userId } } }
      : {};
    return prisma.complaint.findMany({ where, orderBy: { created_at: 'desc' }, include: { evidences: true } });
  },

  async getOne(complaintId: string, userId: string, role: string) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { evidences: true, order: { include: { shop: { select: { owner_id: true } } } } },
    });
    if (!complaint) throw new ApiError(404, 'Shikoyat topilmadi');
    if (role === 'buyer' && complaint.buyer_id !== userId) throw new ApiError(403, "Ruxsat yo'q");
    if (role === 'seller' && complaint.order.shop.owner_id !== userId) throw new ApiError(403, "Ruxsat yo'q");
    return complaint;
  },

  async addEvidence(complaintId: string, uploadedBy: string, files: Array<{ file_url: string; file_type: string }>) {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new ApiError(404, 'Shikoyat topilmadi');
    if (!['open', 'seller_responded', 'disputed'].includes(complaint.status)) {
      throw new ApiError(400, 'Bu holat uchun dalil qo\'shib bo\'lmaydi');
    }

    const evidences = await prisma.$transaction(
      files.map(f =>
        prisma.complaintEvidence.create({
          data: { complaint_id: complaintId, uploaded_by: uploadedBy, file_url: f.file_url, file_type: f.file_type },
        })
      )
    );
    return evidences;
  },
};
