export type FlowerType = {
  flower_id: number;
  flower_name: string;
  flower_price?: number;
  flower_img?: string | null;
  filler_flower_img?: string | null;
  import_date?: string | null;
  expiry_date?: string | null;
};

export async function getMainFlowers(): Promise<FlowerType[]> {
  const res = await fetch('/api/main-flowers');
  if (!res.ok) throw new Error('โหลดรายการดอกหลักไม่สำเร็จ');
  return res.json();
}

export async function getFillerFlowers(): Promise<FlowerType[]> {
  const res = await fetch('/api/filler-flowers');
  if (!res.ok) throw new Error('โหลดรายการดอกแซมไม่สำเร็จ');
  return res.json();
}

// Backward-compatible export for existing callers
export async function getFlowerTypes(): Promise<FlowerType[]> {
  return getMainFlowers();
}
