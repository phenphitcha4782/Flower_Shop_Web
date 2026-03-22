export type Ribbon = {
  ribbon_id: number;
  ribbon_name: string;
  ribbon_img?: string;
};

export type RibbonColor = {
  ribbon_color_id: number;
  ribbon_id: number;
  ribbon_color_name: string;
  hex?: string;
};

export async function getRibbons(): Promise<Ribbon[]> {
  const res = await fetch('http://localhost:3000/api/ribbons');
  if (!res.ok) throw new Error('โหลดรายการริบบิ้นไม่สำเร็จ');
  return res.json();
}

export async function getRibbonColorsByRibbon(ribbonId: number): Promise<RibbonColor[]> {
  const res = await fetch(`http://localhost:3000/api/ribbon-colors?ribbon_id=${ribbonId}`);
  if (!res.ok) throw new Error('โหลดสีริบบิ้นไม่สำเร็จ');
  return res.json();
}
