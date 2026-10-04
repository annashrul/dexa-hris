export interface Employee {
  id: number | string;
  name: string;
  email: string;
  position?: string;
  role: string;
  phone?: string;
  photo?: string;
}

export interface AttendanceFlatRecord {
  id: number | string;
  employeeId: number | string;
  employee?: Employee;
  date: string;
  time: string;
  status: 'MASUK' | 'PULANG' | string;
  createdAt?: string;
  employeeName?: string;
  employeeEmail?: string;
  employeePosition?: string;
}

export interface AttendancePairedRow {
  date: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  employeePosition?: string;
  masuk: AttendanceFlatRecord | null;
  pulang: AttendanceFlatRecord | null;
}

export interface AttendanceSummaryResponse {
  range: { from: string; to: string };
  total: number;
  uniqueEmployees: number;
  masukCount: number;
  pulangCount: number;
  rows: AttendancePairedRow[];
}

export function unwrapEmployees(data: unknown): Employee[] {
  const x = (data as any)?.data ?? data ?? [];
  return Array.isArray(x) ? (x as Employee[]) : [];
}

export function unwrapAttendanceSummary(data: unknown): AttendanceSummaryResponse {
  const raw = (data as any)?.data ?? data ?? {};
  return {
    range: raw.range || { from: '', to: '' },
    total: Number(raw.total || 0),
    uniqueEmployees: Number(raw.uniqueEmployees || 0),
    masukCount: Number(raw.masukCount || 0),
    pulangCount: Number(raw.pulangCount || 0),
    rows: Array.isArray(raw.rows) ? raw.rows : [],
  } as AttendanceSummaryResponse;
}

export function flattenAttendance(resp: AttendanceSummaryResponse): AttendanceFlatRecord[] {
  const list: AttendanceFlatRecord[] = [];
  for (const row of resp.rows) {
    if (row.masuk) {
      list.push({
        ...row.masuk,
        employeeId: row.employeeId,
        employeeName: row.employeeName ?? null,
        employeeEmail: row.employeeEmail ?? null,
        employeePosition: row.employeePosition ?? null,
      } as AttendanceFlatRecord);
    }
    if (row.pulang) {
      list.push({
        ...row.pulang,
        employeeId: row.employeeId,
        employeeName: row.employeeName ?? null,
        employeeEmail: row.employeeEmail ?? null,
        employeePosition: row.employeePosition ?? null,
      } as AttendanceFlatRecord);
    }
  }
  return list.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.status !== b.status) return a.status === 'MASUK' ? -1 : 1;
    return a.time < b.time ? -1 : 1;
  });
}
