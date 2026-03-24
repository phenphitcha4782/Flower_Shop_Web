import { Building2, DollarSign, Filter, LogOut, ShoppingBag, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [overview, setOverview] = useState<any | null>(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState('this-year');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [productCategory, setProductCategory] = useState('all');

  const kpiData = [
    { label: 'รายได้รวม', value: overview ? `฿${overview.total_revenue.toLocaleString()}` : '฿—', change: '+', color: 'bg-blue-500', icon: DollarSign },
    { label: 'คำสั่งซื้อทั้งหมด', value: overview ? overview.total_orders.toLocaleString() : '—', change: '+', color: 'bg-green-500', icon: ShoppingBag },
    { label: 'สาขาที่ใช้งานอยู่', value: overview ? overview.branches.length.toString() : '—', change: '0%', color: 'bg-purple-500', icon: Building2 },
    { label: 'ฐานลูกค้า', value: overview ? overview.customer_count.toLocaleString() : '—', change: '+', color: 'bg-orange-500', icon: Users }
  ];

  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [branchesList, setBranchesList] = useState<Array<{ branch_id: number; branch_name: string }>>([]);
  const [productTypes, setProductTypes] = useState<Array<{ product_type_id: number; product_type_name: string }>>([]);

  // map month index to Thai short names
  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const branchPerformance = [
    // will be replaced by API data
    ...(overview && Array.isArray(overview.branch_performance) ? overview.branch_performance.map((b: any) => ({ branch: b.branch_name, revenue: Number(b.revenue), orders: Number(b.orders), employee_count: Number(b.employee_count || 0), average_rating: Number(b.average_rating || 0) })) : [
      { branch: 'พิจิตร', revenue: 58000, orders: 1250, employee_count: 8, average_rating: 4.8 },
      { branch: 'แพร่', revenue: 42000, orders: 1100, employee_count: 6, average_rating: 4.5 },
      { branch: 'สงขลา', revenue: 25450, orders: 895, employee_count: 5, average_rating: 4.2 }
    ])
  ];

  const [productCategoryData, setProductCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);

  const defaultColors = ['#4DA3FF', '#14B8A6', '#F59E0B', '#A78BFA', '#FB7185', '#60A5FA'];

  const topPerformers = overview ? [
    {
      name: overview.top_branch ? overview.top_branch.branch_name : '—',
      metric: 'รายได้สูงสุด',
      value: overview.top_branch ? `฿${Number(overview.top_branch.revenue).toLocaleString()}` : '฿0'
    },
    {
      name: overview.top_flower ? overview.top_flower.flower_name : '—',
      metric: 'ขายดีที่สุด',
      value: overview.top_flower ? `${overview.top_flower.qty.toLocaleString()} ชิ้น` : '0 ชิ้น'
    }
  ] : [
    { name: '—', metric: 'รายได้สูงสุด', value: '฿—' },
    { name: '—', metric: 'ขายดีที่สุด', value: '—' }
  ];

  const clearAllFilters = () => {
    setDateRange('this-year');
    setSelectedBranches([]);
    setProductCategory('all');
  };

  // build query params helper
  const buildQueryParams = () => {
    const params: Record<string, string> = {};

    // date range mapping (supports simple presets)
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    if (dateRange === 'today') {
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      params.start_date = today;
      params.end_date = today;
    } else if (dateRange === 'this-week') {
      // ISO week starting Monday
      const day = now.getDay(); // 0 (Sun) .. 6 (Sat)
      const diffToMonday = (day + 6) % 7; // days since Monday
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const start = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      const end = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
      params.start_date = start;
      params.end_date = end;
    } else if (dateRange === 'this-month') {
      const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;
      params.start_date = start;
      params.end_date = end;
    } else if (dateRange === 'this-year') {
      params.start_date = `${now.getFullYear()}-01-01`;
      params.end_date = `${now.getFullYear()}-12-31`;
    } else if (dateRange === 'last-month') {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const start = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
      const end = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())}`;
      params.start_date = start;
      params.end_date = end;
    } else if (dateRange === 'last-year') {
      const y = now.getFullYear() - 1;
      params.start_date = `${y}-01-01`;
      params.end_date = `${y}-12-31`;
    }

    // branches: send branch_ids csv. If none selected, send all branch ids.
    const allBranchIds = branchesList.map(b => b.branch_id);
    if (selectedBranches && selectedBranches.length > 0) {
      params.branch_ids = selectedBranches.join(',');
    } else if (allBranchIds.length > 0) {
      params.branch_ids = allBranchIds.join(',');
    }

    // product category -> product_type param
    if (productCategory && productCategory !== 'all') {
      params.product_type = productCategory;
    }

    return new URLSearchParams(params).toString();
  };

  // fetch branch list and product types once
  useEffect(() => {
    fetch('http://localhost:3000/api/branches')
      .then(res => res.json())
      .then((data: Array<{ branch_id: number; branch_name: string }>) => setBranchesList(data || []))
      .catch(err => console.error('Failed to load branches:', err));

    fetch('http://localhost:3000/api/product-types')
      .then(res => res.json())
      .then((data: Array<{ product_type_id: number; product_type_name: string }>) => setProductTypes(data || []))
      .catch(err => console.error('Failed to load product types:', err));
  }, []);

  // fetch data when filters or branch list changes (use branch list length to avoid loop)
  useEffect(() => {
    const qp = buildQueryParams();

    // fetch overview KPIs
    fetch(`http://localhost:3000/api/executive/overview?${qp}`)
      .then(res => res.json())
      .then(data => setOverview(data))
      .catch(err => console.error('Failed to load executive overview:', err));

    // fetch monthly revenue and map to chart data
    fetch(`http://localhost:3000/api/executive/monthly-revenue?${qp}`)
      .then(res => res.json())
      .then((data: Array<{ month: number; revenue: number }>) => {
        const mapped = data.map(d => ({ month: monthNames[d.month - 1] || String(d.month), revenue: Number(d.revenue) }));
        setMonthlyRevenue(mapped);
      })
      .catch(err => console.error('Failed to load monthly revenue:', err));

    // fetch product/category sales (includes product_type) with filters
    fetch(`http://localhost:3000/api/executive/category-sales?${qp}`)
      .then(res => res.json())
      .then((data: { total: number; items: Array<{ product_name: string; product_type?: string; revenue: number; percent: number }> }) => {
        if (!data || !Array.isArray(data.items)) return;
        const mapped = data.items.map((it, idx) => ({
          name: `${it.product_name} (${it.product_type || '—'})`,
          value: Number(it.percent.toFixed(2)),
          color: defaultColors[idx % defaultColors.length]
        }));
        setProductCategoryData(mapped);
      })
      .catch(err => console.error('Failed to load category sales:', err));
  // re-run when filters or branch list size change
  }, [dateRange, selectedBranches, productCategory, branchesList.length]);

  const toggleBranch = (branchId: string) => {
    if (selectedBranches.includes(branchId)) {
      setSelectedBranches(selectedBranches.filter(id => id !== branchId));
    } else {
      setSelectedBranches([...selectedBranches, branchId]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">Executive Dashboard</h1>
              <p className="text-sm text-gray-600">ข้อมูลภาพรวมและ KPI ของบริษัท</p>
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
                onClick={() => navigate('/executive/users')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                จัดการพนักงาน
              </button>
              <button
                onClick={() => navigate('/executive/products')}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                รายการสินค้า
              </button>
              <button
                onClick={() => navigate('/executive/customers')}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                ข้อมูลลูกค้า
              </button>
              <button
                onClick={() => navigate('/executive/promotions')}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                จัดการโปรโมชั่น
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
                  <option value="this-week">สัปดาห์นี้</option>
                  <option value="this-month">เดือนนี้</option>
                  <option value="this-year">ปีนี้</option>
                  <option value="last-month">เดือนที่แล้ว</option>
                  <option value="last-year">ปีที่แล้ว</option>
                  <option value="custom">ทั้งหมด</option>
                </select>
              </div>

              {/* Product Category Filter */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">หมวดหมู่สินค้า</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">ทั้งหมด</option>
                  {productTypes.map((type) => (
                    <option key={type.product_type_id} value={type.product_type_name}>
                      {type.product_type_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch/Province Selection */}
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-700 mb-2">เลือกสาขา</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setSelectedBranches([])}
                    className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                      selectedBranches.length === 0 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    ทุกสาขา
                  </button>
                  {branchesList.map((b) => (
                    <button
                      key={b.branch_id}
                      onClick={() => toggleBranch(String(b.branch_id))}
                      className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                        selectedBranches.includes(String(b.branch_id))
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {b.branch_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            <div className="mt-6 flex flex-wrap gap-2">
              {dateRange !== 'this-month' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                  ช่วงเวลา: {
                    dateRange === 'today' ? 'วันนี้' :
                    dateRange === 'this-week' ? 'สัปดาห์นี้' :
                    dateRange === 'this-year' ? 'ปีนี้' :
                    dateRange === 'last-month' ? 'เดือนที่แล้ว' :
                    dateRange === 'last-year' ? 'ปีที่แล้ว' : 'ทั้งหมด'
                  }
                  <button onClick={() => setDateRange('this-year')} className="hover:bg-blue-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBranches.length > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2">
                  สาขาที่เลือก: {selectedBranches.length} สาขา
                  <button onClick={() => setSelectedBranches([])} className="hover:bg-green-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {productCategory !== 'all' && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center gap-2">
                  หมวดหมู่: {
                    productCategory === 'bouquet' ? 'ช่อดอกไม้' :
                    productCategory === 'vase' ? 'แจกัน' :
                    productCategory === 'top-products' ? 'Top 10' : 'เปรียบเทียบ'
                  }
                  <button onClick={() => setProductCategory('all')} className="hover:bg-orange-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${kpi.color} rounded-xl flex items-center justify-center`}>
                  <kpi.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm px-2 py-1 rounded ${
                  kpi.change.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {kpi.change}
                </span>
              </div>
              <p className="text-3xl text-gray-900 mb-1">{kpi.value}</p>
              <p className="text-sm text-gray-600">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl mb-6 text-gray-900">แนวโน้มรายได้รายเดือน</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#4DA3FF" strokeWidth={3} dot={{ fill: '#4DA3FF', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Performance & Product Categories */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Branch Performance */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl mb-6 text-gray-900">ผลการดำเนินงานของสาขา</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#4DA3FF" radius={[8, 8, 0, 0]} name="รายได้ ($)" />
                <Bar yAxisId="right" dataKey="orders" fill="#14B8A6" radius={[8, 8, 0, 0]} name="คำสั่งซื้อ" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Product Categories */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl mb-6 text-gray-900">ยอดขายตามหมวดหมู่</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl mb-6 text-gray-900">ผลงานชั้นนำ</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {topPerformers.map((performer, index) => (
              <div key={index} className="w-full md:w-1/3 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 text-center">
                <div className="flex flex-col items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-600 uppercase tracking-wide">{performer.metric}</p>
                  <p className="text-lg font-semibold text-gray-900">{performer.name}</p>
                </div>
                <p className="text-3xl text-blue-600 font-bold mt-2">{performer.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Details Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl text-gray-900">รายละเอียดสาขา</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">สาขา</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">รายได้</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">คำสั่งซื้อ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">มูลค่าเฉลี่ยต่อคำสั่งซื้อ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">คะแนนเฉลี่ย</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">พนักงาน</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {branchPerformance.map((branch, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-500" />
                        <span className="text-gray-900">สาขา{branch.branch}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">฿{branch.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-900">{branch.orders}</td>
                    <td className="px-6 py-4 text-gray-900">฿{branch.orders > 0 ? (branch.revenue / branch.orders).toFixed(2) : '0.00'}</td>
                    <td className="px-6 py-4 text-gray-900">{Number(branch.average_rating || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-900">{branch.employee_count ?? 0}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        ใช้งานอยู่
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}