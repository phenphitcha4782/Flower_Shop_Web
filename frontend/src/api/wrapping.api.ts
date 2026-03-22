export type WrappingType = {
  wrapping_type_id: number;
  wrapping_type_name: string;
};

export type WrappingMaterial = {
  wrapping_id: number;
  wrapping_type_id: number;
  wrapping_name: string;
  wrapping_img?: string;
  wrapping_price: number;
};

export async function getWrappingTypes(): Promise<WrappingType[]> {
  const res = await fetch('http://localhost:3000/api/wrapping-types');
  if (!res.ok) throw new Error('โหลดประเภทกระดาษห่อไม่สำเร็จ');
  return res.json();
}

export async function getWrappingsByType(wrappingTypeId: number): Promise<WrappingMaterial[]> {
  const res = await fetch(`http://localhost:3000/api/wrappings?wrapping_type_id=${wrappingTypeId}`);
  if (!res.ok) throw new Error('โหลดรายการกระดาษห่อไม่สำเร็จ');
  return res.json();
}
