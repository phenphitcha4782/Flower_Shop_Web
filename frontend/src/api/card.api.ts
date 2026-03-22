export type CardOption = {
  card_id: number;
  card_name: string;
  card_img?: string;
  card_price: number;
};

export async function getCards(): Promise<CardOption[]> {
  const res = await fetch('/api/cards');
  if (!res.ok) throw new Error('โหลดรายการการ์ดไม่สำเร็จ');
  return res.json();
}
