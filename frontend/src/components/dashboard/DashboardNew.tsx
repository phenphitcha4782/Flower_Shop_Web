import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Crown,
  Flower2,
  Gift,
  LogOut,
  MapPin,
  Percent,
  ShoppingBag,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { Badge } from "../ui/badge";
import "./dashboard.css";

interface DashboardNewProps {
  userPhone?: string;
  onLogout: () => void;
  onGoShopping?: () => void;
}

interface NavbarProps {
  onLogout: () => void;
}

interface ProfileBannerProps {
  profileImage?: string;
  profileData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    memberSince?: string;
    memberLevel?: string;
    currentSpending?: number;
    nextLevelSpending?: number;
  };
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}

interface StatCardsProps {
  loyaltyPoints?: number;
}

interface TabSwitcherProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onGoShopping?: () => void;
}

interface SimpleProfileTabProps {
  phone?: string;
}

const tabs = [
  { id: "profile", label: "ข้อมูลส่วนตัว" },
  { id: "overview", label: "ภาพรวม" },
  { id: "orders", label: "คำสั่งซื้อ" },
  { id: "promotions", label: "โปรโมชั่น" },
];

function NavbarNew({ onLogout }: NavbarProps) {
  return (
    <nav className="dashboard-navbar">
      <div className="navbar-logo">
        <Flower2 size={32} />
        <span>สายฟ้าดอกไม้สด</span>
      </div>
      <button onClick={onLogout} className="navbar-button">
        <LogOut size={16} />
        ออกจากระบบ
      </button>
    </nav>
  );
}

function ProfileBannerNew({
  profileImage: _profileImage = "/avatar.png",
  profileData = {},
}: ProfileBannerProps) {
  const {
    firstName = "สมาชิก",
    lastName = "Blossom",
    email = "member@blossomshop.com",
    phone = "099-999-9999",
    memberSince = "15 มีนาคม 2024",
    memberLevel = "Gold Member",
    currentSpending = 12500,
    nextLevelSpending = 20000,
  } = profileData;

  const fullName = `${firstName} ${lastName}`;
  const initial = firstName.charAt(0);
  const progressPercentage = (currentSpending / nextLevelSpending) * 100;
  const remainingAmount = nextLevelSpending - currentSpending;

  return (
    <div className="profile-banner">
      <div className="profile-header">
        <div className="profile-avatar">{initial}</div>

        <div className="profile-info">
          <div className="profile-name">
            <h2 className="profile-name-text">{fullName}</h2>
            <Badge className="member-badge" variant="default">
              {memberLevel}
            </Badge>
          </div>

          <div className="profile-details">
            <p>{email}</p>
            <p>โทร: {phone}</p>
            <p>สมาชิกตั้งแต่: {memberSince}</p>
          </div>
        </div>
      </div>

      <div className="profile-progress">
        <div className="progress-label">
          <span>Gold → Platinum</span>
          <span>
            {currentSpending.toLocaleString()} / {nextLevelSpending.toLocaleString()} บาท
          </span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        <p className="progress-text">
          ใช้จ่ายอีก {remainingAmount.toLocaleString()} บาท เพื่อเลื่อนระดับ Platinum
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatCardsNew({ loyaltyPoints = 1250 }: StatCardsProps) {
  return (
    <div className="stat-cards-grid">
      <StatCard
        icon={<ShoppingBag size={24} />}
        label="คำสั่งซื้อทั้งหมด"
        value="18"
        subtitle="สำเร็จแล้ว 16 รายการ"
      />
      <StatCard
        icon={<Wallet size={24} />}
        label="ยอดใช้จ่ายทั้งหมด"
        value="฿12,500"
        subtitle="เฉลี่ย ฿694/คำสั่งซื้อ"
      />
      <StatCard
        icon={<Percent size={24} />}
        label="ส่วนลดที่ได้รับ"
        value="฿2,845"
        subtitle="ประหยัด 18.5%"
      />
      <StatCard
        icon={<MapPin size={24} />}
        label="แต้มสะสม"
        value={`${loyaltyPoints.toLocaleString()} แต้ม`}
      />
    </div>
  );
}

function TabSwitcherNew({
  activeTab,
  onTabChange,
  onGoShopping: _onGoShopping,
}: TabSwitcherProps) {
  return (
    <div className="tab-switcher">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`tab-button ${activeTab === tab.id ? "active" : "inactive"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SimpleOverviewTabNew() {
  return (
    <div className="tab-content-space">
      <div className="benefits-section">
        <div className="section-header">
          <Crown className="section-icon" size={20} />
          <h3 className="section-title">สิทธิพิเศษสำหรับสมาชิก</h3>
        </div>

        <p className="section-description">
          สิทธิ์พิเศษสำหรับสมาชิกระดับ Gold ของ Blossom Shop
        </p>

        <div className="benefits-list">
          <div className="benefit-item">
            <div className="benefit-icon">
              <Truck size={16} />
            </div>
            <p className="benefit-text">
              จัดส่งฟรี เมื่อสั่งซื้อครบ <b>฿500</b>
            </p>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">
              <Gift size={16} />
            </div>
            <p className="benefit-text">การ์ดเขียนมือพรีเมียมฟรี</p>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">
              <Zap size={16} />
            </div>
            <p className="benefit-text">สิทธิ์จัดดอกไม้ด่วน (Priority Slot)</p>
          </div>
        </div>
      </div>

      <div className="welcome-card">
        <h3 className="welcome-title">ยินดีต้อนรับสู่ Blossom Shop</h3>
        <p className="welcome-description">
          สำรวจสินค้าและจัดดอกไม้สวยงามได้เลยตอนนี้
        </p>
      </div>
    </div>
  );
}

function SimpleOrdersTabNew() {
  return (
    <div className="orders-container">
      <div className="orders-icon">📦</div>
      <h3 className="orders-title">ยังไม่มีคำสั่งซื้อ</h3>
      <p className="orders-text">เริ่มสั่งซื้อดอกไม้สวยงามได้เลยตอนนี้</p>
    </div>
  );
}

function SimpleProfileTabNew({ phone }: SimpleProfileTabProps) {
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const [firstName, setFirstName] = useState("สุภาพร");
  const [lastName, setLastName] = useState("วิชิตดิษฐ์");
  const [email, setEmail] = useState("suphaporn.w@email.com");
  const [userPhone, setUserPhone] = useState(phone || "099-999-9999");
  const [gender, setGender] = useState("หญิง");
  const [birthDay, setBirthDay] = useState("15");
  const [birthMonth, setBirthMonth] = useState("มีนาคม");
  const [birthYear, setBirthYear] = useState("1995");
  const [avatarFileName, setAvatarFileName] = useState("");

  const years = Array.from({ length: 70 }, (_, i) => String(2025 - i));

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    alert("บันทึกข้อมูลเรียบร้อยแล้ว");
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFileName(file.name);
  };

  return (
    <form className="profile-edit-form" onSubmit={handleSave}>
      <div className="profile-edit-main">
        <h2 className="profile-edit-title">ข้อมูลของฉัน</h2>
        <p className="profile-edit-subtitle">
          จัดการข้อมูลส่วนตัวของคุณเพื่อความปลอดภัยของบัญชีผู้ใช้นี้ <span className="required-text">* จำเป็นต้องกรอก</span>
        </p>

        <div className="profile-field-group">
          <label htmlFor="firstName" className="profile-field-label">ชื่อ</label>
          <input
            id="firstName"
            className="profile-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="profile-field-group">
          <label htmlFor="lastName" className="profile-field-label">นามสกุล</label>
          <input
            id="lastName"
            className="profile-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="profile-field-group">
          <label htmlFor="email" className="profile-field-label">อีเมล</label>
          <input
            id="email"
            type="email"
            className="profile-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="profile-field-group">
          <label htmlFor="phone" className="profile-field-label">หมายเลขโทรศัพท์ <span className="required-text">*</span></label>
          <input
            id="phone"
            className="profile-input"
            value={userPhone}
            onChange={(e) => setUserPhone(e.target.value)}
          />
        </div>

        <div className="profile-field-group">
          <span className="profile-field-label">เพศ</span>
          <div className="profile-radio-row">
            <label className="profile-radio-item">
              <input
                type="radio"
                value="ชาย"
                checked={gender === "ชาย"}
                onChange={(e) => setGender(e.target.value)}
              />
              ชาย
            </label>
            <label className="profile-radio-item">
              <input
                type="radio"
                value="หญิง"
                checked={gender === "หญิง"}
                onChange={(e) => setGender(e.target.value)}
              />
              หญิง
            </label>
            <label className="profile-radio-item">
              <input
                type="radio"
                value="อื่น ๆ"
                checked={gender === "อื่น ๆ"}
                onChange={(e) => setGender(e.target.value)}
              />
              อื่น ๆ
            </label>
          </div>
        </div>

        <div className="profile-field-group">
          <span className="profile-field-label">วัน/เดือน/ปี เกิด</span>
          <div className="profile-birth-row">
            <select className="profile-select" value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
              {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>

            <select className="profile-select profile-select-month" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>

            <select className="profile-select" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="profile-save-button">บันทึก</button>
      </div>

      <div className="profile-avatar-side">
        <div className="profile-avatar-circle" />
        <label className="profile-upload-button">
          เลือกรูป
          <input type="file" accept="image/*" className="hidden-file-input" onChange={handleFileSelect} />
        </label>
        <p className="profile-upload-hint">ขนาดไฟล์: สูงสุด 1 MB</p>
        {avatarFileName && <p className="profile-upload-file">ไฟล์ล่าสุด: {avatarFileName}</p>}
      </div>
    </form>
  );
}

function SimplePromotionsTabNew() {
  return (
    <div className="promotions-container">
      <h3 className="promotions-title">โปรโมชั่นของคุณ</h3>
      <p className="promotions-text">ยังไม่มีโปรโมชั่นที่ใช้งานได้ในขณะนี้</p>
    </div>
  );
}

export function DashboardNew({
  userPhone,
  onLogout,
  onGoShopping,
}: DashboardNewProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [loyaltyPoints] = useState(1250);

  useEffect(() => {
    console.log("DashboardNew mounted with phone:", userPhone);
  }, [userPhone]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <SimpleProfileTabNew phone={userPhone} />;
      case "orders":
        return <SimpleOrdersTabNew />;
      case "promotions":
        return <SimplePromotionsTabNew />;
      case "overview":
      default:
        return <SimpleOverviewTabNew />;
    }
  };

  return (
    <div className="dashboard-container">
      <NavbarNew onLogout={onLogout} />

      <div className="dashboard-wrapper">
        {/* Profile Header */}
        <ProfileBannerNew
          profileData={{
            firstName: "สมาชิก",
            lastName: "Blossom",
            email: "member@blossomshop.com",
            phone: userPhone || "099-999-9999",
            memberSince: "15 มีนาคม 2024",
            memberLevel: "Gold Member",
            currentSpending: 12500,
            nextLevelSpending: 20000,
          }}
        />

        {/* KPI Cards */}
        <StatCardsNew loyaltyPoints={loyaltyPoints} />

        {/* Main Content */}
        <div className={`dashboard-content ${activeTab === "profile" ? "dashboard-content-profile" : ""}`}>
          <TabSwitcherNew
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onGoShopping={onGoShopping}
          />

          <div className={`content-panel ${activeTab === "profile" ? "content-panel-profile" : ""}`}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
