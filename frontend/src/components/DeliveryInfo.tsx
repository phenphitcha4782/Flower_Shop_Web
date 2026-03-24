import { Home, MapPin, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Branch, getBranches, getRegions, type Region } from "../api/branch.api";
import { CartItem } from '../App';

interface DeliveryInfoProps {
  cartItems: CartItem[];
  orderId: string;
  loggedInPhone?: string;
  forcedBranchIds?: number[];
  onBackToCart: () => void;
  onConfirm: (name: string, address: string, phone: string, deliveryType: 'pickup' | 'delivery', selectedBranchId: number) => void;
}

export function DeliveryInfo({cartItems, orderId, loggedInPhone, forcedBranchIds = [], onBackToCart, onConfirm}: DeliveryInfoProps) {
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery' | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(loggedInPhone ?? '');

  const [selectedRegionId, setSelectedRegionId] = useState<number | "">("");
    const [selectedBranchId, setSelectedBranchId] = useState<number | "">("");
    const [regions, setRegions] = useState<Region[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [branchLoading, setBranchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allowedRegionIds, setAllowedRegionIds] = useState<number[] | null>(null);
    const [disabledBranchIds, setDisabledBranchIds] = useState<number[]>([]);
    const [validatedBranchIds, setValidatedBranchIds] = useState<number[]>([]);

  const forcedBranchIdsKey = useMemo(() => {
    if (!Array.isArray(forcedBranchIds) || forcedBranchIds.length === 0) {
      return '';
    }

    const normalized = forcedBranchIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
      .sort((a, b) => a - b);

    return normalized.join(',');
  }, [forcedBranchIds]);

  const normalizedForcedBranchIds = useMemo(() => {
    if (!forcedBranchIdsKey) {
      return [] as number[];
    }
    return forcedBranchIdsKey.split(',').map((id) => Number(id));
  }, [forcedBranchIdsKey]);

  const hasForcedBranchRestriction = normalizedForcedBranchIds.length > 0;
  const isBranchLocked = normalizedForcedBranchIds.length === 1;
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

  const buildStockCheckItems = (items: CartItem[]) => {
    return items.map((item) => ({
      product_id: (item as any).productId || null,
      qty: 1,
      flowers: Array.isArray(item.flowerTypeIds) ? item.flowerTypeIds : [],
      customization: item.customization || {},
    }));
  };

  const validateBranchStock = async (branchId: number) => {
    const payload = {
      items: buildStockCheckItems(cartItems),
    };

    const response = await fetch(`${API_BASE}/api/branches/${branchId}/stock/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'ตรวจสอบสต๊อกไม่สำเร็จ');
    }

    return {
      isAvailable: Boolean(data?.isAvailable),
      insufficient: Array.isArray(data?.insufficient) ? data.insufficient : [],
    };
  };

  const handleBranchSelection = async (branchId: number) => {
    try {
      setBranchLoading(true);
      setError(null);
      const result = await validateBranchStock(branchId);

      if (!result.isAvailable) {
        const details = result.insufficient
          .slice(0, 4)
          .map((row: any) => `- ${row.label}: ต้องการ ${row.requiredQty}, คงเหลือ ${row.availableQty}`)
          .join('<br/>');

        await Swal.fire({
          icon: 'warning',
          title: 'สาขานี้ของไม่พอ',
          html: details || 'มีสินค้าในสาขานี้ไม่เพียงพอ',
          confirmButtonText: 'ตกลง',
        });

        setDisabledBranchIds((prev) => (prev.includes(branchId) ? prev : [...prev, branchId]));
        setSelectedBranchId('');
        return;
      }

      setSelectedBranchId(branchId);
      setValidatedBranchIds((prev) => (prev.includes(branchId) ? prev : [...prev, branchId]));
    } catch (e: any) {
      await Swal.fire({
        icon: 'error',
        title: 'ตรวจสอบสต๊อกไม่สำเร็จ',
        text: e?.message ?? 'เกิดข้อผิดพลาด',
        confirmButtonText: 'ตกลง',
      });
      setSelectedBranchId('');
    } finally {
      setBranchLoading(false);
    }
  };

  useEffect(() => {
    const currentBranchId = Number(selectedBranchId);
    if (!Number.isInteger(currentBranchId) || currentBranchId <= 0) {
      return;
    }
    if (disabledBranchIds.includes(currentBranchId) || validatedBranchIds.includes(currentBranchId)) {
      return;
    }

    void handleBranchSelection(currentBranchId);
  }, [disabledBranchIds, selectedBranchId, validatedBranchIds]);
  
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
        const filtered = hasForcedBranchRestriction
          ? data.filter((branch) => normalizedForcedBranchIds.includes(Number(branch.branch_id)))
          : data;

        if (mounted) {
          setBranches(filtered);

          const currentSelected = Number(selectedBranchId);
          const hasCurrent = Number.isInteger(currentSelected)
            ? filtered.some((branch) => Number(branch.branch_id) === currentSelected)
            : false;

          if (!hasCurrent) {
            if (filtered.length === 1) {
              const onlyBranchId = Number(filtered[0].branch_id);
              if (!disabledBranchIds.includes(onlyBranchId)) {
                setSelectedBranchId(onlyBranchId);
              } else {
                setSelectedBranchId('');
              }
            } else {
              setSelectedBranchId("");
            }
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "เกิดข้อผิดพลาด");
      } finally {
        if (mounted) setBranchLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [disabledBranchIds, forcedBranchIdsKey, hasForcedBranchRestriction, selectedRegionId, selectedBranchId]);

  useEffect(() => {
    if (!hasForcedBranchRestriction || regions.length === 0) {
      setAllowedRegionIds(null);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setBranchLoading(true);
        setError(null);

        let firstMatchedRegionId: number | null = null;
        let matchedBranchId: number | null = null;
        let matchedBranches: Branch[] = [];
        const eligibleRegionIds: number[] = [];

        for (const region of regions) {
          const regionBranches = await getBranches(region.region_id);
          const allowedBranches = regionBranches.filter((branch) =>
            normalizedForcedBranchIds.includes(Number(branch.branch_id))
          );

          if (allowedBranches.length > 0) {
            eligibleRegionIds.push(region.region_id);
            if (!firstMatchedRegionId) {
              firstMatchedRegionId = region.region_id;
              matchedBranchId = Number(allowedBranches[0].branch_id);
              matchedBranches = allowedBranches;
            }
          }
        }

        if (!mounted) {
          return;
        }

        if (firstMatchedRegionId && matchedBranchId) {
          setAllowedRegionIds(eligibleRegionIds);
          setSelectedRegionId(firstMatchedRegionId);
          setBranches(matchedBranches);
          setSelectedBranchId(matchedBranchId);
        } else {
          setAllowedRegionIds([]);
          setSelectedRegionId('');
          setBranches([]);
          setSelectedBranchId('');
          setError('ไม่พบสาขาที่เข้าเงื่อนไขโปรโมชั่น');
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.message ?? 'เกิดข้อผิดพลาด');
        }
      } finally {
        if (mounted) {
          setBranchLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [forcedBranchIdsKey, hasForcedBranchRestriction, regions]);

  useEffect(() => {
    if (loggedInPhone) {
      setPhone(loggedInPhone);
    }
  }, [loggedInPhone]);


  const handleConfirm = async () => {
    if (deliveryType === 'pickup' && name && phone && selectedBranchId) {
      onConfirm(name, '', phone, deliveryType, Number(selectedBranchId));
    } else if (deliveryType === 'delivery' && name && address && phone && selectedBranchId) {
      onConfirm(name, address, phone, deliveryType, Number(selectedBranchId));
    }
  };

  const isValid = deliveryType && name && phone && Number(selectedBranchId) && phone.length >= 9 && 
    (deliveryType === 'pickup' || (deliveryType === 'delivery' && address));
  const displayRegions = allowedRegionIds
    ? regions.filter((region) => allowedRegionIds.includes(region.region_id))
    : regions;

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

          {hasForcedBranchRestriction && (
            <p className="mb-2 text-sm text-blue-600">
              {isBranchLocked
                ? 'โปรโมชั่นนี้กำหนดสาขาไว้แล้ว ระบบจะเลือกให้อัตโนมัติ'
                : 'โปรโมชั่นนี้ใช้ได้เฉพาะบางสาขา กรุณาเลือกสาขาที่ร่วมรายการ'}
            </p>
          )}

          <select
            value={selectedRegionId}
            onChange={(e) => setSelectedRegionId(e.target.value ? Number(e.target.value) : "")}
            disabled={loading || isBranchLocked}
            className="w-full px-4 py-4 rounded-lg border-2 outline-none transition-all disabled:opacity-60"
            style={{
              borderColor: selectedRegionId ? "#AEE6FF" : "#e5e7eb",
              backgroundColor: "white",
            }}
          >
            <option value="">
              {loading ? "กำลังโหลด..." : "-- กรุณาเลือกภาค --"}
            </option>

            {displayRegions.map((r) => (
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
              onChange={(e) => {
                const nextBranchId = e.target.value ? Number(e.target.value) : 0;
                if (!nextBranchId) {
                  setSelectedBranchId('');
                  return;
                }
                void handleBranchSelection(nextBranchId);
              }}
              disabled={branchLoading || branches.length === 0 || isBranchLocked}
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
                <option
                  key={b.branch_id}
                  value={b.branch_id}
                  disabled={disabledBranchIds.includes(Number(b.branch_id))}
                >
                  {b.branch_name} {b.province_name ? `(${b.province_name})` : ""}
                  {disabledBranchIds.includes(Number(b.branch_id)) ? ' - ของหมด' : ''}
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

            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <button
            onClick={onBackToCart}
            className="w-full py-4 rounded-xl border border-[#62C4FF] text-[#62C4FF] bg-white hover:bg-blue-50 transition-all"
            type="button"
          >
            ย้อนกลับไปตะกร้า
          </button>

          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className="w-full py-4 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isValid ? '#62C4FF' : '#d1d5db',
            }}
            type="button"
          >
            ยืนยัน
          </button>
        </div>

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