// ============================================================
// Tableau de bord — agrégats rapides pour l'accueil
// ============================================================
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireRole } from '../lib/auth.js';
import { asyncHandler } from '../lib/http.js';

const monthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export function dashboardRoutes() {
  const router = Router();
  router.get('/', requireRole('ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER', 'VIEWER'), asyncHandler(async (req, res) => {
    const churchId = req.churchId;
    const from = monthStart();

    const personCounts = await Promise.all([
      prisma.person.count({ where: { churchId, isActive: true } }),
      prisma.person.count({ where: { churchId, status: 'MEMBER' } }),
      prisma.person.count({ where: { churchId, status: 'CANDIDATE' } }),
      prisma.person.count({ where: { churchId, gender: 'MALE' } }),
      prisma.person.count({ where: { churchId, gender: 'FEMALE' } }),
    ]);

    const [upcomingActivities, recentActivities] = await Promise.all([
      prisma.activity.findMany({
        where: { churchId, status: { not: 'CANCELLED' }, activityDate: { gte: new Date() } },
        orderBy: { activityDate: 'asc' },
        take: 6,
        include: { type: { select: { id: true, name: true, icon: true, color: true } } },
      }),
      prisma.activity.count({ where: { churchId, status: 'DONE' } }),
    ]);

    const revenueAgg = await prisma.revenue.aggregate({
      where: { churchId, receivedAt: { gte: from } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const expenseAgg = await prisma.expense.aggregate({
      where: { churchId, expenseDate: { gte: from } },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const candidateFlow = await prisma.baptismCandidate.groupBy({
      by: ['status'], where: { churchId }, _count: { _all: true },
    });

    const [families, departments, activeContributions, openCommitments] = await Promise.all([
      prisma.family.count({ where: { churchId } }),
      prisma.department.count({ where: { churchId, isActive: true } }),
      prisma.contribution.count({ where: { churchId, status: 'ACTIVE' } }),
      prisma.commitment.count({ where: { churchId, status: { in: ['OPEN', 'PARTIAL'] } } }),
    ]);

    const recentRevenues = await prisma.revenue.findMany({
      where: { churchId }, orderBy: { receivedAt: 'desc' }, take: 5,
    });

    res.json({
      persons: {
        total: personCounts[0], members: personCounts[1], candidates: personCounts[2],
        male: personCounts[3], female: personCounts[4],
      },
      families,
      departments,
      activities: { upcoming: upcomingActivities, totalDone: recentActivities },
      finance: {
        revenuesMonth: revenueAgg._sum.amount ?? 0,
        revenueCountMonth: revenueAgg._count._all,
        expensesMonth: expenseAgg._sum.amount ?? 0,
        expenseCountMonth: expenseAgg._count._all,
        balanceMonth: Number(revenueAgg._sum.amount ?? 0) - Number(expenseAgg._sum.amount ?? 0),
        lastRevenues: recentRevenues,
      },
      baptisms: { candidateFlow },
      contributions: { active: activeContributions },
      commitments: { open: openCommitments },
    });
  }));

  return router;
}