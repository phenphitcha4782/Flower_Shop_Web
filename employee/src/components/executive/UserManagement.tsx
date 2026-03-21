import { ArrowLeft, Building2, Edit2, Plus, Search, Trash2, UserCircle2, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    branch: '',
    role: 'cashier',
    salary: '',
    rating: '',
    assignedJobs: ''
  });

  const users = [
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
      branch: 'พิจิตร',
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
      rating: 5.0,
      assignedJobs: 24,
      performanceMonth: '2026-03',
      createdAt: '2025-01-01'
    }
  ];

  const stats = [
    { label: 'สมาชิกทั้งหมด', value: users.length.toString(), color: 'bg-blue-500', icon: Users },
    { label: 'แคชเชียร์', value: users.filter(u => u.role === 'cashier').length.toString(), color: 'bg-green-500', icon: UserCircle2 },
    { label: 'ช่างจัดดอกไม้', value: users.filter(u => u.role === 'florist').length.toString(), color: 'bg-purple-500', icon: UserCircle2 },
    { label: 'ไรเดอร์', value: users.filter(u => u.role === 'rider').length.toString(), color: 'bg-orange-500', icon: UserCircle2 }
  ];

  const branchOptions = Array.from(new Set(users.map((user) => user.branch)));
  const outstandingMonthOptions = Array.from(
    new Set(users.map((user) => user.performanceMonth).filter(Boolean))
  ).sort();

  const formatMonthLabel = (monthValue: string) => {
    const [year, month] = monthValue.split('-');
    if (!year || !month) return monthValue;
    return `${month}/${year}`;
  };

  const getTopPerformerByRole = (role: string) => {
    const roleUsers = users.filter(
      (user) =>
        user.role === role &&
        (filterBranch === 'all' || user.branch === filterBranch) &&
        (outstandingMonth === 'all' || user.performanceMonth === outstandingMonth)
    );
    if (roleUsers.length === 0) return null;

    return roleUsers.sort((a, b) => {
      const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.assignedJobs || 0) - Number(a.assignedJobs || 0);
    })[0];
  };

  const outstandingCards = [
    { title: 'พนักงานขายดีเด่น (cashier)', user: getTopPerformerByRole('cashier') },
    { title: 'พนักงานจัดดอกไม้ดีเด่น', user: getTopPerformerByRole('florist') },
    { title: 'พนักงานขนส่งดีเด่น', user: getTopPerformerByRole('rider') },
    { title: 'ผู้จัดการสาขาดีเด่น', user: getTopPerformerByRole('manager') },
  ];

  const handleCreateUser = () => {
    console.log('Creating user:', formData);
    setShowCreateModal(false);
    resetForm();
  };

  const handleEditUser = () => {
    console.log('Editing user:', formData);
    setShowEditModal(false);
    setEditingUser(null);
    resetForm();
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบสมาชิกคนนี้?')) {
      console.log('Deleting user:', userId);
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
      branch: user.branch,
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
      executive: { label: 'ผู้บริหาร', color: 'bg-red-100 text-red-800' }
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

  const complaints = [
    {
      id: 'CMP-001',
      orderCode: 'ORD10623591',
      branch: 'พิจิตร',
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
    },
    {
      id: 'CMP-004',
      orderCode: 'ORD10623917',
      branch: 'สงขลา',
      employeeRole: 'manager',
      employeeName: 'สมพร จัดการเก่ง',
      orderScore: 2,
      reason: 'การประสานงานล่าช้า',
      status: 'in-progress'
    }
  ];

  const getComplaintStatusBadge = (status: string) => {
    if (status === 'pending') {
      return <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-800">รอดำเนินการ</span>;
    }
    if (status === 'in-progress') {
      return <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">กำลังแก้ไข</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">แก้ไขสำเร็จ</span>;
  };

  const complaintBranchOptions = Array.from(new Set(complaints.map((item) => item.branch)));

  const filteredComplaints = complaints.filter((complaint) => {
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
                <option value="executive">ผู้บริหาร</option>
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
                  <th className="px-6 py-3 text-left text-sm text-gray-600">วันที่สร้าง</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody>
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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

            {filteredUsers.length === 0 && (
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
                  onChange={(e) => setComplaintStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="pending">รอดำเนินการ</option>
                  <option value="in-progress">กำลังแก้ไข</option>
                  <option value="resolved">แก้ไขสำเร็จ</option>
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
                    <option value="พิจิตร">พิจิตร</option>
                    <option value="แพร่">แพร่</option>
                    <option value="สงขลา">สงขลา</option>
                    <option value="ทุกสาขา">ทุกสาขา</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">บทบาท</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="cashier">แคชเชียร์</option>
                    <option value="florist">ช่างจัดดอกไม้</option>
                    <option value="rider">ไรเดอร์</option>
                    <option value="manager">ผู้จัดการสาขา</option>
                    <option value="executive">ผู้บริหาร</option>
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
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={showCreateModal ? handleCreateUser : handleEditUser}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showCreateModal ? 'เพิ่มสมาชิก' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}