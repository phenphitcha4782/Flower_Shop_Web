import { CheckCircle, Clock, Download, LogOut, Package, Search, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

interface Order {
  id: string;
  order_code?: string;
  order_id?: number;
  customerName: string;
  customer_name?: string;
  items: string;
  ordered_items?: string;
  receiver_name?: string;
  receiver_phone?: string;
  status: string;
  order_status?: string;
  assignedTime: string;
  created_at?: string;
  dueTime: string;
  completedTime?: string;
  total: number;
  total_amount?: number;
  phone: string;
  receiver_address?: string;
  branch_id?: number;
}

interface PrepareTask extends Order {
  prepare_id?: number;
  florist_photo_url?: string;
  prepare_status?: string;
  assigned_at?: string;
  completed_at?: string;
}

interface OrderItemDetail {
  shopping_cart_id?: number;
  product_name?: string;
  product_type_name?: string;
  flowers?: string;
  filler_flower_name?: string | null;
  wrapping_name?: string | null;
  ribbon_name?: string | null;
  ribbon_color_name?: string | null;
  card_name?: string | null;
  card_message?: string | null;
  vase_name?: string | null;
  monetary_bouquet_name?: string | null;
  folding_style_name?: string | null;
  money_amount?: number | null;
}

interface Employee {
  name: string;
  surname: string;
  branch_id: number;
  employee_id?: number;
}

export default function FloristDashboard() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'tasks'>('available');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myTasks, setMyTasks] = useState<PrepareTask[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [branchName, setBranchName] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [orderItemsByOrderId, setOrderItemsByOrderId] = useState<Record<number, OrderItemDetail[]>>({});

  const fetchOrderDetailItems = async (orderId: number) => {
    if (!orderId || orderItemsByOrderId[orderId]) return;
    try {
      const res = await fetch(`http://localhost:3000/api/order/${orderId}`);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      setOrderItemsByOrderId((prev) => ({ ...prev, [orderId]: items }));
    } catch (err) {
      console.error('Failed to load order detail items:', err);
    }
  };

  // Fetch available orders (status: received)
  const fetchAvailableOrders = async (branchId: number) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:3000/api/order/branches/${branchId}?status=received`);
      const data = await res.json();
      const mappedOrders = (Array.isArray(data) ? data : [])
        .filter((order: any) => order.order_status === 'received')
        .map((order: any) => ({
          id: order.order_code || order.order_id,
          order_id: order.order_id,
          order_code: order.order_code,
          customerName: order.customer_name || 'Unknown',
          customer_name: order.customer_name,
          items: order.ordered_items || 'ไม่พบรายการสินค้า',
          ordered_items: order.ordered_items || '',
          receiver_name: order.receiver_name || order.customer_name || '',
          receiver_phone: order.receiver_phone || order.phone || '',
          status: 'received',
          order_status: order.order_status,
          assignedTime: order.created_at ? new Date(order.created_at).toLocaleString('th-TH') : 'N/A',
          created_at: order.created_at,
          dueTime: 'รอการรับงาน',
          total: Number(order.total_amount) || 0,
          total_amount: order.total_amount,
          phone: order.phone || '',
          receiver_address: order.receiver_address || 'ไม่พบที่อยู่จัดส่ง'
        }));
      setAvailableOrders(mappedOrders);
    } catch (err) {
      console.error('Failed to load available orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch my assigned tasks (from prepare table)
  const fetchMyTasks = async (employeeId: number) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:3000/api/prepare/employee/${employeeId}`);
      const data = await res.json();
      const mappedTasks = (Array.isArray(data) ? data : [])
        .map((task: any) => ({
          id: task.order_code || task.order_id,
          order_id: task.order_id,
          order_code: task.order_code,
          prepare_id: task.prepare_id,
          customerName: task.customer_name || 'Unknown',
          customer_name: task.customer_name,
          items: task.ordered_items || 'ไม่พบรายการสินค้า',
          ordered_items: task.ordered_items || '',
          receiver_name: task.receiver_name || task.customer_name || '',
          receiver_phone: task.receiver_phone || task.phone || '',
          status: 'preparing',
          order_status: task.order_status,
          prepare_status: task.prepare_status,
          florist_photo_url: task.florist_photo_url,
          assignedTime: task.assigned_at ? new Date(task.assigned_at).toLocaleString('th-TH') : 'N/A',
          created_at: task.created_at,
          assigned_at: task.assigned_at,
          completed_at: task.completed_at,
          dueTime: 'ต้องจัดเตรียม',
          total: Number(task.total_amount) || 0,
          total_amount: task.total_amount,
          phone: task.phone || '',
          receiver_address: task.receiver_address || 'ไม่พบที่อยู่จัดส่ง'
        }));
      setMyTasks(mappedTasks);
    } catch (err) {
      console.error('Failed to load my tasks:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load employee data and orders on mount
  useEffect(() => {
    const savedEmployee = localStorage.getItem('florist_employee');
    if (savedEmployee) {
      const employeeData = JSON.parse(savedEmployee);
      setEmployee(employeeData);
      
      // Fetch branch name
      fetch(`http://localhost:3000/api/branches`)
        .then(res => res.json())
        .then((branches: any[]) => {
          const branch = branches.find(b => b.branch_id === employeeData.branch_id);
          if (branch) {
            setBranchName(branch.branch_name);
          }
        })
        .catch(err => console.error('Failed to load branches:', err));

      // Load both available orders and my tasks
      fetchAvailableOrders(employeeData.branch_id);
      if (employeeData.employee_id) {
        fetchMyTasks(employeeData.employee_id);
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const orderIds = [
      ...availableOrders.map((order) => Number(order.order_id)).filter((id) => Number.isFinite(id) && id > 0),
      ...myTasks.map((task) => Number(task.order_id)).filter((id) => Number.isFinite(id) && id > 0),
    ];
    const uniqueOrderIds = Array.from(new Set(orderIds));
    uniqueOrderIds.forEach((orderId) => {
      if (!orderItemsByOrderId[orderId]) {
        fetchOrderDetailItems(orderId);
      }
    });
  }, [availableOrders, myTasks]);

  // Accept order - move from available to my tasks
  const handleAcceptOrder = async (order: Order) => {
    if (!order.order_id || !employee?.employee_id) return;

    try {
      const response = await fetch(`http://localhost:3000/api/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.order_id,
          employee_id: employee.employee_id
        })
      });

      const payload = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to accept order');
      }

      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'รับงานเรียบร้อย',
        timer: 1500,
        showConfirmButton: false
      });

      // Reload both lists
      if (employee?.branch_id) {
        fetchAvailableOrders(employee.branch_id);
      }
      if (employee?.employee_id) {
        fetchMyTasks(employee.employee_id);
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: err instanceof Error ? err.message : 'ไม่สามารถรับงาน'
      });
    }
  };

  // Complete task - upload photo and mark done
  const handleCompleteTask = async (task: PrepareTask) => {
    if (!task.order_id || !employee?.employee_id) return;

    const { value: photoFile } = await Swal.fire({
      title: 'อัพโหลดรูปการจัดเตรียม',
      input: 'file',
      inputLabel: 'เลือกไฟล์รูปภาพ',
      inputAttributes: {
        accept: 'image/*',
      },
      showCancelButton: true,
      confirmButtonText: 'อัพโหลด',
      preConfirm: (file) => {
        if (!file) {
          Swal.showValidationMessage('กรุณาเลือกไฟล์รูปภาพ');
          return null;
        }
        return file;
      }
    });

    if (!photoFile) return;

    setUploadingPhoto(task.order_id || null);

    try {
      const formData = new FormData();
      formData.append('florist_photo', photoFile);
      formData.append('employee_id', String(employee.employee_id));

      const response = await fetch(`http://localhost:3000/api/prepare/${task.order_id}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'บันทึกการจัดเตรียมเรียบร้อย',
        timer: 1500,
        showConfirmAccount: false
      });

      // Reload both lists
      if (employee?.branch_id) {
        fetchAvailableOrders(employee.branch_id);
      }
      if (employee?.employee_id) {
        fetchMyTasks(employee.employee_id);
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: err instanceof Error ? err.message : 'ไม่สามารถบันทึกการจัดเตรียม'
      });
    } finally {
      setUploadingPhoto(null);
    }
  };

  const filteredAvailableOrders = availableOrders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMyTasks = myTasks.filter(task =>
    task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'งานที่สามารถรับได้', value: availableOrders.length, color: 'bg-red-500', icon: Clock },
    { label: 'งานที่รับแล้ว', value: myTasks.length, color: 'bg-yellow-500', icon: Package },
    { label: 'รวมทั้งหมด', value: availableOrders.length + myTasks.length, color: 'bg-green-500', icon: CheckCircle }
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      'received': { bg: 'bg-red-100', text: 'text-red-800', label: 'พร้อมสำหรับรับงาน' },
      'preparing': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'กำลังจัดเตรียม' }
    };
    const badge = badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const renderOrderItems = (orderId?: number, fallback?: string) => {
    const items = orderId ? orderItemsByOrderId[orderId] : undefined;
    if (!items || items.length === 0) {
      return <p className="text-gray-900 text-sm mb-3">{fallback || '-'}</p>;
    }

    return (
      <div className="space-y-2 mb-3">
        {items.map((item, index) => (
          <div key={`${orderId}-detail-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-sm text-gray-900">
              <span className="font-medium">สินค้า:</span> {item.product_name || '-'}
              {item.product_type_name ? ` (${item.product_type_name})` : ''}
            </p>
            {item.flowers && item.flowers !== '-' && <p className="text-sm text-gray-800"><span className="font-medium">ดอกหลัก:</span> {item.flowers}</p>}
            {item.filler_flower_name && <p className="text-sm text-gray-800"><span className="font-medium">ดอกแซม:</span> {item.filler_flower_name}</p>}
            {item.wrapping_name && <p className="text-sm text-gray-800"><span className="font-medium">ช่อ/ห่อ:</span> {item.wrapping_name}</p>}
            {(item.ribbon_name || item.ribbon_color_name) && (
              <p className="text-sm text-gray-800">
                <span className="font-medium">ริบบิ้น:</span> {item.ribbon_name || '-'}
                {item.ribbon_color_name ? ` (${item.ribbon_color_name})` : ''}
              </p>
            )}
            {item.vase_name && <p className="text-sm text-gray-800"><span className="font-medium">ทรงแจกัน:</span> {item.vase_name}</p>}
            {item.card_name && <p className="text-sm text-gray-800"><span className="font-medium">การ์ด:</span> {item.card_name}</p>}
            {item.card_message && <p className="text-sm text-gray-800"><span className="font-medium">ข้อความ:</span> {item.card_message}</p>}
            {item.monetary_bouquet_name && <p className="text-sm text-gray-800"><span className="font-medium">ช่อเงิน:</span> {item.monetary_bouquet_name}</p>}
            {item.folding_style_name && <p className="text-sm text-gray-800"><span className="font-medium">ทรงพับเงิน:</span> {item.folding_style_name}</p>}
            {item.money_amount !== null && item.money_amount !== undefined && (
              <p className="text-sm text-gray-800"><span className="font-medium">จำนวนเงิน:</span> {Number(item.money_amount).toLocaleString('th-TH')}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">Florist Dashboard</h1>
              <p className="text-sm text-gray-600">จัดเตรียมดอกไม้</p>
              {employee && branchName && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="text-gray-700">สาขา: <span className="font-semibold">{branchName}</span> | พนักงาน: <span className="font-semibold">{employee.name} {employee.surname}</span></span>
                </p>
              )}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('florist_employee');
                navigate('/');
              }}
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
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('available')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === 'available'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              งานที่สามารถรับได้ ({availableOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === 'tasks'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              งานที่ต้องจัดเตรียม ({myTasks.length})
            </button>
          </div>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารหัสคำสั่งซื้อหรือชื่อลูกค้า"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Content by Tab */}
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAvailableOrders.length === 0 ? (
              <div className="lg:col-span-2 text-center py-12">
                <p className="text-gray-500 text-lg">ไม่มีงานที่พร้อมสำหรับรับ</p>
              </div>
            ) : (
              filteredAvailableOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl text-blue-600 mb-1">{order.id}</h3>
                      <p className="text-gray-900">{order.customerName}</p>
                      {order.phone && <p className="text-sm text-gray-600">{order.phone}</p>}
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">รายการที่ลูกค้าสั่ง :</p>
                    {renderOrderItems(order.order_id, order.items)}
                    <p className="text-sm text-gray-600 mb-1">ผู้รับ :</p>
                    <p className="text-gray-900 text-sm">{order.receiver_name || order.customerName || '-'}</p>
                    <p className="text-gray-900 text-sm mb-3">{order.receiver_phone || order.phone || '-'}</p>
                    <p className="text-sm text-gray-600 mb-1">ที่อยู่จัดส่ง :</p>
                    <p className="text-gray-900 text-sm">{order.receiver_address || 'N/A'}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">วันที่สั่ง :</span>
                      <span className="text-gray-900">{order.assignedTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">จำนวนเงิน :</span>
                      <span className="text-gray-900 font-semibold">฿{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                    {getStatusBadge(order.order_status)}
                    <button 
                      onClick={() => handleAcceptOrder(order)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      รับงาน
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMyTasks.length === 0 ? (
              <div className="lg:col-span-2 text-center py-12">
                <p className="text-gray-500 text-lg">ไม่มีงานที่ต้องจัดเตรียม</p>
              </div>
            ) : (
              filteredMyTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl text-blue-600 mb-1">{task.id}</h3>
                      <p className="text-gray-900">{task.customerName}</p>
                      {task.phone && <p className="text-sm text-gray-600">{task.phone}</p>}
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">รายการที่ลูกค้าสั่ง :</p>
                    {renderOrderItems(task.order_id, task.items)}
                    <p className="text-sm text-gray-600 mb-1">ผู้รับ :</p>
                    <p className="text-gray-900 text-sm">{task.receiver_name || task.customerName || '-'}</p>
                    <p className="text-gray-900 text-sm mb-3">{task.receiver_phone || task.phone || '-'}</p>
                    <p className="text-sm text-gray-600 mb-1">ที่อยู่จัดส่ง :</p>
                    <p className="text-gray-900 text-sm">{task.receiver_address || 'N/A'}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">เวลาที่รับ :</span>
                      <span className="text-gray-900">{task.assignedTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">จำนวนเงิน :</span>
                      <span className="text-gray-900 font-semibold">฿{task.total.toFixed(2)}</span>
                    </div>
                    {task.florist_photo_url && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">รูปภาพ :</span>
                        <a href={task.florist_photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          ดูรูป
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                    {getStatusBadge(task.order_status)}
                    <button 
                      onClick={() => handleCompleteTask(task)}
                      disabled={uploadingPhoto === task.order_id}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingPhoto === task.order_id ? 'กำลังส่ง...' : 'จัดเตรียมเสร็จ'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
