import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  X, 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle2, 
  MessageSquare,
  Tag,
  Calendar,
  CreditCard
} from "lucide-react";

interface Order {
  id: string;
  date: string;
  promo?: string;
  status: 'preparing' | 'shipping' | 'success' | 'cancelled';
  items: Array<{
    emoji: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
  };
  cardMessage?: string;
  deliveryDate?: string;
  trackingSteps: Array<{
    label: string;
    date: string;
    completed: boolean;
  }>;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-2026-0849',
    date: '3 มีนาคม 2026',
    status: 'preparing',
    items: [{ emoji: '🌼', name: 'ช่อดอกเดซี่สีเหลือง', quantity: 2, price: 630 }],
    originalPrice: 1400,
    discountedPrice: 1260,
    savings: 140,
    shippingAddress: {
      name: 'สมชาย ใจดี',
      phone: '086-123-4567',
      address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    },
    deliveryDate: '5 มีนาคม 2026',
    trackingSteps: [
      { label: 'ได้รับคำสั่งซื้อ', date: '3 มีนาคม 2026, 10:30', completed: true },
      { label: 'กำลังจัดเตรียม', date: '3 มีนาคม 2026, 14:00', completed: true },
      { label: 'กำลังจัดส่ง', date: '-', completed: false },
      { label: 'จัดส่งสำเร็จ', date: '-', completed: false },
    ],
  },
  {
    id: 'ORD-2026-0848',
    date: '2 มีนาคม 2026',
    promo: 'GOLD15',
    status: 'shipping',
    items: [{ emoji: '🌷', name: 'แจกันทิวลิปหลากหลายสี', quantity: 1, price: 1402 }],
    originalPrice: 1650,
    discountedPrice: 1402,
    savings: 248,
    shippingAddress: {
      name: 'วิไล สวยงาม',
      phone: '082-987-6543',
      address: '456 ซอยลาดพร้าว 101 แขวงคลองจั่น เขตบางกะปิ กรุงเทพฯ 10240',
    },
    cardMessage: 'สุขสันต์วันเกิดนะคะ ขอให้มีความสุขมากๆ - จากพี่สาว',
    deliveryDate: '4 มีนาคม 2026',
    trackingSteps: [
      { label: 'ได้รับคำสั่งซื้อ', date: '2 มีนาคม 2026, 09:15', completed: true },
      { label: 'กำลังจัดเตรียม', date: '2 มีนาคม 2026, 11:30', completed: true },
      { label: 'กำลังจัดส่ง', date: '3 มีนาคม 2026, 08:00', completed: true },
      { label: 'จัดส่งสำเร็จ', date: '-', completed: false },
    ],
  },
  {
    id: 'ORD-2026-0845',
    date: '28 กุมภาพันธ์ 2026',
    promo: 'LOVE20',
    status: 'success',
    items: [{ emoji: '🌹', name: 'ช่อกุหลาบแดง 12 ดอก', quantity: 1, price: 890 }],
    originalPrice: 1190,
    discountedPrice: 890,
    savings: 300,
    shippingAddress: {
      name: 'ณัฐพร รักดี',
      phone: '089-555-1234',
      address: '789 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
    },
    cardMessage: 'รักเธอมากที่สุดในโลก Happy Anniversary ครบรอบ 5 ปี - รักนะ',
    deliveryDate: '28 กุมภาพันธ์ 2026',
    trackingSteps: [
      { label: 'ได้รับคำสั่งซื้อ', date: '27 กุมภาพันธ์ 2026, 15:20', completed: true },
      { label: 'กำลังจัดเตรียม', date: '27 กุมภาพันธ์ 2026, 17:45', completed: true },
      { label: 'กำลังจัดส่ง', date: '28 กุมภาพันธ์ 2026, 07:30', completed: true },
      { label: 'จัดส่งสำเร็จ', date: '28 กุมภาพันธ์ 2026, 14:20', completed: true },
    ],
  },
  {
    id: 'ORD-2026-0832',
    date: '14 กุมภาพันธ์ 2026',
    promo: 'VDAY50',
    status: 'success',
    items: [{ emoji: '🌷', name: 'ช่อทิวลิปสีชมพู 20 ดอก', quantity: 1, price: 1250 }],
    originalPrice: 1450,
    discountedPrice: 1250,
    savings: 200,
    shippingAddress: {
      name: 'พิมพ์ใจ สุขสันต์',
      phone: '091-222-3456',
      address: '321 ซอยอารีย์ แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400',
    },
    deliveryDate: '14 กุมภาพันธ์ 2026',
    trackingSteps: [
      { label: 'ได้รับคำสั่งซื้อ', date: '13 กุมภาพันธ์ 2026, 08:00', completed: true },
      { label: 'กำลังจัดเตรียม', date: '13 กุมภาพันธ์ 2026, 12:30', completed: true },
      { label: 'กำลังจัดส่ง', date: '14 กุมภาพันธ์ 2026, 06:00', completed: true },
      { label: 'จัดส่งสำเร็จ', date: '14 กุมภาพันธ์ 2026, 10:45', completed: true },
    ],
  },
  {
    id: 'ORD-2026-0821',
    date: '10 กุมภาพันธ์ 2026',
    status: 'success',
    items: [
      { emoji: '🌸', name: 'ช่อดอกซากุระ', quantity: 1, price: 650 },
      { emoji: '🎀', name: 'ริบบิ้นพิเศษ', quantity: 1, price: 130 },
    ],
    originalPrice: 950,
    discountedPrice: 780,
    savings: 170,
    shippingAddress: {
      name: 'มานี มีสุข',
      phone: '084-777-8899',
      address: '567 ถนนเพชรบุรี แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ 10400',
    },
    deliveryDate: '10 กุมภาพันธ์ 2026',
    trackingSteps: [
      { label: 'ได้รับคำสั่งซื้อ', date: '9 กุมภาพันธ์ 2026, 16:00', completed: true },
      { label: 'กำลังจัดเตรียม', date: '10 กุมภาพันธ์ 2026, 08:30', completed: true },
      { label: 'กำลังจัดส่ง', date: '10 กุมภาพันธ์ 2026, 10:00', completed: true },
      { label: 'จัดส่งสำเร็จ', date: '10 กุมภาพันธ์ 2026, 15:30', completed: true },
    ],
  },
  {
    id: 'ORD-2026-0815',
    date: '5 กุมภาพันธ์ 2026',
    promo: 'MEMBER10',
    status: 'success',
    items: [{ emoji: '💐', name: 'ช่อดอกไม้รวมสีสดใส', quantity: 1, price: 1120 }],
    originalPrice: 1250,
    discountedPrice: 1120,
    savings: 130,
    shippingAddress: {
      name: 'สุดา เจริญ',
      phone: '092-333-4567',
      address: '888 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400',
    },
    cardMessage: 'ขอให้หายป่วยเร็วๆนะคะ - เพื่อนรัก',
    deliveryDate: '5 กุมภาพันธ์ 2026',
    trackingSteps: [
      { label: 'ได้รับคำสั่งซื้อ', date: '4 กุมภาพันธ์ 2026, 13:20', completed: true },
      { label: 'กำลังจัดเตรียม', date: '5 กุมภาพันธ์ 2026, 07:00', completed: true },
      { label: 'กำลังจัดส่ง', date: '5 กุมภาพันธ์ 2026, 09:30', completed: true },
      { label: 'จัดส่งสำเร็จ', date: '5 กุมภาพันธ์ 2026, 13:15', completed: true },
    ],
  },
  {
    id: 'ORD-2026-0801',
    date: '1 กุมภาพันธ์ 2026',
    status: 'success',
    items: [{ emoji: '🌻', name: 'ช่อทานตะวัน 10 ดอก', quantity: 2, price: 810 }],
    originalPrice: 1800,
    discountedPrice: 1620,
    savings: 180,
    shippingAddress: {
      name: 'ประทีป สว่าง',
      phone: '085-444-5678',
      address: '234 ซอยรามคำแหง 24 แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240',
    },
    deliveryDate: '1 กุมภาพันธ์ 2026',
    trackingSteps: [
      { label: 'ได้รับคำสั่งซื้อ', date: '31 มกราคม 2026, 10:00', completed: true },
      { label: 'กำลังจัดเตรียม', date: '31 มกราคม 2026, 14:20', completed: true },
      { label: 'กำลังจัดส่ง', date: '1 กุมภาพันธ์ 2026, 08:00', completed: true },
      { label: 'จัดส่งสำเร็จ', date: '1 กุมภาพันธ์ 2026, 11:40', completed: true },
    ],
  },
  {
    id: 'ORD-2026-0795',
    date: '28 มกราคม 2026',
    promo: 'NEWYEAR',
    status: 'success',
    items: [{ emoji: '🌺', name: 'ช่อดอกบัวสีแดง', quantity: 1, price: 690 }],
    originalPrice: 890,
    discountedPrice: 690,
    savings: 200,
    shippingAddress: {
      name: 'วรรณา รุ่งเรือง',
      phone: '088-666-7890',
      address: '999 ถนนศรีนครินทร์ แขวงหนองบอน เขตประเวศ กรุงเทพฯ 10250',
    },
    deliveryDate: '28 มกราคม 2026',
    trackingSteps: [
      { label: 'ได้รับคำสั่งซื้อ', date: '27 มกราคม 2026, 14:30', completed: true },
      { label: 'กำลังจัดเตรียม', date: '28 มกราคม 2026, 07:15', completed: true },
      { label: 'กำลังจัดส่ง', date: '28 มกราคม 2026, 09:00', completed: true },
      { label: 'จัดส่งสำเร็จ', date: '28 มกราคม 2026, 12:50', completed: true },
    ],
  },
  {
    id: 'ORD-2026-0785',
    date: '20 มกราคม 2026',
    status: 'cancelled',
    items: [{ emoji: '🌹', name: 'ช่อกุหลาบขาว', quantity: 1, price: 890 }],
    originalPrice: 990,
    discountedPrice: 890,
    savings: 100,
    shippingAddress: {
      name: 'ชัยวัฒน์ มั่นคง',
      phone: '090-888-9012',
      address: '147 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    },
    deliveryDate: '-',
    trackingSteps: [
      { label: 'ได้รับคำสั่งซื้อ', date: '20 มกราคม 2026, 11:00', completed: true },
      { label: 'ยกเลิกคำสั่งซื้อ', date: '20 มกราคม 2026, 12:30', completed: true },
      { label: 'กำลังจัดส่ง', date: '-', completed: false },
      { label: 'จัดส่งสำเร็จ', date: '-', completed: false },
    ],
  },
];

export function OrdersTab() {
  const [filter, setFilter] = useState<'all' | 'preparing' | 'shipping' | 'success' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = mockOrders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return <Badge className="bg-blue-100 text-blue-700 border-0 hover:bg-blue-100">กำลังจัดเตรียม</Badge>;
      case 'shipping':
        return <Badge className="bg-purple-100 text-purple-700 border-0 hover:bg-purple-100">กำลังจัดส่ง</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">สำเร็จแล้ว</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700 border-0 hover:bg-gray-100">ยกเลิก</Badge>;
    }
  };

  const getStatusCount = (status: Order['status']) => {
    return mockOrders.filter(o => o.status === status).length;
  };

  return (
    <div className="space-y-4">
      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-[#3D6FEB] text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          ทั้งหมด ({mockOrders.length})
        </button>
        <button
          onClick={() => setFilter('preparing')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'preparing'
              ? 'bg-[#3D6FEB] text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          กำลังจัดเตรียม ({getStatusCount('preparing')})
        </button>
        <button
          onClick={() => setFilter('shipping')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'shipping'
              ? 'bg-[#3D6FEB] text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          กำลังจัดส่ง ({getStatusCount('shipping')})
        </button>
        <button
          onClick={() => setFilter('success')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'success'
              ? 'bg-[#3D6FEB] text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          สำเร็จแล้ว ({getStatusCount('success')})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'cancelled'
              ? 'bg-[#3D6FEB] text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          ยกเลิก ({getStatusCount('cancelled')})
        </button>
      </div>

      {/* Order Cards */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{order.id}</p>
                  {order.promo && (
                    <Badge className="bg-[#EEF3FF] text-[#3D6FEB] border-0 hover:bg-[#EEF3FF]">
                      {order.promo}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{order.date}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Items */}
            <div className="mb-4 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">จำนวน: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 line-through mb-1">฿{order.originalPrice.toLocaleString()}</p>
                  <p className="text-xl font-bold text-gray-900">฿{order.discountedPrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-1">ประหยัด</p>
                  <p className="text-lg font-bold text-green-600">฿{order.savings}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setSelectedOrder(order)}
              >
                ดูรายละเอียด
              </Button>
              <Button className="flex-1 bg-[#3D6FEB] hover:bg-[#2D5FDB]">
                สั่งซ้ำ
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">รายละเอียดคำสั่งซื้อ</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Order Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">{selectedOrder.date}</span>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Status Tracking */}
              <div className="bg-[#F0F5FF] rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#3D6FEB]" />
                  การติดตามสถานะ
                </h3>
                <div className="space-y-4">
                  {selectedOrder.trackingSteps.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-[#3D6FEB]' : 'bg-gray-300'
                        }`}>
                          {step.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        {index < selectedOrder.trackingSteps.length - 1 && (
                          <div className={`w-0.5 h-8 ${step.completed ? 'bg-[#3D6FEB]' : 'bg-gray-300'}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-sm text-gray-500">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">รายการสินค้า</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{item.emoji}</span>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">จำนวน: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">฿{item.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#3D6FEB]" />
                  ข้อมูลการจัดส่ง
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{selectedOrder.shippingAddress.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedOrder.shippingAddress.phone}</p>
                  <p className="text-sm text-gray-600 mt-2">{selectedOrder.shippingAddress.address}</p>
                  {selectedOrder.deliveryDate !== '-' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">วันที่จัดส่ง:</span> {selectedOrder.deliveryDate}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Message */}
              {selectedOrder.cardMessage && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#3D6FEB]" />
                    ข้อความการ์ด
                  </h3>
                  <div className="bg-gradient-to-r from-[#EEF3FF] to-[#F0F5FF] rounded-lg p-4 border-l-4 border-[#3D6FEB]">
                    <p className="text-gray-700 italic">&ldquo;{selectedOrder.cardMessage}&rdquo;</p>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#3D6FEB]" />
                  รายละเอียดคำสั่งซื้อ
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ราคาสินค้า</span>
                    <span className="text-gray-900">฿{selectedOrder.originalPrice.toLocaleString()}</span>
                  </div>
                  {selectedOrder.promo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        ส่วนลด ({selectedOrder.promo})
                      </span>
                      <span className="text-green-600">-฿{selectedOrder.savings.toLocaleString()}</span>
                    </div>
                  )}
                  {!selectedOrder.promo && selectedOrder.savings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ส่วนลด</span>
                      <span className="text-green-600">-฿{selectedOrder.savings.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">ยอดรวมทั้งหมด</span>
                      <span className="font-bold text-[#3D6FEB] text-lg">฿{selectedOrder.discountedPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedOrder(null)}
              >
                ปิด
              </Button>
              <Button className="flex-1 bg-[#3D6FEB] hover:bg-[#2D5FDB]">
                สั่งซ้ำ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}