import { CheckCircle, Clock, Home, MapPin, Package, Phone, Search, Truck, User } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { OrderData } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface OrderTrackingProps {
  savedOrders: OrderData[];
  onBackToHome: () => void;
}

type OrderStatus = 'waiting' | 'received' | 'preparing' | 'shipping' | 'delivered';

export function OrderTracking({ savedOrders, onBackToHome }: OrderTrackingProps) {
  const [searchOrderId, setSearchOrderId] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('waiting');

  const handleSearch = async () => {
    const data = await searchOrder(searchOrderId);
    console.log("search data", data);
    if (data.message === "พบคำสั่งซื้อ") {
      setCurrentOrder(data);
      console.log("currentOrder", data);
      const nextStatus = String(data.order.order_status || '').toLowerCase();
      if (
        nextStatus === 'waiting' ||
        nextStatus === 'received' ||
        nextStatus === 'preparing' ||
        nextStatus === 'shipping' ||
        nextStatus === 'delivered'
      ) {
        setOrderStatus(nextStatus as OrderStatus);
      } else {
        setOrderStatus('waiting');
      }
    } else {
      setCurrentOrder(null);
      NotFoundAlert();
    }
  };

  async function searchOrder(orderCode: string) {
    const res = await fetch("http://localhost:3000/api/orders/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_code: orderCode }),
    });
      const data = await res.json();
      return data;
      
  }

  const NotFoundAlert = () => {
    Swal.fire({
        icon: 'error',
        title: 'ไม่พบคำสั่งซื้อ',
        text: 'กรุณาตรวจสอบรหัสคำสั่งซื้ออีกครั้ง',
    });
  }

  const statusSteps = [
    { status: 'waiting', label: 'กำลังรอยืนยัน', icon: Clock },
    { status: 'received', label: 'รับคำสั่งซื้อ', icon: Package },
    { status: 'preparing', label: 'กำลังจัดเตรียม', icon: Clock },
    { status: 'shipping', label: 'กำลังจัดส่ง', icon: Truck },
    { status: 'delivered', label: 'จัดส่งสำเร็จ', icon: CheckCircle },
  ];

  const getStatusIndex = (status: OrderStatus): number => {
    const index = statusSteps.findIndex(step => step.status === status);
    return index >= 0 ? index : 0;
  };

  const currentStatusIndex = getStatusIndex(orderStatus);

  const getItemDetailLines = (item: any): string[] => {
    const lines: string[] = [];

    if (item.flowers && item.flowers !== '-') {
      lines.push(`ดอกไม้หลัก: ${item.flowers}`);
    }
    if (item.filler_flower_name) {
      lines.push(`ดอกแซม: ${item.filler_flower_name}`);
    }
    if (item.vase_name) {
      lines.push(`ทรงแจกัน: ${item.vase_name}`);
    }
    if (item.wrapping_name) {
      lines.push(`กระดาษห่อ: ${item.wrapping_name}`);
    }
    if (item.ribbon_name || item.ribbon_color_name) {
      lines.push(`ริบบิ้น: ${[item.ribbon_name, item.ribbon_color_name].filter(Boolean).join(' ')}`);
    }
    if (item.card_name) {
      lines.push(`การ์ด: ${item.card_name}`);
    }
    if (item.card_message) {
      lines.push(`ข้อความการ์ด: "${item.card_message}"`);
    }
    if (item.monetary_bouquet_name) {
      lines.push(`ธนบัตร: ${item.monetary_bouquet_name}`);
    }
    if (item.money_amount) {
      lines.push(`จำนวนเงิน: ฿${Number(item.money_amount).toLocaleString()}`);
    }
    if (item.folding_style_name) {
      lines.push(`วิธีพับ: ${item.folding_style_name}`);
    }

    if (lines.length === 0) {
      lines.push('ไม่มีรายละเอียดเพิ่มเติม');
    }

    return lines;
  };



  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">ตรวจสอบคำสั่งซื้อ</h1>
          <p className="text-gray-600">ค้นหาคำสั่งซื้อของคุณด้วยรหัสคำสั่งซื้อ</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              placeholder="กรอกรหัสคำสั่งซื้อ (เช่น ORD12345678)"
              className="flex-1 px-4 py-3 rounded-xl border-2 outline-none transition-all"
              style={{
                borderColor: searchOrderId ? '#AEE6FF' : '#e5e7eb',
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-xl text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#AEE6FF' }}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Details */}
        {currentOrder?.records && (
          <>
            {/* Status Timeline */}
            <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
              <h3 className="mb-6 text-gray-800">สถานะคำสั่งซื้อ</h3>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 w-full h-1 bg-gray-200">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      backgroundColor: '#AEE6FF',
                      width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* Status Steps */}
                <div className="relative flex justify-between">
                  {statusSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;

                    return (
                      <div key={step.status} className="flex flex-col items-center">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all border-2"
                          style={{
                            backgroundColor: isCompleted ? '#AEE6FF' : 'white',
                            borderColor: isCompleted ? '#AEE6FF' : '#e5e7eb',
                          }}
                        >
                          <StepIcon
                            className="w-6 h-6"
                            style={{ color: isCompleted ? 'white' : '#9ca3af' }}
                          />
                        </div>
                        <p
                          className="text-xs text-center max-w-20"
                          style={{ 
                            color: isCurrent ? '#AEE6FF' : isCompleted ? '#374151' : '#9ca3af',
                            fontWeight: isCurrent ? '600' : '400'
                          }}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
              <h3 className="mb-4 text-gray-800">รายละเอียดคำสั่งซื้อ</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">รหัสคำสั่งซื้อ</p>
                    <p className="text-gray-900">{currentOrder.order.order_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">สาขา</p>
                    <p className="text-gray-900">{currentOrder.order.branch_name}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">จำนวนสินค้า</p>
                    <p className="text-gray-900">{currentOrder.records.length} รายการ</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ยอดรวม</p>
                    <p className="text-gray-900">฿{currentOrder.order.total_amount}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t pt-4">
                <h4 className="mb-4 text-gray-800">รายการสินค้า</h4>
                <div className="space-y-3">
                  {currentOrder.records.map((item) => (
                    <div key={item.shopping_cart_id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={item.product_img || undefined}
                          alt={item.product_name || 'สินค้า'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm mb-1">
                          {item.product_type_name} ({item.product_name})
                        </p>
                        <div className="space-y-0.5">
                          {getItemDetailLines(item).map((line) => (
                            <p key={`${item.shopping_cart_id}-${line}`} className="text-xs text-gray-600">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-gray-900 text-sm">
                        ฿{item.price_total.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
              <h3 className="mb-4 text-gray-800">ข้อมูลการจัดส่ง</h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <User className="w-5 h-5 flex-shrink-0" style={{ color: '#AEE6FF' }} />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ชื่อผู้รับ</p>
                    <p className="text-gray-900">{currentOrder.order.receiver_name}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: '#AEE6FF' }} />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ที่อยู่จัดส่ง</p>
                    <p className="text-gray-900">{currentOrder.order.receiver_address}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0" style={{ color: '#AEE6FF' }} />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">เบอร์โทรศัพท์</p>
                    <p className="text-gray-900">{currentOrder.order.receiver_phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Back to Home Button */}
        <button
          onClick={onBackToHome}
          className="w-full py-4 rounded-xl bg-white border-2 text-gray-700 flex items-center justify-center gap-2 transition-all hover:bg-gray-50"
          style={{ borderColor: '#AEE6FF' }}
        >
          <Home className="w-5 h-5" />
          กลับไปหน้าแรก
        </button>

        {/* Help Text */}
        {!currentOrder && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              หากคุณมีปัญหาในการค้นหาคำสั่งซื้อ กรุณาติดต่อเรา
            </p>
          </div>
        )}
      </div>
    </div>
  );
}