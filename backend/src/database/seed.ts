import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../../.env' });

import { PrismaClient as PrismaMainClient, Role, AttendanceStatus } from '@prisma/client-main';
import { PrismaClient as PrismaAuditClient } from '@prisma/client-audit';
import * as bcrypt from 'bcryptjs';

const prismaMain = new PrismaMainClient();
const prismaAudit = new PrismaAuditClient();

const SAMPLE_EMPLOYEES = [
  { name: 'Budi Santoso', email: 'budi.santoso@dexa-group.com',    position: 'Software Engineer',    password: 'employee123', phone: '081210001234' },
  { name: 'Siti Rahayu',  email: 'siti.rahayu@dexa-group.com',     position: 'Product Manager',      password: 'employee123', phone: '081210005678' },
  { name: 'Ahmad Fauzi',  email: 'ahmad.fauzi@dexa-group.com',     position: 'Frontend Developer',   password: 'employee123', phone: '081210009012' },
  { name: 'Dewi Lestari', email: 'dewi.lestari@dexa-group.com',    position: 'QA Engineer',          password: 'employee123', phone: '081210003456' },
  { name: 'Rizki Pratama',email: 'rizki.pratama@dexa-group.com',   position: 'Backend Developer',    password: 'employee123', phone: '081210007890' },
];

function generateWorkingDays(daysBack = 10): Date[] {
  const res: Date[] = [];
  const today = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    res.push(d);
  }
  return res;
}

async function main() {
  console.log('\n---[ HRIS Prisma Seed Start ]---\n');

  await prismaAudit.changeLog.deleteMany({}).catch(() => {});
  await prismaMain.attendance.deleteMany({}).catch(() => {});
  await prismaMain.employee.deleteMany({}).catch(() => {});

  const pwd = await bcrypt.hash('admin123', 10);
  const admin = await prismaMain.employee.create({
    data: {
      name: 'Admin HRD',
      email: 'admin@dexa-group.com',
      password: pwd,
      role: Role.HRD,
      position: 'HRD Manager',
      phone: '081200000001',
    },
  });
  console.log(`[HRD] ${admin.name} - ${admin.email} / admin123`);

  const employeesCreated: any[] = [];
  for (const e of SAMPLE_EMPLOYEES) {
    const ep = await bcrypt.hash(e.password, 10);
    const emp = await prismaMain.employee.create({
      data: {
        name: e.name,
        email: e.email,
        password: ep,
        role: Role.EMPLOYEE,
        position: e.position,
        phone: e.phone,
      },
    });
    employeesCreated.push(emp);
    console.log(`[EMP] ${emp.name} - ${emp.email} / employee123`);
  }

  const workingDays = generateWorkingDays(14).reverse();
  let totalAttendance = 0;
  for (const emp of employeesCreated) {
    for (const d of workingDays) {
      const date = d.toISOString().slice(0, 10);
      const hourOffset = Math.floor(Math.random() * 30) - 15;
      const masukH = 8;
      const masukM = Math.max(0, Math.min(59, 55 + hourOffset));
      await prismaMain.attendance.create({
        data: {
          employeeId: emp.id,
          date,
          time: `${String(masukH).padStart(2,'0')}:${String(masukM).padStart(2,'0')}:00`,
          status: AttendanceStatus.MASUK,
        },
      });
      const pulangH = 17;
      const pulangM = Math.max(0, Math.min(59, Math.floor(Math.random() * 60)));
      await prismaMain.attendance.create({
        data: {
          employeeId: emp.id,
          date,
          time: `${String(pulangH).padStart(2,'0')}:${String(pulangM).padStart(2,'0')}:00`,
          status: AttendanceStatus.PULANG,
        },
      });
      totalAttendance += 2;
    }
  }
  console.log(`\n[ATTENDANCE] Inserted ${totalAttendance} attendance records (${workingDays.length} working days x 5 employees x 2 records)`);

  await prismaAudit.changeLog.create({
    data: {
      entityType: 'system',
      entityId: 'seed',
      eventType: 'seed',
      triggeredBy: 'system',
    },
  });
  console.log(`[AUDIT DB] Audit DB reachable: wrote system.seed changelog.`);

  console.log('\n-------------------------------------------------------');
  console.log('SEED COMPLETE. Credentials:');
  console.log('  HRD / Admin:  admin@dexa-group.com      / admin123');
  console.log('  All employees password:  employee123');
  console.log(`  Frontend Employee App -> http://localhost:5173`);
  console.log(`  Frontend HRD Admin App -> http://localhost:5174`);
  console.log(`  Swagger API docs       -> http://localhost:3000/api`);
  console.log('-------------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Seed FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaMain.$disconnect();
    await prismaAudit.$disconnect();
  });
