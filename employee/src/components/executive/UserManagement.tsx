import { ArrowLeft, Building2, Edit2, Plus, Search, Trash2, UserCircle2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type EmployeeRole = 'cashier' | 'florist' | 'rider' | 'manager' | 'executive' | 'unknown';
type ComplaintStatus = 'waiting' | 'progress' | 'success';

interface ComplaintRow {
  complaint_id: string;
  review_id: number;
  order_id: number;
  order_code: string;
  employee_id: number;
  employee_name: string;
  employee_role: 'florist' | 'rider' | string;
  branch_id: number;
  branch_name: string;
  rating: number;
  rating_type: 'product' | 'delivery' | string;
  status: ComplaintStatus;
  comment: string | null;
  created_at: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const profileImageClass = 'rounded-full object-cover border border-gray-200 shrink-0';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [outstandingMonth, setOutstandingMonth] = useState('all');
  const [complaintBranchFilter, setComplaintBranchFilter] = useState('all');
  const [complaintRoleFilter, setComplaintRoleFilter] = useState('all');
  const [complaintScoreFilter, setComplaintScoreFilter] = useState('all');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<'all' | ComplaintStatus>('all');
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [updatingComplaintId, setUpdatingComplaintId] = useState<number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [topRevenueBranch, setTopRevenueBranch] = useState('');
  const [topRevenueValue, setTopRevenueValue] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const normalizeRole = (rawRole: any, roleId?: any, scope?: string) => {
    if (scope === 'executive') return 'executive';
    const text = String(rawRole || '').trim().toLowerCase();
    const id = Number(roleId);

    if (text === 'cashier' || text.includes('แคชเชียร์')) return 'cashier';
    if (text === 'florist' || text.includes('ช่างจัดดอกไม้') || text.includes('จัดดอกไม้') || text.includes('florist')) return 'florist';
    if (text === 'rider' || text.includes('ไรเดอร์') || text.includes('ขนส่ง') || text.includes('ส่งของ')) return 'rider';
    if (text === 'manager' || text.includes('ผู้จัดการ')) return 'manager';
    if (text === 'executive' || text.includes('ผู้บริหาร')) return 'executive';

    if (!Number.isNaN(id)) {
      if (id === 1) return 'manager';
      if (id === 2) return 'cashier';
      if (id === 3) return 'florist';
      if (id === 4) return 'rider';
    }

    return 'unknown';
  };

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    profileUrl: '',
    branch: '',
    role: 'cashier',
    salary: '',
    rating: '',
    assignedJobs: ''
  });

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

  const computeOutstandingScore = (employee: any, roleUsers: any[]) => {
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

  const loadUsersAndPerformance = async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, perfRes, overviewRes] = await Promise.all([
        fetch('http://localhost:3000/api/executive/users'),
        fetch('http://localhost:3000/api/executive/employee-performance').catch(() => null),
        fetch('http://localhost:3000/api/executive/overview').catch(() => null),
      ]);

      if (!usersRes.ok) throw new Error('Failed to load users');
      const usersData = await usersRes.json();
      const perfData = perfRes && perfRes.ok ? await perfRes.json() : [];
      const overviewData = overviewRes && overviewRes.ok ? await overviewRes.json() : null;

      const resolvedTopBranch = String(overviewData?.top_branch?.branch_name || '').trim();
      const resolvedTopRevenue = Number(overviewData?.top_branch?.revenue || 0);
      setTopRevenueBranch(resolvedTopBranch);
      setTopRevenueValue(resolvedTopRevenue);

      const perfMap = new Map<number, any>();
      if (Array.isArray(perfData)) {
        perfData.forEach((p: any) => {
          const employeeId = Number(p.employee_id || 0);
          if (employeeId > 0) perfMap.set(employeeId, p);
        });
      }

      const mapped = (Array.isArray(usersData) ? usersData : [])
        .filter((u: any) => String(u.scope || '') !== 'executive')
        .map((u: any) => {
          const month = u.created_at ? String(u.created_at).slice(0, 7) : '';
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
          const role = normalizeRole(u.role_name || u.role_key, u.role_id, u.scope) as EmployeeRole;
          const perf = perfMap.get(Number(u.raw_id || 0)) || {};
          const profileUrlRaw = String(u.profile_image || '').trim();
          const profileUrl = profileUrlRaw
            ? (profileUrlRaw.startsWith('http://') || profileUrlRaw.startsWith('https://')
              ? profileUrlRaw
              : `http://localhost:3000${profileUrlRaw.startsWith('/') ? '' : '/'}${profileUrlRaw}`)
            : '';

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

          return {
            id: String(u.id),
            rawId: Number(u.raw_id || 0),
            scope: u.scope || 'employee',
            username: u.username || '',
            profileUrl: profileUrlRaw,
            profileImage:
              profileUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=e8f1ff&color=2563eb`,
            firstName: u.first_name || '',
            lastName: u.last_name || '',
            phone: u.phone || '-',
            branchId: u.branch_id ? String(u.branch_id) : '',
            branch: u.branch_name || 'ทุกสาขา',
            role,
            salary: Number(u.salary || 0),
            rating: Number(perf.average_rating ?? u.rating ?? 0),
            assignedJobs,
            averageTaskMinutes,
            outstandingScore: 0,
            performanceMonth: month,
            createdAt: u.created_at || null,
          };
        });

      const byRole = {
        cashier: mapped.filter((u: any) => u.role === 'cashier'),
        florist: mapped.filter((u: any) => u.role === 'florist'),
        rider: mapped.filter((u: any) => u.role === 'rider'),
      };

      const withScores = mapped.map((u: any) => {
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

      setUsers(withScores);
    } catch (err) {
      console.error('Failed to load users:', err);
      alert('โหลดข้อมูลพนักงานไม่สำเร็จ');
      setUsers([]);
      setTopRevenueBranch('');
      setTopRevenueValue(0);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/branches');
      if (!res.ok) throw new Error('Failed to load branches');
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setBranches([]);
    }
  };

  const loadComplaints = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/complaints/low-ratings');
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to load complaints');
      setComplaints(Array.isArray(data?.complaints) ? data.complaints : []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setComplaints([]);
    }
  };

  const updateComplaintStatus = async (reviewId: number, status: ComplaintStatus) => {
    if (!Number.isInteger(reviewId) || reviewId <= 0) return;
    setUpdatingComplaintId(reviewId);
    try {
      const response = await fetch(`http://localhost:3000/api/complaints/low-ratings/${reviewId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to update complaint status');

      setComplaints((prev) => prev.map((item) => (
        Number(item.review_id) === reviewId ? { ...item, status } : item
      )));
    } catch (err) {
      console.error('Failed to update complaint status:', err);
      alert('ไม่สามารถอัปเดตสถานะคอมเพลนได้');
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  useEffect(() => {
    fetchBranches();
    loadUsersAndPerformance();
    loadComplaints();
  }, []);

  const stats = [
    { label: 'สมาชิกทั้งหมด', value: users.length.toString(), color: 'bg-blue-500', icon: Users },
    { label: 'แคชเชียร์', value: users.filter(u => u.role === 'cashier').length.toString(), color: 'bg-green-500', icon: UserCircle2 },
    { label: 'ช่างจัดดอกไม้', value: users.filter(u => u.role === 'florist').length.toString(), color: 'bg-purple-500', icon: UserCircle2 },
    { label: 'ไรเดอร์', value: users.filter(u => u.role === 'rider').length.toString(), color: 'bg-orange-500', icon: UserCircle2 }
  ];

  const branchOptions = Array.from(
    new Set(
      users
        .filter((user) => user.scope !== 'executive' && user.branchId && user.branch && user.branch !== 'ทุกสาขา')
        .map((user) => user.branch)
    )
  ).sort((a, b) => a.localeCompare(b, 'th'));
  const outstandingMonthOptions = Array.from(
    new Set(users.map((user) => user.performanceMonth).filter(Boolean))
  ).sort();

  const formatMonthLabel = (monthValue: string) => {
    const [year, month] = monthValue.split('-');
    if (!year || !month) return monthValue;
    return `${month}/${year}`;
  };

  const getTopPerformerByRole = (role: EmployeeRole) => {
    const roleUsers = users.filter(
      (user) =>
        user.role === role &&
        (filterBranch === 'all' || user.branch === filterBranch) &&
        (outstandingMonth === 'all' || user.performanceMonth === outstandingMonth)
    );
    if (roleUsers.length === 0) return null;

    const scored = roleUsers.map((u) => ({
      user: u,
      score: computeOutstandingScore(u, roleUsers),
    }));
    scored.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      const ratingDiff = Number(b.user.rating || 0) - Number(a.user.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.user.assignedJobs || 0) - Number(a.user.assignedJobs || 0);
    });
    return {
      ...scored[0].user,
      outstandingScore: scored[0].score,
    };
  };

  const outstandingCards = [
    { title: 'พนักงานขายดีเด่น (cashier)', user: getTopPerformerByRole('cashier') },
    { title: 'พนักงานจัดดอกไม้ดีเด่น', user: getTopPerformerByRole('florist') },
    { title: 'พนักงานขนส่งดีเด่น', user: getTopPerformerByRole('rider') },
    {
      title: 'ผู้จัดการดีเด่น (สาขายอดขายสูงสุด)',
      user: users.find((u) => u.role === 'manager' && u.branch === topRevenueBranch) || null,
      note: topRevenueBranch
        ? `${topRevenueBranch} • ฿${Number(topRevenueValue || 0).toLocaleString('th-TH')}`
        : 'ยังไม่พบข้อมูลสาขายอดขายสูงสุด'
    },
  ];

  const handleCreateUser = async () => {
    if (!formData.username || !formData.password || !formData.firstName || !formData.role) {
      alert('กรอกข้อมูลที่จำเป็นให้ครบก่อนบันทึก');
      return;
    }
    if (!formData.branch) {
      alert('กรุณาเลือกสาขา');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/api/executive/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          role: formData.role,
          branch_id: Number(formData.branch),
          salary: Number(formData.salary || 0),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Create failed');

      setShowCreateModal(false);
      resetForm();
      await loadUsersAndPerformance();
    } catch (err: any) {
      console.error('Create user failed:', err);
      alert(`เพิ่มสมาชิกไม่สำเร็จ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3000/api/executive/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: formData.password || undefined,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          profile_url: formData.profileUrl.trim() || null,
          role: formData.role,
          branch_id: Number(formData.branch || 0),
          salary: Number(formData.salary || 0),
          rating: Number(formData.rating || 0),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Update failed');

      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
      await loadUsersAndPerformance();
    } catch (err: any) {
      console.error('Edit user failed:', err);
      alert(`แก้ไขสมาชิกไม่สำเร็จ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสมาชิกคนนี้?')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3000/api/executive/users/${userId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Delete failed');
      await loadUsersAndPerformance();
    } catch (err: any) {
      console.error('Delete user failed:', err);
      alert(`ลบสมาชิกไม่สำเร็จ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileUrl: user.profileUrl || user.profileImage || '',
      branch: user.branchId || '',
      role: user.role,
      salary: String(user.salary ?? ''),
      rating: String(user.rating ?? ''),
      assignedJobs: String(user.assignedJobs ?? '')
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      profileUrl: '',
      branch: '',
      role: 'cashier',
      salary: '',
      rating: '',
      assignedJobs: ''
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: { [key: string]: { label: string; color: string } } = {
      cashier: { label: 'แคชเชียร์', color: 'bg-green-100 text-green-800' },
      florist: { label: 'ช่างจัดดอกไม้', color: 'bg-purple-100 text-purple-800' },
      rider: { label: 'ไรเดอร์', color: 'bg-orange-100 text-orange-800' },
      manager: { label: 'ผู้จัดการสาขา', color: 'bg-blue-100 text-blue-800' },
      executive: { label: 'ผู้บริหาร', color: 'bg-red-100 text-red-800' },
      unknown: { label: 'ไม่ระบุบทบาท', color: 'bg-gray-100 text-gray-700' }
    };
    const config = roleConfig[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>{config.label}</span>;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesBranch = filterBranch === 'all' || user.branch === filterBranch;
    return matchesSearch && matchesRole && matchesBranch;
  });

  const complaintItems = complaints.map((complaint) => ({
    id: complaint.complaint_id,
    reviewId: Number(complaint.review_id || 0),
    orderCode: complaint.order_code,
    branch: complaint.branch_name || '-',
    employeeRole: complaint.employee_role,
    employeeName: complaint.employee_name,
    orderScore: Number(complaint.rating || 0),
    reason: complaint.comment || `${complaint.rating_type === 'delivery' ? 'ปัญหาการจัดส่ง' : 'ปัญหาคุณภาพสินค้า'}`,
    status: (complaint.status || 'waiting') as ComplaintStatus,
  }));

  const getComplaintStatusBadge = (status: ComplaintStatus) => {
    if (status === 'waiting') {
      return <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-800">รอดำเนินการ</span>;
    }
    if (status === 'progress') {
      return <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">กำลังดำเนินการ</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">ดำเนินการสำเร็จ</span>;
  };

  const complaintBranchOptions = Array.from(new Set(complaintItems.map((item) => item.branch)));

  const filteredComplaints = complaintItems.filter((complaint) => {
    const matchesBranch = complaintBranchFilter === 'all' || complaint.branch === complaintBranchFilter;
    const matchesRole = complaintRoleFilter === 'all' || complaint.employeeRole === complaintRoleFilter;
    const matchesScore = complaintScoreFilter === 'all' || String(complaint.orderScore) === complaintScoreFilter;
    const matchesStatus = complaintStatusFilter === 'all' || complaint.status === complaintStatusFilter;
    return matchesBranch && matchesRole && matchesScore && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/executive/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl text-gray-900">จัดการสมาชิก</h1>
                <p className="text-sm text-gray-600">เพิ่ม แก้ไข และลบสมาชิกในระบบ</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              เพิ่มสมาชิกใหม่
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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

        {/* Outstanding Employees Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base text-gray-900">ฟิลเตอร์พนักงานดีเด่น</h3>
              <p className="text-sm text-gray-500">เลือกสาขาและเดือนเพื่อดูผู้ที่โดดเด่นตามเงื่อนไข</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">สาขา</label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">รวมทั้งหมด</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">เดือน</label>
              <select
                value={outstandingMonth}
                onChange={(e) => setOutstandingMonth(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">ทุกเดือน</option>
                {outstandingMonthOptions.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {outstandingCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-yellow-100">
              <p className="text-sm text-gray-600 mb-2">{card.title}</p>
              {'note' in card && card.note && (
                <p className="text-xs text-blue-700 mb-3">{card.note}</p>
              )}
              {card.user ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg text-gray-900 mb-1">
                      {card.user.firstName} {card.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">สาขา: {card.user.branch}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-amber-600">Rating: {Number(card.user.rating || 0).toFixed(1)}</span>
                      <span className="text-blue-600">งาน: {Number(card.user.assignedJobs || 0).toLocaleString('th-TH')}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <img
                      src={card.user.profileImage}
                      alt={`${card.user.firstName} ${card.user.lastName}`}
                      className={profileImageClass}
                      style={{ width: 50, height: 50, minWidth: 50, minHeight: 50 }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">ยังไม่มีข้อมูลพนักงานในหมวดนี้</p>
              )}
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
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

            {/* Role Filter */}
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">บทบาททั้งหมด</option>
                <option value="cashier">แคชเชียร์</option>
                <option value="florist">ช่างจัดดอกไม้</option>
                <option value="rider">ไรเดอร์</option>
                <option value="manager">ผู้จัดการสาขา</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">สาขาทั้งหมด</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
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
                  <th className="px-6 py-3 text-center text-sm text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers && (
                  <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-gray-500">กำลังโหลดข้อมูลพนักงาน...</td>
                  </tr>
                )}
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <img
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                        className={profileImageClass}
                        style={{ width: 50, height: 50, minWidth: 50, minHeight: 50 }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-mono">{user.username}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{user.phone}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-900">{user.branch}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-gray-900">
                      ฿{Number(user.salary || 0).toLocaleString('th-TH')}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{Number(user.rating || 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-gray-900">{Number(user.assignedJobs || 0).toLocaleString('th-TH')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          disabled={submitting}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={submitting}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loadingUsers && filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา</p>
              </div>
            )}
          </div>
        </div>

        {/* Complaints Table */}
        <div className="mt-14 pt-2 border-t border-blue-100">
          <div className="bg-white rounded-xl shadow-md p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">ฟิลเตอร์สาขา</label>
                <select
                  value={complaintBranchFilter}
                  onChange={(e) => setComplaintBranchFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">ทุกสาขา</option>
                  {complaintBranchOptions.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">ฟิลเตอร์บทบาท</label>
                <select
                  value={complaintRoleFilter}
                  onChange={(e) => setComplaintRoleFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">ทุกบทบาท</option>
                  <option value="cashier">แคชเชียร์</option>
                  <option value="florist">ช่างจัดดอกไม้</option>
                  <option value="rider">ไรเดอร์</option>
                  <option value="manager">ผู้จัดการสาขา</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">ฟิลเตอร์คะแนน</label>
                <select
                  value={complaintScoreFilter}
                  onChange={(e) => setComplaintScoreFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">ทุกคะแนน</option>
                  <option value="1">1/5</option>
                  <option value="2">2/5</option>
                  <option value="3">3/5</option>
                  <option value="4">4/5</option>
                  <option value="5">5/5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">ฟิลเตอร์สถานะ</label>
                <select
                  value={complaintStatusFilter}
                  onChange={(e) => setComplaintStatusFilter(e.target.value as 'all' | ComplaintStatus)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="waiting">รอดำเนินการ</option>
                  <option value="progress">กำลังดำเนินการ</option>
                  <option value="success">ดำเนินการสำเร็จ</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg text-gray-900">รายการคอมเพลนพนักงาน</h2>
            <p className="text-sm text-gray-500 mt-1">รายการร้องเรียนจากออเดอร์ที่ต้องติดตามและแก้ไข</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">รหัส Order</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">สาขา</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">บทบาทพนักงาน</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">ชื่อพนักงาน</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">คะแนน Order</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">รายละเอียดสาเหตุ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">สถานะ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">แก้ไขสถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-mono">{complaint.orderCode}</td>
                    <td className="px-6 py-4 text-gray-900">{complaint.branch}</td>
                    <td className="px-6 py-4 text-gray-900">{getRoleBadge(complaint.employeeRole)}</td>
                    <td className="px-6 py-4 text-gray-900">{complaint.employeeName}</td>
                    <td className="px-6 py-4 text-gray-900">{complaint.orderScore}/5</td>
                    <td className="px-6 py-4 text-gray-700">{complaint.reason}</td>
                    <td className="px-6 py-4">{getComplaintStatusBadge(complaint.status)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={complaint.status}
                        disabled={updatingComplaintId === complaint.reviewId}
                        onChange={(e) => updateComplaintStatus(complaint.reviewId, e.target.value as ComplaintStatus)}
                        className="w-full max-w-[180px] px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="waiting">รอดำเนินการ</option>
                        <option value="progress">กำลังดำเนินการ</option>
                        <option value="success">ดำเนินการสำเร็จ</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredComplaints.length === 0 && (
              <div className="text-center py-10 text-gray-500">ไม่พบรายการคอมเพลนที่ตรงกับเงื่อนไข</div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl text-gray-900">
                {showCreateModal ? 'เพิ่มสมาชิกใหม่' : 'แก้ไขข้อมูลสมาชิก'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono"
                  placeholder="cashier001"
                  disabled={showEditModal}
                />
                {showEditModal && (
                  <p className="text-xs text-gray-500 mt-1">Username ไม่สามารถแก้ไขได้</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  รหัสผ่าน {showEditModal && '(เว้นว่างหากไม่ต้องการเปลี่ยน)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              {/* Name */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">ชื่อ</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="สมชาย"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">นามสกุล</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="ใจดี"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">เบอร์โทร</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="081-234-5678"
                />
              </div>

              {showEditModal && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">ลิงก์รูปโปรไฟล์</label>
                  <input
                    type="url"
                    value={formData.profileUrl}
                    onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="https://example.com/profile.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">ใส่ URL รูปภาพ เช่น https://... หรือ http://...</p>
                </div>
              )}

              {/* Branch and Role */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">สาขา</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">เลือกสาขา</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={String(branch.branch_id)}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">บทบาท</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      setFormData({
                        ...formData,
                        role: nextRole,
                      });
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="cashier">แคชเชียร์</option>
                    <option value="florist">ช่างจัดดอกไม้</option>
                    <option value="rider">ไรเดอร์</option>
                    <option value="manager">ผู้จัดการสาขา</option>
                  </select>
                </div>
              </div>

              {/* Salary */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">เงินเดือน (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="18000"
                  />
                </div>
                {showEditModal && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Rating (0-5)</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="4.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">จำนวนงานที่รับ</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.assignedJobs}
                        onChange={(e) => setFormData({ ...formData, assignedJobs: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="120"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                disabled={submitting}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={showCreateModal ? handleCreateUser : handleEditUser}
                disabled={submitting}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {submitting ? 'กำลังบันทึก...' : showCreateModal ? 'เพิ่มสมาชิก' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}