import { AlertTriangle, ArrowLeft, Building2, Search, Star, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type EmployeeRole = 'cashier' | 'florist' | 'rider' | 'manager' | 'executive';

interface EmployeeItem {
  id: string;
  username: string;
  profileImage: string;
  firstName: string;
  lastName: string;
  phone: string;
  branch: string;
  role: EmployeeRole;
  salary: number;
  rating: number;
  assignedJobs: number;
  performanceMonth: string;
  createdAt: string;
}

interface ComplaintItem {
  id: string;
  orderCode: string;
  branch: string;
  employeeRole: EmployeeRole;
  employeeName: string;
  orderScore: number;
  reason: string;
  status: 'pending' | 'in-progress' | 'resolved';
}

const employeeSeed: EmployeeItem[] = [
  {
    id: '1',
    username: 'cashier001',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    phone: '081-234-5678',
    branch: 'พิจิตร',
    role: 'cashier',
    salary: 16000,
    rating: 4.6,
    assignedJobs: 128,
    performanceMonth: '2026-01',
    createdAt: '2025-01-15'
  },
  {
    id: '2',
    username: 'florist001',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    firstName: 'สมหญิง',
    lastName: 'รักดอกไม้',
    phone: '082-345-6789',
    branch: 'พิจิตร',
    role: 'florist',
    salary: 18500,
    rating: 4.8,
    assignedJobs: 96,
    performanceMonth: '2026-01',
    createdAt: '2025-01-15'
  },
  {
    id: '3',
    username: 'rider001',
    profileImage: 'https://images.unsplash.com/photo-1542204625-de293a8e0fe6?auto=format&fit=crop&w=200&q=80',
    firstName: 'สมศักดิ์',
    lastName: 'ขับเร็ว',
    phone: '083-456-7890',
    branch: 'กรุงเทพและปริมณฑล',
    role: 'rider',
    salary: 17000,
    rating: 4.4,
    assignedJobs: 212,
    performanceMonth: '2026-02',
    createdAt: '2025-01-16'
  },
  {
    id: '4',
    username: 'manager001',
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
    firstName: 'สมพร',
    lastName: 'จัดการเก่ง',
    phone: '084-567-8901',
    branch: 'พิจิตร',
    role: 'manager',
    salary: 32000,
    rating: 4.9,
    assignedJobs: 61,
    performanceMonth: '2026-02',
    createdAt: '2025-01-10'
  },
  {
    id: '5',
    username: 'cashier002',
    profileImage: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80',
    firstName: 'วิชัย',
    lastName: 'บริการดี',
    phone: '085-678-9012',
    branch: 'แพร่',
    role: 'cashier',
    salary: 15800,
    rating: 4.3,
    assignedJobs: 104,
    performanceMonth: '2026-02',
    createdAt: '2025-01-18'
  },
  {
    id: '6',
    username: 'florist002',
    profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80',
    firstName: 'วรรณา',
    lastName: 'สวยงาม',
    phone: '086-789-0123',
    branch: 'แพร่',
    role: 'florist',
    salary: 18200,
    rating: 4.7,
    assignedJobs: 88,
    performanceMonth: '2026-03',
    createdAt: '2025-01-18'
  },
  {
    id: '7',
    username: 'rider002',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    firstName: 'ประยุทธ',
    lastName: 'ส่งไว',
    phone: '087-890-1234',
    branch: 'สงขลา',
    role: 'rider',
    salary: 17200,
    rating: 4.2,
    assignedJobs: 187,
    performanceMonth: '2026-03',
    createdAt: '2025-01-20'
  },
  {
    id: '8',
    username: 'executive001',
    profileImage: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=200&q=80',
    firstName: 'นายใหญ่',
    lastName: 'บริหารดี',
    phone: '088-901-2345',
    branch: 'ทุกสาขา',
    role: 'executive',
    salary: 65000,
    rating: 5,
    assignedJobs: 24,
    performanceMonth: '2026-03',
    createdAt: '2025-01-01'
  }
];

const complaintSeed: ComplaintItem[] = [
  {
    id: 'CMP-001',
    orderCode: 'ORD10623591',
    branch: 'กรุงเทพและปริมณฑล',
    employeeRole: 'cashier',
    employeeName: 'สมชาย ใจดี',
    orderScore: 2,
    reason: 'คุณภาพสินค้าไม่ดี',
    status: 'pending'
  },
  {
    id: 'CMP-002',
    orderCode: 'ORD10623644',
    branch: 'แพร่',
    employeeRole: 'rider',
    employeeName: 'ประยุทธ ส่งไว',
    orderScore: 1,
    reason: 'ส่งล่าช้า',
    status: 'in-progress'
  },
  {
    id: 'CMP-003',
    orderCode: 'ORD10623802',
    branch: 'พิจิตร',
    employeeRole: 'florist',
    employeeName: 'สมหญิง รักดอกไม้',
    orderScore: 3,
    reason: 'จัดช่อไม่ตรงแบบ',
    status: 'resolved'
  }
];

export default function ManagerEmployees() {
  const navigate = useNavigate();
  const [branchName, setBranchName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | EmployeeRole>('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<'all' | ComplaintItem['status']>('all');

  useEffect(() => {
    const branchId = localStorage.getItem('branch_id');
    if (!branchId) return;

    fetch('http://localhost:3000/api/branches')
      .then((res) => res.json())
      .then((branches: Array<{ branch_id: number; branch_name: string }>) => {
        const branch = branches.find((item) => item.branch_id === Number(branchId));
        if (branch) setBranchName(branch.branch_name);
      })
      .catch((err) => console.error('Failed to load branches:', err));
  }, []);

  const roleLabel = (role: EmployeeRole) => {
    if (role === 'cashier') return 'แคชเชียร์';
    if (role === 'florist') return 'ช่างจัดดอกไม้';
    if (role === 'rider') return 'ไรเดอร์';
    if (role === 'manager') return 'ผู้จัดการสาขา';
    return 'ผู้บริหาร';
  };

  const roleBadgeClass = (role: EmployeeRole) => {
    if (role === 'cashier') return 'bg-green-100 text-green-800';
    if (role === 'florist') return 'bg-purple-100 text-purple-800';
    if (role === 'rider') return 'bg-orange-100 text-orange-800';
    if (role === 'manager') return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  const branchEmployees = useMemo(() => {
    if (!branchName) return [];
    return employeeSeed.filter((user) => user.branch === branchName);
  }, [branchName]);

  const monthOptions = useMemo(() => {
    const set = new Set(branchEmployees.map((item) => item.performanceMonth).filter(Boolean));
    return Array.from(set).sort();
  }, [branchEmployees]);

  const filteredEmployees = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return branchEmployees.filter((user) => {
      const matchesSearch =
        keyword.length === 0 ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        user.phone.includes(keyword);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesMonth = monthFilter === 'all' || user.performanceMonth === monthFilter;
      return matchesSearch && matchesRole && matchesMonth;
    });
  }, [branchEmployees, searchTerm, roleFilter, monthFilter]);

  const previewEmployees = useMemo(() => {
    if (filteredEmployees.length > 0) return filteredEmployees.slice(0, 3);
    return branchEmployees.slice(0, 3);
  }, [filteredEmployees, branchEmployees]);

  const topPerformerByRole = (role: EmployeeRole) => {
    const roleUsers = filteredEmployees.filter((user) => user.role === role);
    if (roleUsers.length === 0) return null;
    return roleUsers.sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      if (ratingDiff !== 0) return ratingDiff;
      return b.assignedJobs - a.assignedJobs;
    })[0];
  };

  const outstandingCards = [
    { title: 'พนักงานขายดีเด่น', user: topPerformerByRole('cashier') },
    { title: 'พนักงานจัดดอกไม้ดีเด่น', user: topPerformerByRole('florist') },
    { title: 'พนักงานขนส่งดีเด่น', user: topPerformerByRole('rider') }
  ];

  const filteredComplaints = useMemo(() => {
    return complaintSeed.filter((item) => {
      const inBranch = branchName ? item.branch === branchName : false;
      const statusMatch = complaintStatusFilter === 'all' || item.status === complaintStatusFilter;
      return inBranch && statusMatch;
    });
  }, [branchName, complaintStatusFilter]);

  const openComplaintCount = filteredComplaints.filter((item) => item.status !== 'resolved').length;

  const stats = [
    { label: 'พนักงานในสาขา', value: String(branchEmployees.length), color: 'bg-blue-500', icon: Users },
    {
      label: 'คะแนนเฉลี่ย',
      value:
        branchEmployees.length > 0
          ? (branchEmployees.reduce((sum, user) => sum + user.rating, 0) / branchEmployees.length).toFixed(1)
          : '0.0',
      color: 'bg-amber-500',
      icon: Star
    },
    {
      label: 'จำนวนงานรวม',
      value: String(branchEmployees.reduce((sum, user) => sum + user.assignedJobs, 0)),
      color: 'bg-indigo-500',
      icon: Building2
    },
    {
      label: 'คอมเพลนที่ยังเปิด',
      value: String(openComplaintCount),
      color: 'bg-rose-500',
      icon: AlertTriangle
    }
  ];

  const formatMonth = (monthValue: string) => {
    const [year, month] = monthValue.split('-');
    if (!year || !month) return monthValue;
    return `${month}/${year}`;
  };

  const complaintStatusBadge = (status: ComplaintItem['status']) => {
    if (status === 'pending') {
      return <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-800">รอดำเนินการ</span>;
    }
    if (status === 'in-progress') {
      return <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">กำลังแก้ไข</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">แก้ไขสำเร็จ</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/manager/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl text-gray-900">พนักงานในสาขา</h1>
                <p className="text-sm text-gray-600">
                  ข้อมูลพนักงานแบบละเอียด (ดูได้เฉพาะสาขาของคุณ): {branchName || 'กำลังโหลด...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-white ${stat.label === 'คะแนนเฉลี่ย' ? 'fill-white' : ''}`} />
                </div>
              </div>
              <p className="text-3xl text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base text-gray-900">ฟิลเตอร์พนักงานดีเด่น</h3>
              <p className="text-sm text-gray-500">เลือกเดือนเพื่อดูผู้ที่โดดเด่นในแต่ละบทบาท</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">เดือน</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">ทุกเดือน</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {outstandingCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-yellow-100">
              <p className="text-sm text-gray-600 mb-2">{card.title}</p>
              {card.user ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg text-gray-900 mb-1">
                      {card.user.firstName} {card.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">สาขา: {card.user.branch}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-amber-600">Rating: {card.user.rating.toFixed(1)}</span>
                      <span className="text-blue-600">งาน: {card.user.assignedJobs.toLocaleString('th-TH')}</span>
                    </div>
                  </div>
                  <img
                    src={card.user.profileImage}
                    alt={`${card.user.firstName} ${card.user.lastName}`}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-400">ยังไม่มีข้อมูลพนักงานในหมวดนี้</p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-base text-gray-900 mb-4">ตัวอย่างการ์ดพนักงาน (Frontend)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {previewEmployees.map((user) => (
              <article key={user.id} className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={user.profileImage}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-14 h-14 rounded-full object-cover border border-white shadow-sm"
                  />
                  <div className="min-w-0">
                    <p className="text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">{user.username}</p>
                    <span className={`mt-2 inline-block px-2.5 py-1 rounded-full text-xs ${roleBadgeClass(user.role)}`}>
                      {roleLabel(user.role)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-white px-2 py-1 text-gray-700">Rating: {user.rating.toFixed(1)}</div>
                  <div className="rounded-md bg-white px-2 py-1 text-gray-700">งาน: {user.assignedJobs.toLocaleString('th-TH')}</div>
                </div>
              </article>
            ))}
          </div>
          {previewEmployees.length === 0 && (
            <div className="text-center py-6 text-gray-500">ไม่มีข้อมูลตัวอย่างที่ตรงกับเงื่อนไข</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อ, นามสกุล, username หรือเบอร์"
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | EmployeeRole)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">ทุกบทบาท</option>
                <option value="cashier">แคชเชียร์</option>
                <option value="florist">ช่างจัดดอกไม้</option>
                <option value="rider">ไรเดอร์</option>
                <option value="manager">ผู้จัดการสาขา</option>
              </select>
            </div>
            <div className="w-full px-4 py-2 border-2 border-blue-100 bg-blue-50 text-blue-700 rounded-lg">
              สาขา: {branchName || 'กำลังโหลด...'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-10">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg text-gray-900">รายการพนักงานในสาขา</h2>
            <p className="text-sm text-gray-500 mt-1">ข้อมูลฝั่งผู้จัดการสาขาจะถูกจำกัดเฉพาะสาขาของคุณ</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">โปรไฟล์</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Username</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">เบอร์โทร</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">สาขา</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">บทบาท</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">เงินเดือน</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Rating</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">จำนวนงานที่รับ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">วันที่สร้าง</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <img
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-mono">{user.username}</td>
                    <td className="px-6 py-4 text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{user.phone}</td>
                    <td className="px-6 py-4 text-gray-900">{user.branch}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${roleBadgeClass(user.role)}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">฿{user.salary.toLocaleString('th-TH')}</td>
                    <td className="px-6 py-4 text-gray-900">{user.rating.toFixed(1)}</td>
                    <td className="px-6 py-4 text-gray-900">{user.assignedJobs.toLocaleString('th-TH')}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString('th-TH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEmployees.length === 0 && (
            <div className="py-12 text-center text-gray-500">ไม่พบพนักงานที่ตรงกับเงื่อนไขในสาขานี้</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg text-gray-900">รายการคอมเพลนพนักงานในสาขา</h2>
              <p className="text-sm text-gray-500 mt-1">มุมมองนี้แสดงเฉพาะรายการที่เกี่ยวข้องกับสาขาของคุณ</p>
            </div>
            <select
              value={complaintStatusFilter}
              onChange={(e) => setComplaintStatusFilter(e.target.value as 'all' | ComplaintItem['status'])}
              className="w-full max-w-[220px] px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="in-progress">กำลังแก้ไข</option>
              <option value="resolved">แก้ไขสำเร็จ</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">รหัส Order</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">ชื่อพนักงาน</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">บทบาท</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">คะแนนออเดอร์</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">สาเหตุ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-900">{complaint.orderCode}</td>
                    <td className="px-6 py-4 text-gray-900">{complaint.employeeName}</td>
                    <td className="px-6 py-4 text-gray-900">{roleLabel(complaint.employeeRole)}</td>
                    <td className="px-6 py-4 text-gray-900">{complaint.orderScore}/5</td>
                    <td className="px-6 py-4 text-gray-700">{complaint.reason}</td>
                    <td className="px-6 py-4">{complaintStatusBadge(complaint.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredComplaints.length === 0 && (
            <div className="text-center py-10 text-gray-500">ไม่มีรายการคอมเพลนในสาขานี้</div>
          )}
        </div>
      </div>
    </div>
  );
}
