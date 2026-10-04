import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });

import { PrismaClient as PrismaAuditClient } from '@prisma/client-audit';
import { PrismaClient as PrismaMainClient } from '@prisma/client-main';

const audit = new PrismaAuditClient();
const main = new PrismaMainClient();

(async () => {
  try {
    const totalLogs = await audit.changeLog.count();
    const logs = await audit.changeLog.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
    });
    console.log('\n[AUDIT DB] ChangeLog total rows: ' + totalLogs + '\nLast 5 events:');
    logs.forEach((l: any, i: number) => {
      const eid = (l.entityId || '').substring(0, 8);
      const by = String(l.triggeredBy || '').substring(0, 8);
      console.log('  ' + (i + 1) + '. [' + l.eventType + '] entity=' + l.entityType + ':' + eid + ' by=' + by + ' ' + (l.createdAt || '').toString());
    });
    console.log('---');
    const totalEmp = await main.employee.count();
    const totalAtt = await main.attendance.count();
    console.log('[MAIN DB] Employees: ' + totalEmp + ' | Attendance: ' + totalAtt);
    await audit.$disconnect();
    await main.$disconnect();
    process.exit(0);
  } catch (e: any) {
    console.error('ERR:', e.message || e);
    await audit.$disconnect();
    await main.$disconnect();
    process.exit(1);
  }
})();
