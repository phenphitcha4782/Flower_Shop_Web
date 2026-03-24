const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export type PromotionBenefitType = 'amount' | 'percent' | 'shipping';

export interface Promotion {
  promotion_id: number;
  code: string;
  label: string;
  benefitType: PromotionBenefitType;
  benefitValue: number;
  maxDiscount?: number;
  minSubtotal?: number;
  description: string;
  usageLimit?: number;
  perUserLimit?: number;
  startDate?: string;
  endDate?: string;
  promotionTypeId?: number;
  promotionTypeName?: string;
  usedCount?: number;
  isAllFlower?: boolean;
  flowerIds?: number[];
  memberLevelIds?: number[];
  memberLevelNames?: string[];
}

export interface ValidatePromotionPayload {
  code: string;
  subtotal: number;
  deliveryType: 'pickup' | 'delivery';
  memberLevelName?: string;
  customerPhone?: string;
  flowerIds?: number[];
}

export interface ValidatePromotionResponse {
  valid: boolean;
  message?: string;
  promotionId?: number;
  code?: string;
  label?: string;
  benefitType?: PromotionBenefitType;
  discountAmount?: number;
  maxDiscount?: number | null;
  minSubtotal?: number;
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number | null;
  memberLevelIds?: number[];
  memberLevelNames?: string[];
  flowerIds?: number[];
  flowerNames?: string[];
  isFlowerRestricted?: boolean;
  branchIds?: number[];
  branchNames?: string[];
  isBranchRestricted?: boolean;
}

export async function getPromotions(): Promise<Promotion[]> {
  try {
    const response = await fetch(`${API_BASE}/api/promotions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch promotions: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('✅ Promotions loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching promotions:', error);
    return [];
  }
}

export async function validatePromotion(
  payload: ValidatePromotionPayload
): Promise<ValidatePromotionResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/promotions/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        valid: false,
        message: data?.message || data?.error || 'ตรวจสอบโค้ดโปรโมชั่นไม่สำเร็จ',
      };
    }

    return data as ValidatePromotionResponse;
  } catch (error) {
    console.error('❌ Error validating promotion:', error);
    return {
      valid: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบโค้ดโปรโมชั่น',
    };
  }
}
