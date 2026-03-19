import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { ProfileBanner } from "./components/ProfileBanner";
import { StatCards } from "./components/StatCards";
import { TabSwitcher } from "./components/TabSwitcher";
import { OverviewTab } from "./components/OverviewTab";
import { OrdersTab } from "./components/OrdersTab";
import { ProfileTab } from "./components/ProfileTab";
import { PromotionsTab } from "./components/PromotionsTab";

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [profileImage, setProfileImage] =
    useState("/avatar.png");
  const [loyaltyPoints, setLoyaltyPoints] = useState(1250);
  const [profileData, setProfileData] = useState({
    firstName: "สุภาพร",
    lastName: "วิชัยดิษฐ์",
    email: "suphaporn.w@email.com",
    phone: "099-999-9999",
    gender: "female",
    birthDay: "15",
    birthMonth: "มีนาคม",
    birthYear: "1995",
    memberSince: "15 มีนาคม 2024",
    memberLevel: "Gold Member",
    currentSpending: 12500,
    nextLevelSpending: 20000,
  });
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileTab
            profileImage={profileImage}
            setProfileImage={setProfileImage}
            profileData={profileData}
            setProfileData={setProfileData}
          />
        );

      case "overview":
        return <OverviewTab loyaltyPoints={loyaltyPoints} setLoyaltyPoints={setLoyaltyPoints} />;

      case "orders":
        return <OrdersTab />;

      case "promotions":
        return <PromotionsTab />;

      default:
        return <OverviewTab loyaltyPoints={loyaltyPoints} setLoyaltyPoints={setLoyaltyPoints} />;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F0F5FF]"
      style={{ fontFamily: "Sarabun, sans-serif" }}
    >
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Profile Header */}
        <ProfileBanner profileImage={profileImage} profileData={profileData} />

        {/* KPI Cards */}
        <StatCards loyaltyPoints={loyaltyPoints} />

        {/* Main Content */}
        <div className="flex gap-6 items-start">
          <TabSwitcher
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="flex-1">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}