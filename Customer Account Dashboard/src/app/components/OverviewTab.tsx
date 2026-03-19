import { useState } from "react";
import {
  Eye,
  Flower,
  Calendar,
  Heart,
  Crown,
  Gift,
  Truck,
  Zap,
  X,
  Check,
} from "lucide-react";

import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { LoyaltyPointsCard } from "./LoyaltyPointsCard";

interface OverviewTabProps {
  loyaltyPoints: number;
  setLoyaltyPoints: (points: number) => void;
}

export function OverviewTab({ loyaltyPoints, setLoyaltyPoints }: OverviewTabProps) {
  const [showRedeem, setShowRedeem] = useState(false);
  const [selectedReward, setSelectedReward] = useState<number | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const rewardOptions = [
    { points: 100, discount: 10 },
    { points: 500, discount: 60 },
    { points: 1000, discount: 150 },
    { points: 2000, discount: 350 },
  ];

  const handleRedeemClick = () => {
    setShowRedeem(true);
    setRedeemSuccess(false);
    setSelectedReward(null);
  };

  const handleConfirmRedeem = () => {
    if (selectedReward !== null) {
      const reward = rewardOptions[selectedReward];
      if (loyaltyPoints >= reward.points) {
        setLoyaltyPoints(loyaltyPoints - reward.points);
        setRedeemSuccess(true);
        setTimeout(() => {
          setShowRedeem(false);
          setRedeemSuccess(false);
          setSelectedReward(null);
        }, 2000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loyalty Points Section */}
        <div className="space-y-4">
          <LoyaltyPointsCard 
            loyaltyPoints={loyaltyPoints}
            onRedeem={handleRedeemClick}
          />
        </div>

        {/* Member Benefits */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#3D6FEB]" />
            <h3 className="text-lg font-semibold text-gray-900">
              สิทธิพิเศษสำหรับสมาชิก
            </h3>
          </div>

          <p className="text-sm text-gray-500">
            สิทธิ์พิเศษสำหรับสมาชิกระดับ Gold ของ Blossom Shop
          </p>

          {/* Benefits */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="bg-[#F0F5FF] p-2 rounded-lg">
                <Truck className="w-4 h-4 text-[#3D6FEB]" />
              </div>
              <p className="text-sm text-gray-700">
                จัดส่งฟรี เมื่อสั่งซื้อครบ <b>฿500</b>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-[#F0F5FF] p-2 rounded-lg">
                <Gift className="w-4 h-4 text-[#3D6FEB]" />
              </div>
              <p className="text-sm text-gray-700">
                การ์ดเขียนมือพรีเมียมฟรี
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-[#F0F5FF] p-2 rounded-lg">
                <Zap className="w-4 h-4 text-[#3D6FEB]" />
              </div>
              <p className="text-sm text-gray-700">
                สิทธิ์จัดดอกไม้ด่วน (Priority Slot)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      {showRedeem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full">
            {!redeemSuccess ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">แลกแต้มสะสม</h3>
                  <button
                    onClick={() => setShowRedeem(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  คุณมี {loyaltyPoints.toLocaleString()} แต้ม
                </p>

                <div className="space-y-3 mb-6">
                  {rewardOptions.map((reward, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedReward(index)}
                      disabled={loyaltyPoints < reward.points}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        selectedReward === index
                          ? "border-[#3D6FEB] bg-[#EEF3FF]"
                          : "border-gray-200 bg-white hover:border-[#3D6FEB]/50"
                      } ${
                        loyaltyPoints < reward.points
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#3D6FEB] text-white rounded-full w-12 h-12 flex items-center justify-center font-semibold">
                            {reward.points}
                          </div>
                          <span className="text-sm text-gray-700">แต้ม</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-[#3D6FEB]">
                            ฿{reward.discount}
                          </span>
                          <span className="text-sm text-gray-700">ส่วนลด</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowRedeem(false)}
                    className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleConfirmRedeem}
                    disabled={selectedReward === null}
                    className="flex-1 bg-[#3D6FEB] hover:bg-[#2D5FDB] text-white disabled:opacity-50"
                  >
                    แลกเลย
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  แลกแต้มสำเร็จ!
                </h3>
                <p className="text-sm text-gray-600">
                  คูปองส่วนลดได้ถูกส่งไปที่โปรโมชั่นของคุณแล้ว
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}