import { Clock, DollarSign, Filter, LogOut, Package, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Manager {
  name: string;
  surname: string;
  branch_id: number;
}

interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  in_progress_orders: number;
  available_products: number;
}

interface FrontTopProduct {
  name: string;
  sales: number;
  revenue: string;
  productType?: string;
}

interface RecentOrderRow {
  id: string;
  customer: string;
  memberLevel: string;
  amount: string;
  status: string;
  time: string;
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [manager, setManager] = useState<Manager | null>(null);
  const [branchName, setBranchName] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    total_revenue: 0,
    total_orders: 0,
    in_progress_orders: 0,
    available_products: 0
  });
  
  // Filter states
  const [dateRange, setDateRange] = useState('custom');
  const [productType, setProductType] = useState('all');
  const [memberLevelFilter, setMemberLevelFilter] = useState('all');
  const [productTypes, setProductTypes] = useState<{ product_type_id: number; product_type_name: string }[]>([]);

  const getDateRangeParam = (value: string) => {
    if (value === 'today') return 'today';
    if (value === 'yesterday') return 'yesterday';
    if (value === 'this-week') return 'week';
    if (value === 'this-month') return 'month';
    if (value === 'this-year') return 'year';
    return '';
  };

  const normalizeMemberLevel = (memberLevelName?: string, memberLevelId?: number) => {
    if (memberLevelName) return memberLevelName;
    if (memberLevelId === 2) return 'Silver';
    if (memberLevelId === 3) return 'Gold';
    if (memberLevelId === 4) return 'Platinum';
    return 'Member';
  };

  const getMemberLevelBadgeClass = (memberLevelRaw?: string) => {
    const memberLevel = String(memberLevelRaw || '').toLowerCase();
    if (memberLevel === 'platinum') return 'bg-violet-100 text-violet-800';
    if (memberLevel === 'gold') return 'bg-amber-100 text-amber-800';
    if (memberLevel === 'silver') return 'bg-slate-200 text-slate-700';
    return 'bg-emerald-100 text-emerald-800';
  };

  const mapOrderStatusLabel = (statusRaw?: string) => {
    const status = String(statusRaw || '').toLowerCase();
    if (status === 'waiting') return 'กำลังรอ';
    if (status === 'received') return 'รับคำสั่งซื้อ';
    if (status === 'preparing') return 'กำลังจัดเตรียม';
    if (status === 'shipping') return 'กำลังจัดส่ง';
    if (status === 'success') return 'พร้อมรับสินค้า';
    if (status === 'delivered') return 'จัดส่งสำเร็จ';
    if (status === 'cancelled' || status === 'canceled') return 'ยกเลิก';
    return statusRaw || '-';
  };

  const getOrderStatusBadgeClass = (statusRaw?: string) => {
    const status = String(statusRaw || '').toLowerCase();
    if (status === 'waiting') return 'bg-yellow-100 text-yellow-800';
    if (status === 'received') return 'bg-green-100 text-green-800';
    if (status === 'preparing') return 'bg-indigo-100 text-indigo-800';
    if (status === 'shipping') return 'bg-blue-100 text-blue-800';
    if (status === 'success') return 'bg-green-100 text-green-800';
    if (status === 'delivered') return 'bg-green-100 text-green-800';
    if (status === 'cancelled' || status === 'canceled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Load manager data and branch name
  useEffect(() => {
    const managerName = localStorage.getItem('manager_name') || '';
    const branchId = localStorage.getItem('branch_id');

    if (managerName && branchId) {
      const [name, surname] = managerName.split(' ');
      setManager({
        name,
        surname,
        branch_id: Number(branchId)
      });

      // Fetch branch name
      fetch('http://localhost:3000/api/branches')
        .then(res => res.json())
        .then((branches: any[]) => {
          const branch = branches.find(b => b.branch_id === Number(branchId));
          if (branch) {
            setBranchName(branch.branch_name);
          }
        })
        .catch(err => console.error('Failed to load branches:', err));

      // Fetch dashboard stats
      fetch(`http://localhost:3000/api/manager/dashboard-stats/${branchId}`)
        .then(res => res.json())
        .then((data: DashboardStats) => {
          setStats(data);
        })
        .catch(err => console.error('Failed to load dashboard stats:', err));
      // Fetch recent orders for branch
      fetch(`http://localhost:3000/api/order/branches/${branchId}`)
        .then(res => res.json())
        .then((rows: any[]) => {
          const mapped = rows.slice(0, 10).map(r => ({
            id: r.order_code || String(r.order_id),
            customer: r.customer_name || '',
            memberLevel: normalizeMemberLevel(r.member_level_name, Number(r.member_level_id || 0)),
            amount: `฿${Number(r.total_amount || 0).toLocaleString()}`,
            status: r.order_status || '',
            time: timeAgo(r.created_at || r.createdAt || new Date())
          }));
          setRecentOrders(mapped);
        })
        .catch(err => console.error('Failed to load recent orders:', err));
      // Fetch product types
      fetch('http://localhost:3000/api/product-types')
        .then(res => res.json())
        .then((rows: any[]) => {
          setProductTypes(rows);
        })
        .catch(err => console.error('Failed to load product types:', err));
    }
  }, []);

  // Fetch stats when dateRange or productType changes
  useEffect(() => {
    const branchId = localStorage.getItem('branch_id');
    if (branchId) {
      const dateRangeParam = getDateRangeParam(dateRange);

      let url = `http://localhost:3000/api/manager/dashboard-stats/${branchId}`;
      const params = [];
      if (dateRangeParam) params.push(`date_range=${dateRangeParam}`);
      if (productType && productType !== 'all') params.push(`product_type_id=${productType}`);
      
      if (params.length) url += '?' + params.join('&');

      fetch(url)
        .then(res => res.json())
        .then((data: DashboardStats) => {
          setStats(data);
        })
        .catch(err => console.error('Failed to load dashboard stats:', err));
    }
  }, [dateRange, productType]);

  // Fetch weekly sales when filters change
  useEffect(() => {
    const branchId = localStorage.getItem('branch_id');
    if (branchId) {
      const dateRangeParam = getDateRangeParam(dateRange);

      let url = `http://localhost:3000/api/manager/weekly-sales/${branchId}`;
      const params = [];
      if (dateRangeParam) params.push(`date_range=${dateRangeParam}`);
      if (productType && productType !== 'all') params.push(`product_type_id=${productType}`);
      if (params.length) url += '?' + params.join('&');

      fetch(url)
        .then(res => res.json())
        .then((rows: { date: string; sales: number }[]) => {
          const mapped = rows.map(r => ({ day: thaiWeekday(r.date), sales: Number(r.sales) }));
          setWeeklySales(mapped);
        })
        .catch(err => console.error('Failed to load weekly sales:', err));
    }
  }, [dateRange, productType]);

  // Fetch top products when dateRange or productType changes
  useEffect(() => {
    const branchId = localStorage.getItem('branch_id');
    if (branchId) {
      const dateRangeParam = getDateRangeParam(dateRange);

      let url = `http://localhost:3000/api/manager/top-products/${branchId}`;
      const params = [];
      if (dateRangeParam) params.push(`date_range=${dateRangeParam}`);
      if (productType && productType !== 'all') params.push(`product_type_id=${productType}`);
      
      if (params.length) url += '?' + params.join('&');

      fetch(url)
        .then(res => res.json())
        .then((rows: any[]) => {
          const mapped = rows.map(r => ({
            name: r.product_name,
            sales: Number(r.qty_sold || r.sales || 0),
            revenue: `฿${Number(r.revenue || 0).toLocaleString()}`,
            productType: r.product_type || r.product_type_name || ''
          }));
          setTopProducts(mapped);
        })
        .catch(err => console.error('Failed to load top products:', err));
    }
  }, [dateRange, productType]);

  const statsArray = [
    { label: 'ยอดขายรวม', value: `฿${stats.total_revenue.toLocaleString()}`, color: 'bg-blue-500', icon: DollarSign },
    { label: 'คำสั่งซื้อรวม', value: String(stats.total_orders), color: 'bg-green-500', icon: ShoppingBag },
    { label: 'คำสั่งซื้อที่ดำเนินการ', value: String(stats.in_progress_orders), color: 'bg-yellow-500', icon: Clock },
    { label: 'สินค้าที่ขายอยู่', value: String(stats.available_products), color: 'bg-purple-500', icon: Package }
  ];

  // weekly sales from backend (date string -> sales)
  const [weeklySales, setWeeklySales] = useState<{ day: string; sales: number }[]>([]);
  const [topProducts, setTopProducts] = useState<FrontTopProduct[]>([]);

  const thaiWeekday = (isoDate: string) => {
    const d = new Date(isoDate + 'T00:00:00');
    const map = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    return map[d.getDay()];
  };

  const timeAgo = (dateInput: string | Date) => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    if (min < 1) return 'เมื่อสักครู่';
    if (min < 60) return `${min} นาทีที่แล้ว`;
    if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
    return d.toLocaleDateString();
  };

  const demoTopProducts = [
    { name: 'ช่อกุหลาบสีชมพู', sales: 45, revenue: '฿2,025', productType: 'ช่อดอกไม้' },
    { name: 'ช่อทานตะวัน', sales: 38, revenue: '฿1,444', productType: 'ช่อดอกไม้' },
    { name: 'ช่อทิวลิป', sales: 32, revenue: '฿1,344', productType: 'ช่อดอกไม้' },
    { name: 'กล้วยไม้สีขาว', sales: 28, revenue: '฿1,540', productType: 'แจกัน' }
  ];

  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);

  const filteredRecentOrders = recentOrders.filter((order) => {
    if (memberLevelFilter === 'all') return true;
    return String(order.memberLevel || '').toLowerCase() === String(memberLevelFilter).toLowerCase();
  });

  const clearAllFilters = () => {
    setDateRange('custom');
    setProductType('all');
    setMemberLevelFilter('all');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">Branch Manager Dashboard</h1>
              <p className="text-sm text-gray-600">
                สาขา: {branchName || 'กำลังโหลด...'} {manager && `| ผู้จัดการ: ${manager.name} ${manager.surname}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-500 text-white' : 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>ฟิลเตอร์</span>
              </button>
              <button
                onClick={() => navigate('/manager/promotions')}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                โปรโมชั่น
              </button>
              <button
                onClick={() => navigate('/manager/products')}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                จัดการสินค้า
              </button>
              <button
                onClick={() => navigate('/manager/employees')}
                className="px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                พนักงานในสาขา
              </button>
              <button
                onClick={() => navigate('/manager/orders')}
                className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
              >
                ดูคำสั่งซื้อ
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-gray-900">ตัวกรองข้อมูล</h3>
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                ล้างทั้งหมด
              </button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">ช่วงเวลา</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="today">วันนี้</option>
                  <option value="yesterday">เมื่อวาน</option>
                  <option value="this-week">สัปดาห์นี้</option>
                  <option value="this-month">เดือนนี้</option>
                  <option value="this-year">ปีนี้</option>
                  <option value="custom">ทั้งหมด</option>
                </select>
              </div>

              {/* Product Type Filter */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">ประเภทสินค้า</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">ทั้งหมด</option>
                  {productTypes.map((pt) => (
                    <option key={pt.product_type_id} value={String(pt.product_type_id)}>
                      {pt.product_type_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">ระดับสมาชิก</label>
                <select
                  value={memberLevelFilter}
                  onChange={(e) => setMemberLevelFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="Member">Member</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>

            </div>

            {/* Active Filters Summary */}
            <div className="mt-6 flex flex-wrap gap-2">
              {dateRange !== 'today' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                  ช่วงเวลา: {dateRange === 'yesterday' ? 'เมื่อวาน' : dateRange === 'this-week' ? 'สัปดาห์นี้' : dateRange === 'this-month' ? 'เดือนนี้' : dateRange === 'this-year' ? 'ปีนี้' : 'กำหนดเอง'}
                  <button onClick={() => setDateRange('today')} className="hover:bg-blue-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {productType !== 'all' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                  ประเภทสินค้า: {productType === 'bouquet' ? 'ช่อดอกไม้' : productType === 'vase' ? 'แจกัน' : 'สินค้าขายดี'}
                  <button onClick={() => setProductType('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {memberLevelFilter !== 'all' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                  ระดับสมาชิก: {memberLevelFilter}
                  <button onClick={() => setMemberLevelFilter('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsArray.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl mb-4 text-gray-900">ยอดขายรายสัปดาห์</h2>
            {weeklySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#4DA3FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-gray-500">ไม่พบข้อมูลยอดขายรายสัปดาห์จากฐานข้อมูล</p>
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl mb-4 text-gray-900">สินค้ายอดนิยม</h2>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-1">{product.name}</p>
                      {product.productType && (
                        <p className="text-xs text-gray-500">ประเภท: {product.productType}</p>
                      )}
                      <p className="text-sm text-gray-600">ขายได้ {product.sales} ชิ้น</p>
                    </div>
                    <p className="text-lg text-blue-600">{product.revenue}</p>
                  </div>
                ))
              ) : (dateRange !== 'custom' || productType !== 'all') ? (
                <p className="text-center text-gray-500 py-4">ไม่มีสินค้าสำหรับช่วงเวลา/ประเภทที่เลือก</p>
              ) : (
                demoTopProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-1">{product.name}</p>
                      {product.productType && (
                        <p className="text-xs text-gray-500">ประเภท: {product.productType}</p>
                      )}
                      <p className="text-sm text-gray-600">ขายได้ {product.sales} ชิ้น</p>
                    </div>
                    <p className="text-lg text-blue-600">{product.revenue}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl text-gray-900">คำสั่งซื้อล่าสุด</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">รหัสคำสั่งซื้อ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">ชื่อลูกค้า</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">ระดับสมาชิก</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">ยอดเงิน</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">สถานะ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">เวลา</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-blue-600">{order.id}</td>
                    <td className="px-6 py-4 text-gray-900">{order.customer}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getMemberLevelBadgeClass(order.memberLevel)}`}>
                        {order.memberLevel || 'Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{order.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getOrderStatusBadgeClass(order.status)}`}>
                        {mapOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.time}</td>
                  </tr>
                ))}
                {filteredRecentOrders.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-center text-gray-500" colSpan={6}>ไม่พบคำสั่งซื้อในระดับสมาชิกที่เลือก</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}