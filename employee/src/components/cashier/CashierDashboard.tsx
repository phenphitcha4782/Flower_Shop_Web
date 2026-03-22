import { CheckCircle, Clock, Eye, LogOut, Search, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  order_id?: string;
  customerName: string;
  phone: string;
  total: number;
  status: string;
  date: string;
  paymentMethod: string;
  memberLevel?: string;
}

interface OrderItem {
  shopping_cart_id: number;
  product_id: number;
  product_name: string;
  product_img: string | null;
  product_type_name: string;
  total_price: number;
  price_total: number;
  flowers: string;
  filler_flower_name: string | null;
  wrapping_name: string | null;
  ribbon_name: string | null;
  ribbon_color_name: string | null;
  card_name: string | null;
  card_message: string | null;
  vase_name: string | null;
  monetary_bouquet_name: string | null;
  folding_style_name: string | null;
  money_amount: number | null;
}

interface OrderDetail {
  order: any;
  items: OrderItem[];
}

interface Employee {
  name: string;
  surname: string;
  branch_id: number;
  employee_id?: number;
}

export default function CashierDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMemberLevel, setFilterMemberLevel] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [branchName, setBranchName] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusLoading, setStatusLoading] = useState<'received' | 'cancelled' | null>(null);
  const [statusError, setStatusError] = useState('');

  const fetchOrders = async (branchId: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/order/branches/${branchId}?status=all`);
      const data = await res.json();
      const mappedOrders = (Array.isArray(data) ? data : []).map((order: any) => ({
        id: order.order_code || order.order_id,
        order_id: order.order_id,
        customerName: order.customer_name || 'Unknown',
        phone: order.phone || '',
        total: Number(order.total_amount) || 0,
        status: order.order_status,
        date: order.created_at ? new Date(order.created_at).toLocaleString('th-TH') : 'N/A',
        paymentMethod: order.payment_method_name || 'Unknown',
        memberLevel: order.membership_level || order.member_level || 'member'
      }));
      setOrders(mappedOrders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  // Load employee data and orders
  useEffect(() => {
    // Load employee data from localStorage
    const savedEmployee = localStorage.getItem('cashier_employee');
    console.log('Saved Employee:', savedEmployee);
    console.log("order",orders)
    if (savedEmployee) {
      const employeeData = JSON.parse(savedEmployee);
      setEmployee(employeeData);
      
      // Fetch branch name
      if (employeeData.branch_id) {
        fetch(`http://localhost:3000/api/branches`)
          .then(res => res.json())
          .then((branches: any[]) => {
            const branch = branches.find(b => b.branch_id === employeeData.branch_id);
            if (branch) {
              setBranchName(branch.branch_name);
            }
          })
          .catch(err => console.error('Failed to load branches:', err));
      }
    }

    // Load orders from backend API
    const employeeData = JSON.parse(savedEmployee || '{}');
    if (employeeData.branch_id) {
      fetchOrders(employeeData.branch_id);
    }


  }, []);

  const handleViewDetails = async (orderId: string) => {
    setStatusError('');
    setLoadingDetail(true);
    try {
      const response = await fetch(`http://localhost:3000/api/order/${orderId}`);
      if (!response.ok) {
        console.error('Failed to fetch order details');
        return;
      }
      const data = await response.json();
      setExpandedOrder(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };



  const handleUpdateOrderStatus = async (nextStatus: 'received' | 'cancelled') => {
    if (!expandedOrder?.order) return;

    const currentStatus = String(expandedOrder.order.order_status || '').toLowerCase();
    if (currentStatus !== 'waiting') {
      setStatusError('คำสั่งซื้อนี้ถูกดำเนินการแล้ว ไม่สามารถอนุมัติหรือปฏิเสธซ้ำได้');
      return;
    }

    const targetIdentifier = expandedOrder.order.order_id || expandedOrder.order.order_code;
    if (!targetIdentifier) {
      setStatusError('ไม่พบรหัสคำสั่งซื้อสำหรับอัปเดตสถานะ');
      return;
    }

    setStatusError('');
    setStatusLoading(nextStatus);
    try {
      const verifiedResult = nextStatus === 'received' ? 'approved' : 'rejected';
      const response = await fetch(`http://localhost:3000/api/order/${targetIdentifier}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: nextStatus,
          employee_id: employee?.employee_id || null,
          verified_result: verifiedResult
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'ไม่สามารถอัปเดตสถานะได้');
      }

      if (employee?.branch_id) {
        await fetchOrders(employee.branch_id);
      }
      setExpandedOrder(null);
    } catch (err: any) {
      setStatusError(err?.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setStatusLoading(null);
    }
  };

  const getItemDetailLines = (item: OrderItem): string[] => {
    const details: string[] = [];
    if (item.flowers && item.flowers !== '-') details.push(`ดอก: ${item.flowers}`);
    if (item.filler_flower_name) details.push(`ดอกพิเศษ: ${item.filler_flower_name}`);
    if (item.vase_name) details.push(`ที่ใส่: ${item.vase_name}`);
    if (item.wrapping_name) details.push(`ห่อมัดกดดำเนิน: ${item.wrapping_name}`);
    if (item.ribbon_name) {
      if (item.ribbon_color_name) {
        details.push(`ริบบิ้น: ${item.ribbon_name} (${item.ribbon_color_name})`);
      } else {
        details.push(`ริบบิ้น: ${item.ribbon_name}`);
      }
    }
    if (item.card_name) {
      if (item.card_message) {
        details.push(`การ์ด: ${item.card_name} - "${item.card_message}"`);
      } else {
        details.push(`การ์ด: ${item.card_name}`);
      }
    }
    if (item.monetary_bouquet_name) details.push(`ชุดถุงเงิน: ${item.monetary_bouquet_name}`);
    if (item.money_amount) details.push(`จำนวนเงิน: ฿${item.money_amount}`);
    if (item.folding_style_name) details.push(`รูปแบบการพับ: ${item.folding_style_name}`);
    return details;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'waiting': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'กำลังรอการยืนยัน'
      },
      'received': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'ยืนยันสำเร็จ'
      },
      'rejected': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'ปฎิเสธ'
      },
      'cancelled': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'ยกเลิกคำสั่งซื้อ'
      }
    };
    const badge = badges[status as keyof typeof badges] || {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: Clock,
      label: status || 'ไม่ทราบสถานะ'
    };
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${badge.bg} ${badge.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesMemberLevel = filterMemberLevel === 'all' || order.memberLevel === filterMemberLevel;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || order.paymentMethod === filterPaymentMethod;
    return matchesSearch && matchesStatus && matchesMemberLevel && matchesPaymentMethod;
  });

  const expandedOrderStatus = String(expandedOrder?.order?.order_status || '').toLowerCase();
  const canTakeAction = expandedOrderStatus === 'waiting';

  const stats = [
    { label: 'กำลังรอการยืนยัน', value: orders.filter(o => o.status === 'waiting').length, color: 'bg-yellow-500' },
    { label: 'ยืนยันสำเร็จ', value: orders.filter(o => o.status === 'received').length, color: 'bg-green-500' },
    { label: 'จำนวนคำสั่งซื้อ', value: orders.length, color: 'bg-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">Cashier Dashboard</h1>
              <p className="text-sm text-gray-600">จัดการและยืนยันคำสั่งซื้อ</p>
              {employee && branchName && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="text-gray-700">สาขา: <span className="font-semibold">{branchName}</span> | พนักงาน: <span className="font-semibold">{employee.name} {employee.surname}</span></span>
                </p>
              )}
            </div>
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

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white text-xl`}>
                  {stat.value}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหารหัสคำสั่งซื้อ"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="waiting">กำลังรอ</option>
                <option value="received">ยืนยันเรียบร้อย</option>
              </select>
              <select
                value={filterMemberLevel}
                onChange={(e) => setFilterMemberLevel(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="all">สมาชิกทั้งหมด</option>
                <option value="member">Member</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="all">วิธีการชำระเงินทั้งหมด</option>
                <option value="Cash">เงินสด</option>
                <option value="Online Payment">ชำระเงินออนไลน์</option>
                <option value="Credit Card">บัตรเครดิต</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">รหัสคำสั่งซื้อ</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">ชื่อลูกค้า</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">จำนวน</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">สถานะ</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">วันที่สั่งซื้อ</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">เพิ่มเติม</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-blue-600">{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900">{order.customerName}</p>
                        <p className="text-sm text-gray-500">{order.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      ฿{order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.date}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(String(order.order_id))}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        disabled={loadingDetail}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {expandedOrder && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
          <div className="bg-[#dff4fb] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div>
                <p className="text-sm text-gray-500">จัดการคำสั่งซื้อ</p>
                <h2 className="text-2xl font-bold text-gray-900">รายละเอียดคำสั่งซื้อ</h2>
              </div>
              <button
                onClick={() => setExpandedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Column */}
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-slate-300">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">รายละเอียดคำสั่งซื้อ</h3>
                    <div className="space-y-3 text-lg">
                      <div className="flex justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-gray-600">รหัสคำสั่งซื้อ :</span>
                        <span className="text-blue-600 font-medium">{expandedOrder.order.order_code}</span>
                      </div>
                      <div className="flex justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-gray-600">วันที่ :</span>
                        <span className="text-gray-900">{new Date(expandedOrder.order.created_at).toLocaleString('th-TH')}</span>
                      </div>
                      <div className="flex justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-gray-600">วิธีการชำระเงิน :</span>
                        <span className="text-gray-900">{expandedOrder.order.payment_method_name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between gap-3 items-center px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-gray-600">สถานะ :</span>
                        {getStatusBadge(expandedOrder.order.order_status)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-slate-300">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">ข้อมูลลูกค้า</h3>
                    <p className="text-lg text-gray-900 font-medium px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">{expandedOrder.order.customer_name || '-'}</p>
                    <p className="text-base text-gray-700 mt-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">{expandedOrder.order.phone || '-'}</p>
                    {expandedOrder.order.receiver_address && (
                      <p className="text-base text-gray-700 mt-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">{expandedOrder.order.receiver_address}</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-slate-300">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">รายการสินค้า</h3>
                    <div className="space-y-4">
                      {expandedOrder.items.map((item, idx) => {
                        const detailLines = getItemDetailLines(item);
                        return (
                          <div key={idx} className="bg-slate-50 rounded-xl p-3 border-2 border-slate-300">
                            <div className="flex gap-3">
                              {item.product_img && (
                                <img
                                  src={item.product_img}
                                  alt={item.product_name}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-base text-gray-900 font-medium truncate">{item.product_name}</p>
                                <p className="text-sm text-blue-600 font-medium">฿ {Number(item.price_total).toFixed(2)}</p>
                                {detailLines.length > 0 && (
                                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                                    {detailLines.map((line, lineIdx) => (
                                      <li key={lineIdx}>• {line}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-3xl text-gray-900">ทั้งหมด :</span>
                      <span className="text-3xl font-semibold text-blue-600">฿ {Number(expandedOrder.order.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-slate-300">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">อนุมัติหรือปฏิเสธคำสั่งซื้อ</h3>
                    {statusError && (
                      <p className="text-sm text-red-600 mb-3">{statusError}</p>
                    )}
                    {canTakeAction ? (
                      <div className="space-y-3">
                        <button
                          type="button"
                          disabled={Boolean(statusLoading)}
                          onClick={() => handleUpdateOrderStatus('received')}
                          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {statusLoading === 'received' ? 'กำลังบันทึก...' : 'อนุมัติคำสั่งซื้อ'}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(statusLoading)}
                          onClick={() => handleUpdateOrderStatus('cancelled')}
                          className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          {statusLoading === 'cancelled' ? 'กำลังบันทึก...' : 'ปฏิเสธคำสั่งซื้อ'}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-gray-700 text-center">
                        คำสั่งซื้อนี้ถูกดำเนินการแล้ว
                      </div>
                    )}
                          
                        </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

