import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, MapPin, Phone, User, XCircle } from 'lucide-react';

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

const inferFulfillmentMethodLabel = (receiverAddressRaw?: string) => {
  const receiverAddress = String(receiverAddressRaw || '').trim();
  if (!receiverAddress || receiverAddress === 'ที่ร้าน') return 'รับที่ร้าน';
  return 'จัดส่ง';
};

export default function CashierOrderDetail() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState<'received' | 'cancelled' | null>(null);
  const [statusError, setStatusError] = useState('');

  const fetchDetail = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/order/${orderId}`);
      if (!response.ok) {
        throw new Error('ไม่พบคำสั่งซื้อ');
      }
      const data = await response.json();
      setDetail(data);
    } catch (err) {
      console.error('Failed to load order detail:', err);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [orderId]);

  const getItemDetailLines = (item: OrderItem): string[] => {
    const details: string[] = [];
    if (item.flowers && item.flowers !== '-') details.push(`ดอก: ${item.flowers}`);
    if (item.filler_flower_name) details.push(`ดอกแซม: ${item.filler_flower_name}`);
    if (item.vase_name) details.push(`ทรงแจกัน: ${item.vase_name}`);
    if (item.wrapping_name) details.push(`กระดาษห่อ: ${item.wrapping_name}`);
    if (item.ribbon_name) {
      details.push(item.ribbon_color_name ? `ริบบิ้น: ${item.ribbon_name} (${item.ribbon_color_name})` : `ริบบิ้น: ${item.ribbon_name}`);
    }
    if (item.card_name) {
      details.push(item.card_message ? `การ์ด: ${item.card_name} - "${item.card_message}"` : `การ์ด: ${item.card_name}`);
    }
    if (item.monetary_bouquet_name) details.push(`ช่อเงิน: ${item.monetary_bouquet_name}`);
    if (item.money_amount) details.push(`จำนวนเงิน: ฿${item.money_amount.toLocaleString()}`);
    if (item.folding_style_name) details.push(`รูปแบบการพับ: ${item.folding_style_name}`);
    return details;
  };

  const getStatusBadge = (statusRaw: string) => {
    const status = String(statusRaw || '').toLowerCase();
    const badges = {
      waiting: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'กำลังรอการยืนยัน' },
      received: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'ยืนยันสำเร็จ' },
      preparing: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: Clock, label: 'กำลังจัดเตรียม' },
      shipping: { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: Clock, label: 'กำลังจัดส่ง' },
      delivered: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'จัดส่งสำเร็จ' },
      success: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'จัดส่งสำเร็จ' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'ยกเลิกคำสั่งซื้อ' },
      canceled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'ยกเลิกคำสั่งซื้อ' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'ปฏิเสธ' },
    } as const;
    const badge = badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: statusRaw || '-' };
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${badge.bg} ${badge.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const handleUpdateOrderStatus = async (nextStatus: 'received' | 'cancelled') => {
    if (!detail?.order) return;

    const currentStatus = String(detail.order.order_status || '').toLowerCase();
    if (currentStatus !== 'waiting') {
      setStatusError('คำสั่งซื้อนี้ถูกดำเนินการแล้ว ไม่สามารถอนุมัติหรือปฏิเสธซ้ำได้');
      return;
    }

    setStatusError('');
    setStatusLoading(nextStatus);
    try {
      const targetIdentifier = detail.order.order_id || detail.order.order_code;
      const employeeRaw = localStorage.getItem('cashier_employee');
      const employee = employeeRaw ? JSON.parse(employeeRaw) : null;
      const verifiedResult = nextStatus === 'received' ? 'approved' : 'rejected';

      const response = await fetch(`http://localhost:3000/api/order/${targetIdentifier}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          employee_id: employee?.employee_id || null,
          verified_result: verifiedResult,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'ไม่สามารถอัปเดตสถานะได้');
      }

      await fetchDetail();
    } catch (err: any) {
      setStatusError(err?.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setStatusLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center text-gray-700">กำลังโหลดรายละเอียดคำสั่งซื้อ...</div>
      </div>
    );
  }

  if (!detail?.order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl text-gray-900 mb-2">ไม่พบคำสั่งซื้อ</h2>
          <p className="text-gray-600 mb-6">ไม่พบคำสั่งซื้อที่ต้องการดู</p>
          <button
            onClick={() => navigate('/cashier/dashboard')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = String(detail.order.order_status || '').toLowerCase();
  const canTakeAction = currentStatus === 'waiting';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/cashier/dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับสู่หน้าหลัก</span>
          </button>
          <h1 className="text-2xl text-gray-900">รายละเอียดคำสั่งซื้อ</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-slate-300">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">รายละเอียดคำสั่งซื้อ</h3>
              <div className="space-y-3 text-lg">
                <div className="flex justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-gray-600">รหัสคำสั่งซื้อ :</span>
                  <span className="text-blue-600 font-medium">{detail.order.order_code}</span>
                </div>
                <div className="flex justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-gray-600">วันที่ :</span>
                  <span className="text-gray-900">{detail.order.created_at ? new Date(detail.order.created_at).toLocaleString('th-TH') : '-'}</span>
                </div>
                <div className="flex justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-gray-600">วิธีการรับสินค้า :</span>
                  <span className="text-gray-900">{inferFulfillmentMethodLabel(detail.order.receiver_address)}</span>
                </div>
                <div className="flex justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-gray-600">วิธีการชำระเงิน :</span>
                  <span className="text-gray-900">{detail.order.payment_method_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between gap-3 items-center px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-gray-600">สถานะ :</span>
                  {getStatusBadge(detail.order.order_status)}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-slate-300">
              <h3 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                ข้อมูลลูกค้า
              </h3>
              <p className="text-lg text-gray-900 font-medium px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">{detail.order.customer_name || '-'}</p>
              <p className="text-base text-gray-700 mt-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {detail.order.phone || '-'}
              </p>
              {detail.order.receiver_address && detail.order.receiver_address !== 'ที่ร้าน' && (
                <p className="text-base text-gray-700 mt-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {detail.order.receiver_address}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-slate-300">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">รายการสินค้า</h3>
              <div className="space-y-4">
                {detail.items.map((item, idx) => {
                  const detailLines = getItemDetailLines(item);
                  return (
                    <div key={item.shopping_cart_id || idx} className="bg-slate-50 rounded-xl p-3 border-2 border-slate-300">
                      <div className="flex gap-3">
                        {item.product_img && (
                          <img
                            src={item.product_img}
                            alt={item.product_name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-base text-gray-900 font-medium truncate">{item.product_type_name} ({item.product_name})</p>
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
                <span className="text-3xl font-semibold text-blue-600">฿ {Number(detail.order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

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
  );
}
