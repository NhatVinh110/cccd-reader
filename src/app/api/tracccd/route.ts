// src/app/api/tracccd/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'tracuu',
  port: Number(process.env.MYSQL_PORT) || 3306,
  connectionLimit: 10,
});

const maTinh: Record<string, string> = {
  "001": "Hà Nội","002": "Hà Giang","004": "Cao Bằng","006": "Bắc Kạn","008": "Tuyên Quang",
  "010": "Lào Cai","011": "Điện Biên","012": "Lai Châu","014": "Sơn La","015": "Yên Bái",
  "017": "Hòa Bình","019": "Thái Nguyên","020": "Lạng Sơn","022": "Quảng Ninh","024": "Bắc Giang",
  "025": "Phú Thọ","026": "Vĩnh Phúc","027": "Bắc Ninh","030": "Hải Dương","031": "Hải Phòng",
  "033": "Hưng Yên","034": "Thái Bình","035": "Hà Nam","036": "Nam Định","037": "Ninh Bình",
  "038": "Thanh Hóa","040": "Nghệ An","042": "Hà Tĩnh","044": "Quảng Bình","045": "Quảng Trị",
  "046": "Thừa Thiên Huế","048": "Đà Nẵng","049": "Quảng Nam","051": "Quảng Ngãi","052": "Bình Định",
  "054": "Phú Yên","056": "Khánh Hòa","058": "Ninh Thuận","060": "Bình Thuận","062": "Kon Tum",
  "064": "Gia Lai","066": "Đắk Lắk","067": "Đắk Nông","068": "Lâm Đồng","070": "Bình Phước",
  "072": "Tây Ninh","074": "Bình Dương","075": "Đồng Nai","077": "Bà Rịa - Vũng Tàu",
  "079": "TP. Hồ Chí Minh","080": "Long An","082": "Tiền Giang","083": "Bến Tre","084": "Trà Vinh",
  "086": "Vĩnh Long","087": "Đồng Tháp","089": "An Giang","091": "Kiên Giang","092": "Cần Thơ",
  "093": "Hậu Giang","094": "Sóc Trăng","095": "Bạc Liêu","096": "Cà Mau"
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('cccd')?.replace(/\D/g, '') || '';
  const cccd = raw.padStart(12, '0').slice(0, 12);

  if (cccd.length !== 12) {
    return NextResponse.json({ error: 'CCCD không hợp lệ' }, { status: 400 });
  }

  const maT = cccd.slice(0, 3);
  const gtCode = parseInt(cccd[3]);
  const namsinh = (gtCode <= 1 ? '19' : '20') + cccd.slice(4, 6);
  const gioitinh = gtCode % 2 === 0 ? 'Nam' : 'Nữ';
  const tinh = maTinh[maT] || 'Không xác định';

  const conn = await pool.getConnection();

  try {
    const [rows] = await conn.execute<mysql.RowDataPacket[]>( 
  'SELECT ten, mst FROM tracuu_logs WHERE cccd = ? LIMIT 1', 
  [cccd]);
    let ten = '';
    let mst = cccd;

    if (rows.length > 0) {
      const row = rows[0] as any;
      if (row.ten && row.ten !== 'CCCD chưa có mã số thuế cá nhân' && !row.ten.includes('Cập nhật')) {
        ten = row.ten;
        mst = row.mst || cccd;
      }
    }

    if (!ten || ten === 'CCCD chưa có mã số thuế cá nhân') {
      const delay = 800 + (parseInt(cccd.slice(-4)) % 1200);
      await new Promise(r => setTimeout(r, delay));

      const res = await fetch(`https://masothue.com/Search/?q=${cccd}&type=auto&force-search=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'vi-VN,vi;q=0.9',
          'Referer': 'https://masothue.com/',
        },
        signal: AbortSignal.timeout(15000),
      });

      const html = await res.text();
      if (!html.includes('Just a moment') && html.length > 8000) {
        const strongMatch = html.match(/Mã số thuế[\s\S]*?<strong[^>]*>(\d{10,13})<\/strong>/i);
        if (strongMatch) {
          mst = strongMatch[1].trim();
          if (mst.length === 13) mst = mst.slice(0, -3);
        }

        const h1Match = html.match(/<h1[^>]*>[\s\S]*?\d{10,13}[-–—\s]+([^<]+)</i);
        if (h1Match?.[1]) ten = h1Match[1].trim();

        if (!ten) {
          const repTd = html.match(/(?:Người đại diện|Đại diện pháp luật)[\s\S]*?<td[^>]*>([^<]+)</i);
          if (repTd?.[1]) ten = repTd[1].trim();
        }

        if (!ten || mst === cccd) {
          const emMatch = html.match(/<em><a[^>]*>([^<]+)<\/a><\/em>/i);
          if (emMatch?.[1]) ten = emMatch[1].trim();
        }
      }

      if (!ten || ten.length < 4 || mst === cccd) {
        const gdt = await getFromGDT(cccd);
        if (gdt) {
          ten = gdt.ten;
          mst = gdt.mst;
        }
      }
    }

    const finalTen = ten && ten.length > 3 && !ten.includes('Cập nhật') && !ten.includes('bảo mật')
      ? ten
      : 'CCCD chưa có mã số thuế cá nhân';

    const finalMst = finalTen.includes('chưa có') ? cccd : mst;

    // LƯU DB
    await conn.execute(
      `INSERT INTO tracuu_logs (cccd, ten, mst, tinh, gioitinh, namsinh, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         ten = VALUES(ten),
         mst = VALUES(mst),
         tinh = VALUES(tinh),
         gioitinh = VALUES(gioitinh),
         namsinh = VALUES(namsinh),
         created_at = CURRENT_TIMESTAMP`,
      [cccd, finalTen, finalTen.includes('chưa có') ? null : finalMst, tinh, gioitinh, namsinh]
    );
    conn.release();

    // CHỈ GỬI HEADER x-my-history
    const currentList = request.headers.get('x-my-history') || '';
    const newList = currentList ? `${currentList},${cccd}` : cccd;

    const response = NextResponse.json({
      ten: finalTen,
      mst: finalMst,
      tinh,
      gioitinh,
      namsinh
    });
    response.headers.set('x-my-history', newList);
    return response;

  } catch (error) {
    conn.release();
    return NextResponse.json({
      ten: 'CCCD chưa có mã số thuế cá nhân',
      mst: cccd,
      tinh,
      gioitinh,
      namsinh
    });
  }
}

async function getFromGDT(cccd: string): Promise<{ten: string, mst: string} | null> {
  try {
    const res = await fetch(`http://tracuunnt.gdt.gov.vn/tcnnt/mstcn.jsp?cccd=${cccd}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ten = html.match(/Họ và tên:\s*<\/b>\s*([^<]+)</i)?.[1]?.trim() || '';
    const allMst = [...new Set(html.match(/\d{10,13}/g) || [])];
    if (!ten || allMst.length === 0) return null;

    let mst = allMst.find(m => m.length <= 12) || allMst[0];
    if (mst.length === 13) mst = mst.slice(0, -3);

    return { ten, mst };
  } catch {
    return null;
  }
}