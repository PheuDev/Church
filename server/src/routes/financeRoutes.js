// ============================================================
// Finances : comptes, fonds, catégories, recettes, dépenses,
// cotisations, engagements + synthèse
// ============================================================
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { crudRouter } from '../lib/router.js';
import { requireRole } from '../lib/auth.js';
import { asyncHandler } from '../lib/http.js';

const FINANCE_ROLES = { read: ['ADMIN', 'PASTOR', 'TREASURER', 'SECRETARY', 'VIEWER'], write: ['ADMIN', 'PASTOR', 'TREASURER', 'SECRETARY'], delete: ['ADMIN', 'TREASURER'] };

const accountShape = {
  name: z.string().min(1).max(120),
  type: z.enum(['CASH', 'BANK', 'MOBILE_MONEY']).default('CASH').optional(),
  accountNumber: z.string().max(80).nullable().optional(),
  bankName: z.string().max(120).nullable().optional(),
  phoneNumber: z.string().max(40).nullable().optional(),
  currency: z.string().max(10).default('XAF').optional(),
  initialBalance: z.number().default(0).optional(),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
};

const fundShape = {
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
};

const categoryShape = {
  name: z.string().min(1).max(120),
  kind: z.enum(['INCOME', 'EXPENSE']).default('INCOME').optional(),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
};

const revenueShape = {
  accountId: z.string().nullable().optional(),
  fundId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  source: z.enum(['QUETE', 'OFFER', 'TITHE', 'CONTRIBUTION', 'DONATION', 'EVENT', 'PROJECT', 'OTHER']).default('OTHER').optional(),
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK', 'IN_KIND']).default('CASH').optional(),
  payerId: z.string().nullable().optional(),
  receivedAt: z.coerce.date(),
  receiptNumber: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
};

const expenseShape = {
  accountId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK', 'IN_KIND']).default('CASH').optional(),
  beneficiary: z.string().max(200).nullable().optional(),
  expenseDate: z.coerce.date(),
  receiptNumber: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
};

const contributionShape = {
  departmentId: z.string().nullable().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  amount: z.number().min(0),
  periodicity: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).default('ANNUAL').optional(),
  periodStart: z.coerce.date().nullable().optional(),
  periodEnd: z.coerce.date().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE').optional(),
};

const contributionPaymentShape = {
  contributionId: z.string().min(1),
  personId: z.string().min(1),
  amount: z.number().min(0),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK', 'IN_KIND']).default('CASH').optional(),
  paidAt: z.coerce.date(),
  periodLabel: z.string().max(50).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
};

const commitmentShape = {
  personId: z.string().min(1),
  projectId: z.string().nullable().optional(),
  kind: z.enum(['FINANCIAL', 'IN_KIND']).default('FINANCIAL').optional(),
  description: z.string().min(1).max(500),
  amount: z.number().min(0).nullable().optional(),
  status: z.enum(['OPEN', 'PARTIAL', 'FULFILLED', 'CANCELLED']).default('OPEN').optional(),
  startDate: z.coerce.date().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
};

const commitmentPaymentShape = {
  commitmentId: z.string().min(1),
  amount: z.number().min(0),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK', 'IN_KIND']).default('CASH').optional(),
  paidAt: z.coerce.date(),
  note: z.string().max(1000).nullable().optional(),
};

export function financeRoutes() {
  const accounts = crudRouter({
    model: 'account', label: 'Compte', searchFields: ['name', 'bankName'],
    orderBy: { name: 'asc' },
    include: { _count: { select: { revenues: true, expenses: true } } },
    createSchema: z.object(accountShape).strict(),
    updateSchema: z.object(accountShape).strict().partial(),
    readRoles: FINANCE_ROLES.read, writeRoles: FINANCE_ROLES.write, deleteRoles: FINANCE_ROLES.delete,
  });

  const funds = crudRouter({
    model: 'fund', label: 'Fonds', searchFields: ['name'], orderBy: { name: 'asc' },
    include: { _count: { select: { revenues: true } } },
    createSchema: z.object(fundShape).strict(),
    updateSchema: z.object(fundShape).strict().partial(),
    readRoles: FINANCE_ROLES.read, writeRoles: FINANCE_ROLES.write, deleteRoles: FINANCE_ROLES.delete,
  });

  const categories = crudRouter({
    model: 'financialCategory', label: 'Catégorie financière', searchFields: ['name'],
    orderBy: { name: 'asc' },
    createSchema: z.object(categoryShape).strict(),
    updateSchema: z.object(categoryShape).strict().partial(),
    readRoles: FINANCE_ROLES.read, writeRoles: FINANCE_ROLES.write, deleteRoles: FINANCE_ROLES.delete,
  });

  const revenues = crudRouter({
    model: 'revenue', label: 'Recette', searchFields: ['description', 'receiptNumber'],
    filters: ['accountId', 'fundId', 'categoryId', 'source', 'payerId'],
    orderBy: { receivedAt: 'desc' },
    include: {
      account: { select: { id: true, name: true, type: true } },
      fund: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      payer: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
    createSchema: z.object(revenueShape).strict(),
    updateSchema: z.object(revenueShape).strict().partial(),
    readRoles: FINANCE_ROLES.read, writeRoles: FINANCE_ROLES.write, deleteRoles: FINANCE_ROLES.delete,
    csvColumns: ['description', 'amount', 'source', 'receivedAt', 'paymentMethod', 'receiptNumber'],
  });

  const expenses = crudRouter({
    model: 'expense', label: 'Dépense', searchFields: ['description', 'receiptNumber'],
    filters: ['accountId', 'categoryId', 'beneficiary'],
    orderBy: { expenseDate: 'desc' },
    include: {
      account: { select: { id: true, name: true, type: true } },
      category: { select: { id: true, name: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
    createSchema: z.object(expenseShape).strict(),
    updateSchema: z.object(expenseShape).strict().partial(),
    readRoles: FINANCE_ROLES.read, writeRoles: FINANCE_ROLES.write, deleteRoles: FINANCE_ROLES.delete,
    csvColumns: ['description', 'amount', 'expenseDate', 'paymentMethod', 'beneficiary', 'receiptNumber'],
  });

  const contributions = crudRouter({
    model: 'contribution', label: 'Cotisation', searchFields: ['name'],
    filters: ['departmentId', 'status', 'periodicity'],
    orderBy: { createdAt: 'desc' },
    include: { department: { select: { id: true, name: true } } },
    createSchema: z.object(contributionShape).strict(),
    updateSchema: z.object(contributionShape).strict().partial(),
    readRoles: FINANCE_ROLES.read, writeRoles: FINANCE_ROLES.write, deleteRoles: FINANCE_ROLES.delete,
  });

  const contributionPayments = crudRouter({
    model: 'contributionPayment', label: 'Paiement de cotisation',
    filters: ['contributionId', 'personId', 'periodLabel'],
    orderBy: { paidAt: 'desc' },
    include: {
      contribution: { select: { id: true, name: true, amount: true } },
      person: { select: { id: true, firstName: true, lastName: true } },
      receivedBy: { select: { id: true, fullName: true } },
    },
    createSchema: z.object(contributionPaymentShape).strict(),
    updateSchema: z.object(contributionPaymentShape).strict().partial(),
    readRoles: FINANCE_ROLES.read, writeRoles: FINANCE_ROLES.write, deleteRoles: FINANCE_ROLES.delete,
  });

  const commitments = crudRouter({
    model: 'commitment', label: 'Engagement', searchFields: ['description'],
    filters: ['personId', 'projectId', 'status', 'kind'],
    orderBy: { createdAt: 'desc' },
    include: {
      person: { select: { id: true, firstName: true, lastName: true } },
      project: { select: { id: true, name: true } },
      _count: { select: { payments: true } },
    },
    createSchema: z.object(commitmentShape).strict(),
    updateSchema: z.object(commitmentShape).strict().partial(),
    readRoles: FINANCE_ROLES.read, writeRoles: FINANCE_ROLES.write, deleteRoles: FINANCE_ROLES.delete,
  });

  const commitmentPayments = crudRouter({
    model: 'commitmentPayment', label: "Paiement d'engagement",
    filters: ['commitmentId'],
    orderBy: { paidAt: 'desc' },
    include: {
      commitment: { select: { id: true, description: true, amount: true } },
      receivedBy: { select: { id: true, fullName: true } },
    },
    createSchema: z.object(commitmentPaymentShape).strict(),
    updateSchema: z.object(commitmentPaymentShape).strict().partial(),
    readRoles: FINANCE_ROLES.read, writeRoles: FINANCE_ROLES.write, deleteRoles: FINANCE_ROLES.delete,
  });

  const summary = (() => {
    const router = Router();
    router.get('/', requireRole(...FINANCE_ROLES.read), asyncHandler(async (req, res) => {
      const revWhere = { churchId: req.churchId };
      const expWhere = { churchId: req.churchId };
      if (req.query.from || req.query.to) {
        if (req.query.from) {
          revWhere.receivedAt = { gte: new Date(req.query.from) };
          expWhere.expenseDate = { gte: new Date(req.query.from) };
        }
        if (req.query.to) {
          revWhere.receivedAt = { ...revWhere.receivedAt, lte: new Date(req.query.to) };
          expWhere.expenseDate = { ...expWhere.expenseDate, lte: new Date(req.query.to) };
        }
      }

      const [revAgg, expAgg, bySource, byRevCategory, byExpCategory, accounts, byAccountRev, byAccountExp] = await Promise.all([
        prisma.revenue.aggregate({ where: revWhere, _sum: { amount: true }, _count: { _all: true } }),
        prisma.expense.aggregate({ where: expWhere, _sum: { amount: true }, _count: { _all: true } }),
        prisma.revenue.groupBy({ by: ['source'], where: revWhere, _sum: { amount: true }, _count: { _all: true } }),
        prisma.revenue.groupBy({ by: ['categoryId'], where: revWhere, _sum: { amount: true }, _count: { _all: true } }),
        prisma.expense.groupBy({ by: ['categoryId'], where: expWhere, _sum: { amount: true }, _count: { _all: true } }),
        prisma.account.findMany({ where: { churchId: req.churchId }, orderBy: { name: 'asc' } }),
        prisma.revenue.groupBy({ by: ['accountId'], where: revWhere, _sum: { amount: true } }),
        prisma.expense.groupBy({ by: ['accountId'], where: expWhere, _sum: { amount: true } }),
      ]);

      const catIds = [...new Set([...byRevCategory.map((r) => r.categoryId), ...byExpCategory.map((r) => r.categoryId)].filter(Boolean))];
      const catNames = catIds.length
        ? await prisma.financialCategory.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } })
        : [];
      const nameOf = (id) => catNames.find((c) => c.id === id)?.name;

      const accountBalances = accounts.map((acc) => {
        const rev = byAccountRev.find((r) => r.accountId === acc.id)?._sum.amount ?? 0;
        const exp = byAccountExp.find((r) => r.accountId === acc.id)?._sum.amount ?? 0;
        return {
          id: acc.id, name: acc.name, type: acc.type, currency: acc.currency,
          initialBalance: acc.initialBalance, revenues: rev, expenses: exp,
          balance: Number(acc.initialBalance) + Number(rev) - Number(exp),
        };
      });

      res.json({
        period: { from: req.query.from, to: req.query.to },
        totalRevenues: revAgg._sum.amount ?? 0,
        revenueCount: revAgg._count._all,
        totalExpenses: expAgg._sum.amount ?? 0,
        expenseCount: expAgg._count._all,
        balance: Number(revAgg._sum.amount ?? 0) - Number(expAgg._sum.amount ?? 0),
        bySource,
        byRevenueCategory: byRevCategory.map((r) => ({ categoryId: r.categoryId, name: nameOf(r.categoryId), total: r._sum.amount, count: r._count._all })),
        byExpenseCategory: byExpCategory.map((r) => ({ categoryId: r.categoryId, name: nameOf(r.categoryId), total: r._sum.amount, count: r._count._all })),
        accountBalances,
      });
    }));
    return router;
  })();

  return { accounts, funds, categories, revenues, expenses, contributions, contributionPayments, commitments, commitmentPayments, summary };
}