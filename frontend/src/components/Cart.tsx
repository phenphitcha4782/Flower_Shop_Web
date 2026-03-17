import { useEffect, useMemo, useState } from 'react';
import { Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { CartItem, type CheckoutPricing } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CartProps {
  items: CartItem[];
  onAddMore: () => void;
  onCheckout: () => void;
  onRemove: (itemId: string) => void;
  onPricingChange: (pricing: CheckoutPricing) => void;
}

const PROMOTION_CODES: Record<string, number> = {
  BLOOM50: 50,
  FLOWER100: 100,
  LOVE200: 200,
};

const resolvePromotionDiscount = (code: string, subtotal: number): number => {
  if (!code) return 0;
  const normalizedCode = code.trim().toUpperCase();
  const directDiscount = PROMOTION_CODES[normalizedCode];
  if (directDiscount) return Math.min(directDiscount, subtotal);

  const dynamicMatch = normalizedCode.match(/^SAVE(\d{1,4})$/);
  if (dynamicMatch) {
    const dynamicDiscount = Number(dynamicMatch[1]);
    if (dynamicDiscount > 0) return Math.min(dynamicDiscount, subtotal);
  }
  return 0;
};

export function Cart({ items, onAddMore, onCheckout, onRemove, onPricingChange }: CartProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const [promotionInput, setPromotionInput] = useState('');
  const [appliedPromotionCode, setAppliedPromotionCode] = useState<string | null>(null);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsInput, setPointsInput] = useState('0');

  const getProductTypeLabel = (item: CartItem) => {
    if (item.productType === 'vase') {
      return 'แจกันดอกไม้';
    }
    if (item.customization?.bouquetKind === 'money-envelope') {
      return 'ช่อซองเงิน';
    }
    return 'ช่อดอกไม้ปกติ';
  };

  const labelMap: Record<string, string> = {
    glass: 'แจกันแก้ว',
    ceramic: 'แจกันเซรามิค',
    clay: 'แจกันดินเผา',
    cylinder: 'ทรงกระบอก',
    bottle: 'ทรงขวด',
    round: 'ทรงกลม',
    kraft: 'กระดาษคราฟท์',
    clear: 'กระดาษใส',
    pastel: 'กระดาษสีพาสเทล',
    'style-1': 'แบบที่ 1',
    'style-2': 'แบบที่ 2',
    blue: 'สีฟ้า',
    red: 'สีแดง',
    fan: 'พับแบบพัด',
    rose: 'พับแบบกุหลาบ',
    heart: 'พับแบบหัวใจ',
    star: 'พับแบบดาว',
    classic: 'การ์ดคลาสสิก',
    minimal: 'การ์ดมินิมอล',
    romantic: 'การ์ดโรแมนติก',
  };

  const getDetailLines = (item: CartItem): string[] => {
    const custom = item.customization;
    const lines: string[] = [];

    if (item.productType === 'vase') {
      if (custom?.vaseMaterial || custom?.vaseShape) {
        lines.push(`แจกัน: ${custom?.vaseMaterial ? labelMap[custom.vaseMaterial] : '-'} / ${custom?.vaseShape ? labelMap[custom.vaseShape] : '-'}`);
      }
    }

    if (custom?.mainFlowers && custom.mainFlowers.length > 0) {
      lines.push(
        `ดอกไม้หลัก: ${custom.mainFlowers
          .map((flower) => `${flower.name} ${flower.count} ดอก x ฿${flower.unitPrice}`)
          .join(', ')}`
      );
    } else if (custom?.mainFlower) {
      lines.push(`ดอกไม้หลัก: ${custom.mainFlower}`);
    }
    if (custom?.fillerFlower) {
      lines.push(`ดอกแซม: ${custom.fillerFlower}`);
    }
    if (custom?.fillerFlowerGrams) {
      lines.push(`น้ำหนักดอกแซม: ${custom.fillerFlowerGrams} กรัม`);
    }
    if (custom?.moneyPackage) {
      lines.push(`ธนบัตร: ${custom.moneyPackage} บาท`);
    }
    if (custom?.moneyAmount) {
      const noteCount = custom.moneyPackage ? custom.moneyAmount / custom.moneyPackage : 0;
      const noteText = Number.isInteger(noteCount) && noteCount > 0 ? ` (${noteCount} ใบ)` : '';
      lines.push(`จำนวนเงิน: ${custom.moneyAmount.toLocaleString()} บาท${noteText}`);
    }
    if (custom?.moneyFoldStyle) {
      lines.push(`วิธีพับ: ${labelMap[custom.moneyFoldStyle] || custom.moneyFoldStyle}`);
    }
    if (custom?.wrapperPaper) {
      lines.push(`กระดาษห่อ: ${labelMap[custom.wrapperPaper] || custom.wrapperPaper}`);
    }
    if (custom?.ribbonStyle || custom?.ribbonColor) {
      lines.push(`ริบบิ้น: ${custom?.ribbonStyle ? labelMap[custom.ribbonStyle] : '-'} ${custom?.ribbonColor ? labelMap[custom.ribbonColor] : ''}`.trim());
    }
    if (custom?.hasCard) {
      lines.push(`การ์ด: ${custom.cardTemplate ? labelMap[custom.cardTemplate] : 'มีการ์ด'}`);
      if (custom.cardMessage) {
        lines.push(`ข้อความการ์ด: "${custom.cardMessage}"`);
      }
    }

    if (lines.length === 0 && item.flowerTypes.length > 0) {
      lines.push(`ดอกไม้: ${item.flowerTypes.join(', ')}`);
    }

    return lines;
  };

  const promotionDiscount = useMemo(() => {
    if (!appliedPromotionCode) return 0;
    return resolvePromotionDiscount(appliedPromotionCode, totalAmount);
  }, [appliedPromotionCode, totalAmount]);

  const remainingAfterPromotion = Math.max(totalAmount - promotionDiscount, 0);
  const requestedPoints = useMemo(() => {
    if (!usePoints) return 0;
    const rawPoints = Number(pointsInput || '0');
    if (!Number.isFinite(rawPoints) || rawPoints <= 0) return 0;
    return Math.floor(rawPoints / 100) * 100;
  }, [pointsInput, usePoints]);

  const maxUsablePoints = Math.floor(remainingAfterPromotion / 10) * 100;
  const pointsUsed = Math.max(0, Math.min(requestedPoints, maxUsablePoints));
  const pointsDiscount = pointsUsed / 10;
  const totalDiscount = promotionDiscount + pointsDiscount;
  const finalAmount = Math.max(totalAmount - totalDiscount, 0);

  useEffect(() => {
    onPricingChange({
      subtotal: totalAmount,
      promotionCode: appliedPromotionCode,
      promotionDiscount,
      usePoints,
      pointsUsed,
      pointsDiscount,
      totalDiscount,
      finalAmount,
    });
  }, [
    appliedPromotionCode,
    finalAmount,
    onPricingChange,
    pointsDiscount,
    pointsUsed,
    promotionDiscount,
    totalAmount,
    totalDiscount,
    usePoints,
  ]);

  const handleApplyPromotion = () => {
    const normalizedCode = promotionInput.trim().toUpperCase();
    if (!normalizedCode) {
      setAppliedPromotionCode(null);
      setPromotionError(null);
      return;
    }

    const discount = resolvePromotionDiscount(normalizedCode, totalAmount);
    if (discount <= 0) {
      setAppliedPromotionCode(null);
      setPromotionError('ไม่พบโค้ดโปรโมชั่นนี้');
      return;
    }

    setAppliedPromotionCode(normalizedCode);
    setPromotionInput(normalizedCode);
    setPromotionError(null);
  };

  const handleRemovePromotion = () => {
    setAppliedPromotionCode(null);
    setPromotionInput('');
    setPromotionError(null);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-[#AEE6FF]/30">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-white">
            <ShoppingCart className="w-8 h-8" style={{ color: '#62C4FF' }} />
          </div>
          <h1 className="mb-2 text-gray-900">ตะกร้าสินค้า</h1>
          <p className="text-gray-700">รายการสินค้าของคุณ ({items.length} รายการ)</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <p className="text-gray-500 mb-6">ยังไม่มีสินค้าในตะกร้า</p>
            <button
              onClick={onAddMore}
              className="px-8 py-4 rounded-xl text-white"
              style={{ backgroundColor: '#62C4FF' }}
            >
              เริ่มสั่งซื้อ
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-md">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt="สินค้า"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="mb-2 text-gray-800">{getProductTypeLabel(item)}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        {getDetailLines(item).map((line) => (
                          <div key={`${item.id}-${line}`}>{line}</div>
                        ))}
                        <div className="text-gray-800 mt-2">฿{item.price.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemove(item.id)}
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-red-50"
                      style={{ color: '#ef4444' }}
                      title="ลบสินค้า"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-md mb-6 space-y-6">
              <div>
                <p className="text-gray-900 mb-3">โค้ดโปรโมชั่น</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={promotionInput}
                    onChange={(e) => setPromotionInput(e.target.value)}
                    placeholder="กรอกโค้ด เช่น BLOOM50 หรือ SAVE120"
                    className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={handleApplyPromotion}
                    className="px-6 py-3 rounded-xl text-white"
                    style={{ backgroundColor: '#62C4FF' }}
                  >
                    ใช้โค้ด
                  </button>
                  {appliedPromotionCode && (
                    <button
                      onClick={handleRemovePromotion}
                      className="px-6 py-3 rounded-xl border text-gray-700 hover:bg-gray-50"
                    >
                      ล้างโค้ด
                    </button>
                  )}
                </div>
                {promotionError && <p className="text-red-500 text-sm mt-2">{promotionError}</p>}
                {appliedPromotionCode && promotionDiscount > 0 && (
                  <p className="text-green-600 text-sm mt-2">
                    ใช้โค้ด {appliedPromotionCode} สำเร็จ ลด {promotionDiscount.toLocaleString()} บาท
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-3 text-gray-900 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="w-5 h-5"
                  />
                  ต้องการใช้ Point หรือไม่ (100 Point = ลด 10 บาท)
                </label>

                {usePoints && (
                  <div className="space-y-2">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      placeholder="กรอกจำนวน Point ที่ต้องการใช้"
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-400"
                    />
                    <p className="text-sm text-gray-600">
                      ใช้ได้สูงสุด {maxUsablePoints.toLocaleString()} Point ในคำสั่งซื้อนี้
                    </p>
                    <p className="text-sm text-green-600">
                      Point ที่ใช้จริง {pointsUsed.toLocaleString()} Point ลด {pointsDiscount.toLocaleString()} บาท
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ยอดสินค้า</span>
                  <span className="text-gray-900">฿{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ส่วนลดโปรโมชั่น</span>
                  <span className="text-gray-900">- ฿{promotionDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ส่วนลดจาก Point</span>
                  <span className="text-gray-900">- ฿{pointsDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">รวมส่วนลด</span>
                  <span className="text-gray-900">฿{totalDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 mt-2">
                  <span className="text-gray-900">ยอดชำระสุทธิ</span>
                  <span className="text-gray-900">฿{finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={onAddMore}
                className="py-4 rounded-xl border-2 bg-white text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                style={{ borderColor: '#62C4FF' }}
              >
                <Plus className="w-5 h-5" />
                เพิ่มรายการ
              </button>
              <button
                onClick={onCheckout}
                className="py-4 rounded-xl text-white"
                style={{ backgroundColor: '#62C4FF' }}
              >
                ดำเนินการต่อ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}