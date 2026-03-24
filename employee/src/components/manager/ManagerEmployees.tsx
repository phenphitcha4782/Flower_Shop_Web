// @ts-nocheck
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
  averageTaskMinutes: number;
  outstandingScore: number;
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
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | EmployeeRole>('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<'all' | ComplaintItem['status']>('all');

  const mapRole = (roleId: number, roleName?: string): EmployeeRole => {
    const normalized = String(roleName || '').trim().toLowerCase();
    if (normalized.includes('cashier') || normalized.includes('แคช')) return 'cashier';
    if (normalized.includes('florist') || normalized.includes('ช่าง')) return 'florist';
    if (normalized.includes('rider') || normalized.includes('ไรเดอร์')) return 'rider';
    if (normalized.includes('manager') || normalized.includes('ผู้จัดการ')) return 'manager';
    if (normalized.includes('executive') || normalized.includes('ผู้บริหาร')) return 'executive';

    if (roleId === 1) return 'cashier';
    if (roleId === 2) return 'florist';
    if (roleId === 3) return 'rider';
    if (roleId === 4) return 'manager';
    return 'executive';
  };

  const normalizePositive = (value: number, maxValue: number) => {
    if (!Number.isFinite(value) || value <= 0) return 0;
    if (!Number.isFinite(maxValue) || maxValue <= 0) return 0;
    return Math.min(Math.max(value / maxValue, 0), 1);
  };

  const normalizeLowerIsBetter = (value: number, minValue: number, maxValue: number) => {
    if (!Number.isFinite(value) || value <= 0) return 0;
    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || maxValue <= 0) return 0;
    if (maxValue === minValue) return 1;
    return Math.min(Math.max((maxValue - value) / (maxValue - minValue), 0), 1);
  };

  const computeOutstandingScore = (employee: EmployeeItem, roleUsers: EmployeeItem[]) => {
    const maxRating = Math.max(...roleUsers.map((u) => Number(u.rating || 0)), 0);
    const maxOrders = Math.max(...roleUsers.map((u) => Number(u.assignedJobs || 0)), 0);
    const ratingScore = normalizePositive(Number(employee.rating || 0), maxRating);
    const orderScore = normalizePositive(Number(employee.assignedJobs || 0), maxOrders);

    if (employee.role === 'cashier') {
      return (ratingScore * 0.5) + (orderScore * 0.5);
    }

    if (employee.role === 'florist' || employee.role === 'rider') {
      const roleDurations = roleUsers
        .map((u) => Number(u.averageTaskMinutes || 0))
        .filter((v) => Number.isFinite(v) && v > 0);
      const minDuration = roleDurations.length > 0 ? Math.min(...roleDurations) : 0;
      const maxDuration = roleDurations.length > 0 ? Math.max(...roleDurations) : 0;
      const durationScore = normalizeLowerIsBetter(Number(employee.averageTaskMinutes || 0), minDuration, maxDuration);
      return (durationScore * 0.3) + (ratingScore * 0.3) + (orderScore * 0.4);
    }

    return 0;
  };

  useEffect(() => {
    const branchId = localStorage.getItem('branch_id');
    if (!branchId) return;

    setLoadingEmployees(true);

    fetch('http://localhost:3000/api/branches')
      .then((res) => res.json())
      .then((branches: Array<{ branch_id: number; branch_name: string }>) => {
        const branch = branches.find((item) => item.branch_id === Number(branchId));
        if (branch) setBranchName(branch.branch_name);
      })
      .catch((err) => console.error('Failed to load branches:', err));

    Promise.all([
      fetch(`http://localhost:3000/api/manager/branch-employees/${branchId}`).then((res) => res.json()),
      fetch(`http://localhost:3000/api/manager/employee-performance/${branchId}`).then((res) => res.json()).catch(() => []),
    ])
      .then(([rows, perfRows]: [Array<any>, Array<any>]) => {
        const perfMap = new Map<number, any>();
        if (Array.isArray(perfRows)) {
          perfRows.forEach((p) => {
            const employeeId = Number(p.employee_id || 0);
            if (employeeId > 0) perfMap.set(employeeId, p);
          });
        }

        const mapped = rows.map((row) => {
          const firstName = String(row.name || '').trim();
          const lastName = String(row.surname || '').trim();
          const username = String(row.username || `employee_${row.employee_id || ''}`);
          const createdAt = row.created_at ? String(row.created_at) : new Date().toISOString();
          const role = mapRole(Number(row.role_id || 0), String(row.role_name || ''));
          const perf = perfMap.get(Number(row.employee_id || 0)) || {};
          const averageRating = Number(perf.average_rating || 0);
          let assignedJobs = 0;
          let averageTaskMinutes = 0;
          if (role === 'cashier') {
            assignedJobs = Number(perf.cashier_orders || 0);
          } else if (role === 'florist') {
            assignedJobs = Number(perf.florist_orders || 0);
            averageTaskMinutes = Number(perf.florist_avg_minutes || 0);
          } else if (role === 'rider') {
            assignedJobs = Number(perf.rider_orders || 0);
            averageTaskMinutes = Number(perf.rider_avg_minutes || 0);
          }
          const profileUrlRaw = String(row.employee_profile_url || '').trim();
          const profileUrl = profileUrlRaw
            ? (profileUrlRaw.startsWith('http://') || profileUrlRaw.startsWith('https://')
              ? profileUrlRaw
              : `http://localhost:3000${profileUrlRaw.startsWith('/') ? '' : '/'}${profileUrlRaw}`)
            : '';
          return {
            id: String(row.employee_id),
            username,
            profileImage:
              profileUrl ||
              `https://ui-avatars.com/api/?background=E5F0FF&color=1F4D8F&name=${encodeURIComponent(`${firstName} ${lastName}`.trim() || username)}`,
            firstName: firstName || '-',
            lastName: lastName || '-',
            phone: String(row.phone || '-'),
            branch: String(row.branch_name || branchName || `สาขา ${branchId}`),
            role,
            salary: Number(row.salary || 0),
            rating: averageRating,
            assignedJobs,
            averageTaskMinutes,
            outstandingScore: 0,
            performanceMonth: createdAt.slice(0, 7),
            createdAt,
          } as EmployeeItem;
        });

        const byRole = {
          cashier: mapped.filter((u) => u.role === 'cashier'),
          florist: mapped.filter((u) => u.role === 'florist'),
          rider: mapped.filter((u) => u.role === 'rider'),
        };

        const withScores = mapped.map((u) => {
          const roleUsers = u.role === 'cashier'
            ? byRole.cashier
            : u.role === 'florist'
              ? byRole.florist
              : u.role === 'rider'
                ? byRole.rider
                : [];
          if (roleUsers.length === 0) return u;
          return {
            ...u,
            outstandingScore: computeOutstandingScore(u, roleUsers),
          };
        });
        setEmployees(withScores);
      })
      .catch((err) => {
        console.error('Failed to load branch employees:', err);
        setEmployees([]);
      })
      .finally(() => setLoadingEmployees(false));
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
    return employees;
  }, [employees]);

  const monthOptions = useMemo(() => {
    const set = new Set(
      branchEmployees
        .map((item) => item.performanceMonth)
        .filter((value) => /^\d{4}-\d{2}$/.test(value))
    );
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

  const topPerformerByRole = (role: EmployeeRole) => {
    const roleUsers = filteredEmployees.filter((user) => user.role === role);
    if (roleUsers.length === 0) return null;
    const scored = roleUsers.map((u) => ({
      user: u,
      score: computeOutstandingScore(u, roleUsers),
    }));
    scored.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      const ratingDiff = b.user.rating - a.user.rating;
      if (ratingDiff !== 0) return ratingDiff;
      return b.user.assignedJobs - a.user.assignedJobs;
    });
    return {
      ...scored[0].user,
      outstandingScore: scored[0].score,
    };
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
      color: 'bg-yellow-500',
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
      color: 'bg-red-500',
      icon: AlertTriangle
    }
  ];

  const getStatIcon = (label: string, icon?: any) => {
    if (icon) return icon;
    if (label === 'คะแนนเฉลี่ย') return Star;
    if (label === 'คอมเพลนที่ยังเปิด') return AlertTriangle;
    if (label === 'จำนวนงานรวม') return Building2;
    return Users;
  };

  const getStatColor = (label: string, color?: string) => {
    if (color) return color;
    if (label === 'คะแนนเฉลี่ย') return 'bg-amber-500';
    if (label === 'คอมเพลนที่ยังเปิด') return 'bg-rose-500';
    if (label === 'จำนวนงานรวม') return 'bg-indigo-500';
    return 'bg-blue-500';
  };

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
                  ข้อมูลพนักงานทั้งหมด : {branchName || 'กำลังโหลด...'}
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
              {(() => {
                const StatIcon = getStatIcon(stat.label, stat.icon);
                const statColor = getStatColor(stat.label, stat.color);
                return (
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${statColor} rounded-xl flex items-center justify-center`}>
                  <StatIcon className={`w-6 h-6 text-white ${stat.label === 'คะแนนเฉลี่ย' ? 'fill-white' : ''}`} />
                </div>
              </div>
                );
              })()}
              <p className="text-3xl text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base text-gray-900">ฟิลเตอร์พนักงานดีเด่น</h3>
              <p className="text-sm text-gray-500">เลือกเดือนเพื่อดูผู้ที่โดดเด่นในแต่ละตำแหน่ง</p>
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
                      {(card.user.role === 'florist' || card.user.role === 'rider') && card.user.averageTaskMinutes > 0 && (
                        <span className="text-emerald-600">เวลาเฉลี่ย: {card.user.averageTaskMinutes.toFixed(1)} นาที</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">คะแนน: {(Number(card.user.outstandingScore || 0) * 100).toFixed(1)}</p>
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
                <option value="all">ทุกตำแหน่ง</option>
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
                  <th className="px-6 py-3 text-left text-sm text-gray-600">ตำแหน่ง</th>
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
            <div className="py-12 text-center text-gray-500">
              {loadingEmployees ? 'กำลังโหลดข้อมูลพนักงาน...' : 'ไม่พบพนักงานที่ตรงกับเงื่อนไขในสาขานี้'}
            </div>
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
                  <th className="px-6 py-3 text-left text-sm text-gray-600">ตำแหน่ง</th>
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
