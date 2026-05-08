"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSheet } from "@/hooks/useSheet";
import {
  detectColumns,
  rowMonth,
  rowYear,
  TH_MONTHS,
  toDate,
  toNumber,
} from "@/lib/columns";
import { KpiCard } from "./KpiCard";

const fmtBaht = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 0,
  }).format(n);

const fmtCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

const PIE_COLORS = [
  "#f97316",
  "#fb923c",
  "#fbbf24",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#f87171",
];

export default function Dashboard() {
  const { data, loading, error, refresh } = useSheet();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const cols = useMemo(
    () => (data ? detectColumns(data.headers) : {}),
    [data]
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.rows.filter((row) => {
      if (q) {
        const hay = Object.values(row)
          .map((v) => (v == null ? "" : String(v).toLowerCase()))
          .join(" ");
        if (!hay.includes(q)) return false;
      }
      if (monthFilter !== "all") {
        const m = rowMonth(row, cols);
        if (m === null) return false;
        if (String(m) !== monthFilter) return false;
      }
      return true;
    });
  }, [data, search, monthFilter, cols]);

  const totalAmount = useMemo(() => {
    if (!cols.amount) return 0;
    return filtered.reduce((acc, r) => acc + toNumber(r[cols.amount!]), 0);
  }, [filtered, cols]);

  const uniqueCustomers = useMemo(() => {
    if (!cols.customer) return 0;
    return new Set(
      filtered.map((r) => String(r[cols.customer!] ?? "").trim()).filter(Boolean)
    ).size;
  }, [filtered, cols]);

  const avgTicket = filtered.length ? totalAmount / filtered.length : 0;

  const monthlySeries = useMemo(() => {
    const buckets = new Array(12).fill(0).map((_, i) => ({
      month: TH_MONTHS[i],
      idx: i,
      total: 0,
      count: 0,
    }));
    if (!cols.date) return buckets;
    for (const r of filtered) {
      const m = rowMonth(r, cols);
      if (m == null) continue;
      buckets[m].count += 1;
      buckets[m].total += cols.amount ? toNumber(r[cols.amount]) : 0;
    }
    return buckets;
  }, [filtered, cols]);

  const productSeries = useMemo(() => {
    const key = cols.product || cols.status || cols.branch;
    if (!key) return [];
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = String(r[key] ?? "ไม่ระบุ").trim() || "ไม่ระบุ";
      const v = cols.amount ? toNumber(r[cols.amount]) : 1;
      map.set(k, (map.get(k) || 0) + v);
    }
    return Array.from(map, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered, cols]);

  const branchSeries = useMemo(() => {
    const key = cols.branch || cols.staff;
    if (!key) return [];
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = String(r[key] ?? "ไม่ระบุ").trim() || "ไม่ระบุ";
      const v = cols.amount ? toNumber(r[cols.amount]) : 1;
      map.set(k, (map.get(k) || 0) + v);
    }
    return Array.from(map, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered, cols]);

  const yearLabel = useMemo(() => {
    if (!data || !cols.date) return "2569";
    const years = new Set<number>();
    for (const r of data.rows) {
      const y = rowYear(r, cols);
      if (y) years.add(y);
    }
    if (!years.size) return "2569";
    const ys = Array.from(years).sort((a, b) => b - a);
    return ys
      .map((y) => (y < 2400 ? y + 543 : y))
      .slice(0, 2)
      .join(", ");
  }, [data, cols]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1500px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 grid place-items-center font-bold text-white shadow-lg shadow-orange-500/30">
              N
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                NTL Sales Dashboard
              </h1>
              <p className="text-xs text-slate-400">
                เงินติดล้อ – ภาพรวมยอดขายปี {yearLabel} • อัปเดตอัตโนมัติทุก 30 วินาที
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                error ? "bg-red-400" : "bg-emerald-400 animate-pulse"
              }`}
            />
            {error ? "Connection error" : "Live"}
          </div>
          {data && (
            <span className="text-slate-400">
              อัปเดตล่าสุด {new Date(data.fetchedAt).toLocaleTimeString("th-TH")}
            </span>
          )}
          <button
            onClick={refresh}
            className="glass rounded-full px-4 py-1.5 hover:bg-white/10 transition"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">
            ค้นหาลูกค้า / ข้อมูลใดก็ได้
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="พิมพ์ชื่อลูกค้า, เลขที่, สาขา ฯลฯ"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/60"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">เดือน</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500/60"
          >
            <option value="all">ทุกเดือน</option>
            {TH_MONTHS.map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="glass rounded-2xl p-4 mb-6 border-red-500/30 text-red-300 text-sm">
          ไม่สามารถดึงข้อมูลจาก Google Sheet: {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="ยอดขายรวม"
          value={"฿" + fmtBaht(totalAmount)}
          hint={cols.amount ? `จากคอลัมน์: ${cols.amount}` : "ไม่พบคอลัมน์ยอด"}
          accent="from-orange-500 to-amber-400"
        />
        <KpiCard
          label="จำนวนรายการ"
          value={fmtBaht(filtered.length)}
          hint={data ? `ทั้งหมด ${data.rows.length} รายการ` : ""}
          accent="from-emerald-500 to-teal-400"
        />
        <KpiCard
          label="ลูกค้า (ไม่ซ้ำ)"
          value={fmtBaht(uniqueCustomers)}
          hint={cols.customer ? `จาก: ${cols.customer}` : "ไม่พบคอลัมน์ลูกค้า"}
          accent="from-sky-500 to-blue-400"
        />
        <KpiCard
          label="ยอดเฉลี่ย / รายการ"
          value={"฿" + fmtBaht(Math.round(avgTicket))}
          accent="from-violet-500 to-fuchsia-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-3">
            ยอดขายรายเดือน
          </h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthlySeries}>
                <defs>
                  <linearGradient id="barOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#c2410c" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={fmtCompact}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0b1020",
                    border: "1px solid #ffffff20",
                    borderRadius: 12,
                  }}
                  formatter={(v: any) => "฿" + fmtBaht(Number(v))}
                />
                <Bar dataKey="total" fill="url(#barOrange)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            สัดส่วนตาม{cols.product ? "ประเภท" : cols.status ? "สถานะ" : "หมวด"}
          </h3>
          <div className="h-72">
            {productSeries.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={productSeries}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {productSeries.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }}
                    iconSize={8}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0b1020",
                      border: "1px solid #ffffff20",
                      borderRadius: 12,
                    }}
                    formatter={(v: any) => "฿" + fmtBaht(Number(v))}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-slate-500 text-sm">
                ไม่พบคอลัมน์สำหรับจัดกลุ่ม
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            แนวโน้มจำนวนรายการต่อเดือน
          </h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0b1020",
                    border: "1px solid #ffffff20",
                    borderRadius: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#34d399"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#34d399" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            Top {cols.branch ? "สาขา" : "พนักงาน"}
          </h3>
          <div className="h-64">
            {branchSeries.length ? (
              <ResponsiveContainer>
                <BarChart data={branchSeries} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={fmtCompact}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0b1020",
                      border: "1px solid #ffffff20",
                      borderRadius: 12,
                    }}
                    formatter={(v: any) => "฿" + fmtBaht(Number(v))}
                  />
                  <Bar dataKey="value" fill="#60a5fa" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-slate-500 text-sm">
                ไม่พบคอลัมน์สาขา/พนักงาน
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">
            รายการ ({fmtBaht(filtered.length)})
          </h3>
          {loading && !data && (
            <span className="text-xs text-slate-400">กำลังโหลด...</span>
          )}
        </div>
        <div className="overflow-auto scroll-thin max-h-[480px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#111a36] z-10">
              <tr className="text-left text-slate-400">
                {data?.headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 font-medium border-b border-white/10 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition">
                  {data?.headers.map((h) => {
                    const v = row[h];
                    let display: string;
                    if (v == null || v === "") display = "-";
                    else if (cols.date && h === cols.date) {
                      const d = toDate(v);
                      display = d
                        ? d.toLocaleDateString("th-TH")
                        : String(v);
                    } else if (cols.amount && h === cols.amount) {
                      display = fmtBaht(toNumber(v));
                    } else display = String(v);
                    return (
                      <td
                        key={h}
                        className="px-3 py-2 border-b border-white/5 text-slate-200 whitespace-nowrap"
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <div className="text-xs text-slate-400 text-center py-3">
              แสดง 500 รายการแรกจาก {fmtBaht(filtered.length)} รายการ
              (กรองเพิ่มเพื่อดูข้อมูลที่ต้องการ)
            </div>
          )}
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 mt-8">
        Realtime via Google Sheets gviz • Next.js + Tailwind + Recharts
      </footer>
    </div>
  );
}
