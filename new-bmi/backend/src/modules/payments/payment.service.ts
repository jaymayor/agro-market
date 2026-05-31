import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';

export const paymentService = {
  async initiate(orderId: string, buyerId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyer_id: buyerId, payment_status: 'pending' },
    });
    if (!order) throw new ApiError(404, 'Buyurtma topilmadi yoki to\'lov holati noto\'g\'ri');

    const idempotencyKey = `${orderId}-${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        order_id: orderId,
        amount: order.total_amount,
        provider: order.payment_method,
        status: 'initiated',
        idempotency_key: idempotencyKey,
      },
    });

    await prisma.order.update({ where: { id: orderId }, data: { payment_status: 'initiated' } });

    let paymentUrl = '';

    if (order.payment_method === 'click') {
      paymentUrl = `https://my.click.uz/services/pay?service_id=${env.payment.click.serviceId}&merchant_id=${env.payment.click.merchantId}&amount=${order.total_amount}&transaction_param=${payment.id}&return_url=${env.clientUrl}/orders/${orderId}`;
    } else if (order.payment_method === 'payme') {
      const params = Buffer.from(JSON.stringify({ m: env.payment.payme.merchantId, ac: { order_id: orderId }, a: Number(order.total_amount) * 100 })).toString('base64');
      paymentUrl = `https://checkout.paycom.uz/${params}`;
    }

    await prisma.payment.update({ where: { id: payment.id }, data: { provider_payment_url: paymentUrl } });

    return { paymentUrl, paymentId: payment.id };
  },

  async handleClickWebhook(body: any) {
    // Click signature tekshirish
    const sign = crypto
      .createHash('md5')
      .update(`${body.click_trans_id}${body.service_id}${env.payment.click.secretKey}${body.merchant_trans_id}${body.amount}${body.action}${body.sign_time}`)
      .digest('hex');

    if (sign !== body.sign_string) throw new ApiError(400, 'Signature noto\'g\'ri');

    const payment = await prisma.payment.findUnique({ where: { id: body.merchant_trans_id } });
    if (!payment) return { error: -5, error_note: 'Payment not found' };

    if (body.error < 0) {
      await paymentService._failPayment(payment.id, payment.order_id, body);
      return { error: 0, error_note: 'Success' };
    }

    if (body.action === 1) {
      // To'lov muvaffaqiyatli
      await paymentService._completePayment(payment.id, payment.order_id, body.click_trans_id.toString(), body);
    }

    return { error: 0, error_note: 'Success' };
  },

  async handlePaymeWebhook(body: any) {
    const { method, params } = body;
    const orderId = params?.account?.order_id;

    if (method === 'CheckPerformTransaction') {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return { error: { code: -31050, message: 'Order not found' } };
      return { result: { allow: true } };
    }

    if (method === 'CreateTransaction') {
      const payment = await prisma.payment.findFirst({ where: { order_id: orderId } });
      if (!payment) return { error: { code: -31050, message: 'Payment not found' } };
      await prisma.payment.update({ where: { id: payment.id }, data: { provider_transaction_id: params.id, status: 'processing' } });
      return { result: { create_time: Date.now(), transaction: params.id, state: 1 } };
    }

    if (method === 'PerformTransaction') {
      const payment = await prisma.payment.findFirst({ where: { order_id: orderId } });
      if (!payment) return { error: { code: -31050, message: 'Not found' } };
      await paymentService._completePayment(payment.id, orderId, params.id, body);
      return { result: { perform_time: Date.now(), transaction: params.id, state: 2 } };
    }

    if (method === 'CancelTransaction') {
      const payment = await prisma.payment.findFirst({ where: { order_id: orderId } });
      if (payment) await paymentService._failPayment(payment.id, orderId, body);
      return { result: { cancel_time: Date.now(), transaction: params?.id, state: -1 } };
    }

    return { error: { code: -32601, message: 'Method not found' } };
  },

  async _completePayment(paymentId: string, orderId: string, transactionId: string, rawResponse: any) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'paid', provider_transaction_id: transactionId, raw_response: rawResponse },
      }),
      prisma.order.update({ where: { id: orderId }, data: { payment_status: 'paid' } }),
    ]);
  },

  async _failPayment(paymentId: string, orderId: string, rawResponse: any) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: paymentId }, data: { status: 'failed', raw_response: rawResponse } }),
      prisma.order.update({ where: { id: orderId }, data: { payment_status: 'failed' } }),
    ]);
  },

  async getStatus(orderId: string) {
    return prisma.payment.findUnique({
      where: { order_id: orderId },
      select: { id: true, status: true, provider: true, amount: true, created_at: true },
    });
  },

  async refund(orderId: string, adminId: string, dto: { amount?: number; reason: string }) {
    const payment = await prisma.payment.findUnique({ where: { order_id: orderId } });
    if (!payment) throw new ApiError(404, "To'lov topilmadi");
    if (payment.status !== 'paid') throw new ApiError(400, "Faqat to'langan buyurtmani qaytarish mumkin");

    const refundAmount = dto.amount ?? Number(payment.amount);
    const isPartial = refundAmount < Number(payment.amount);

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: isPartial ? 'partial_refunded' : 'refunded' },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { payment_status: isPartial ? 'partial_refunded' : 'refunded', status: 'cancelled' },
      }),
    ]);

    return { refundAmount, status: isPartial ? 'partial_refunded' : 'refunded', reason: dto.reason };
  },
};
