# NTL Sales Dashboard 2569

Realtime dashboard ภาพรวมยอดขายเงินติดล้อปี 2569 ดึงข้อมูลตรงจาก Google Sheet ทุก 30 วินาที.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts
- Client-side fetch จาก Google Sheets gviz JSON endpoint (ไม่ต้องใช้ API key)

## Data source
- Sheet ID: `1fPTbNHb9vTE6jLtXbOoq3oA7I8VYblAf-nffwNIghJI`
- Tab: `ALL_INS`
- Endpoint: `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:json&sheet=ALL_INS`

> gviz endpoint ถูกเรียกจาก browser โดยตรงผ่าน React hook `hooks/useSheet.ts`
> (ไม่เรียกผ่าน Next.js API route เพื่อหลีกเลี่ยง 403)

ต้องตั้ง Google Sheet เป็น **Anyone with the link – Viewer** เพื่อให้ gviz เปิดดึงได้.

## Run locally
```bash
npm install
npm run dev
```

เปิด http://localhost:3000

## Deploy ไป Vercel
1. Push repository ขึ้น GitHub (branch `main`)
2. ที่ https://vercel.com → New Project → Import repository
3. Framework: Next.js (auto-detect), ไม่ต้องตั้ง env var ใดๆ
4. Deploy

## Features
- อัปเดตอัตโนมัติทุก 30 วินาที + ปุ่ม Refresh
- KPI: ยอดขายรวม, จำนวนรายการ, ลูกค้าไม่ซ้ำ, ยอดเฉลี่ย
- กราฟยอดรายเดือน, สัดส่วนตามประเภท, แนวโน้ม, Top สาขา/พนักงาน
- ค้นหาลูกค้าหรือข้อความใดๆ + filter รายเดือน
- ตรวจคอลัมน์อัตโนมัติจากชื่อหัวตาราง (ไทย/อังกฤษ)
