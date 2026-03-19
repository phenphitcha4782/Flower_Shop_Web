import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { CartItem, type CheckoutPricing } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CartProps {
  items: CartItem[];
  currentDeliveryType: 'pickup' | 'delivery';
  currentUserPoints: number;
  isUserPointsLoading: boolean;
  onAddMore: () => void;
  onCheckout: () => void;
  onRemove: (itemId: string) => void;
  onPricingChange: (pricing: CheckoutPricing) => void;
}

type MemberTier = 'gold' | 'silver' | 'bronze';
type PromotionBenefitType = 'amount' | 'percent' | 'shipping';
type PromotionCodeType = 'ส่วนลด' | 'ส่งฟรี';

interface PromotionPreset {
  code: string;
  label: string;
  benefitType: PromotionBenefitType;
  benefitValue: number;
  maxDiscount?: number;
  minSubtotal?: number;
  memberTiers: MemberTier[];
  codeType: PromotionCodeType;
  campaignLabel: string;
  expiresAt: string;
  totalQuota: number;
  usedCount: number;
}

const PROMOTION_PRESETS: PromotionPreset[] = [
  {
    code: 'BLOOM50',
    label: 'ลด 50 บาท',
    benefitType: 'amount',
    benefitValue: 50,
    minSubtotal: 199,
    memberTiers: ['bronze', 'silver', 'gold'],
    codeType: 'ส่วนลด',
    campaignLabel: 'ร้านโค้ดคุ้ม Xtra',
    expiresAt: '08.04.2026',
    totalQuota: 20,
    usedCount: 14,
  },
  {
    code: 'FLOWER100',
    label: 'ลด 100 บาท',
    benefitType: 'amount',
    benefitValue: 100,
    minSubtotal: 399,
    memberTiers: ['silver', 'gold'],
    codeType: 'ส่วนลด',
    campaignLabel: 'ดีลสมาชิก Silver+ Gold',
    expiresAt: '10.04.2026',
    totalQuota: 16,
    usedCount: 11,
  },
  {
    code: 'LOVE20',
    label: 'ลด 20%',
    benefitType: 'percent',
    benefitValue: 20,
    maxDiscount: 300,
    minSubtotal: 199,
    memberTiers: ['gold'],
    codeType: 'ส่วนลด',
    campaignLabel: 'ร้านโค้ดคุ้ม Xtra',
    expiresAt: '08.04.2026',
    totalQuota: 12,
    usedCount: 6,
  },
  {
    code: 'SAVE120',
    label: 'ลด 120 บาท',
    benefitType: 'amount',
    benefitValue: 120,
    minSubtotal: 599,
    memberTiers: ['bronze', 'silver', 'gold'],
    codeType: 'ส่วนลด',
    campaignLabel: 'เทศกาลพิเศษประจำเดือน',
    expiresAt: '15.04.2026',
    totalQuota: 10,
    usedCount: 7,
  },
  {
    code: 'FREESHIP',
    label: 'ส่งฟรี',
    benefitType: 'shipping',
    benefitValue: 0,
    minSubtotal: 499,
    memberTiers: ['silver', 'gold'],
    codeType: 'ส่งฟรี',
    campaignLabel: 'ส่งไวค่าส่งฟรี',
    expiresAt: '20.04.2026',
    totalQuota: 30,
    usedCount: 18,
  },
];

const ORDER_SHIPPING_FEE = 39;

const isTierEligible = (preset: PromotionPreset, memberTier: MemberTier): boolean => {
  return preset.memberTiers.includes(memberTier);
};

const getPromotionPreset = (code: string): PromotionPreset | undefined => {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return undefined;
  return PROMOTION_PRESETS.find((preset) => preset.code === normalizedCode);
};

const getPromotionRemainingCount = (preset: PromotionPreset): number => {
  return Math.max(preset.totalQuota - preset.usedCount, 0);
};

const getPromotionBenefitLabel = (preset: PromotionPreset): string => {
  if (preset.benefitType === 'amount') {
    return `ลด ${preset.benefitValue.toLocaleString()} บาท`;
  }
  if (preset.benefitType === 'percent') {
    if (preset.maxDiscount) {
      return `ลด ${preset.benefitValue}% สูงสุด ฿${preset.maxDiscount.toLocaleString()}`;
    }
    return `ลด ${preset.benefitValue}%`;
  }
  return 'ส่งฟรี';
};

const getPromotionMemberLabel = (tiers: MemberTier[]): string => {
  return tiers.map((tier) => tier.toUpperCase()).join(', ');
};

const getPromotionAvailability = (
  preset: PromotionPreset,
  memberTier: MemberTier,
  subtotal: number,
  deliveryType: 'pickup' | 'delivery'
): { isSelectable: boolean; reason: string | null } => {
  if (preset.benefitType === 'shipping' && deliveryType === 'pickup') {
    return {
      isSelectable: false,
      reason: 'โค้ดส่งฟรีใช้ไม่ได้กับการรับหน้าร้าน (ไม่มีค่าส่ง)',
    };
  }

  if (!isTierEligible(preset, memberTier)) {
    return {
      isSelectable: false,
      reason: `ใช้ได้เฉพาะสมาชิก ${getPromotionMemberLabel(preset.memberTiers)}`,
    };
  }

  if (subtotal < (preset.minSubtotal || 0)) {
    return {
      isSelectable: false,
      reason: `ต้องมียอดขั้นต่ำ ฿${(preset.minSubtotal || 0).toLocaleString()} จึงใช้โค้ดนี้ได้`,
    };
  }

  if (getPromotionRemainingCount(preset) <= 0) {
    return {
      isSelectable: false,
      reason: 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว',
    };
  }

  return {
    isSelectable: true,
    reason: null,
  };
};

const getPromotionDiscountFromPreset = (preset: PromotionPreset, subtotal: number): number => {
  if (subtotal < (preset.minSubtotal || 0)) {
    return 0;
  }

  if (preset.benefitType === 'amount') {
    return Math.min(preset.benefitValue, subtotal);
  }
  if (preset.benefitType === 'percent') {
    const discount = Math.floor((subtotal * preset.benefitValue) / 100);
    const cappedDiscount = preset.maxDiscount ? Math.min(discount, preset.maxDiscount) : discount;
    return Math.min(cappedDiscount, subtotal);
  }
  return 0;
};

const resolvePromotionDiscount = (code: string, subtotal: number): number => {
  if (!code) return 0;
  const normalizedCode = code.trim().toUpperCase();
  const preset = getPromotionPreset(normalizedCode);
  if (preset) {
    return getPromotionDiscountFromPreset(preset, subtotal);
  }

  const dynamicMatch = normalizedCode.match(/^SAVE(\d{1,4})$/);
  if (dynamicMatch) {
    const dynamicDiscount = Number(dynamicMatch[1]);
    if (dynamicDiscount > 0) return Math.min(dynamicDiscount, subtotal);
  }
  return 0;
};

export function Cart({
  items,
  currentDeliveryType,
  currentUserPoints,
  isUserPointsLoading,
  onAddMore,
  onCheckout,
  onRemove,
  onPricingChange,
}: CartProps) {
  const currentMemberTier: MemberTier = 'gold';
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const promotionDropdownRef = useRef<HTMLDivElement | null>(null);
  const [promotionInput, setPromotionInput] = useState('');
  const [appliedPromotionCode, setAppliedPromotionCode] = useState<string | null>(null);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [promotionDropdownOpen, setPromotionDropdownOpen] = useState(false);
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
    'kraft-plain': 'ลายเรียบธรรมชาติ',
    'kraft-newsprint': 'ลายหนังสือพิมพ์',
    'kraft-floral': 'ลายดอกไม้',
    'pastel-pink': 'ชมพูพาสเทล',
    'pastel-peach': 'พีชพาสเทล',
    'pastel-mint': 'เขียวมิ้นต์พาสเทล',
    'pastel-lilac': 'ม่วงไลแลคพาสเทล',
    'clear-transparent': 'สีใส',
    'clear-rainbow': 'สีรุ้ง',
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

      if (custom.wrapperPaper === 'kraft' && custom.wrapperKraftPattern) {
        lines.push(`ลายกระดาษคราฟท์: ${labelMap[custom.wrapperKraftPattern] || custom.wrapperKraftPattern}`);
      }
      if (custom.wrapperPaper === 'pastel' && custom.wrapperPastelColor) {
        lines.push(`สีพาสเทล: ${labelMap[custom.wrapperPastelColor] || custom.wrapperPastelColor}`);
      }
      if (custom.wrapperPaper === 'clear' && custom.wrapperClearStyle) {
        lines.push(`กระดาษใส: ${labelMap[custom.wrapperClearStyle] || custom.wrapperClearStyle}`);
      }
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

  const selectedPromotionPreset = useMemo(() => {
    return getPromotionPreset(promotionInput);
  }, [promotionInput]);

  const appliedPromotionPreset = useMemo(() => {
    if (!appliedPromotionCode) return undefined;
    return getPromotionPreset(appliedPromotionCode);
  }, [appliedPromotionCode]);

  const remainingAfterPromotion = Math.max(totalAmount - promotionDiscount, 0);
  const requestedPoints = useMemo(() => {
    if (!usePoints) return 0;
    const rawPoints = Number(pointsInput || '0');
    if (!Number.isFinite(rawPoints) || rawPoints <= 0) return 0;
    return Math.floor(rawPoints / 100) * 100;
  }, [pointsInput, usePoints]);

  const maxPointDiscountFromPriceCap = totalAmount * 0.3;
  const maxPointsByPriceCap = Math.floor(maxPointDiscountFromPriceCap / 10) * 100;
  const maxPointsByRemainingAmount = Math.floor(remainingAfterPromotion / 10) * 100;
  const normalizedCurrentUserPoints = Math.max(0, Math.floor(currentUserPoints));
  const maxUsablePoints = Math.max(
    0,
    Math.min(maxPointsByPriceCap, maxPointsByRemainingAmount, normalizedCurrentUserPoints)
  );
  const pointsUsed = Math.max(0, Math.min(requestedPoints, maxUsablePoints));
  const pointsDiscount = pointsUsed / 10;
  const totalDiscount = promotionDiscount + pointsDiscount;
  const finalAmount = Math.max(totalAmount - totalDiscount, 0);

  const shippingFee = currentDeliveryType === 'delivery' ? ORDER_SHIPPING_FEE : 0;
  const isFreeShippingPromotion =
    currentDeliveryType === 'delivery' && appliedPromotionPreset?.benefitType === 'shipping';
  const shippingDiscount = isFreeShippingPromotion ? shippingFee : 0;
  const finalAmountWithShipping = Math.max(finalAmount + shippingFee - shippingDiscount, 0);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        promotionDropdownRef.current &&
        !promotionDropdownRef.current.contains(event.target as Node)
      ) {
        setPromotionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const applyPromotionCode = (rawCode: string) => {
    const normalizedCode = rawCode.trim().toUpperCase();
    if (!normalizedCode) {
      setAppliedPromotionCode(null);
      setPromotionError(null);
      return;
    }

    const preset = getPromotionPreset(normalizedCode);
    if (preset) {
      if (preset.benefitType === 'shipping' && currentDeliveryType === 'pickup') {
        setAppliedPromotionCode(null);
        setPromotionError('โค้ดส่งฟรีใช้ไม่ได้กับการรับหน้าร้าน (ไม่มีค่าส่ง)');
        return;
      }

      if (!isTierEligible(preset, currentMemberTier)) {
        setAppliedPromotionCode(null);
        setPromotionError(`โค้ดนี้ใช้ได้เฉพาะสมาชิก ${getPromotionMemberLabel(preset.memberTiers)}`);
        return;
      }

      if (totalAmount < (preset.minSubtotal || 0)) {
        setAppliedPromotionCode(null);
        setPromotionError(`โค้ดนี้ใช้ได้เมื่อยอดซื้อขั้นต่ำ ฿${(preset.minSubtotal || 0).toLocaleString()}`);
        return;
      }

      if (getPromotionRemainingCount(preset) <= 0) {
        setAppliedPromotionCode(null);
        setPromotionError('โค้ดนี้ถูกใช้ครบจำนวนแล้ว');
        return;
      }
      setAppliedPromotionCode(normalizedCode);
      setPromotionInput(normalizedCode);
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

  const handleApplyPromotion = () => {
    applyPromotionCode(promotionInput);
  };

  const handleSelectPromotion = (code: string) => {
    applyPromotionCode(code);
    setPromotionDropdownOpen(false);
  };

  const handleRemovePromotion = () => {
    setAppliedPromotionCode(null);
    setPromotionInput('');
    setPromotionError(null);
    setPromotionDropdownOpen(false);
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
                <p className="text-xs text-gray-500 mb-3">สมาชิกปัจจุบัน: {currentMemberTier.toUpperCase()}</p>

                <div className="relative mb-4" ref={promotionDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setPromotionDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-gray-700 transition-colors hover:border-blue-300"
                  >
                    <span className="truncate">
                      {selectedPromotionPreset
                        ? `${selectedPromotionPreset.code} | ${getPromotionBenefitLabel(selectedPromotionPreset)} | เหลือ ${getPromotionRemainingCount(selectedPromotionPreset)} สิทธิ์`
                        : 'เลือกโค้ดโปรโมชั่น'}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 transition-transform ${promotionDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {promotionDropdownOpen && (
                    <div className="absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                      {PROMOTION_PRESETS.map((preset) => {
                        const remaining = getPromotionRemainingCount(preset);
                        const availability = getPromotionAvailability(
                          preset,
                          currentMemberTier,
                          totalAmount,
                          currentDeliveryType
                        );

                        return (
                          <button
                            key={preset.code}
                            type="button"
                            disabled={!availability.isSelectable}
                            onClick={() => handleSelectPromotion(preset.code)}
                            className={`mb-2 w-full rounded-lg border p-3 text-left last:mb-0 ${availability.isSelectable ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
                          >
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {preset.code} · {getPromotionBenefitLabel(preset)}
                              </p>
                              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                                x{remaining}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600">
                              ขั้นต่ำ ฿{(preset.minSubtotal || 0).toLocaleString()} · สมาชิก {getPromotionMemberLabel(preset.memberTiers)} · ประเภท {preset.codeType}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {preset.campaignLabel} · ใช้ได้ถึง {preset.expiresAt} · ใช้ไปแล้ว {preset.usedCount.toLocaleString()} ครั้ง
                            </p>

                            {!availability.isSelectable && availability.reason && (
                              <p className="mt-1 text-xs text-red-600">{availability.reason}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-dashed border-gray-300 p-3">
                  <p className="mb-2 text-sm text-gray-600">หรือกรอกโค้ดเอง</p>
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
                </div>
                {selectedPromotionPreset && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-gray-700">
                    <div className="grid gap-1 sm:grid-cols-2">
                      <p><span className="text-gray-500">โค้ด:</span> {selectedPromotionPreset.code}</p>
                      <p><span className="text-gray-500">รายละเอียด:</span> {selectedPromotionPreset.label}</p>
                      <p><span className="text-gray-500">ลด:</span> {getPromotionBenefitLabel(selectedPromotionPreset)}</p>
                      <p><span className="text-gray-500">ประเภทโค้ด:</span> {selectedPromotionPreset.codeType}</p>
                      <p><span className="text-gray-500">สมาชิกที่ใช้ได้:</span> {getPromotionMemberLabel(selectedPromotionPreset.memberTiers)}</p>
                      <p><span className="text-gray-500">ใช้ไปแล้ว:</span> {selectedPromotionPreset.usedCount.toLocaleString()} ครั้ง</p>
                      <p><span className="text-gray-500">คงเหลือ:</span> {getPromotionRemainingCount(selectedPromotionPreset).toLocaleString()} สิทธิ์</p>
                      <p><span className="text-gray-500">จำนวนทั้งหมด:</span> {selectedPromotionPreset.totalQuota.toLocaleString()} สิทธิ์</p>
                    </div>
                  </div>
                )}
                {promotionError && <p className="text-red-500 text-sm mt-2">{promotionError}</p>}
                {appliedPromotionCode && promotionDiscount > 0 && (
                  <p className="text-green-600 text-sm mt-2">
                    ใช้โค้ด {appliedPromotionCode} สำเร็จ ลด {promotionDiscount.toLocaleString()} บาท
                  </p>
                )}
                {appliedPromotionCode && appliedPromotionPreset?.benefitType === 'shipping' && (
                  <p className="text-green-600 text-sm mt-2">
                    ใช้โค้ด {appliedPromotionCode} สำเร็จ: ส่งฟรี {currentDeliveryType === 'delivery' ? '(หักค่าส่งแล้ว)' : '(โค้ดนี้จะใช้ได้เมื่อเลือกแบบจัดส่ง)'}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  คะแนนปัจจุบันของคุณ:{' '}
                  {isUserPointsLoading
                    ? 'กำลังโหลด...'
                    : `${normalizedCurrentUserPoints.toLocaleString()} Point`}
                </p>
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
                      max={maxUsablePoints}
                      step={100}
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      placeholder="กรอกจำนวน Point ที่ต้องการใช้"
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-400"
                    />
                    <p className="text-sm text-gray-600">
                      ใช้ Point ได้สูงสุด 30% ของราคาสินค้า ({maxPointDiscountFromPriceCap.toLocaleString()} บาท)
                    </p>
                    <p className="text-sm text-gray-600">
                      ใช้ได้จริงสูงสุด {maxUsablePoints.toLocaleString()} Point ในคำสั่งซื้อนี้
                    </p>
                    <p className="text-sm text-gray-600">
                      จำกัดตามคะแนนคงเหลือในบัญชี {normalizedCurrentUserPoints.toLocaleString()} Point
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ค่าจัดส่ง ({currentDeliveryType === 'delivery' ? 'จัดส่ง' : 'รับหน้าร้าน'})</span>
                  <span className="text-gray-900">฿{shippingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ส่วนลดค่าส่ง</span>
                  <span className="text-gray-900">- ฿{shippingDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 mt-2">
                  <span className="text-gray-900">ยอดชำระสุทธิ</span>
                  <span className="text-gray-900">฿{finalAmountWithShipping.toLocaleString()}</span>
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