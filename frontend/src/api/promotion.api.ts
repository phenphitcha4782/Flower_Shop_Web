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
  memberLevelIds?: number[];
  memberLevelNames?: string[];
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
