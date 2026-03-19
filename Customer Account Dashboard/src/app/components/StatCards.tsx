import {
  ShoppingBag,
  Wallet,
  Percent,
  MapPin,
} from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="bg-[#EEF3FF] text-[#3D6FEB] p-3 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardsProps {
  loyaltyPoints: number;
}

export function StatCards({ loyaltyPoints }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<ShoppingBag className="w-6 h-6" />}
        label="คำสั่งซื้อทั้งหมด"
        value="18"
        subtitle="สำเร็จแล้ว 16 รายการ"
      />
      <StatCard
        icon={<Wallet className="w-6 h-6" />}
        label="ยอดใช้จ่ายทั้งหมด"
        value="฿12,500"
        subtitle="เฉลี่ย ฿694/คำสั่งซื้อ"
      />
      <StatCard
        icon={<Percent className="w-6 h-6" />}
        label="ส่วนลดที่ได้รับ"
        value="฿2,845"
        subtitle="ประหยัด 18.5%"
      />
      <StatCard
        icon={<MapPin className="w-6 h-6" />}
        label="แต้มสะสม"
        value={`${loyaltyPoints.toLocaleString()} แต้ม`}
      />
    </div>
  );
}