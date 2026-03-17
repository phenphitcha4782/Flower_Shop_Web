import { useState,useEffect } from 'react';
import { MapPin, Home, Truck, MessageSquare } from 'lucide-react';
import { Branch, getBranches, getRegions, type Region } from "../api/branch.api";
import { CartItem } from '../App';
import Swal from 'sweetalert2';

interface DeliveryInfoProps {
  cartItems: CartItem[];
  orderId: string;
  onConfirm: (name: string, address: string, phone: string, deliveryType: 'pickup' | 'delivery', selectedBranchId: number, cardMessage?: string) => void;
}

export function DeliveryInfo({cartItems, orderId, onConfirm}: DeliveryInfoProps) {
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery' | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [cardMessage, setCardMessage] = useState('');

  const [selectedRegionId, setSelectedRegionId] = useState<number | "">("");
    const [selectedBranchId, setSelectedBranchId] = useState<number | "">("");
    const [regions, setRegions] = useState<Region[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [branchLoading, setBranchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
  // โหลดภาคเมื่อ component mount
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRegions();
        if (mounted) setRegions(data);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "เกิดข้อผิดพลาด");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // โหลดสาขาเมื่อเลือกภาค
  useEffect(() => {
    if (selectedRegionId === "") {
      setBranches([]);
      setSelectedBranchId("");
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setBranchLoading(true);
        setError(null);
        const data = await getBranches(selectedRegionId as number);
        if (mounted) setBranches(data);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "เกิดข้อผิดพลาด");
      } finally {
        if (mounted) setBranchLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedRegionId]);


  const handleConfirm = async () => {
    const check = await handleCheckStock(cartItems,selectedBranchId);
    console.log("check stock result",check);
    // if (check === false) {
    //   Swal.fire({
    //     title: "ขออภัย สินค้าหมด",
    //     text: "ต้องการให้ระบบค้นหาสินค้าในสาขาอื่นหรือไม่?",
    //     icon: "warning",
    //     showCancelButton: true,
    //     confirmButtonColor: "#3085d6",
    //     cancelButtonColor: "#d33",
    //     confirmButtonText: "ค้นหาสินค้าในสาขาอื่น",
    //     cancelButtonText: "ยกเลิก"
    //   }).then((result) => {
    //     if (result.isConfirmed) {
    //       Swal.fire({
    //         title: "พบสินค้าในสาขาอื่น",
    //         text: "มีสินค้าในสาขาเชียงใหม่",
    //         icon: "success"
    //       });
    //   }
    // });
    //   return;
    // }
    if (check === false){
      Swal.fire({
      title: "ขออภัย สินค้าหมด",
      text: "กรุณาเปลี่ยนสาขาในการรับสินค้า",
      icon: "error"
});
return;
    }
    if (deliveryType === 'pickup' && name && phone && selectedBranchId) {
      onConfirm(name, '', phone, deliveryType,Number(selectedBranchId) , cardMessage);
    } else if (deliveryType === 'delivery' && name && address && phone && selectedBranchId) {
      onConfirm(name, address, phone, deliveryType, Number(selectedBranchId), cardMessage);
    }
  };

  const handleCheckStock = async (cart: CartItem[], selectedBranchId: number | ""): Promise<boolean> => {
  const res = await fetch("http://localhost:3000/check-stocks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cart,selectedBranchId }),
  });
  const data = await res.json();
  return data.is_available; // true / false
}
  const isValid = deliveryType && name && phone && Number(selectedBranchId) && phone.length >= 9 && 
    (deliveryType === 'pickup' || (deliveryType === 'delivery' && address));

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-[#AEE6FF]/30">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-white">
            <MapPin className="w-8 h-8" style={{ color: '#62C4FF' }} />
          </div>
          <h1 className="mb-2 text-gray-900">กรอกข้อมูลจัดส่ง</h1>
          <p className="text-gray-700">กรุณาเลือกวิธีการรับสินค้า</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          {/* Order ID */}
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#AEE6FF40' }}>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">รหัสคำสั่งซื้อ</span>
              <span className="text-gray-900">{orderId}</span>
            </div>
          </div>

          {/* Delivery Type Selection */}
          <div className="mb-6">
            <label className="block mb-3 text-gray-700">วิธีการรับสินค้า <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDeliveryType('pickup')}
                className="p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2"
                style={{
                  borderColor: deliveryType === 'pickup' ? '#62C4FF' : '#e5e7eb',
                  backgroundColor: deliveryType === 'pickup' ? '#62C4FF' : 'white',
                  color: deliveryType === 'pickup' ? 'white' : '#374151',
                }}
              >
                <Home className="w-8 h-8" />
                <span>รับที่ร้าน</span>
              </button>
              <button
                onClick={() => setDeliveryType('delivery')}
                className="p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2"
                style={{
                  borderColor: deliveryType === 'delivery' ? '#62C4FF' : '#e5e7eb',
                  backgroundColor: deliveryType === 'delivery' ? '#62C4FF' : 'white',
                  color: deliveryType === 'delivery' ? 'white' : '#374151',
                }}
              >
                <Truck className="w-8 h-8" />
                <span>จัดส่ง</span>
              </button>
            </div>
          </div>

          {/* Customer Information (shown only when delivery type is selected) */}
          
          {deliveryType && (
            
            <div className="space-y-6 border-t pt-6">




               {/* เลือกภาค */}
        <div className="mb-6">
          <label className="block mb-3 text-gray-700">เลือกภาค <span className="text-red-500">*</span></label>

          <select
            value={selectedRegionId}
            onChange={(e) => setSelectedRegionId(e.target.value ? Number(e.target.value) : "")}
            disabled={loading}
            className="w-full px-4 py-4 rounded-lg border-2 outline-none transition-all disabled:opacity-60"
            style={{
              borderColor: selectedRegionId ? "#AEE6FF" : "#e5e7eb",
              backgroundColor: "white",
            }}
          >
            <option value="">
              {loading ? "กำลังโหลด..." : "-- กรุณาเลือกภาค --"}
            </option>

            {regions.map((r) => (
              <option key={r.region_id} value={r.region_id}>
                {r.region_name}
              </option>
            ))}
          </select>

          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        


        {/* เลือกสาขา (แสดงเฉพาะเมื่อเลือกภาค) */}
        {selectedRegionId && (
          <div className="mb-6">
            <label className="block mb-3 text-gray-700">เลือกสาขา <span className="text-red-500">*</span></label>

            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : "")}
              disabled={branchLoading || branches.length === 0}
              className="w-full px-4 py-4 rounded-lg border-2 outline-none transition-all disabled:opacity-60"
              style={{
                borderColor: selectedBranchId ? "#AEE6FF" : "#e5e7eb",
                backgroundColor: "white",
              }}
            >
              <option value="">
                {branchLoading ? "กำลังโหลดสาขา..." : branches.length === 0 ? "ไม่มีสาขาในภาคนี้" : "-- กรุณาเลือกสาขา --"}
              </option>

              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name} {b.province_name ? `(${b.province_name})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}




              {/* Name Input */}
              <div>
                <label className="block mb-2 text-gray-700">
                  ชื่อผู้รับ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all"
                  style={{
                    borderColor: name ? '#62C4FF' : '#e5e7eb',
                  }}
                />
              </div>

              {/* Address Input (only for delivery) */}
              {deliveryType === 'delivery' && (
                
                <div>
                  <label className="block mb-2 text-gray-700">
                    ที่อยู่จัดส่ง <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="กรอกที่อยู่สำหรับจัดส่ง"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none"
                    style={{
                      borderColor: address ? '#62C4FF' : '#e5e7eb',
                    }}
                  />
                </div>
              )}

              {/* Phone Input */}
              <div>
                <label className="block mb-2 text-gray-700">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0xx-xxx-xxxx"
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all"
                  style={{
                    borderColor: phone ? '#62C4FF' : '#e5e7eb',
                  }}
                />
              </div>

              {/* Card Message (Optional) */}
              <div>
                <label className="block mb-2 text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" style={{ color: '#62C4FF' }} />
                  ข้อความบนการ์ดอวยพร (ถ้ามี)
                </label>
                <textarea
                  value={cardMessage}
                  onChange={(e) => setCardMessage(e.target.value)}
                  placeholder="กรอกข้อความที่ต้องการให้แสดงบนการ์ด (ไม่บังคับ)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none"
                  style={{
                    borderColor: cardMessage ? '#62C4FF' : '#e5e7eb',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="w-full py-4 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          style={{
            backgroundColor: isValid ? '#62C4FF' : '#d1d5db',
          }}
        >
          ยืนยัน
        </button>

        {/* Warning Message */}
        {deliveryType && (
          <p className="text-sm text-red-500 text-center">
            * กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนกดยืนยัน
          </p>
        )}
      </div>
    </div>
  );
}