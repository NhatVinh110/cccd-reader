// src/app/history/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryItem {
  cccd: string;
  ten: string;
  mst: string;
  tinh: string;
  gioiTinh: string;
  namSinh: string;
}

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('my_cccd_history_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as HistoryItem[];
        setHistory(parsed.slice(-200).reverse()); 
      } catch {
        localStorage.removeItem('my_cccd_history_v2');
      }
    }
  }, []);

  const goHome = () => router.push('/');

  // Tính toán phân trang
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = history.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-2xl">Đang tải lịch sử...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Lịch sử tra cứu</h1>
          <p className="text-xl text-gray-500 mt-4">Chưa có dữ liệu</p>
          <button
            onClick={goHome}
            className="mt-8 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay về
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Lịch sử tra cứu của bạn</h1>
          <button
            onClick={goHome}
            className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay về
          </button>
        </div>

        <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3">STT</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">CCCD</th>
                <th className="px-4 py-3">Mã số thuế</th>
                <th className="px-4 py-3">Tỉnh/TP</th>
                <th className="px-4 py-3">Giới tính</th>
                <th className="px-4 py-3">Năm sinh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {currentItems.map((item, index) => (
                <tr key={item.cccd} className="hover:bg-zinc-800/50 transition">
                  <td className="px-4 py-4 text-zinc-400 font-medium">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-4 font-semibold text-white">{item.ten}</td>
                  <td className="px-4 py-4 font-mono text-cyan-400">{item.cccd}</td>
                  <td className="px-4 py-4 font-mono text-yellow-400">{item.mst || '-'}</td>
                  <td className="px-4 py-4">{item.tinh}</td>
                  <td className="px-4 py-4 text-center">{item.gioiTinh}</td>
                  <td className="px-4 py-4 text-center">{item.namSinh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex justify-end items-center gap-3 text-sm">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded border ${
                currentPage === 1
                  ? 'border-zinc-700 text-zinc-600 cursor-not-allowed'
                  : 'border-zinc-600 text-zinc-400 hover:border-white hover:text-white transition'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-zinc-400">
              Trang <span className="text-white font-medium">{currentPage}</span> / {totalPages}
            </span>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded border ${
                currentPage === totalPages
                  ? 'border-zinc-700 text-zinc-600 cursor-not-allowed'
                  : 'border-zinc-600 text-zinc-400 hover:border-white hover:text-white transition'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}