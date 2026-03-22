export type MonetaryBouquet = {
  monetary_bouquet_id: number;
  monetary_bouquet_name: string;
  monetary_value: number;
};

export type FoldingStyle = {
  folding_style_id: number;
  folding_style_name: string;
  folding_style_img?: string;
  folding_style_price: number;
};

export async function getMonetaryBouquets(): Promise<MonetaryBouquet[]> {
  const res = await fetch('/api/monetary-bouquets');
  if (!res.ok) throw new Error('โหลดรายการธนบัตรไม่สำเร็จ');
  return res.json();
}

export async function getFoldingStyles(): Promise<FoldingStyle[]> {
  const res = await fetch('/api/folding-styles');
  if (!res.ok) throw new Error('โหลดรายการวิธีพับไม่สำเร็จ');
  return res.json();
}
