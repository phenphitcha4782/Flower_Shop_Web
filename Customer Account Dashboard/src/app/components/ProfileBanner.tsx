import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

interface ProfileBannerProps {
  profileImage: string;
  profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    memberSince: string;
    memberLevel: string;
    currentSpending: number;
    nextLevelSpending: number;
  };
}

export function ProfileBanner({
  profileImage,
  profileData,
}: ProfileBannerProps) {
  const fullName = `${profileData.firstName} ${profileData.lastName}`;
  const initial = profileData.firstName.charAt(0);
  const progressPercentage = (profileData.currentSpending / profileData.nextLevelSpending) * 100;
  const remainingAmount = profileData.nextLevelSpending - profileData.currentSpending;

  return (
    <div className="bg-[#3D6FEB] text-white px-6 py-8 rounded-xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex gap-4 items-start">
            <Avatar className="w-20 h-20 border-4 border-white">
              <AvatarImage src={profileImage} />
              <AvatarFallback className="text-2xl bg-white text-[#3D6FEB]">
                {initial}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-semibold">
                  {fullName}
                </h2>

                <Badge className="bg-amber-500 text-white border-0 hover:bg-amber-600">
                  {profileData.memberLevel}
                </Badge>
              </div>

              <p className="text-white/90 text-sm">
                {profileData.email}
              </p>

              <p className="text-white/90 text-sm">
                โทร: {profileData.phone}
              </p>

              <p className="text-white/80 text-xs mt-1">
                สมาชิกตั้งแต่: {profileData.memberSince}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex-1 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Gold → Platinum
              </span>
              <span className="text-sm font-semibold">
                {profileData.currentSpending.toLocaleString()} / {profileData.nextLevelSpending.toLocaleString()} บาท
              </span>
            </div>

            <Progress
              value={progressPercentage}
              className="h-2 bg-white/20"
            />

            <p className="text-xs text-white/80 mt-1">
              ใช้จ่ายอีก {remainingAmount.toLocaleString()} บาท เพื่อเลื่อนระดับ Platinum
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}