import {
  Crown,
  Flower2,
  Gift,
  House,
  LogOut,
  MapPin,
  Percent,
  ShoppingBag,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import Swal from "sweetalert2";
import { Badge } from "../ui/badge";
import "./dashboard.css";

interface DashboardNewProps {
  userPhone?: string;
  onLogout: () => void;
  onBackHome?: () => void;
  onGoShopping?: () => void;
}

interface NavbarProps {
  onLogout: () => void;
  onBackHome?: () => void;
}

interface ProfileBannerProps {
  profileImage?: string;
  profileData?: DashboardProfile;
}

interface DashboardProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  genderName?: string | null;
  dateOfBirth?: string | null;
  profileImageUrl?: string | null;
  loyaltyPoints?: number;
  memberSince?: string;
  memberLevel?: string;
  levelProgress?: {
    currentLevelName?: string;
    currentLevelMinSpending?: number;
    nextLevelName?: string | null;
    nextLevelMinSpending?: number | null;
    currentSpending?: number;
    spendingToNextLevel?: number;
    progressPercent?: number;
    isMaxLevel?: boolean;
  };
}

interface DashboardStats {
  totalOrders: number;
  completedOrders: number;
  totalSpending: number;
  averageOrderValue: number;
  totalPromoUsage: number;
  redeemedDiscount: number;
}

interface DashboardOrder {
  orderId: number;
  orderCode: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string | null;
  branchName: string;
  hasReview: boolean;
  items: {
    shoppingCartId: number;
    productName: string;
    productTypeName?: string | null;
    productImg?: string | null;
    qty: number;
    priceTotal: number;
    flowers?: string;
    fillerFlowerName?: string | null;
    wrappingName?: string | null;
    ribbonName?: string | null;
    ribbonColorName?: string | null;
    cardName?: string | null;
    cardMessage?: string | null;
    vaseName?: string | null;
    monetaryBouquetName?: string | null;
    foldingStyleName?: string | null;
    moneyAmount?: number | null;
  }[];
}

interface DashboardPromotion {
  id: string;
  code: string;
  label: string;
  date: string | null;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}

interface StatCardsProps {
  loyaltyPoints?: number;
  stats?: DashboardStats;
}

interface TabSwitcherProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onGoShopping?: () => void;
}

interface SimpleProfileTabProps {
  profile: DashboardProfile;
  onSaveProfile: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    genderName: string;
    dateOfBirth: string | null;
    profileImageUrl?: string | null;
  }) => Promise<void>;
  isSaving: boolean;
}

interface SimpleOrdersTabProps {
  orders: DashboardOrder[];
}

interface SimplePromotionsTabProps {
  promotions: DashboardPromotion[];
  redeemedDiscount: number;
}

const tabs = [
  { id: "profile", label: "ข้อมูลส่วนตัว" },
  { id: "overview", label: "ภาพรวม" },
  { id: "orders", label: "คำสั่งซื้อ" },
  { id: "promotions", label: "โปรโมชั่น" },
];

function NavbarNew({ onLogout, onBackHome }: NavbarProps) {
  return (
    <nav className="dashboard-navbar">
      <div className="navbar-logo">
        <Flower2 size={32} />
        <span>สายฟ้าดอกไม้สด</span>
      </div>
      <div className="navbar-actions">
        {onBackHome && (
          <button onClick={onBackHome} className="navbar-button">
            <House size={16} />
            กลับหน้าหลัก
          </button>
        )}
        <button onClick={onLogout} className="navbar-button">
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      </div>
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
    levelProgress,
  } = profileData;

  const fullName = `${firstName} ${lastName}`;
  const initial = firstName.charAt(0);
  const currentLevelName = levelProgress?.currentLevelName || memberLevel || '-';
  const nextLevelName = levelProgress?.nextLevelName || null;
  const currentSpending = Number(levelProgress?.currentSpending || 0);
  const nextLevelMinSpending = levelProgress?.nextLevelMinSpending ?? null;
  const progressPercentage = Number(levelProgress?.progressPercent || 0);
  const spendingToNext = Number(levelProgress?.spendingToNextLevel || 0);
  const isMaxLevel = Boolean(levelProgress?.isMaxLevel);

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
          <span>
            {isMaxLevel ? `${currentLevelName} (ระดับสูงสุด)` : `${currentLevelName} → ${nextLevelName || '-'}`}
          </span>
          <span>฿{currentSpending.toLocaleString()} / ฿{(nextLevelMinSpending ?? currentSpending).toLocaleString()}</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        <p className="progress-text">
          {isMaxLevel
            ? 'คุณอยู่ระดับสูงสุดแล้ว'
            : `ยอดสั่งซื้ออีก ฿${spendingToNext.toLocaleString()} เพื่อเลื่อนระดับ ${nextLevelName || '-'}`}
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

function StatCardsNew({ loyaltyPoints = 0, stats }: StatCardsProps) {
  const totalOrders = stats?.totalOrders ?? 0;
  const completedOrders = stats?.completedOrders ?? 0;
  const totalSpending = stats?.totalSpending ?? 0;
  const averageOrderValue = stats?.averageOrderValue ?? 0;
  const redeemedDiscount = stats?.redeemedDiscount ?? 0;

  return (
    <div className="stat-cards-grid">
      <StatCard
        icon={<ShoppingBag size={24} />}
        label="คำสั่งซื้อทั้งหมด"
        value={totalOrders.toLocaleString()}
        subtitle="นับเฉพาะคำสั่งซื้อสำเร็จ"
      />
      <StatCard
        icon={<Wallet size={24} />}
        label="ยอดใช้จ่ายทั้งหมด"
        value={`฿${totalSpending.toLocaleString()}`}
        subtitle={`เฉลี่ย ฿${Math.round(averageOrderValue).toLocaleString()}/คำสั่งซื้อ`}
      />
      <StatCard
        icon={<Percent size={24} />}
        label="ส่วนลดที่ได้รับ"
        value={`฿${redeemedDiscount.toLocaleString()}`}
        subtitle="ส่วนลดจากการใช้แต้ม"
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

function mapOrderStatusLabel(statusRaw: string) {
  const status = String(statusRaw || '').toLowerCase();
  if (status === 'waiting') return 'กำลังรอ';
  if (status === 'received') return 'รับคำสั่งซื้อ';
  if (status === 'preparing') return 'กำลังจัดเตรียม';
  if (status === 'shipping') return 'กำลังจัดส่ง';
  if (status === 'delivered') return 'จัดส่งสำเร็จ';
  if (status === 'success') return 'พร้อมรับสินค้า';
  if (status === 'cancelled' || status === 'canceled') return 'ยกเลิก';
  return statusRaw || '-';
}

function mapOrderStatusClassName(statusRaw: string) {
  const status = String(statusRaw || '').toLowerCase();
  if (status === 'waiting') return 'order-status-badge waiting';
  if (status === 'received') return 'order-status-badge received';
  if (status === 'preparing') return 'order-status-badge preparing';
  if (status === 'shipping') return 'order-status-badge shipping';
  if (status === 'delivered') return 'order-status-badge delivered';
  if (status === 'success') return 'order-status-badge success';
  if (status === 'cancelled' || status === 'canceled') return 'order-status-badge cancelled';
  return 'order-status-badge';
}

function getOrderItemDetailLines(item: DashboardOrder['items'][number]): string[] {
  const lines: string[] = [];

  if (item.flowers && item.flowers !== '-') {
    lines.push(`ดอกไม้หลัก: ${item.flowers}`);
  }
  if (item.fillerFlowerName) {
    lines.push(`ดอกแซม: ${item.fillerFlowerName}`);
  }
  if (item.vaseName) {
    lines.push(`ทรงแจกัน: ${item.vaseName}`);
  }
  if (item.wrappingName) {
    lines.push(`กระดาษห่อ: ${item.wrappingName}`);
  }
  if (item.ribbonName || item.ribbonColorName) {
    lines.push(`ริบบิ้น: ${[item.ribbonName, item.ribbonColorName].filter(Boolean).join(' ')}`);
  }
  if (item.cardName) {
    lines.push(`การ์ด: ${item.cardName}`);
  }
  if (item.cardMessage) {
    lines.push(`ข้อความการ์ด: "${item.cardMessage}"`);
  }
  if (item.monetaryBouquetName) {
    lines.push(`ธนบัตร: ${item.monetaryBouquetName}`);
  }
  if (item.moneyAmount) {
    lines.push(`จำนวนเงิน: ฿${Number(item.moneyAmount).toLocaleString()}`);
  }
  if (item.foldingStyleName) {
    lines.push(`วิธีพับ: ${item.foldingStyleName}`);
  }

  if (lines.length === 0) {
    lines.push('ไม่มีรายละเอียดเพิ่มเติม');
  }

  return lines;
}

function SimpleOrdersTabNew({ orders }: SimpleOrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'received' | 'preparing' | 'shipping' | 'delivered' | 'success' | 'cancelled'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'reviewed' | 'not-reviewed'>('all');
  const [activeRatingOrderCode, setActiveRatingOrderCode] = useState<string | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [productRating, setProductRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const openRatingForm = (orderCode: string) => {
    if (activeRatingOrderCode === orderCode) {
      closeRatingForm();
      return;
    }
    // Validate order status before opening form
    const order = filteredOrders.find(o => o.orderCode === orderCode);
    if (!order) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่พบคำสั่งซื้อ',
      });
      return;
    }
    const normalizedStatus = String(order.orderStatus || '').toLowerCase();
    const isReviewable = normalizedStatus === 'success' || normalizedStatus === 'delivered';
    if (!isReviewable) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถรีวิวได้',
        text: 'สามารถรีวิวได้เฉพาะคำสั่งซื้อที่มีสถานะ "พร้อมรับสินค้า" หรือ "จัดส่งสำเร็จ" เท่านั้น',
      });
      return;
    }
    setActiveRatingOrderCode(orderCode);
    setProductRating(5);
    setDeliveryRating(5);
    setRatingComment('');
  };

  const closeRatingForm = () => {
    setActiveRatingOrderCode(null);
    setProductRating(5);
    setDeliveryRating(5);
    setRatingComment('');
  };

  const submitRatingForm = async (orderCode: string) => {
    if (productRating < 1 || productRating > 5 || deliveryRating < 1 || deliveryRating > 5) {
      Swal.fire({
        icon: 'warning',
        title: 'คะแนนไม่ถูกต้อง',
        text: 'คะแนนต้องอยู่ระหว่าง 1 ถึง 5',
      });
      return;
    }

    // Find order_id from orderCode
    const order = filteredOrders.find(o => o.orderCode === orderCode);
    if (!order) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่พบคำสั่งซื้อ',
      });
      return;
    }

    setIsSubmittingRating(true);
    try {
      const response = await fetch('/api/customers/order-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.orderId,
          rating_product: productRating,
          rating_rider: deliveryRating,
          comment: ratingComment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: data.error || 'ไม่สามารถส่งคะแนนได้',
        });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'ส่งคะแนนเรียบร้อย',
        text: `คำสั่งซื้อ ${orderCode} | สินค้า ${productRating}/5${data.is_delivery ? ` | จัดส่ง ${deliveryRating}/5` : ''}${ratingComment.trim() ? ` | ความคิดเห็น: ${ratingComment.trim()}` : ''}`,
      });
      closeRatingForm();
    } catch (error) {
      console.error('❌ Rating submission error:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถส่งคะแนนได้ โปรดลองใหม่อีกครั้ง',
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const normalizedStatus = String(order.orderStatus || '').toLowerCase();
    
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'cancelled') {
        const isMatch = normalizedStatus === 'cancelled' || normalizedStatus === 'canceled';
        if (!isMatch) return false;
      } else {
        if (normalizedStatus !== statusFilter) return false;
      }
    }

    // Review filter
    if (reviewFilter === 'reviewed') {
      if (!order.hasReview) return false;
    } else if (reviewFilter === 'not-reviewed') {
      // Not reviewed AND status must be success or delivered
      if (order.hasReview) return false;
      const isReviewable = normalizedStatus === 'success' || normalizedStatus === 'delivered';
      if (!isReviewable) return false;
    }

    return true;
  });

  if (!orders.length) {
    return (
      <div className="orders-container">
        <div className="orders-icon">📦</div>
        <h3 className="orders-title">ยังไม่มีคำสั่งซื้อ</h3>
        <p className="orders-text">เริ่มสั่งซื้อดอกไม้สวยงามได้เลยตอนนี้</p>
      </div>
    );
  }

  return (
    <div className="tab-content-space">
      <div className="orders-filter-row">
        <label htmlFor="orderStatusFilter" className="orders-filter-label">สถานะ</label>
        <select
          id="orderStatusFilter"
          className="orders-filter-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | 'waiting' | 'received' | 'preparing' | 'shipping' | 'delivered' | 'success' | 'cancelled')}
        >
          <option value="all">ทั้งหมด</option>
          <option value="waiting">กำลังรอ</option>
          <option value="received">รับคำสั่งซื้อ</option>
          <option value="preparing">กำลังจัดเตรียม</option>
          <option value="shipping">กำลังจัดส่ง</option>
          <option value="delivered">จัดส่งสำเร็จ</option>
          <option value="success">พร้อมรับสินค้า</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
      </div>

      <div className="orders-filter-row">
        <label htmlFor="orderReviewFilter" className="orders-filter-label">สถานะรีวิว</label>
        <select
          id="orderReviewFilter"
          className="orders-filter-select"
          value={reviewFilter}
          onChange={(event) => setReviewFilter(event.target.value as 'all' | 'reviewed' | 'not-reviewed')}
        >
          <option value="all">ทั้งหมด</option>
          <option value="not-reviewed">ยังไม่ได้รีวิว</option>
          <option value="reviewed">รีวิวแล้ว</option>
        </select>
      </div>

      {!filteredOrders.length && (
        <div className="welcome-card">
          <p className="welcome-description">ไม่พบคำสั่งซื้อในสถานะที่เลือก</p>
        </div>
      )}

      {filteredOrders.map((order) => (
        <div key={order.orderCode} className="benefits-section">
          {(() => {
            const normalizedStatus = String(order.orderStatus || '').toLowerCase();
            const canRate = (normalizedStatus === 'delivered' || normalizedStatus === 'success') && !order.hasReview;
            const isRatingFormOpen = activeRatingOrderCode === order.orderCode;

            return (
              <>
          <div className="section-header" style={{ justifyContent: 'space-between' }}>
            <h3 className="section-title">{order.orderCode}</h3>
            <Badge className={mapOrderStatusClassName(order.orderStatus)} variant="default">
              {mapOrderStatusLabel(order.orderStatus)}
            </Badge>
          </div>
          <p className="section-description">สาขา: {order.branchName || '-'}</p>
          <p className="section-description">
            วันที่สั่งซื้อ: {order.createdAt ? new Date(order.createdAt).toLocaleString('th-TH') : '-'}
          </p>
          <div className="order-summary-row" style={{ marginTop: 8 }}>
            <p className="benefit-text">
              ยอดรวม: <b>฿{order.totalAmount.toLocaleString()}</b>
            </p>
            {canRate && (
              <button
                type="button"
                className="order-rate-button"
                onClick={() => openRatingForm(order.orderCode)}
              >
                {isRatingFormOpen ? 'ให้คะแนน' : 'ให้คะแนน'}
              </button>
            )}
          </div>

          {canRate && isRatingFormOpen && (
            <div className="rating-form-card">
              <h4 className="rating-form-title">ให้คะแนนคำสั่งซื้อ</h4>

              <div className="rating-form-row">
                <label htmlFor={`product-rating-${order.orderCode}`} className="rating-form-label">การให้คะแนนสินค้า</label>
                <select
                  id={`product-rating-${order.orderCode}`}
                  className="rating-form-select"
                  value={productRating}
                  onChange={(event) => setProductRating(Number(event.target.value))}
                >
                  <option value={5}>5 คะแนน</option>
                  <option value={4}>4 คะแนน</option>
                  <option value={3}>3 คะแนน</option>
                  <option value={2}>2 คะแนน</option>
                  <option value={1}>1 คะแนน</option>
                </select>
              </div>

              <div className="rating-form-row">
                <label htmlFor={`delivery-rating-${order.orderCode}`} className="rating-form-label">การให้คะแนนจัดส่ง</label>
                <select
                  id={`delivery-rating-${order.orderCode}`}
                  className="rating-form-select"
                  value={deliveryRating}
                  onChange={(event) => setDeliveryRating(Number(event.target.value))}
                >
                  <option value={5}>5 คะแนน</option>
                  <option value={4}>4 คะแนน</option>
                  <option value={3}>3 คะแนน</option>
                  <option value={2}>2 คะแนน</option>
                  <option value={1}>1 คะแนน</option>
                </select>
              </div>

              <div className="rating-form-row">
                <label htmlFor={`rating-comment-${order.orderCode}`} className="rating-form-label">Comment</label>
                <textarea
                  id={`rating-comment-${order.orderCode}`}
                  className="rating-form-textarea"
                  value={ratingComment}
                  onChange={(event) => setRatingComment(event.target.value)}
                  placeholder="เขียนความคิดเห็นเพิ่มเติม"
                  rows={3}
                />
              </div>

              <div className="rating-form-actions">
                <button
                  type="button"
                  className="rating-form-cancel"
                  onClick={closeRatingForm}
                  disabled={isSubmittingRating}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="rating-form-submit"
                  onClick={() => submitRatingForm(order.orderCode)}
                  disabled={isSubmittingRating}
                >
                  {isSubmittingRating ? 'กำลังส่ง...' : 'ส่งคะแนน'}
                </button>
              </div>
            </div>
          )}

          <div className="order-items-wrap">
            <p className="order-items-title">รายละเอียดสินค้า</p>
            {order.items.length ? (
              <ul className="order-items-list">
                {order.items.map((item, index) => (
                  <li key={item.shoppingCartId > 0 ? item.shoppingCartId : `${order.orderId}-${index}`} className="order-item-card">
                    <div className="order-item-row">
                      <p className="order-item-name">
                        {item.productTypeName ? `${item.productTypeName} (${item.productName})` : item.productName}
                      </p>
                      <span className="order-item-price">฿{item.priceTotal.toLocaleString()}</span>
                    </div>
                    <p className="order-item-qty">จำนวน: {item.qty.toLocaleString()}</p>
                    <div className="order-item-details">
                      {getOrderItemDetailLines(item).map((line, lineIndex) => (
                        <p key={`${order.orderId}-${index}-${lineIndex}`} className="order-item-detail-line">{line}</p>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="section-description">- ไม่พบรายละเอียดสินค้า -</p>
            )}
          </div>
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
}

function SimpleProfileTabNew({ profile, onSaveProfile, isSaving }: SimpleProfileTabProps) {
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

  const [firstName, setFirstName] = useState(profile.firstName || "-");
  const [lastName, setLastName] = useState(profile.lastName || "-");
  const [email, setEmail] = useState(profile.email || "");
  const [userPhone, setUserPhone] = useState(profile.phone || "-");
  const [gender, setGender] = useState("หญิง");
  const [birthDay, setBirthDay] = useState("15");
  const [birthMonth, setBirthMonth] = useState("มีนาคม");
  const [birthYear, setBirthYear] = useState("1995");
  const [avatarFileName, setAvatarFileName] = useState("");

  const years = Array.from({ length: 70 }, (_, i) => String(2025 - i));

  const toUiGender = (genderName?: string | null) => {
    if (genderName === 'ชาย') return 'ชาย';
    if (genderName === 'หญิง') return 'หญิง';
    return 'อื่น ๆ';
  };

  const parseDateParts = (dateRaw?: string | null) => {
    if (!dateRaw) return null;
    const dateOnly = String(dateRaw).slice(0, 10);
    const [year, month, day] = dateOnly.split('-');
    const monthIndex = Number(month) - 1;
    if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11 || !day) {
      return null;
    }
    return {
      year,
      monthName: months[monthIndex],
      day: String(Number(day)),
    };
  };

  useEffect(() => {
    setFirstName(profile.firstName || "-");
    setLastName(profile.lastName || "-");
    setEmail(profile.email || "");
    setUserPhone(profile.phone || "-");
    setGender(toUiGender(profile.genderName));
    const parsedDate = parseDateParts(profile.dateOfBirth);
    if (parsedDate) {
      setBirthDay(parsedDate.day);
      setBirthMonth(parsedDate.monthName);
      setBirthYear(parsedDate.year);
    }
  }, [profile]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    const monthNumber = months.indexOf(birthMonth) + 1;
    const dateOfBirth =
      monthNumber > 0
        ? `${birthYear}-${String(monthNumber).padStart(2, '0')}-${String(Number(birthDay)).padStart(2, '0')}`
        : null;

    try {
      await onSaveProfile({
        firstName: firstName.trim() || '-',
        lastName: lastName.trim() || '-',
        email: email.trim(),
        genderName: gender,
        dateOfBirth,
      });
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'บันทึกข้อมูลไม่สำเร็จ';
      await Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: message,
      });
    }
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
            readOnly
            aria-readonly="true"
            title="เบอร์มือถือไม่สามารถแก้ไขได้"
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

        <button type="submit" className="profile-save-button" disabled={isSaving}>
          {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
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

function SimplePromotionsTabNew({ promotions, redeemedDiscount }: SimplePromotionsTabProps) {
  if (!promotions.length) {
    return (
      <div className="promotions-container">
        <h3 className="promotions-title">โปรโมชั่นของคุณ</h3>
        <p className="promotions-text">ยังไม่มีประวัติการใช้โปรโมชั่น</p>
      </div>
    );
  }

  return (
    <div className="tab-content-space">
      <div className="welcome-card">
        <h3 className="welcome-title">สรุปส่วนลด</h3>
        <p className="welcome-description">ส่วนลดจากการใช้แต้มสะสมทั้งหมด ฿{redeemedDiscount.toLocaleString()}</p>
      </div>
      {promotions.map((promo) => (
        <div key={promo.id} className="benefits-section">
          <div className="section-header" style={{ justifyContent: 'space-between' }}>
            <h3 className="section-title">{promo.code}</h3>
            <Badge className="member-badge" variant="default">ใช้แล้ว</Badge>
          </div>
          <p className="section-description">{promo.label}</p>
          <p className="section-description">
            วันที่ใช้: {promo.date ? new Date(promo.date).toLocaleString('th-TH') : '-'}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DashboardNew({
  userPhone,
  onLogout,
  onBackHome,
  onGoShopping,
}: DashboardNewProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<DashboardProfile>({
    firstName: "สมาชิก",
    lastName: "Blossom",
    email: "member@blossomshop.com",
    phone: userPhone || "-",
    genderName: null,
    dateOfBirth: null,
    profileImageUrl: null,
    loyaltyPoints: 0,
    memberSince: "-",
    memberLevel: "-",
    levelProgress: {
      currentLevelName: '-',
      currentLevelMinSpending: 0,
      nextLevelName: null,
      nextLevelMinSpending: null,
      currentSpending: 0,
      spendingToNextLevel: 0,
      progressPercent: 0,
      isMaxLevel: false,
    },
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    completedOrders: 0,
    totalSpending: 0,
    averageOrderValue: 0,
    totalPromoUsage: 0,
    redeemedDiscount: 0,
  });
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [promotions, setPromotions] = useState<DashboardPromotion[]>([]);

  const API_BASE = (import.meta as any).env?.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

  useEffect(() => {
    if (!userPhone) {
      setErrorMessage('ไม่พบเบอร์โทรผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    const controller = new AbortController();

    const fetchDashboard = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const url = `${API_BASE ? `${API_BASE}/api/customers/dashboard` : '/api/customers/dashboard'}?phone=${encodeURIComponent(userPhone)}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard: ${response.status}`);
        }

        const data = await response.json();

        const fetchedProfile = data?.profile || {};
        const fetchedStats = data?.stats || {};
        const fetchedLevelProgress = fetchedProfile.level_progress || {};
        const totalSpending = Number(fetchedStats.total_spending || 0);

        setProfileData({
          firstName: fetchedProfile.first_name || '-',
          lastName: fetchedProfile.last_name || '-',
          email: fetchedProfile.email || '',
          phone: fetchedProfile.phone || userPhone,
          genderName: fetchedProfile.gender_name || null,
          dateOfBirth: fetchedProfile.date_of_birth || null,
          profileImageUrl: fetchedProfile.profile_image_url || null,
          loyaltyPoints: Number(fetchedProfile.loyalty_points || 0),
          memberSince: fetchedProfile.member_since
            ? new Date(fetchedProfile.member_since).toLocaleDateString('th-TH')
            : '-',
          memberLevel: fetchedProfile.member_level || '-',
          levelProgress: {
            currentLevelName: fetchedLevelProgress.current_level_name || fetchedProfile.member_level || '-',
            currentLevelMinSpending: Number(fetchedLevelProgress.current_level_min_spending || 0),
            nextLevelName: fetchedLevelProgress.next_level_name || null,
            nextLevelMinSpending:
              fetchedLevelProgress.next_level_min_spending !== null &&
              fetchedLevelProgress.next_level_min_spending !== undefined
                ? Number(fetchedLevelProgress.next_level_min_spending)
                : null,
            currentSpending: Number(fetchedLevelProgress.current_spending || fetchedStats.total_spending || 0),
            spendingToNextLevel: Number(fetchedLevelProgress.spending_to_next_level || 0),
            progressPercent: Number(fetchedLevelProgress.progress_percent || 0),
            isMaxLevel: Boolean(fetchedLevelProgress.is_max_level),
          },
        });

        setStats({
          totalOrders: Number(fetchedStats.completed_orders || 0),
          completedOrders: Number(fetchedStats.completed_orders || 0),
          totalSpending,
          averageOrderValue: Number(fetchedStats.average_order_value || 0),
          totalPromoUsage: Number(fetchedStats.total_promo_usage || 0),
          redeemedDiscount: Number(fetchedStats.redeemed_discount || 0),
        });

        setOrders(
          Array.isArray(data?.orders)
            ? data.orders.map((order: any) => ({
                orderId: Number(order.order_id || 0),
                orderCode: order.order_code || '-',
                orderStatus: order.order_status || '-',
                totalAmount: Number(order.total_amount || 0),
                createdAt: order.created_at || null,
                branchName: order.branch_name || '-',
                hasReview: Boolean(order.has_review || false),
                items: Array.isArray(order.items)
                  ? order.items.map((item: any) => ({
                      shoppingCartId: Number(item.shopping_cart_id || 0),
                      productName: item.product_name || '-',
                      productTypeName: item.product_type_name || null,
                      productImg: item.product_img || null,
                      qty: Number(item.qty || 0),
                      priceTotal: Number(item.price_total || 0),
                      flowers: item.flowers || '-',
                      fillerFlowerName: item.filler_flower_name || null,
                      wrappingName: item.wrapping_name || null,
                      ribbonName: item.ribbon_name || null,
                      ribbonColorName: item.ribbon_color_name || null,
                      cardName: item.card_name || null,
                      cardMessage: item.card_message || null,
                      vaseName: item.vase_name || null,
                      monetaryBouquetName: item.monetary_bouquet_name || null,
                      foldingStyleName: item.folding_style_name || null,
                      moneyAmount: item.money_amount ? Number(item.money_amount) : null,
                    }))
                  : [],
              }))
            : []
        );

        setPromotions(
          Array.isArray(data?.promotions)
            ? data.promotions.map((promo: any) => ({
                id: promo.id || String(Math.random()),
                code: promo.code || '-',
                label: promo.label || 'โปรโมชั่น',
                date: promo.date || null,
              }))
            : []
        );
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('Failed to load dashboard', error);
        setErrorMessage('ไม่สามารถโหลดข้อมูล Dashboard ได้');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      controller.abort();
    };
  }, [API_BASE, userPhone]);

  const handleSaveProfile = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    genderName: string;
    dateOfBirth: string | null;
    profileImageUrl?: string | null;
  }) => {
    if (!userPhone) {
      throw new Error('ไม่พบเบอร์โทรผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
    }

    setIsProfileSaving(true);
    try {
      const url = `${API_BASE ? `${API_BASE}/api/customers/profile` : '/api/customers/profile'}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: userPhone,
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          gender_name: payload.genderName,
          date_of_birth: payload.dateOfBirth,
          profile_image_url: payload.profileImageUrl || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'บันทึกข้อมูลไม่สำเร็จ');
      }

      const updated = await response.json();
      setProfileData((prev) => ({
        ...prev,
        firstName: updated.customer_name || prev.firstName || '-',
        lastName: updated.customer_surname || prev.lastName || '-',
        email: updated.email || '',
        phone: updated.phone || prev.phone || userPhone,
        genderName: updated.gender_name || null,
        dateOfBirth: updated.date_of_birth || null,
        profileImageUrl: updated.profile_image_url || null,
      }));
    } finally {
      setIsProfileSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <SimpleProfileTabNew profile={profileData} onSaveProfile={handleSaveProfile} isSaving={isProfileSaving} />;
      case "orders":
        return <SimpleOrdersTabNew orders={orders} />;
      case "promotions":
        return <SimplePromotionsTabNew promotions={promotions} redeemedDiscount={stats.redeemedDiscount} />;
      case "overview":
      default:
        return <SimpleOverviewTabNew />;
    }
  };

  return (
    <div className="dashboard-container">
      <NavbarNew onLogout={onLogout} onBackHome={onBackHome} />

      <div className="dashboard-wrapper">
        {/* Profile Header */}
        <ProfileBannerNew profileData={profileData} />

        {/* KPI Cards */}
        <StatCardsNew loyaltyPoints={Number(profileData.loyaltyPoints || 0)} stats={stats} />

        {isLoading && (
          <div className="welcome-card">
            <p className="welcome-description">กำลังโหลดข้อมูล Dashboard...</p>
          </div>
        )}

        {errorMessage && (
          <div className="welcome-card">
            <p className="welcome-description">{errorMessage}</p>
          </div>
        )}

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
