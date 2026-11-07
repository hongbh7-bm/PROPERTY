const SALE_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
const RENT_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent";

const text = (xml, names) => {
  for (const name of names) {
    const match = xml.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`, "i"));
    if (match) return match[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
  }
  return "";
};
const number = (value) => Number(String(value || "0").replace(/[^0-9.-]/g, "")) || 0;
const items = (xml) => [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);
const monthsBetween = (from, to) => {
  const start = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00Z`);
  const out = [];
  while (start <= end && out.length < 12) {
    out.push(`${start.getUTCFullYear()}${String(start.getUTCMonth() + 1).padStart(2, "0")}`);
    start.setUTCMonth(start.getUTCMonth() + 1);
  }
  return out;
};
const fetchMonth = async (base, month, key) => {
  const url = new URL(base);
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("LAWD_CD", "11560");
  url.searchParams.set("DEAL_YMD", month);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "1000");
  const response = await fetch(url, { headers: { accept: "application/xml" } });
  if (!response.ok) throw new Error(`공공데이터 응답 오류 (${response.status})`);
  const xml = await response.text();
  const code = text(xml, ["resultCode"]);
  if (code && code !== "000" && code !== "00") throw new Error(text(xml, ["resultMsg"]) || `API 오류 ${code}`);
  return items(xml);
};
const normalizeSale = (xml) => {
  const year = text(xml, ["dealYear", "년"]), month = text(xml, ["dealMonth", "월"]), day = text(xml, ["dealDay", "일"]);
  return { type: "매매", name: text(xml, ["aptNm", "아파트"]), dong: text(xml, ["umdNm", "법정동"]), area: number(text(xml, ["excluUseAr", "전용면적"])), amount: number(text(xml, ["dealAmount", "거래금액"])), deposit: 0, rent: 0, floor: text(xml, ["floor", "층"]), built: text(xml, ["buildYear", "건축년도"]), date: `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}` };
};
const normalizeRent = (xml) => {
  const year = text(xml, ["dealYear", "년"]), month = text(xml, ["dealMonth", "월"]), day = text(xml, ["dealDay", "일"]);
  const rent = number(text(xml, ["monthlyRent", "월세금액"]));
  return { type: rent > 0 ? "월세" : "전세", name: text(xml, ["aptNm", "아파트"]), dong: text(xml, ["umdNm", "법정동"]), area: number(text(xml, ["excluUseAr", "전용면적"])), amount: number(text(xml, ["deposit", "보증금액"])), deposit: number(text(xml, ["deposit", "보증금액"])), rent, floor: text(xml, ["floor", "층"]), built: text(xml, ["buildYear", "건축년도"]), date: `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}` };
};
const topComplexes = (rows, type, dong) => {
  const filtered = rows.filter((r) => r.type === type && r.name && (!dong || dong === "영등포구 전체" || r.dong.includes(dong.replace("동", ""))));
  const latest = new Map();
  for (const row of filtered.sort((a,b) => b.date.localeCompare(a.date))) if (!latest.has(row.name)) latest.set(row.name, row);
  return [...latest.values()].sort((a,b) => type === "월세" ? b.rent-a.rent : b.amount-a.amount).slice(0,10);
};

async function market(request, env) {
  if (!env.PUBLIC_DATA_API_KEY) return Response.json({ ok: false, error: "공공데이터 API 키가 설정되지 않았습니다." }, { status: 503 });
  const q = new URL(request.url).searchParams;
  const from = q.get("from") || new Date(Date.now()-31*86400000).toISOString().slice(0,10);
  const to = q.get("to") || new Date().toISOString().slice(0,10);
  const dong = q.get("dong") || "영등포구 전체";
  const months = monthsBetween(from, to);
  try {
    const [saleXml, rentXml] = await Promise.all([
      Promise.all(months.map((m) => fetchMonth(SALE_URL, m, env.PUBLIC_DATA_API_KEY))),
      Promise.all(months.map((m) => fetchMonth(RENT_URL, m, env.PUBLIC_DATA_API_KEY)))
    ]);
    const rows = [...saleXml.flat().map(normalizeSale), ...rentXml.flat().map(normalizeRent)].filter((r) => r.date >= from && r.date <= to);
    const sales = rows.filter((r) => r.type === "매매");
    const average = sales.length ? Math.round(sales.reduce((s,r)=>s+r.amount,0)/sales.length) : 0;
    return Response.json({ ok: true, live: true, source: "국토교통부 실거래가 공개시스템", updatedAt: new Date().toISOString(), summary: { volume: sales.length, average }, top: { "매매": topComplexes(rows,"매매",dong), "전세": topComplexes(rows,"전세",dong), "월세": topComplexes(rows,"월세",dong) } }, { headers: { "cache-control": "public, max-age=300" } });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "데이터 조회 실패" }, { status: 502 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/market") return market(request, env);
    if (url.pathname === "/" || url.pathname === "/index.html") return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
    return new Response("Not found", { status: 404 });
  }
};
