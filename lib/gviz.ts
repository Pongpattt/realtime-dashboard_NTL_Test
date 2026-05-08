// Client-side gviz fetcher + parser. Must be called from the browser.
export type Row = Record<string, any>;

export interface SheetData {
  headers: string[];
  rows: Row[];
  fetchedAt: number;
}

const SHEET_ID = "1fPTbNHb9vTE6jLtXbOoq3oA7I8VYblAf-nffwNIghJI";
const SHEET_NAME = "ALL_INS";

export const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
  SHEET_NAME
)}`;

// gviz wraps payload like: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
function stripWrapper(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Invalid gviz response");
  return JSON.parse(text.slice(start, end + 1));
}

function cellValue(cell: any): any {
  if (cell == null) return null;
  // gviz Date: "Date(yyyy,mm,dd,...)" — month is 0-indexed
  if (typeof cell.v === "string") {
    const m = cell.v.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/);
    if (m) {
      const [_, y, mo, d, hh, mm, ss] = m;
      return new Date(
        Number(y),
        Number(mo),
        Number(d),
        Number(hh ?? 0),
        Number(mm ?? 0),
        Number(ss ?? 0)
      ).toISOString();
    }
  }
  return cell.f ?? cell.v ?? null;
}

export async function fetchSheet(): Promise<SheetData> {
  const res = await fetch(GVIZ_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const json = stripWrapper(text);
  const table = json.table;

  const cols: string[] = (table.cols || []).map(
    (c: any, i: number) =>
      (c.label && String(c.label).trim()) ||
      (c.id && String(c.id).trim()) ||
      `col_${i}`
  );

  const rows: Row[] = (table.rows || []).map((r: any) => {
    const obj: Row = {};
    (r.c || []).forEach((cell: any, i: number) => {
      obj[cols[i] || `col_${i}`] = cellValue(cell);
    });
    return obj;
  });

  return { headers: cols, rows, fetchedAt: Date.now() };
}
