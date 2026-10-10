// ============================================================
// Seed — Données de démonstration (idempotent)
// Exécution : npm run db:seed (dans server/) ou npm run setup:db
// ============================================================
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (plain) => bcrypt.hashSync(plain, 10);

async function ensureChurch() {
  const existing = await prisma.church.findFirst({ where: { code: 'AD-001' } });
  if (existing) return existing;

  const church = await prisma.church.create({
    data: {
      name: 'Assemblée de Dieu de Yaoundé',
      shortName: 'AD Yaoundé',
      code: 'AD-001',
      address: 'Rue 1234, Quartier du Centre',
      city: 'Yaoundé',
      phone: '+237 6 90 00 00 00',
      email: 'contact@ad-yaounde.org',
      foundedAt: new Date('1990-05-20'),
      pastorName: 'Pasteur Emmanuel Mbarga',
      description: 'Communauté locale des Assemblées de Dieu.',
    },
  });

  await prisma.churchSetting.createMany({
    data: [
      { churchId: church.id, key: 'certificateInstitutionName', value: 'Union des Églises des Assemblées de Dieu' },
      { churchId: church.id, key: 'gradingMode', value: 'PERCENT' },
      { churchId: church.id, key: 'currency', value: 'XAF' },
    ],
    skipDuplicates: true,
  });

  return church;
}

async function main() {
  const church = await ensureChurch();

  const personCount = await prisma.person.count({ where: { churchId: church.id } });
  if (personCount > 0) {
    console.log('[seed] Données déjà présentes, exécution annulée (idempotence).');
    return;
  }

  const person = async (data) => {
    const found = await prisma.person.findFirst({ where: { churchId: church.id, firstName: data.firstName, lastName: data.lastName } });
    return found ?? prisma.person.create({ data: { churchId: church.id, ...data } });
  };

  const m = {};
  const add = async (key, data) => { m[key] = await person(data); };
  await add('emmanuel', { firstName: 'Emmanuel', lastName: 'Mbarga', gender: 'MALE', birthDate: new Date('1968-03-14'), phone: '+237 6 90 00 00 01', email: 'pastor@ad-yaounde.org', profession: 'Pasteur', status: 'MEMBER', memberSince: new Date('1990-06-01'), membershipNumber: 'M-0001' });
  await add('marie', { firstName: 'Marie-Claire', lastName: 'Mbarga', gender: 'FEMALE', birthDate: new Date('1972-09-02'), phone: '+237 6 90 00 00 02', profession: 'Enseignante', status: 'MEMBER', memberSince: new Date('1990-06-01'), membershipNumber: 'M-0002' });
  await add('jean', { firstName: 'Jean-Baptiste', lastName: 'Nkolo', gender: 'MALE', birthDate: new Date('1985-01-22'), phone: '+237 6 90 00 00 03', profession: 'Comptable', status: 'MEMBER', memberSince: new Date('2010-01-15'), membershipNumber: 'M-0003' });
  await add('salome', { firstName: 'Salomé', lastName: 'Bella', gender: 'FEMALE', birthDate: new Date('1992-06-30'), phone: '+237 6 90 00 00 04', profession: 'Infirmière', status: 'MEMBER', memberSince: new Date('2015-02-10'), membershipNumber: 'M-0004' });
  await add('esther', { firstName: 'Esther', lastName: 'Eyenga', gender: 'FEMALE', birthDate: new Date('1998-11-11'), phone: '+237 6 90 00 00 05', profession: 'Étudiante', status: 'ATTENDEE', memberSince: new Date('2021-09-01') });
  await add('paul', { firstName: 'Paul', lastName: 'Etoga', gender: 'MALE', birthDate: new Date('1975-04-19'), phone: '+237 6 90 00 00 06', profession: 'Commerçant', status: 'MEMBER', memberSince: new Date('2005-03-01'), membershipNumber: 'M-0005' });
  await add('ruth', { firstName: 'Ruth', lastName: 'Etoga', gender: 'FEMALE', birthDate: new Date('1979-07-07'), phone: '+237 6 90 00 00 07', status: 'MEMBER', memberSince: new Date('2005-03-01'), membershipNumber: 'M-0006' });
  await add('david', { firstName: 'David', lastName: 'Mbarga', gender: 'MALE', birthDate: new Date('2005-12-25'), status: 'ATTENDEE' });
  await add('samuel', { firstName: 'Samuel', lastName: 'Mvondo', gender: 'MALE', birthDate: new Date('2001-08-15'), phone: '+237 6 90 00 00 08', status: 'CANDIDATE', memberSince: new Date('2024-01-10') });
  await add('anne', { firstName: 'Anne', lastName: 'Essou', gender: 'FEMALE', birthDate: new Date('1995-02-14'), phone: '+237 6 90 00 00 09', status: 'VISITOR' });

  const dept = async (name, type, leaderId, color) => {
    const found = await prisma.department.findFirst({ where: { churchId: church.id, name } });
    return found ?? prisma.department.create({ data: { churchId: church.id, name, type, leaderPersonId: leaderId, color } });
  };
  const dHommes = await dept('Union des Hommes', 'MEN', m.paul.id, '#1f6fd0');
  const dFemmes = await dept('Union des Femmes', 'WOMEN', m.marie.id, '#d0389e');
  const dJeunesse = await dept('Jeunesse', 'YOUTH', m.esther.id, '#0fa968');
  const dLouange = await dept('Louange', 'WORSHIP', m.jean.id, '#e8a33d');
  const dPriere = await dept('Réunion de prière', 'PRAYER', m.emmanuel.id, '#7a5cb8');

  const addMember = async (departmentId, personId, role) => {
    await prisma.departmentMember.upsert({
      where: { departmentId_personId: { departmentId, personId } },
      create: { churchId: church.id, departmentId, personId, role, joinedAt: new Date() },
      update: { isActive: true },
    });
  };
  await addMember(dHommes.id, m.paul.id, 'LEADER');
  await addMember(dHommes.id, m.jean.id, 'ASSISTANT');
  await addMember(dFemmes.id, m.marie.id, 'LEADER');
  await addMember(dFemmes.id, m.salome.id, 'SECRETARY');
  await addMember(dFemmes.id, m.esther.id, 'MEMBER');
  await addMember(dJeunesse.id, m.esther.id, 'LEADER');
  await addMember(dJeunesse.id, m.david.id, 'MEMBER');
  await addMember(dLouange.id, m.jean.id, 'LEADER');
  await addMember(dLouange.id, m.salome.id, 'MEMBER');

  await seedUsers(church.id);
  await seedActivities(church.id, m);
  await seedSundaySchool(church.id, m);
  await seedFormations(church.id, m);
  await seedFinance(church.id, m);
  await seedEvents(church.id, m);

  console.log('[seed] Jeu de données de démonstration créé avec succès.');
}

async function seedUsers(churchId) {
  const users = [
    { email: process.env.ADMIN_EMAIL || 'admin@ad-yaounde.org', fullName: 'Administrateur AD', role: 'ADMIN', mustChangePassword: true },
    { email: 'pastor@ad-yaounde.org', fullName: 'Pasteur Emmanuel Mbarga', role: 'PASTOR', mustChangePassword: true },
    { email: 'secretaire@ad-yaounde.org', fullName: 'Salomé Bella', role: 'SECRETARY', mustChangePassword: true },
    { email: 'tresorier@ad-yaounde.org', fullName: 'Jean-Baptiste Nkolo', role: 'TREASURER', mustChangePassword: true },
    { email: 'lecteur@ad-yaounde.org', fullName: 'Anne Essou', role: 'VIEWER', mustChangePassword: true },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { churchId_email: { churchId, email: u.email } },
      create: { churchId, ...u, passwordHash: hash(u.role === 'ADMIN' ? (process.env.ADMIN_PASSWORD || 'ChangeMe123!') : 'ChangeMe123!') },
      update: {},
    });
  }
}

async function seedActivities(churchId, m) {
  const type = async (name, icon, color) => {
    const found = await prisma.activityType.findFirst({ where: { churchId, name } });
    return found ?? prisma.activityType.create({ data: { churchId, name, icon, color } });
  };
  const tCulte = await type('Culte du dimanche', 'Church', '#1f6fd0');
  const tPriere = await type('Réunion de prière', 'HeartHandshake', '#7a5cb8');
  const tEtude = await type('Étude biblique', 'BookOpen', '#0fa968');
  const tChorale = await type('Répétition chorale', 'Music', '#e8a33d');

  const count = await prisma.activity.count({ where: { churchId } });
  if (count > 0) return;

  const act = async (typeId, title, daysAgo, durationMin, responsibleId, location, status) => {
    const date = new Date(Date.now() + daysAgo * 86400000);
    const end = new Date(date.getTime() + durationMin * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    const hh = date.getHours(), mm = date.getMinutes(), eh = end.getHours(), em = end.getMinutes();
    return prisma.activity.create({
      data: {
        churchId, typeId, title,
        activityDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        startTime: `${pad(hh)}:${pad(mm)}`, endTime: `${pad(eh)}:${pad(em)}`,
        responsibleId, location, status,
      },
    });
  };
  const culte = await act(tCulte.id, 'Culte dominical', -0, 150, m.emmanuel.id, 'Temple principal', 'DONE');
  await act(tPriere.id, 'Vigile de prière', 3, 120, m.emmanuel.id, 'Temple principal', 'PLANNED');
  await act(tEtude.id, 'Étude biblique du mercredi', 1, 90, m.jean.id, 'Salle 2', 'DONE');
  await act(tChorale.id, 'Répétition de chorale', 6, 120, m.salome.id, 'Salle de musique', 'PLANNED');

  // Présences du culte (mode quantitatif)
  await prisma.attendanceStat.create({
    data: { churchId, activityId: culte.id, presentCount: 7, absentCount: 2, visitorCount: 1, notes: 'Absents : David, Samuel (excusé).' },
  });
}

async function seedSundaySchool(churchId, m) {
  const count = await prisma.sundaySchoolClass.count({ where: { churchId } });
  if (count > 0) return;

  const cls = await prisma.sundaySchoolClass.create({
    data: { churchId, name: 'Classe des enfants (6-10 ans)', teacherId: m.marie.id, minAge: 6, maxAge: 10 },
  });
  const session = await prisma.sundaySchoolSession.create({
    data: { churchId, classId: cls.id, title: 'Leçon 1 : La création', sessionDate: new Date(), teacherId: m.marie.id, lessonTopic: 'Genèse 1', status: 'DONE', presentCount: 1, attendanceNotes: 'David présent.' },
  });
}

async function seedFormations(churchId, m) {
  const count = await prisma.formationProgram.count({ where: { churchId } });
  if (count > 0) return;

  const program = await prisma.formationProgram.create({
    data: { churchId, name: 'Formation au baptême', description: 'Préparation au baptême — cursus officiel.', gradingMode: 'PERCENT', passThreshold: 70, totalLessons: 6, durationWeeks: 8 },
  });

  const lesson1 = await prisma.lesson.create({ data: { churchId, programId: program.id, title: 'Les fondements de la foi', number: 1, objective: 'Comprendre les bases du salut.', durationMin: 90, verses: 'Jean 3:16 ; Matthieu 28:19 ; Actes 2:42' } });
  const lesson2 = await prisma.lesson.create({ data: { churchId, programId: program.id, title: 'La vie de l\'Église', number: 2, durationMin: 90 } });

  const session = await prisma.formationSession.create({
    data: { churchId, programId: program.id, name: 'Session 2026-1', startDate: new Date(), status: 'ONGOING', responsibleId: m.emmanuel.id, location: 'Salle de formation' },
  });
  await prisma.sessionLesson.create({
    data: { churchId, sessionId: session.id, lessonId: lesson1.id, seanceType: 'NEW_LESSON', title: 'Séance 1 — Fondements', taughtAt: new Date(), teacherId: m.emmanuel.id },
  });

  const candidate = await prisma.baptismCandidate.findFirst({ where: { churchId, personId: m.samuel.id } });
  if (!candidate) {
    const cand = await prisma.baptismCandidate.create({
      data: { churchId, personId: m.samuel.id, status: 'IN_FORMATION', enrolledAt: new Date(), formationSessionId: session.id, requestedAt: new Date() },
    });
    await prisma.evaluation.create({
      data: { churchId, candidateId: cand.id, evaluatorId: m.emmanuel.id, grade: 82, gradingMode: 'PERCENT', passed: true, comments: 'Bon niveau général.', evaluatedAt: new Date() },
    });
  }
}

async function seedFinance(churchId, m) {
  const accounts = [];
  const acc = async (name, type, accountNumber, phone) => {
    const found = await prisma.account.findFirst({ where: { churchId, name } });
    return found ?? prisma.account.create({ data: { churchId, name, type, accountNumber, phoneNumber: phone, currency: 'XAF' } });
  };
  accounts.caisse = await acc('Caisse principale', 'CASH');
  accounts.ecobank = await acc('Compte ECOBANK', 'BANK', 'ECOBANK-00123456');
  accounts.momo = await acc('Mobile Money', 'MOBILE_MONEY', null, '+237 6 90 00 00 00');

  const cat = async (name, kind) => {
    const found = await prisma.financialCategory.findFirst({ where: { churchId, name, kind } });
    return found ?? prisma.financialCategory.create({ data: { churchId, name, kind } });
  };
  const cOffrandes = await cat('Offrandes', 'INCOME');
  const cDimes = await cat('Dîmes', 'INCOME');
  const cEvenement = await cat('Événements', 'INCOME');
  const cFournitures = await cat('Fournitures et matériel', 'EXPENSE');
  const cImmobilier = await cat('Immobilier', 'EXPENSE');

  const revCount = await prisma.revenue.count({ where: { churchId } });
  if (revCount === 0) {
    const rev = async (description, amount, source, accountId, categoryId, receivedAt, payerId) =>
      prisma.revenue.create({ data: { churchId, description, amount, source, accountId, categoryId, receivedAt, payerId } });
    await rev('Dîme du mois', 250000, 'TITHE', accounts.caisse.id, cDimes.id, new Date(Date.now() - 5 * 86400000), m.paul.id);
    await rev('Offrande du culte dominical', 185000, 'OFFER', accounts.caisse.id, cOffrandes.id, new Date(Date.now() - 5 * 86400000));
    await rev('Produit de la kermesse', 400000, 'EVENT', accounts.ecobank.id, cEvenement.id, new Date(Date.now() - 1 * 86400000));
    await rev('Don anonyme', 100000, 'DONATION', accounts.momo.id, cOffrandes.id, new Date());

    const exp = async (description, amount, accountId, categoryId, expenseDate, beneficiary) =>
      prisma.expense.create({ data: { churchId, description, amount, accountId, categoryId, expenseDate, beneficiary } });
    await exp('Achat de chaises pliantes', 320000, accounts.caisse.id, cFournitures.id, new Date(Date.now() - 3 * 86400000), 'Quincaillerie du Centre');
    await exp('Entretien du toit', 150000, accounts.ecobank.id, cImmobilier.id, new Date(Date.now() - 2 * 86400000), 'Entreprise TOIT-PLUS');
  }

  const engCount = await prisma.engagement.count({ where: { churchId } });
  if (engCount === 0) {
    const cot = await prisma.engagement.create({
      data: { churchId, name: 'Cotisation annuelle 2026', amount: 12000, periodicity: 'ANNUAL', periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-12-31'), dueDate: new Date('2026-03-31'), status: 'OPEN' },
    });
    await prisma.engagementPayment.create({
      data: { churchId, engagementId: cot.id, personId: m.paul.id, amount: 12000, paidAt: new Date(), periodLabel: '2026' },
    });
  }

  const project = await prisma.project.findFirst({ where: { churchId } });
  if (!project) {
    const proj = await prisma.project.create({
      data: { churchId, name: 'Construction salle polyvalente', type: 'CONSTRUCTION', status: 'ONGOING', startDate: new Date('2026-02-01'), targetAmount: 25000000, responsibleId: m.emmanuel.id },
    });
    const commit = await prisma.engagement.create({
      data: { churchId, personId: m.paul.id, projectId: proj.id, name: 'Promesse de don pour la salle', description: 'Promesse de don pour la salle', amount: 500000, status: 'PARTIAL', dueDate: new Date('2026-12-31') },
    });
    await prisma.engagementPayment.create({
      data: { churchId, engagementId: commit.id, amount: 200000, paidAt: new Date() },
    });
  }
}

async function seedEvents(churchId, m) {
  const count = await prisma.churchEvent.count({ where: { churchId } });
  if (count > 0) return;

  const event = await prisma.churchEvent.create({
    data: { churchId, name: 'Fête de fin d\'année', type: 'FETE', startDate: new Date(), responsibleId: m.salome.id, budget: 1000000, status: 'PLANNED' },
  });
  await prisma.eventParticipant.createMany({
    data: [
      { churchId, eventId: event.id, personId: m.salome.id, role: 'Coordinatrice', isConfirmed: true },
      { churchId, eventId: event.id, personId: m.jean.id, role: 'Régie son', isConfirmed: true },
      { churchId, eventId: event.id, personId: m.esther.id, role: 'Animation', isConfirmed: false },
    ],
    skipDuplicates: true,
  });
}

await main()
  .catch((err) => {
    console.error('[seed] Erreur :', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
