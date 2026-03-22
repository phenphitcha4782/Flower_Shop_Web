export type Vase = {
  product_id: number;
  product_name: string;
  price: number;
  product_img?: string;
  product_type_id?: number;
};

export type VaseShapeOption = {
  vase_id: number;
  product_id: number;
  vase_name: string;
  vase_img?: string;
  vase_price: number;
};

export type VaseColor = {
  vase_color_id: number;
  color_name?: string;
  hex?: string;
  [k: string]: any;
};

export type BouquetStyle = {
  bouquet_style_id: number;
  bouquet_style_name: string;
};

export async function getVases(productTypeId?: number): Promise<Vase[]> {
  const url = productTypeId ? `http://localhost:3000/api/vases?product_type_id=${productTypeId}` : `http://localhost:3000/api/vases`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('โหลดรายการแจกันไม่สำเร็จ');
  return res.json();
}

export async function getVaseShapes(productId: number): Promise<VaseShapeOption[]> {
  const res = await fetch(`http://localhost:3000/api/vase-shapes?product_id=${productId}`);
  if (!res.ok) throw new Error('โหลดทรงแจกันไม่สำเร็จ');
  return res.json();
}

export async function getVaseColors(): Promise<VaseColor[]> {
  const res = await fetch(`http://localhost:3000/api/vase-colors`);
  if (!res.ok) throw new Error('โหลดสีแจกันไม่สำเร็จ');
  return res.json();
}

export async function getBouquetStyles(): Promise<BouquetStyle[]> {
  const res = await fetch(`http://localhost:3000/api/bouquet-styles`);
  if (!res.ok) throw new Error('โหลดรูปแบบช่อไม่สำเร็จ');
  return res.json();
}
