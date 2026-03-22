// @ts-nocheck
import { CheckCircle, Clock, LogOut, Search, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

interface RiderOrder {
  id: string;
  order_id?: number;
  order_code?: string;
  customerName: string;
  phone: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
  items: string;
  total: number;
  order_status?: string;
  delivery_status?: string;
  assignedTime: string;
}

interface Employee {
  name: string;
  surname: string;
  branch_id: number;
  employee_id?: number;
}

export default function RiderDashboard() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'tasks'>('available');
  const [availableOrders, setAvailableOrders] = useState<RiderOrder[]>([]);
  const [myTasks, setMyTasks] = useState<RiderOrder[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAvailableOrders = async (branchId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/order/branches/${branchId}?status=shipping`);
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map((order: any) => ({
        id: order.order_code || String(order.order_id),
        order_id: order.order_id,
        order_code: order.order_code,
        customerName: order.customer_name || 'Unknown',
        phone: order.phone || '',
        receiver_name: order.receiver_name || order.customer_name || '',
        receiver_phone: order.receiver_phone || order.phone || '',
        receiver_address: order.receiver_address || 'ไม่พบที่อยู่จัดส่ง',
        items: order.ordered_items || 'ไม่พบรายการสินค้า',
        total: Number(order.total_amount) || 0,
        order_status: order.order_status,
        assignedTime: order.created_at ? new Date(order.created_at).toLocaleString('th-TH') : 'N/A',
      }));
      setAvailableOrders(mapped);
    } catch (err) {
      console.error('Failed to load shipping orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async (employeeId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/delivery/employee/${employeeId}`);
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map((task: any) => ({
        id: task.order_code || String(task.order_id),
        order_id: task.order_id,
        order_code: task.order_code,
        customerName: task.customer_name || 'Unknown',
        phone: task.phone || '',
        receiver_name: task.receiver_name || task.customer_name || '',
        receiver_phone: task.receiver_phone || task.phone || '',
        receiver_address: task.receiver_address || 'ไม่พบที่อยู่จัดส่ง',
        items: task.ordered_items || 'ไม่พบรายการสินค้า',
        total: Number(task.total_amount) || 0,
        order_status: task.order_status,
        delivery_status: task.delivery_status,
        assignedTime: task.assigned_at ? new Date(task.assigned_at).toLocaleString('th-TH') : 'N/A',
      }));
      setMyTasks(mapped);
    } catch (err) {
      console.error('Failed to load rider tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedEmployee = localStorage.getItem('rider_employee');
    if (!savedEmployee) {
      navigate('/');
      return;
    }

    const employeeData = JSON.parse(savedEmployee);
    setEmployee(employeeData);

    fetch('http://localhost:3000/api/branches')
      .then((res) => res.json())
      .then((branches: any[]) => {
        const branch = branches.find((b) => b.branch_id === employeeData.branch_id);
        if (branch) setBranchName(branch.branch_name);
      })
      .catch((err) => console.error('Failed to load branches:', err));

    fetchAvailableOrders(employeeData.branch_id);
    if (employeeData.employee_id) {
      fetchMyTasks(employeeData.employee_id);
    }
  }, [navigate]);

  const handleAcceptTask = async (order: RiderOrder) => {
    if (!order.order_id || !employee?.employee_id) return;

    try {
      const response = await fetch('http://localhost:3000/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.order_id,
          employee_id: employee.employee_id,
        }),
      });

      const payload = await response.json().catch(() => ({} as any));
      if (!response.ok) {
        throw new Error(payload?.message || 'ไม่สามารถรับงานจัดส่งได้');
      }

      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'รับงานจัดส่งเรียบร้อย',
        timer: 1400,
        showConfirmButton: false,
      });

      setActiveTab('tasks');
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
        text: err instanceof Error ? err.message : 'ไม่สามารถรับงานจัดส่งได้',
      });
    }
  };

  const filteredAvailable = availableOrders.filter((order) =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = myTasks.filter((task) =>
    task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'งานส่งที่รับได้', value: availableOrders.length, color: 'bg-blue-500', icon: Truck },
    { label: 'งานที่รับแล้ว', value: myTasks.length, color: 'bg-yellow-500', icon: Clock },
    { label: 'รวมทั้งหมด', value: availableOrders.length + myTasks.length, color: 'bg-green-500', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">Rider Dashboard</h1>
              <p className="text-sm text-gray-600">จัดการงานจัดส่ง</p>
              {employee && branchName && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="text-gray-700">สาขา: <span className="font-semibold">{branchName}</span> | พนักงาน: <span className="font-semibold">{employee.name} {employee.surname}</span></span>
                </p>
              )}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('rider_employee');
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

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('available')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === 'available' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              งานที่พร้อมจัดส่ง ({availableOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === 'tasks' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              งานที่รับแล้ว ({myTasks.length})
            </button>
          </div>

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

        {loading && (
          <div className="text-center py-6 text-gray-600">กำลังโหลดข้อมูล...</div>
        )}

        {!loading && activeTab === 'available' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAvailable.length === 0 ? (
              <div className="lg:col-span-2 text-center py-10 text-gray-500">ไม่มีงานจัดส่งที่พร้อมรับ</div>
            ) : (
              filteredAvailable.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
                  <h3 className="text-xl text-blue-600 mb-1">{order.id}</h3>
                  <p className="text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-600 mb-3">{order.phone || '-'}</p>

                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">ผู้รับ :</p>
                    <p className="text-sm text-gray-900">{order.receiver_name || order.customerName || '-'}</p>
                    <p className="text-sm text-gray-900 mb-2">{order.receiver_phone || order.phone || '-'}</p>
                    <p className="text-sm text-gray-600 mb-1">ที่อยู่จัดส่ง :</p>
                    <p className="text-sm text-gray-900">{order.receiver_address || '-'}</p>
                    <p className="text-sm text-gray-600 mt-2 mb-1">รายการสินค้า :</p>
                    <p className="text-sm text-gray-900">{order.items || '-'}</p>
                  </div>

                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-600">วันที่สั่ง :</span>
                    <span className="text-gray-900">{order.assignedTime}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                    <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">พร้อมจัดส่ง</span>
                    <button
                      onClick={() => handleAcceptTask(order)}
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

        {!loading && activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTasks.length === 0 ? (
              <div className="lg:col-span-2 text-center py-10 text-gray-500">ยังไม่มีงานที่รับไว้</div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
                  <h3 className="text-xl text-blue-600 mb-1">{task.id}</h3>
                  <p className="text-gray-900">{task.customerName}</p>
                  <p className="text-sm text-gray-600 mb-3">{task.phone || '-'}</p>

                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">ผู้รับ :</p>
                    <p className="text-sm text-gray-900">{task.receiver_name || task.customerName || '-'}</p>
                    <p className="text-sm text-gray-900 mb-2">{task.receiver_phone || task.phone || '-'}</p>
                    <p className="text-sm text-gray-600 mb-1">ที่อยู่จัดส่ง :</p>
                    <p className="text-sm text-gray-900">{task.receiver_address || '-'}</p>
                    <p className="text-sm text-gray-600 mt-2 mb-1">รายการสินค้า :</p>
                    <p className="text-sm text-gray-900">{task.items || '-'}</p>
                  </div>

                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-600">เวลาที่รับ :</span>
                    <span className="text-gray-900">{task.assignedTime}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                    <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">กำลังจัดส่ง</span>
                    <button
                      onClick={() => navigate(`/rider/delivery/${task.order_id}`)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      เปิดงาน
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
