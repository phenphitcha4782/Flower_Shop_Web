import { ArrowLeft, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  code: string;
  date: string;
  customer: string;
  phone: string;
  total: number;
  status: string;
  payment?: string;
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeOrderStatus = (statusRaw?: string) => {
    const status = String(statusRaw || '').toLowerCase();
    if (status === 'canceled') return 'cancelled';
    return status;
  };

  const mapOrderStatusLabel = (statusRaw?: string) => {
    const status = normalizeOrderStatus(statusRaw);
    if (status === 'waiting') return 'กำลังรอ';
    if (status === 'received') return 'รับคำสั่งซื้อ';
    if (status === 'preparing') return 'กำลังจัดเตรียม';
    if (status === 'shipping') return 'กำลังจัดส่ง';
    if (status === 'success') return 'พร้อมรับสินค้า';
    if (status === 'delivered') return 'จัดส่งสำเร็จ';
    if (status === 'cancelled') return 'ยกเลิก';
    return statusRaw || '-';
  };

  const getOrderStatusBadgeClass = (statusRaw?: string) => {
    const status = normalizeOrderStatus(statusRaw);
    if (status === 'waiting') return 'bg-yellow-100 text-yellow-800';
    if (status === 'received') return 'bg-green-100 text-green-800';
    if (status === 'preparing') return 'bg-indigo-100 text-indigo-800';
    if (status === 'shipping') return 'bg-blue-100 text-blue-800';
    if (status === 'success') return 'bg-green-100 text-green-800';
    if (status === 'delivered') return 'bg-green-100 text-green-800';
    if (status === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const statusOptions = [
    { value: 'all', label: 'สถานะทั้งหมด' },
    { value: 'waiting', label: 'กำลังรอ' },
    { value: 'received', label: 'รับคำสั่งซื้อ' },
    { value: 'preparing', label: 'กำลังจัดเตรียม' },
    { value: 'shipping', label: 'กำลังจัดส่ง' },
    { value: 'success', label: 'พร้อมรับสินค้า' },
    { value: 'delivered', label: 'จัดส่งสำเร็จ' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ];

  useEffect(() => {
    const branchId = localStorage.getItem('branch_id');
    if (!branchId) {
      navigate('/manager/login');
      return;
    }

    // Fetch all orders for this branch
    fetch(`http://localhost:3000/api/order/branches/${branchId}?limit=10000`)
      .then(res => res.json())
      .then((rows: any[]) => {
        const mapped = rows.map(r => ({
          id: String(r.order_id),
          code: r.order_code || String(r.order_id),
          date: new Date(r.created_at).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          customer: r.customer_name || '',
          phone: r.phone || '',
          total: Number(r.total_amount || 0),
          status: r.order_status || '',
          payment: r.payment_method_name || 'ไม่ระบุ'
        }));
        setOrders(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load orders:', err);
        setLoading(false);
      });
  }, [navigate]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || normalizeOrderStatus(order.status) === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับสู่แดชบอร์ด</span>
          </button>
          <h1 className="text-2xl text-gray-900">ประวัติคำสั่งซื้อ</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">จำนวนคำสั่งซื้อทั้งหมด</p>
            <p className="text-3xl text-gray-900">{filteredOrders.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">ยอดรวมทั้งหมด</p>
            <p className="text-3xl text-blue-600">฿{totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">คำสั่งซื้อที่เสร็จสมบูรณ์</p>
            <p className="text-3xl text-green-600">
              {filteredOrders.filter(o => o.status === 'delivered').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาด้วยรหัสคำสั่งซื้อหรือชื่อลูกค้า..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">รหัสคำสั่งซื้อ</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">ชื่อลูกค้า</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">ยอดเงิน</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">สถานะ</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">เวลาสั่งซื้อ</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-blue-600">{order.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900">{order.customer}</p>
                        <p className="text-sm text-gray-500">{order.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      ฿{order.total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getOrderStatusBadgeClass(order.status)}`}>
                        {mapOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">{loading ? 'กำลังโหลด...' : 'ไม่พบคำสั่งซื้อ'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}