import type { Row } from "./gviz";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

const PATTERNS = {
  date: ["date", "วันที่", "วัน", "เดือน", "month"],
  customer: ["customer", "ลูกค้า", "ชื่อ", "name", "fullname", "client"],
  amount: [
    "amount",
    "ยอด",
    "ยอดขาย",
    "ยอดอนุมัติ",
    "วงเงิน",
    "sales",
    "total",
    "price",
    "value",
    "จำนวนเงิน",
  ],
  product: ["product", "ประเภท", "type", "สินเชื่อ", "category", "หมวด"],
  status: ["status", "สถานะ", "state"],
  branch: ["branch", "สาขา", "area", "region", "เขต"],
  staff: ["staff", "พนักงาน", "sales", "เซลล์", "เซลส์", "owner", "ผู้ขาย"],
};

export type DetectedColumns = Partial<Record<keyof typeof PATTERNS, string>>;

export function detectColumns(headers: string[]): DetectedColumns {
  const result: DetectedColumns = {};
  const used = new Set<string>();
  for (const key of Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]) {
    const pats = PATTERNS[key];
    let best: string | undefined;
    for (const h of headers) {
      if (used.has(h)) continue;
      const n = norm(h);
      if (pats.some((p) => n.includes(norm(p)))) {
        best = h;
        break;
      }
    }
    if (best) {
      result[key] = best;
      used.add(best);
    }
  }
  return result;
}

export function toNumber(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[฿,\s]/g, "").replace(/[^\d.\-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d;
  // Try dd/mm/yyyy
  const m = String(v).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [_, d1, m1, y1] = m;
    let y = Number(y1);
    if (y > 2400) y -= 543; // Buddhist year → CE
    if (y < 100) y += 2000;
    const dd = new Date(y, Number(m1) - 1, Number(d1));
    if (!isNaN(dd.getTime())) return dd;
  }
  return null;
}

export const TH_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export function rowMonth(row: Row, cols: DetectedColumns): number | null {
  if (!cols.date) return null;
  const d = toDate(row[cols.date]);
  return d ? d.getMonth() : null;
}

export function rowYear(row: Row, cols: DetectedColumns): number | null {
  if (!cols.date) return null;
  const d = toDate(row[cols.date]);
  return d ? d.getFullYear() : null;
}
