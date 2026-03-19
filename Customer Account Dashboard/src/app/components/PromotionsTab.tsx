import { Percent, Tag, TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";

interface Promo {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'member';
  label: string;
  date: string;
  discount: number;
}

const mockPromos: Promo[] = [
  {
    id: '1',
    code: 'LOVE20',
    type: 'percentage',
    label: 'ส่วนลดวันวาเลนไทน์',
    date: '28 ก.พ. 2026',
    discount: 300,
  },
  {
    id: '2',
    code: 'VDAY50',
    type: 'fixed',
    label: 'ส่วนลดพิเศษวันวาเลนไทน์',
    date: '14 ก.พ. 2026',
    discount: 200,
  },
  {
    id: '3',
    code: 'MEMBER10',
    type: 'member',
    label: 'ส่วนลดสมาชิก Gold',
    date: '5 ก.พ. 2026',
    discount: 130,
  },
  {
    id: '4',
    code: 'NEWYEAR',
    type: 'percentage',
    label: 'โปรโมชั่นปีใหม่',
    date: '28 ม.ค. 2026',
    discount: 200,
  },
  {
    id: '5',
    code: 'GOLDMEMBER',
    type: 'member',
    label: 'ส่วนลดสมาชิก Gold',
    date: '20 ม.ค. 2026',
    discount: 125,
  },
  {
    id: '6',
    code: 'WELCOME10',
    type: 'percentage',
    label: 'ส่วนลดสมาชิกใหม่',
    date: '15 ม.ค. 2026',
    discount: 150,
  },
  {
    id: '7',
    code: 'FLASH50',
    type: 'fixed',
    label: 'Flash Sale ลด 50 บาท',
    date: '10 ม.ค. 2026',
    discount: 50,
  },
  {
    id: '8',
    code: 'WEEKEND15',
    type: 'percentage',
    label: 'ส่วนลดวันหยุดสุดสัปดาห์',
    date: '5 ม.ค. 2026',
    discount: 180,
  },
];

export function PromotionsTab() {
  const totalSavings = mockPromos.reduce((sum, promo) => sum + promo.discount, 0);
  const averageSavings = Math.round(totalSavings / mockPromos.length);

  const getTypeBadge = (type: Promo['type']) => {
    switch (type) {
      case 'percentage':
        return <Badge className="bg-purple-100 text-purple-700 border-0 hover:bg-purple-100">%</Badge>;
      case 'fixed':
        return <Badge className="bg-orange-100 text-orange-700 border-0 hover:bg-orange-100">฿</Badge>;
      case 'member':
        return <Badge className="bg-amber-100 text-amber-700 border-0 hover:bg-amber-100">GOLD</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-[#3D6FEB] to-[#5B8BFF] rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/90 text-sm mb-1">ประหยัดทั้งหมด</p>
              <p className="text-3xl font-bold">฿{totalSavings.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/90 text-sm mb-1">เฉลี่ยต่อครั้ง</p>
              <p className="text-3xl font-bold">฿{averageSavings}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/90 text-sm mb-1">ใช้โปรโมชั่น</p>
              <p className="text-3xl font-bold">{mockPromos.length} ครั้ง</p>
            </div>
          </div>
        </div>
      </div>

      {/* Promo History */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ประวัติการใช้โปรโมชั่น</h3>
        <div className="space-y-3">
          {mockPromos.map((promo) => (
            <div
              key={promo.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <Tag className="w-5 h-5 text-[#3D6FEB]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{promo.code}</p>
                    {getTypeBadge(promo.type)}
                  </div>
                  <p className="text-sm text-gray-600">{promo.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{promo.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">ประหยัด</p>
                <p className="text-xl font-bold text-green-600">฿{promo.discount}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between bg-green-50 rounded-lg p-4">
            <p className="text-lg font-semibold text-gray-900">รวมส่วนลดทั้งหมด</p>
            <p className="text-2xl font-bold text-green-600">฿{totalSavings.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
