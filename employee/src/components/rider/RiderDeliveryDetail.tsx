import { ArrowLeft, CheckCircle, MapPin, Phone, Upload, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

interface DeliveryDetail {
  order_id: number;
  order_code: string;
  order_status: string;
  total_amount: number;
  created_at?: string;
  customer_name?: string;
  phone?: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
  delivery_id?: number;
  employee_id?: number;
  delivery_status?: string;
  rider_photo_url?: string;
  assigned_at?: string;
  completed_at?: string;
}

interface OrderItem {
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

export default function RiderDeliveryDetail() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const orderIdNumber = useMemo(() => Number(orderId), [orderId]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!Number.isFinite(orderIdNumber) || orderIdNumber <= 0) {
        setLoading(false);
        return;
      }

      try {
        const [deliveryRes, orderRes] = await Promise.all([
          fetch(`http://localhost:3000/api/delivery/order/${orderIdNumber}`),
          fetch(`http://localhost:3000/api/order/${orderIdNumber}`),
        ]);

        const deliveryData = await deliveryRes.json();
        const orderData = await orderRes.json();

        if (!deliveryRes.ok) {
          throw new Error(deliveryData?.message || 'ไม่สามารถโหลดข้อมูลงานจัดส่งได้');
        }

        setDelivery(deliveryData);
        setItems(Array.isArray(orderData?.items) ? orderData.items : []);
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด',
          text: err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลงานจัดส่งได้',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [orderIdNumber]);

  const handleCompleteDelivery = async () => {
    if (!delivery?.order_id) return;

    if (!proofImage) {
      await Swal.fire({
        icon: 'warning',
        title: 'กรุณาแนบไฟล์รูปภาพ',
        text: 'ต้องแนบหลักฐานการจัดส่งก่อนกดยืนยัน',
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันการจัดส่งสำเร็จ',
      text: 'เมื่อยืนยันแล้ว ระบบจะอัปเดตสถานะเป็น delivered',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('rider_photo', proofImage);

      const response = await fetch(`http://localhost:3000/api/delivery/${delivery.order_id}/complete`, {
        method: 'PUT',
        body: formData,
      });

      const payload = await response.json().catch(() => ({} as any));
      if (!response.ok) {
        throw new Error(payload?.message || 'ไม่สามารถยืนยันการจัดส่งได้');
      }

      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'ยืนยันการจัดส่งเรียบร้อย',
        timer: 1400,
        showConfirmButton: false,
      });

      navigate('/rider/dashboard');
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: err instanceof Error ? err.message : 'ไม่สามารถยืนยันการจัดส่งได้',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">กำลังโหลดข้อมูล...</div>;
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
          <h2 className="text-2xl text-gray-900 mb-2">ไม่พบข้อมูลงานจัดส่ง</h2>
          <button
            onClick={() => navigate('/rider/dashboard')}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/rider/dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับสู่หน้าหลัก</span>
          </button>
          <h1 className="text-2xl text-gray-900">รายละเอียดการจัดส่ง</h1>
          <p className="text-sm text-gray-600">{delivery.order_code}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl mb-4 text-gray-900">ลูกค้าและปลายทาง</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">ชื่อลูกค้า:</span> <span className="text-gray-900">{delivery.customer_name || '-'}</span></p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /><a href={`tel:${delivery.phone || ''}`} className="text-blue-600 hover:underline">{delivery.phone || '-'}</a></p>
              <p><span className="text-gray-600">ผู้รับ:</span> <span className="text-gray-900">{delivery.receiver_name || delivery.customer_name || '-'}</span></p>
              <p><span className="text-gray-600">เบอร์ผู้รับ:</span> <span className="text-gray-900">{delivery.receiver_phone || delivery.phone || '-'}</span></p>
              <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-gray-500" /><span className="text-gray-900">{delivery.receiver_address || '-'}</span></p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl mb-4 text-gray-900">สถานะ</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">สถานะออเดอร์:</span> <span className="text-gray-900">{delivery.order_status || '-'}</span></p>
              <p><span className="text-gray-600">สถานะงานส่ง:</span> <span className="text-gray-900">{delivery.delivery_status || '-'}</span></p>
              <p><span className="text-gray-600">เวลารับงาน:</span> <span className="text-gray-900">{delivery.assigned_at ? new Date(delivery.assigned_at).toLocaleString('th-TH') : '-'}</span></p>
              <p><span className="text-gray-600">มูลค่าออเดอร์:</span> <span className="text-gray-900">฿{Number(delivery.total_amount || 0).toFixed(2)}</span></p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl mb-4 text-gray-900">รายการสินค้า</h2>
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">ไม่พบรายการสินค้า</p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={`${delivery.order_id}-item-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm text-gray-900"><span className="font-medium">สินค้า:</span> {item.product_name || '-'} {item.product_type_name ? `(${item.product_type_name})` : ''}</p>
                    {item.flowers && item.flowers !== '-' && <p className="text-sm text-gray-800"><span className="font-medium">ดอกหลัก:</span> {item.flowers}</p>}
                    {item.filler_flower_name && <p className="text-sm text-gray-800"><span className="font-medium">ดอกแซม:</span> {item.filler_flower_name}</p>}
                    {item.wrapping_name && <p className="text-sm text-gray-800"><span className="font-medium">ช่อ/ห่อ:</span> {item.wrapping_name}</p>}
                    {(item.ribbon_name || item.ribbon_color_name) && <p className="text-sm text-gray-800"><span className="font-medium">ริบบิ้น:</span> {item.ribbon_name || '-'} {item.ribbon_color_name ? `(${item.ribbon_color_name})` : ''}</p>}
                    {item.vase_name && <p className="text-sm text-gray-800"><span className="font-medium">ทรงแจกัน:</span> {item.vase_name}</p>}
                    {item.card_name && <p className="text-sm text-gray-800"><span className="font-medium">การ์ด:</span> {item.card_name}</p>}
                    {item.card_message && <p className="text-sm text-gray-800"><span className="font-medium">ข้อความ:</span> {item.card_message}</p>}
                    {item.monetary_bouquet_name && <p className="text-sm text-gray-800"><span className="font-medium">ช่อเงิน:</span> {item.monetary_bouquet_name}</p>}
                    {item.folding_style_name && <p className="text-sm text-gray-800"><span className="font-medium">ทรงพับเงิน:</span> {item.folding_style_name}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {delivery.delivery_status !== 'completed' ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl mb-4 text-gray-900">ยืนยันส่งสำเร็จ</h2>
              <label className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center block cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProofImage(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-700">{proofImage ? proofImage.name : 'แนบไฟล์รูปหลักฐานการจัดส่ง'}</p>
              </label>

              <button
                onClick={handleCompleteDelivery}
                disabled={submitting}
                className="w-full mt-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'กำลังบันทึก...' : 'ยืนยันส่งสำเร็จ'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">งานจัดส่งสำเร็จแล้ว</h3>
              {delivery.rider_photo_url && (
                <a href={delivery.rider_photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  เปิดรูปหลักฐาน
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
