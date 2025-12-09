// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, User, Calendar, History } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const [cccd, setCccd] = useState('');
  const [ten, setTen] = useState('');
  const [mst, setMst] = useState('');
  const [tinh, setTinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState('');
  const [namSinh, setNamSinh] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cleanCccd = cccd.replace(/\D/g, '');

  const traCuu = async () => {
    setError('');
    setTen(''); setMst(''); setTinh(''); setGioiTinh(''); setNamSinh('');

    if (cleanCccd.length !== 12) {
      setError('CCCD phải đủ 12 số');
      setTen('Sai định dạng CCCD');
      return;
    }

    setLoading(true);
    setTen('Đang tìm...');

    try {
      const res = await fetch(`/api/tracccd?cccd=${cleanCccd}`);
      const data = await res.json();

      setTen(data.ten || 'Không tìm thấy');
      setMst(data.mst || '');
      setTinh(data.tinh || 'Không xác định');
      setGioiTinh(data.gioitinh || '');
      setNamSinh(data.namsinh || '');

      const tenThat = data.ten || '';
      if (
        tenThat &&
        tenThat !== 'CCCD chưa có mã số thuế cá nhân' &&
        tenThat !== 'Không tìm thấy' &&
        tenThat.length > 3 &&
        !tenThat.includes('Cập nhật') &&
        !tenThat.includes('bảo mật')
      ) {
        const current = localStorage.getItem('my_cccd_history_v2');
        const list = current ? JSON.parse(current) : [];

        const newItem = {
          cccd: cleanCccd,
          ten: tenThat,
          mst: data.mst || '',
          tinh: data.tinh || 'Không xác định',
          gioiTinh: data.gioitinh || '',
          namSinh: data.namsinh || '',
        };

        const filtered = list.filter((x: any) => x.cccd !== cleanCccd);
        filtered.push(newItem);

        localStorage.setItem('my_cccd_history_v2', JSON.stringify(filtered.slice(-20)));
      }

    } catch (e) {
      setTen('Lỗi kết nối');
      console.error('Lỗi tra cứu:', e);
    } finally {
      setLoading(false);
    }
  };

  const goToHistory = () => {
    router.push('/history');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <h1 className="text-3xl md:text-4xl font-black text-center text-white mb-8">
          TRA CỨU CCCD
        </h1>

        <div className="bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 p-6">

          <div className="flex flex-col md:flex-row gap-3 mb-8">
            <Input
              placeholder=""
              value={cccd}
              onChange={(e) => setCccd(e.target.value.replace(/\D/g, '').slice(0, 12))}
              onKeyUp={(e) => e.key === 'Enter' && traCuu()}
              className="text-2xl md:text-3xl text-center font-mono h-14 bg-zinc-900 border-zinc-700 text-white rounded-xl focus:border-white"
              maxLength={12}
              style={{ letterSpacing: '0.15em' }}
            />
            <Button
              onClick={traCuu}
              disabled={loading}
              className="h-14 px-8 text-lg font-bold rounded-xl bg-white text-black hover:bg-gray-200"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'TRA NGAY'}
            </Button>
          </div>

          <div className="mb-6">
            <Button
              onClick={goToHistory}
              variant="outline"
              className="
                w-full h-12 text-lg font-bold
                bg-white text-black border border-black/10
                rounded-2xl shadow-md
                transition-all duration-300 flex items-center justify-center gap-3"
            >
              <History className="w-5 h-5" />
              Xem lịch sử tra cứu
            </Button>
          </div>

          {/* Lỗi */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/60 border border-red-700 rounded-xl text-red-300 text-center font-semibold animate-pulse">
              {error}
            </div>
          )}

          {/* Kết quả */}
          {ten && !loading && (
            <div className="text-center space-y-6">
              <h2 className="font-black text-white leading-tight" style={{ fontSize: 'clamp(1.8rem, 6vw, 3.2rem)' }}>
                {ten}
              </h2>

              {mst && mst.length === 10 && (
                <div className="bg-white text-black py-5 px-12 rounded-3xl inline-block shadow-2xl">
                  <p className="text-5xl md:text-6xl font-black font-mono tracking-widest">
                    {mst.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                  </p>
                </div>
              )}

              {mst && mst.length === 12 && (
                <Badge className="text-4xl md:text-5xl py-3 px-8 font-mono bg-white text-black rounded-xl">
                  {mst}
                </Badge>
              )}

              {(tinh || gioiTinh || namSinh) && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                    <MapPin className="w-5 h-5 mx-auto mb-1 text-zinc-400" />
                    <p className="text-zinc-300">{tinh}</p>
                  </div>
                  <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                    <User className="w-5 h-5 mx-auto mb-1 text-zinc-400" />
                    <p className="text-zinc-300">{gioiTinh}</p>
                  </div>
                  <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-zinc-400" />
                    <p className="text-zinc-300">{namSinh}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}