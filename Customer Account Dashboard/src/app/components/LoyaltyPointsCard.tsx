import { Gift, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

interface LoyaltyPointsCardProps {
  loyaltyPoints: number;
  onRedeem: () => void;
}

export function LoyaltyPointsCard({ loyaltyPoints, onRedeem }: LoyaltyPointsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-[#3D6FEB] to-[#5B8BFF] p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5" />
            <h3 className="text-lg font-semibold">แต้มสะสมของคุณ</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-bold">{loyaltyPoints.toLocaleString()}</p>
            <p className="text-xl text-white/90">แต้ม</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-600">
          สะสมจากการสั่งซื้อสินค้า
        </p>

        {/* Reward Info */}
        <div className="bg-[#F0F5FF] rounded-lg p-4 border border-[#3D6FEB]/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-[#3D6FEB] text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold text-sm">
                100
              </div>
              <span className="text-sm text-gray-700">แต้ม</span>
            </div>
            <span className="text-gray-500">=</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#3D6FEB]">฿10</span>
              <span className="text-sm text-gray-700">ส่วนลด</span>
            </div>
          </div>
        </div>

        {/* Button */}
        <Button 
          className="w-full bg-[#3D6FEB] hover:bg-[#2D5FDB] text-white"
          onClick={onRedeem}
          disabled={loyaltyPoints < 100}
        >
          <Gift className="w-4 h-4 mr-2" />
          แลกแต้ม
        </Button>
        
        {loyaltyPoints < 100 && (
          <p className="text-xs text-center text-gray-500">
            ต้องมีแต้มอย่างน้อย 100 แต้ม
          </p>
        )}
      </div>
    </div>
  );
}
