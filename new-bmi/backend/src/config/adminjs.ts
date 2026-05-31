import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Prisma } from '@prisma/client';
import { Application } from 'express';
import { prisma } from '../lib/prisma';
import { env } from './env';

/* eslint-disable @typescript-eslint/no-require-imports */
const { Database, Resource } = require('@adminjs/prisma') as {
  Database: any;
  Resource: any;
};

// @adminjs/prisma@3 uses _baseDmmf which doesn't exist in Prisma 5 — patch it
const modelMap: Record<string, any> = Object.fromEntries(
  Prisma.dmmf.datamodel.models.map((m: any) => [m.name, m]),
);
const datamodelEnumMap: Record<string, any> = Object.fromEntries(
  Prisma.dmmf.datamodel.enums.map((e: any) => [e.name, e]),
);
(prisma as any)._baseDmmf = { modelMap, datamodelEnumMap };

AdminJS.registerAdapter({ Database, Resource });

const model = (name: string) => ({ model: modelMap[name], client: prisma });

export const mountAdmin = (app: Application): void => {
  const adminJs = new AdminJS({
    rootPath: '/admin',
    branding: {
      companyName: 'AgroMarket Admin',
      logo: false,
      favicon: '',
    },
    resources: [
      {
        resource: model('DevOtpLog'),
        options: {
          navigation: { name: 'Dev Tools', icon: 'Key' },
          sort: { direction: 'desc', sortBy: 'created_at' },
          actions: {
            new: { isAccessible: false },
            edit: { isAccessible: false },
          },
          properties: {
            id: { isVisible: { list: false, show: true, filter: false, edit: false } },
            phone: { isTitle: true },
            otp: { type: 'string' },
            created_at: { isVisible: { list: true, show: true, filter: true, edit: false } },
          },
        },
      },
      {
        resource: model('User'),
        options: {
          navigation: { name: 'Users', icon: 'User' },
          sort: { direction: 'desc', sortBy: 'created_at' },
          actions: {
            new: { isAccessible: false },
            delete: { isAccessible: false },
          },
          properties: {
            id: { isVisible: { list: false, show: true, filter: false } },
            otp_attempts: { isVisible: { list: false, show: true, filter: false } },
            otp_blocked_until: { isVisible: { list: false, show: true, filter: false } },
          },
        },
      },
      {
        resource: model('Shop'),
        options: {
          navigation: { name: 'Shops', icon: 'Store' },
          sort: { direction: 'desc', sortBy: 'created_at' },
          properties: {
            id:          { isVisible: { list: false, show: true,  filter: false, edit: false } },
            slug:        { isVisible: { list: false, show: true,  filter: false, edit: false } },
            status:      { isTitle: false },
            name:        { isTitle: true },
            created_at:  { isVisible: { list: true,  show: true,  filter: true,  edit: false } },
            updated_at:  { isVisible: { list: false, show: false, filter: false, edit: false } },
          },
          actions: {
            approve: {
              actionType: 'record',
              icon: 'Check',
              label: '✅ Tasdiqlash',
              guard: 'Do\'konni tasdiqlaysizmi? Egasi darhol kirish imkoniga ega bo\'ladi.',
              component: false,
              isVisible: (context: any) => context.record?.param('status') === 'pending' || context.record?.param('status') === 'suspended',
              handler: async (_req: any, _res: any, context: any) => {
                const id = context.record.id();
                await prisma.shop.update({ where: { id }, data: { status: 'active' } });
                return {
                  record: (await context.resource.findOne(id)).toJSON(context.currentAdmin),
                  notice: { message: 'Do\'kon muvaffaqiyatli tasdiqlandi!', type: 'success' },
                };
              },
            },
            suspend: {
              actionType: 'record',
              icon: 'XCircle',
              label: '🚫 To\'xtatish',
              guard: 'Do\'konni to\'xtatmoqchimisiz?',
              component: false,
              isVisible: (context: any) => context.record?.param('status') === 'active' || context.record?.param('status') === 'pending',
              handler: async (_req: any, _res: any, context: any) => {
                const id = context.record.id();
                await prisma.shop.update({ where: { id }, data: { status: 'suspended' } });
                return {
                  record: (await context.resource.findOne(id)).toJSON(context.currentAdmin),
                  notice: { message: 'Do\'kon to\'xtatildi.', type: 'warning' },
                };
              },
            },
          },
        },
      },
      {
        resource: model('Order'),
        options: {
          navigation: { name: 'Orders', icon: 'ShoppingCart' },
          sort: { direction: 'desc', sortBy: 'created_at' },
          actions: {
            new: { isAccessible: false },
            delete: { isAccessible: false },
          },
        },
      },
      {
        resource: model('Product'),
        options: {
          navigation: { name: 'Products', icon: 'Package' },
          sort: { direction: 'desc', sortBy: 'created_at' },
        },
      },
      {
        resource: model('Complaint'),
        options: {
          navigation: { name: 'Complaints', icon: 'AlertCircle' },
          sort: { direction: 'desc', sortBy: 'created_at' },
        },
      },
      {
        resource: model('WithdrawalRequest'),
        options: {
          navigation: { name: 'Withdrawals', icon: 'DollarSign' },
          sort: { direction: 'desc', sortBy: 'created_at' },
        },
      },
    ],
  });

  const router = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (username: string, password: string) => {
        if (username === env.admin.username && password === env.admin.password) {
          return { username, role: 'admin' };
        }
        return null;
      },
      cookieName: 'adminjs_session',
      cookiePassword: env.admin.sessionSecret,
    },
    undefined,
    {
      secret: env.admin.sessionSecret,
      resave: false,
      saveUninitialized: false,
    },
  );

  app.use(adminJs.options.rootPath, router);
  console.log(`🎛️  AdminJS ready: http://localhost:${env.PORT}/admin`);
};
