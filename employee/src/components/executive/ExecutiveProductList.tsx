import { ArrowLeft, Boxes, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Button } from '../ui/button';

type FlowerCategory = 'fresh-core' | 'filler';
type StockStatus = 'available' | 'expired' | 'out-of-stock';

interface ExecutiveProductItem {
  id: string;
  name: string;
  flowerCategory: FlowerCategory;
  status: StockStatus;
  quantity: number;
  unit: string;
  expiryDate: string;
  costPrice: number;
  sellPrice: number;
}

type ArrangementType = 'product' | 'bouquet' | 'vase';
type VaseKind = 'แจกันแก้ว' | 'แจกันขวด' | 'แจกันเซรามิก' | 'แจกันทรงกลม';

interface ExecutiveArrangementItem {
  id: string;
  name: string;
  type: ArrangementType;
  vaseKind?: VaseKind;
  status: StockStatus;
  quantity: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
}

type SupplyType = 'card' | 'wrapping' | 'ribbon';
type WrappingMainType = 'กระดาษคราฟต์' | 'กระดาษไข' | 'กระดาษใส';

interface ExecutiveSupplyItem {
  id: string;
  name: string;
  type: SupplyType;
  status: StockStatus;
  quantity: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  wrappingMainType?: WrappingMainType;
  wrappingSubType?: string;
}

const mockProducts: ExecutiveProductItem[] = [
  {
    id: 'F-001',
    name: 'กุหลาบแดง',
    flowerCategory: 'fresh-core',
    status: 'available',
    quantity: 120,
    unit: 'ดอก',
    expiryDate: '2026-03-25',
    costPrice: 32,
    sellPrice: 55,
  },
  {
    id: 'F-002',
    name: 'ยิปโซ',
    flowerCategory: 'filler',
    status: 'available',
    quantity: 200,
    unit: 'ก้าน',
    expiryDate: '2026-03-24',
    costPrice: 12,
    sellPrice: 25,
  },
  {
    id: 'F-003',
    name: 'ลิลลี่ขาว',
    flowerCategory: 'fresh-core',
    status: 'expired',
    quantity: 10,
    unit: 'ดอก',
    expiryDate: '2026-03-18',
    costPrice: 28,
    sellPrice: 48,
  },
  {
    id: 'F-004',
    name: 'สนใบเงิน',
    flowerCategory: 'filler',
    status: 'out-of-stock',
    quantity: 0,
    unit: 'ก้าน',
    expiryDate: '2026-03-22',
    costPrice: 8,
    sellPrice: 18,
  },
  {
    id: 'F-005',
    name: 'ทิวลิปชมพู',
    flowerCategory: 'fresh-core',
    status: 'available',
    quantity: 48,
    unit: 'ดอก',
    expiryDate: '2026-03-23',
    costPrice: 36,
    sellPrice: 62,
  },
  {
    id: 'F-006',
    name: 'ใบยูคาลิปตัส',
    flowerCategory: 'filler',
    status: 'expired',
    quantity: 12,
    unit: 'ก้าน',
    expiryDate: '2026-03-19',
    costPrice: 10,
    sellPrice: 20,
  },
];

const mockArrangements: ExecutiveArrangementItem[] = [
  {
    id: 'B-001',
    name: 'ช่อกุหลาบพรีเมียม',
    type: 'bouquet',
    status: 'available',
    quantity: 24,
    unit: 'ช่อ',
    costPrice: 420,
    sellPrice: 790,
  },
  {
    id: 'B-002',
    name: 'ช่อทิวลิปหวาน',
    type: 'bouquet',
    status: 'available',
    quantity: 15,
    unit: 'ช่อ',
    costPrice: 380,
    sellPrice: 720,
  },
  {
    id: 'V-001',
    name: 'แจกันดอกไม้โทนขาว',
    type: 'vase',
    vaseKind: 'แจกันแก้ว',
    status: 'available',
    quantity: 8,
    unit: 'ชุด',
    costPrice: 520,
    sellPrice: 980,
  },
  {
    id: 'V-002',
    name: 'แจกันทิวลิปเรียบหรู',
    type: 'vase',
    vaseKind: 'แจกันขวด',
    status: 'available',
    quantity: 11,
    unit: 'ชุด',
    costPrice: 490,
    sellPrice: 920,
  },
  {
    id: 'V-003',
    name: 'แจกันดอกไม้พาสเทล',
    type: 'vase',
    vaseKind: 'แจกันเซรามิก',
    status: 'out-of-stock',
    quantity: 0,
    unit: 'ชุด',
    costPrice: 450,
    sellPrice: 860,
  },
];

const mockSupplies: ExecutiveSupplyItem[] = [
  {
    id: 'C-001',
    name: 'การ์ดอวยพรวันเกิด',
    type: 'card',
    status: 'available',
    quantity: 120,
    unit: 'ใบ',
    costPrice: 8,
    sellPrice: 20,
  },
  {
    id: 'C-002',
    name: 'การ์ดขอบคุณ',
    type: 'card',
    status: 'available',
    quantity: 85,
    unit: 'ใบ',
    costPrice: 7,
    sellPrice: 18,
  },
  {
    id: 'C-003',
    name: 'การ์ดแสดงความยินดี',
    type: 'card',
    status: 'expired',
    quantity: 20,
    unit: 'ใบ',
    costPrice: 9,
    sellPrice: 22,
  },
  {
    id: 'W-001',
    name: 'คราฟต์น้ำตาลอ่อน',
    type: 'wrapping',
    wrappingMainType: 'กระดาษคราฟต์',
    wrappingSubType: 'ผิวเรียบ',
    status: 'available',
    quantity: 60,
    unit: 'แผ่น',
    costPrice: 12,
    sellPrice: 26,
  },
  {
    id: 'W-002',
    name: 'คราฟต์ลายหนังสือพิมพ์',
    type: 'wrapping',
    wrappingMainType: 'กระดาษคราฟต์',
    wrappingSubType: 'ลายพิมพ์',
    status: 'available',
    quantity: 42,
    unit: 'แผ่น',
    costPrice: 14,
    sellPrice: 30,
  },
  {
    id: 'W-003',
    name: 'กระดาษไขขาวขุ่น',
    type: 'wrapping',
    wrappingMainType: 'กระดาษไข',
    wrappingSubType: 'เนื้อด้าน',
    status: 'available',
    quantity: 75,
    unit: 'แผ่น',
    costPrice: 10,
    sellPrice: 24,
  },
  {
    id: 'W-004',
    name: 'กระดาษไขพาสเทล',
    type: 'wrapping',
    wrappingMainType: 'กระดาษไข',
    wrappingSubType: 'สีพาสเทล',
    status: 'available',
    quantity: 55,
    unit: 'แผ่น',
    costPrice: 11,
    sellPrice: 25,
  },
  {
    id: 'W-005',
    name: 'กระดาษใสเซลโลเฟน',
    type: 'wrapping',
    wrappingMainType: 'กระดาษใส',
    wrappingSubType: 'ใสเงา',
    status: 'available',
    quantity: 48,
    unit: 'แผ่น',
    costPrice: 9,
    sellPrice: 21,
  },
  {
    id: 'W-006',
    name: 'กระดาษใสลายจุด',
    type: 'wrapping',
    wrappingMainType: 'กระดาษใส',
    wrappingSubType: 'ลายจุด',
    status: 'out-of-stock',
    quantity: 0,
    unit: 'แผ่น',
    costPrice: 10,
    sellPrice: 23,
  },
  {
    id: 'R-001',
    name: 'ริบบิ้นผ้าซาตินสีแดง',
    type: 'ribbon',
    status: 'available',
    quantity: 35,
    unit: 'ม้วน',
    costPrice: 28,
    sellPrice: 55,
  },
  {
    id: 'R-002',
    name: 'ริบบิ้นผ้าแก้วสีขาว',
    type: 'ribbon',
    status: 'available',
    quantity: 22,
    unit: 'ม้วน',
    costPrice: 25,
    sellPrice: 50,
  },
  {
    id: 'R-003',
    name: 'ริบบิ้นพิมพ์ลายทอง',
    type: 'ribbon',
    status: 'expired',
    quantity: 9,
    unit: 'ม้วน',
    costPrice: 30,
    sellPrice: 58,
  },
];

const getStatusText = (status: StockStatus) => {
  if (status === 'available') return 'พร้อมจำหน่าย';
  if (status === 'expired') return 'หมดอายุ';
  return 'หมดสต๊อก';
};

const getStatusBadgeClass = (status: StockStatus) => {
  if (status === 'available') return 'bg-green-100 text-green-800';
  if (status === 'expired') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

const getCategoryText = (category: FlowerCategory) => {
  if (category === 'fresh-core') return 'ดอกไส้สด';
  return 'ดอกแซม';
};

export default function ExecutiveProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ExecutiveProductItem[]>(mockProducts);
  const [arrangements, setArrangements] = useState<ExecutiveArrangementItem[]>(mockArrangements);
  const [supplies, setSupplies] = useState<ExecutiveSupplyItem[]>(mockSupplies);
  const [searchTerm, setSearchTerm] = useState('');
  const [mainFlowerStatusFilter, setMainFlowerStatusFilter] = useState<'all' | StockStatus>('all');
  const [fillerFlowerStatusFilter, setFillerFlowerStatusFilter] = useState<'all' | StockStatus>('all');
  const [bouquetStatusFilter, setBouquetStatusFilter] = useState<'all' | StockStatus>('all');
  const [vaseStatusFilter, setVaseStatusFilter] = useState<'all' | StockStatus>('all');
  const [cardStatusFilter, setCardStatusFilter] = useState<'all' | StockStatus>('all');
  const [wrappingStatusFilter, setWrappingStatusFilter] = useState<'all' | StockStatus>('all');
  const [ribbonStatusFilter, setRibbonStatusFilter] = useState<'all' | StockStatus>('all');

  useEffect(() => {
    const toDateOnly = (value?: string | null) => {
      if (!value) return '';
      const m = String(value).match(/\d{4}-\d{2}-\d{2}/);
      return m ? m[0] : '';
    };

    const calcStatus = (qty: number, expiryDate?: string | null): StockStatus => {
      if (!Number.isFinite(qty) || qty <= 0) return 'out-of-stock';
      const exp = toDateOnly(expiryDate);
      if (!exp) return 'available';
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const expDate = new Date(`${exp}T00:00:00`);
      if (!Number.isNaN(expDate.getTime()) && expDate < todayOnly) return 'expired';
      return 'available';
    };

    const loadFromDatabase = async () => {
      try {
        const [branchRows, productRows, vaseRows, cardRows, flowerRows, fillerRows, wrappingTypeRows, wrappingRows, ribbonRows] = await Promise.all([
          fetch('http://localhost:3000/api/branches').then((r) => r.json()),
          fetch('http://localhost:3000/api/products').then((r) => r.json()),
          fetch('http://localhost:3000/api/vase-shapes/all').then((r) => r.json()),
          fetch('http://localhost:3000/api/cards').then((r) => r.json()),
          fetch('http://localhost:3000/api/main-flowers').then((r) => r.json()),
          fetch('http://localhost:3000/api/filler-flowers').then((r) => r.json()),
          fetch('http://localhost:3000/api/wrapping-types').then((r) => r.json()),
          fetch('http://localhost:3000/api/wrappings/all').then((r) => r.json()),
          fetch('http://localhost:3000/api/ribbons').then((r) => r.json()),
        ]);

        const branches = Array.isArray(branchRows) ? branchRows : [];

        const [stockByBranch, ribbonColorGroups] = await Promise.all([
          Promise.all(
            branches.map(async (b: any) => {
              const branchId = Number(b.branch_id || 0);
              if (!Number.isFinite(branchId) || branchId <= 0) return { branchId: 0, data: {} };
              const data = await fetch(`http://localhost:3000/api/manager/branch-stocks/${branchId}`).then((r) => r.json()).catch(() => ({}));
              return { branchId, data };
            })
          ),
          Promise.all(
            (Array.isArray(ribbonRows) ? ribbonRows : []).map(async (ribbon: any) => {
              const ribbonId = Number(ribbon.ribbon_id || 0);
              if (!Number.isFinite(ribbonId) || ribbonId <= 0) return { ribbonId: 0, ribbonName: '', colors: [] as any[] };
              const colorRows = await fetch(`http://localhost:3000/api/ribbon-colors?ribbon_id=${ribbonId}`).then((r) => r.json()).catch(() => []);
              return {
                ribbonId,
                ribbonName: String(ribbon.ribbon_name || 'ริบบิ้น'),
                colors: Array.isArray(colorRows) ? colorRows : [],
              };
            })
          ),
        ]);

        const flowerById = new Map<number, any>((Array.isArray(flowerRows) ? flowerRows : []).map((f: any) => [Number(f.flower_id), f]));
        const fillerById = new Map<number, any>((Array.isArray(fillerRows) ? fillerRows : []).map((f: any) => [Number(f.filler_flower_id || f.flower_id), f]));
        const vaseById = new Map<number, any>((Array.isArray(vaseRows) ? vaseRows : []).map((v: any) => [Number(v.vase_id), v]));
        const cardById = new Map<number, any>((Array.isArray(cardRows) ? cardRows : []).map((c: any) => [Number(c.card_id), c]));
        const wrappingById = new Map<number, any>((Array.isArray(wrappingRows) ? wrappingRows : []).map((w: any) => [Number(w.wrapping_id), w]));
        const wrappingTypeById = new Map<number, string>(
          (Array.isArray(wrappingTypeRows) ? wrappingTypeRows : []).map((t: any) => [
            Number(t.wrapping_type_id),
            String(t.wrapping_type_name || ''),
          ])
        );

        const ribbonColorById = new Map<number, {
          name: string;
          ribbonName: string;
          sellPrice: number;
          costPrice: number;
        }>();
        ribbonColorGroups.forEach((group: any) => {
          if (!Array.isArray(group.colors)) return;
          group.colors.forEach((color: any) => {
            const colorId = Number(color.ribbon_color_id || 0);
            if (!Number.isFinite(colorId) || colorId <= 0) return;
            ribbonColorById.set(colorId, {
              name: String(color.ribbon_color_name || 'สีริบบิ้น'),
              ribbonName: String(group.ribbonName || 'ริบบิ้น'),
              sellPrice: Number(color.ribbon_price || color.sell_price || color.price || 0),
              costPrice: Number(color.cost_price || color.ribbon_cost_price || color.ribbon_color_cost_price || 0),
            });
          });
        });

        const nextProducts: ExecutiveProductItem[] = [];
        const nextArrangements: ExecutiveArrangementItem[] = [];
        const nextSupplies: ExecutiveSupplyItem[] = [];
        const productQtyById = new Map<number, number>();

        stockByBranch.forEach(({ branchId, data }: any) => {
          if (!branchId || !data || typeof data !== 'object') return;

          const flowerStocks = Array.isArray(data.flower) ? data.flower : [];
          flowerStocks.forEach((s: any) => {
            const itemId = Number(s.item_id || 0);
            const qty = Number(s.stock_qty || 0);
            const flower = flowerById.get(itemId);
            const name = String(flower?.flower_name || `ดอกไม้ #${itemId}`);
            const sellPrice = Number(flower?.flower_price || flower?.sell_price || 0);
            const costPrice = Number(flower?.cost_price || flower?.flower_cost_price || sellPrice || 0);
            nextProducts.push({
              id: `F-${branchId}-${itemId}`,
              name,
flowerCategory: 'fresh-core',
              status: calcStatus(qty, s.expiry_date),
              quantity: qty,
              unit: 'ดอก',
              expiryDate: toDateOnly(s.expiry_date) || toDateOnly(s.received_date) || new Date().toISOString().slice(0, 10),
              costPrice,
              sellPrice,
            });
          });

          const fillerStocks = Array.isArray(data.filler_flower) ? data.filler_flower : [];
          fillerStocks.forEach((s: any) => {
            const itemId = Number(s.item_id || 0);
            const qty = Number(s.stock_qty || 0);
            const filler = fillerById.get(itemId);
            const name = String(filler?.filler_flower_name || filler?.flower_name || `ดอกแซม #${itemId}`);
            const sellPrice = Number(filler?.filler_flower_price || filler?.flower_price || filler?.sell_price || 0);
            const costPrice = Number(filler?.cost_price || filler?.filler_flower_cost_price || sellPrice || 0);
            nextProducts.push({
              id: `FF-${branchId}-${itemId}`,
              name,
flowerCategory: 'filler',
              status: calcStatus(qty, s.expiry_date),
              quantity: qty,
              unit: 'ก้าน',
              expiryDate: toDateOnly(s.expiry_date) || toDateOnly(s.received_date) || new Date().toISOString().slice(0, 10),
              costPrice,
              sellPrice,
            });
          });

          const productStocks = Array.isArray(data.product) ? data.product : [];
          productStocks.forEach((s: any) => {
            const itemId = Number(s.item_id || 0);
            const qty = Number(s.stock_qty || 0);
            if (!Number.isFinite(itemId) || itemId <= 0) return;
            const prevQty = Number(productQtyById.get(itemId) || 0);
            productQtyById.set(itemId, prevQty + (Number.isFinite(qty) ? qty : 0));
          });

          const vaseStocks = Array.isArray(data.vase) ? data.vase : [];
          vaseStocks.forEach((s: any) => {
            const itemId = Number(s.item_id || 0);
            const qty = Number(s.stock_qty || 0);
            const vase = vaseById.get(itemId);
            const sellPrice = Number(vase?.vase_price || vase?.sell_price || 0);
            const costPrice = Number(vase?.cost_price || vase?.vase_cost_price || sellPrice || 0);
            nextArrangements.push({
              id: `V-${branchId}-${itemId}`,
              name: String(vase?.vase_name || `แจกัน #${itemId}`),
type: 'vase',
              vaseKind: 'แจกันแก้ว',
              status: calcStatus(qty),
              quantity: qty,
              unit: 'ชิ้น',
              costPrice,
              sellPrice,
            });
          });

          const cardStocks = Array.isArray(data.card) ? data.card : [];
          cardStocks.forEach((s: any) => {
            const itemId = Number(s.item_id || 0);
            const qty = Number(s.stock_qty || 0);
            const card = cardById.get(itemId);
            const sellPrice = Number(card?.card_price || card?.sell_price || 0);
            const costPrice = Number(card?.cost_price || sellPrice || 0);
            nextSupplies.push({
              id: `C-${branchId}-${itemId}`,
              name: String(card?.card_name || `การ์ด #${itemId}`),
type: 'card',
              status: calcStatus(qty),
              quantity: qty,
              unit: 'ใบ',
              costPrice,
              sellPrice,
            });
          });

          const wrappingStocks = Array.isArray(data.wrapping) ? data.wrapping : [];
          wrappingStocks.forEach((s: any) => {
            const itemId = Number(s.item_id || 0);
            const qty = Number(s.stock_qty || 0);
            const wrapping = wrappingById.get(itemId);
            const paperTypeName = String(
              wrappingTypeById.get(Number(wrapping?.wrapping_type_id || 0)) || wrapping?.wrapping_material_type || ''
            ).trim();
            const paperColorName = String(wrapping?.wrapping_material || wrapping?.wrapping_name || '').trim();
            const composedName = paperTypeName && paperColorName
              ? `${paperTypeName} (${paperColorName})`
              : String(wrapping?.wrapping_name || `วัสดุห่อ #${itemId}`);
            const sellPrice = Number(wrapping?.wrapping_price || wrapping?.sell_price || 0);
            const costPrice = Number(wrapping?.cost_price || sellPrice || 0);
            nextSupplies.push({
              id: `W-${branchId}-${itemId}`,
              name: composedName,
type: 'wrapping',
              status: calcStatus(qty),
              quantity: qty,
              unit: 'แผ่น',
              costPrice,
              sellPrice,
              wrappingMainType: undefined,
              wrappingSubType: undefined,
            });
          });

          const ribbonStocks = Array.isArray(data.ribbon) ? data.ribbon : [];
          ribbonStocks.forEach((s: any) => {
            const itemId = Number(s.item_id || 0);
            const qty = Number(s.stock_qty || 0);
            const ribbonColor = ribbonColorById.get(itemId);
            nextSupplies.push({
              id: `R-${branchId}-${itemId}`,
              name: ribbonColor ? `${ribbonColor.ribbonName} (${ribbonColor.name})` : `ริบบิ้น #${itemId}`,
type: 'ribbon',
              status: calcStatus(qty),
              quantity: qty,
              unit: 'ม้วน',
              costPrice: Number(ribbonColor?.costPrice || 0),
              sellPrice: Number(ribbonColor?.sellPrice || 0),
            });
          });
        });

        (Array.isArray(productRows) ? productRows : []).forEach((product: any) => {
          const itemId = Number(product?.product_id || 0);
          if (!Number.isFinite(itemId) || itemId <= 0) return;

          const qty = Number(productQtyById.get(itemId) || 0);
          const sellPrice = Number(product?.product_price || product?.sell_price || 0);
          const costPrice = Number(product?.cost_price || sellPrice || 0);

          nextArrangements.push({
            id: `B-${itemId}`,
            name: String(product?.product_name || `สินค้า #${itemId}`),
            type: 'product',
            status: calcStatus(qty),
            quantity: qty,
            unit: 'ชิ้น',
            costPrice,
            sellPrice,
          });
        });

        const mergeItems = <T extends { id: string; quantity: number; costPrice: number; sellPrice: number; status: StockStatus; expiryDate?: string }>(items: T[]) => {
          const merged = new Map<string, T>();
          items.forEach((item) => {
            const parts = item.id.split('-');
            const key = parts.length >= 3 ? `${parts[0]}-${parts[2]}` : item.id;
            const existing = merged.get(key);
            if (!existing) {
              merged.set(key, { ...item, id: key });
              return;
            }

            const totalQty = Number(existing.quantity || 0) + Number(item.quantity || 0);
            const expiryCandidate = [existing.expiryDate, item.expiryDate]
              .filter((d): d is string => Boolean(d))
              .sort()
              .pop();

            merged.set(key, {
              ...existing,
              id: key,
              quantity: totalQty,
              expiryDate: expiryCandidate,
              status: calcStatus(totalQty, expiryCandidate),
              costPrice: Number.isFinite(existing.costPrice) ? existing.costPrice : Number.isFinite(item.costPrice) ? item.costPrice : 0,
              sellPrice: Number.isFinite(existing.sellPrice) ? existing.sellPrice : Number.isFinite(item.sellPrice) ? item.sellPrice : 0,
            });
          });
          return Array.from(merged.values());
        };

        if (nextProducts.length > 0) setProducts(mergeItems(nextProducts));
        if (nextArrangements.length > 0) setArrangements(mergeItems(nextArrangements));
        if (nextSupplies.length > 0) setSupplies(mergeItems(nextSupplies));
      } catch (err) {
        console.error('Failed to load executive product list from DB:', err);
      }
    };

    loadFromDatabase();
  }, []);

  const handleProductPriceChange = (
    id: string,
    field: 'costPrice' | 'sellPrice',
    value: string
  ) => {
    const numeric = Number(value);
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: Number.isFinite(numeric) ? Math.max(0, numeric) : 0 } : item
      )
    );
  };

  const handleSaveFlowerPrices = async (items: ExecutiveProductItem[]) => {
    try {
      console.log('💾 Saving flower prices:', items);
      
      const savePromises = items.map((item) => {
        const parts = item.id.split('-');
        // ID format: F-itemId (after merge) or F-branchId-itemId (before merge)
        const itemId = parts.length >= 3 ? Number(parts[2]) : Number(parts[1]);
        const isMainFlower = item.flowerCategory === 'fresh-core';
        const endpoint = isMainFlower ? `/api/main-flowers/${itemId}` : `/api/filler-flowers/${itemId}`;
        const payload = isMainFlower
          ? { costPrice: item.costPrice, sellPrice: item.sellPrice }
          : { costPrice: item.costPrice };
        
        console.log(`📝 ${item.name}: ID=${item.id}, itemId=${itemId}, endpoint=${endpoint}, costPrice=${item.costPrice}${isMainFlower ? `, sellPrice=${item.sellPrice}` : ''}`);
        
        return fetch(`http://localhost:3000${endpoint}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              console.log(`✅ Saved ${item.name}:`, data);
            } else {
              console.error(`❌ Failed to save ${item.name}:`, data);
            }
            return data;
          })
          .catch((err) => {
            console.error(`❌ Error saving ${item.name}:`, err);
            return { success: false, error: err.message };
          });
      });

      const results = await Promise.all(savePromises);
      const successCount = results.filter((r) => r.success).length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกราคาสำเร็จ',
          html: `<p>บันทึกรายการเรียบร้อย</p>`,
          confirmButtonText: 'ตกลง',
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'บันทึกราคาไม่สมบูรณ์',
          html: `<p>กรุณาตรวจสอบรายการ</p>`,
          confirmButtonText: 'ตกลง',
        });
      }
    } catch (err) {
      console.error('Error saving flower prices:', err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: String(err),
        confirmButtonText: 'ตกลง',
      });
    }
  };

  const showSaveSummary = (successCount: number, totalCount: number, label: string) => {
    if (successCount === totalCount) {
      Swal.fire({
        icon: 'success',
        title: 'บันทึกราคาสำเร็จ',
        html: `<p>บันทึกรายการเรียบร้อย</p>`,
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: 'บันทึกราคาไม่สมบูรณ์',
      html: `<p>กรุณาตรวจสอบรายการ</p>`,
      confirmButtonText: 'ตกลง',
    });
  };

  const handleSaveVasePrices = async (items: ExecutiveArrangementItem[]) => {
    try {
      const savePromises = items.map((item) => {
        const parts = item.id.split('-');
        const itemId = parts.length >= 3 ? Number(parts[2]) : Number(parts[1]);
        return fetch(`http://localhost:3000/api/vases/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            costPrice: item.costPrice,
            sellPrice: item.sellPrice,
          }),
        })
          .then((r) => r.json())
          .catch((err) => ({ success: false, error: err.message }));
      });

      const results = await Promise.all(savePromises);
      const successCount = results.filter((r) => r.success).length;
      showSaveSummary(successCount, results.length, 'แจกัน');
    } catch (err) {
      console.error('Error saving vase prices:', err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: String(err),
        confirmButtonText: 'ตกลง',
      });
    }
  };

  const handleSaveSupplyPrices = async (items: ExecutiveSupplyItem[], type: SupplyType) => {
    try {
      const endpointByType: Record<SupplyType, string> = {
        card: '/api/cards',
        wrapping: '/api/wrappings',
        ribbon: '/api/ribbon-colors',
      };

      const labelByType: Record<SupplyType, string> = {
        card: 'การ์ด',
        wrapping: 'กระดาษห่อ',
        ribbon: 'ริบบิ้น',
      };

      const savePromises = items.map((item) => {
        const parts = item.id.split('-');
        const itemId = parts.length >= 3 ? Number(parts[2]) : Number(parts[1]);
        return fetch(`http://localhost:3000${endpointByType[type]}/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            costPrice: item.costPrice,
            sellPrice: item.sellPrice,
          }),
        })
          .then((r) => r.json())
          .catch((err) => ({ success: false, error: err.message }));
      });

      const results = await Promise.all(savePromises);
      const successCount = results.filter((r) => r.success).length;
      showSaveSummary(successCount, results.length, labelByType[type]);
    } catch (err) {
      console.error(`Error saving ${type} prices:`, err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: String(err),
        confirmButtonText: 'ตกลง',
      });
    }
  };

  const handleArrangementPriceChange = (
    id: string,
    field: 'costPrice' | 'sellPrice',
    value: string
  ) => {
    const numeric = Number(value);
    setArrangements((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: Number.isFinite(numeric) ? Math.max(0, numeric) : 0 } : item
      )
    );
  };

  const handleSupplyPriceChange = (
    id: string,
    field: 'costPrice' | 'sellPrice',
    value: string
  ) => {
    const numeric = Number(value);
    setSupplies((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: Number.isFinite(numeric) ? Math.max(0, numeric) : 0 } : item
      )
    );
  };

  const filteredMainFlowers = useMemo(() => {
    return products.filter((item) => {
      const isMainFlower = item.flowerCategory === 'fresh-core';
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = mainFlowerStatusFilter === 'all' || item.status === mainFlowerStatusFilter;
      return isMainFlower && matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, mainFlowerStatusFilter]);

  const filteredFillerFlowers = useMemo(() => {
    return products.filter((item) => {
      const isFillerFlower = item.flowerCategory === 'filler';
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = fillerFlowerStatusFilter === 'all' || item.status === fillerFlowerStatusFilter;
      return isFillerFlower && matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, fillerFlowerStatusFilter]);

  const filteredProducts = useMemo(() => {
    return arrangements.filter((item) => {
      const matchesType = item.type === 'product';
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [arrangements, searchTerm]);

  const filteredVases = useMemo(() => {
    return arrangements.filter((item) => {
      const matchesType = item.type === 'vase';
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVaseStatus = vaseStatusFilter === 'all' || item.status === vaseStatusFilter;
      return matchesType && matchesSearch && matchesVaseStatus;
    });
  }, [arrangements, searchTerm, vaseStatusFilter]);

  const filteredCards = useMemo(() => {
    return supplies.filter((item) => {
      const matchesType = item.type === 'card';
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = cardStatusFilter === 'all' || item.status === cardStatusFilter;
      return matchesType && matchesSearch && matchesStatus;
    });
  }, [supplies, searchTerm, cardStatusFilter]);

  const filteredWrappings = useMemo(() => {
    return supplies.filter((item) => {
      const matchesType = item.type === 'wrapping';
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWrappingStatus = wrappingStatusFilter === 'all' || item.status === wrappingStatusFilter;
      return matchesType && matchesSearch && matchesWrappingStatus;
    });
  }, [supplies, searchTerm, wrappingStatusFilter]);

  const filteredRibbons = useMemo(() => {
    return supplies.filter((item) => {
      const matchesType = item.type === 'ribbon';
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRibbonStatus = ribbonStatusFilter === 'all' || item.status === ribbonStatusFilter;
      return matchesType && matchesSearch && matchesRibbonStatus;
    });
  }, [supplies, searchTerm, ribbonStatusFilter]);

  const stats = useMemo(() => {
    const allFlowers = [...filteredMainFlowers, ...filteredFillerFlowers];
    const available = allFlowers.filter((item) => item.status === 'available').length;
    const expired = allFlowers.filter((item) => item.status === 'expired').length;
    const outOfStock = allFlowers.filter((item) => item.status === 'out-of-stock').length;
    return { available, expired, outOfStock };
  }, [filteredMainFlowers, filteredFillerFlowers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/executive/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl text-gray-900">รายการสินค้า</h1>
                <p className="text-sm text-gray-600">ภาพรวมสต๊อกสินค้าทั้งหมดและสถานะ</p>
              </div>
            </div>
          </div>
        </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
            <p className="text-sm text-gray-600">พร้อมจำหน่าย</p>
            <p className="text-3xl text-green-600">{stats.available}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md border border-red-100">
            <p className="text-sm text-gray-600">หมดอายุ</p>
            <p className="text-3xl text-red-600">{stats.expired}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
            <p className="text-sm text-gray-600">หมดสต๊อก</p>
            <p className="text-3xl text-gray-700">{stats.outOfStock}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาด้วยชื่อสินค้า หรือรหัสสินค้า"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>

        </div>

        <div className="pt-4">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg text-gray-900">ตารางดอกไม้สด</h2>
                  <p className="text-sm text-gray-600">จัดการดอกไม้ไส้สด แก้ไขราคาต้นทุนและราคาขายได้ทันที</p>
                </div>
                {filteredMainFlowers.length > 0 && (
                  <Button
                    onClick={() => handleSaveFlowerPrices(filteredMainFlowers)}
                    variant="secondary"
                    size="lg"
                    className="ml-4 px-6 font-bold text-base shadow-md"
                  >
                    บันทึกราคา
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สถานะ (เฉพาะตารางดอกไม้สด)</label>
                  <select
                    value={mainFlowerStatusFilter}
                    onChange={(e) => setMainFlowerStatusFilter(e.target.value as 'all' | StockStatus)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="available">พร้อมจำหน่าย</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="out-of-stock">หมดสต๊อก</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อดอกไม้</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMainFlowers.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.costPrice || ''}
                        onChange={(e) => handleProductPriceChange(item.id, 'costPrice', e.target.value)}
                        placeholder="0"
                        className="w-32 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.sellPrice || ''}
                        onChange={(e) => handleProductPriceChange(item.id, 'sellPrice', e.target.value)}
                        placeholder="0"
                        className="w-32 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMainFlowers.length === 0 && (
            <div className="py-12 text-center bg-white">
              <Boxes className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">ไม่พบรายการดอกไม้สดที่ตรงกับเงื่อนไข</p>
            </div>
          )}
        </section>

        <div className="h-8 md:h-10" />

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg text-gray-900">ตารางดอกไม้แซม</h2>
                  <p className="text-sm text-gray-600">จัดการดอกไม้แซมและดอกประกอบ แก้ไขราคาต้นทุนได้ทันที</p>
                </div>
                {filteredFillerFlowers.length > 0 && (
                  <Button
                    onClick={() => handleSaveFlowerPrices(filteredFillerFlowers)}
                    variant="secondary"
                    size="lg"
                    className="ml-4 px-6 font-bold text-base shadow-md"
                  >
                    บันทึกราคา
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สถานะ (เฉพาะตารางดอกไม้แซม)</label>
                  <select
                    value={fillerFlowerStatusFilter}
                    onChange={(e) => setFillerFlowerStatusFilter(e.target.value as 'all' | StockStatus)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="available">พร้อมจำหน่าย</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="out-of-stock">หมดสต๊อก</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อดอกไม้แซม</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFillerFlowers.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.costPrice || ''}
                        onChange={(e) => handleProductPriceChange(item.id, 'costPrice', e.target.value)}
                        placeholder="0"
                        className="w-32 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredFillerFlowers.length === 0 && (
            <div className="py-12 text-center bg-white">
              <Boxes className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">ไม่พบรายการดอกไม้แซมที่ตรงกับเงื่อนไข</p>
            </div>
          )}
        </section>

        <div className="h-8 md:h-10" />

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-lg text-gray-900">ตารางสินค้า</h2>
                <p className="text-sm text-gray-600">รายการสินค้า</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อสินค้า</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        value={item.costPrice}
                        onChange={(e) => handleArrangementPriceChange(item.id, 'costPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        value={item.sellPrice}
                        onChange={(e) => handleArrangementPriceChange(item.id, 'sellPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="py-10 text-center bg-white text-gray-500">ไม่พบรายการสินค้าตามเงื่อนไข</div>
          )}
        </section>

        <div className="h-8 md:h-10" />

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg text-gray-900">ตารางแจกัน</h2>
                  <p className="text-sm text-gray-600">แยกชนิดแจกันชัดเจน เช่น แจกันแก้ว แจกันขวด และแจกันเซรามิก</p>
                </div>
                {filteredVases.length > 0 && (
                  <Button
                    onClick={() => handleSaveVasePrices(filteredVases)}
                    variant="secondary"
                    size="lg"
                    className="ml-4 px-6 font-bold text-base shadow-md"
                  >
                    บันทึกราคา
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สถานะ (เฉพาะตารางแจกัน)</label>
                  <select
                    value={vaseStatusFilter}
                    onChange={(e) => setVaseStatusFilter(e.target.value as 'all' | StockStatus)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="available">พร้อมจำหน่าย</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="out-of-stock">หมดสต๊อก</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อรายการ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชนิดแจกัน</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVases.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.vaseKind || '-'}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        value={item.costPrice}
                        onChange={(e) => handleArrangementPriceChange(item.id, 'costPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        value={item.sellPrice}
                        onChange={(e) => handleArrangementPriceChange(item.id, 'sellPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVases.length === 0 && (
            <div className="py-10 text-center bg-white text-gray-500">ไม่พบรายการแจกันตามเงื่อนไข</div>
          )}
        </section>

        <div className="h-8 md:h-10" />

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg text-gray-900">ตารางการ์ด</h2>
                  <p className="text-sm text-gray-600">รายการการ์ดที่ใช้ประกอบสินค้า พร้อมจำนวนคงเหลือ</p>
                </div>
                {filteredCards.length > 0 && (
                  <Button
                    onClick={() => handleSaveSupplyPrices(filteredCards, 'card')}
                    variant="secondary"
                    size="lg"
                    className="ml-4 px-6 font-bold text-base shadow-md"
                  >
                    บันทึกราคา
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สถานะ (เฉพาะตารางการ์ด)</label>
                  <select
                    value={cardStatusFilter}
                    onChange={(e) => setCardStatusFilter(e.target.value as 'all' | StockStatus)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="available">พร้อมจำหน่าย</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="out-of-stock">หมดสต๊อก</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อการ์ด</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCards.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">
                      <input
                        type="number"
                        min={0}
                        value={item.costPrice}
                        onChange={(e) => handleSupplyPriceChange(item.id, 'costPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <input
                        type="number"
                        min={0}
                        value={item.sellPrice}
                        onChange={(e) => handleSupplyPriceChange(item.id, 'sellPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.quantity.toLocaleString()} {item.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCards.length === 0 && (
            <div className="py-10 text-center bg-white text-gray-500">ไม่พบรายการการ์ดตามเงื่อนไข</div>
          )}
        </section>

        <div className="h-8 md:h-10" />

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg text-gray-900">ตารางกระดาษห่อ</h2>
                  <p className="text-sm text-gray-600">ชื่อกระดาษแสดงเป็นรูปแบบ ชื่อกระดาษ(สีกระดาษ)</p>
                </div>
                {filteredWrappings.length > 0 && (
                  <Button
                    onClick={() => handleSaveSupplyPrices(filteredWrappings, 'wrapping')}
                    variant="secondary"
                    size="lg"
                    className="ml-4 px-6 font-bold text-base shadow-md"
                  >
                    บันทึกราคา
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สถานะ (เฉพาะตารางกระดาษห่อ)</label>
                  <select
                    value={wrappingStatusFilter}
                    onChange={(e) => setWrappingStatusFilter(e.target.value as 'all' | StockStatus)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="available">พร้อมจำหน่าย</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="out-of-stock">หมดสต๊อก</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อกระดาษ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWrappings.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">
                      <input
                        type="number"
                        min={0}
                        value={item.costPrice}
                        onChange={(e) => handleSupplyPriceChange(item.id, 'costPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <input
                        type="number"
                        min={0}
                        value={item.sellPrice}
                        onChange={(e) => handleSupplyPriceChange(item.id, 'sellPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.quantity.toLocaleString()} {item.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredWrappings.length === 0 && (
            <div className="py-10 text-center bg-white text-gray-500">ไม่พบรายการกระดาษห่อตามเงื่อนไข</div>
          )}
        </section>

        <div className="h-8 md:h-10" />

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg text-gray-900">ตารางริบบิ้น</h2>
                  <p className="text-sm text-gray-600">รายการริบบิ้นสำหรับตกแต่งสินค้าและจำนวนคงเหลือ</p>
                </div>
                {filteredRibbons.length > 0 && (
                  <Button
                    onClick={() => handleSaveSupplyPrices(filteredRibbons, 'ribbon')}
                    variant="secondary"
                    size="lg"
                    className="ml-4 px-6 font-bold text-base shadow-md"
                  >
                    บันทึกราคา
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สถานะ (เฉพาะตารางริบบิ้น)</label>
                  <select
                    value={ribbonStatusFilter}
                    onChange={(e) => setRibbonStatusFilter(e.target.value as 'all' | StockStatus)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="available">พร้อมจำหน่าย</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="out-of-stock">หมดสต๊อก</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อริบบิ้น</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRibbons.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">
                      <input
                        type="number"
                        min={0}
                        value={item.costPrice}
                        onChange={(e) => handleSupplyPriceChange(item.id, 'costPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <input
                        type="number"
                        min={0}
                        value={item.sellPrice}
                        onChange={(e) => handleSupplyPriceChange(item.id, 'sellPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.quantity.toLocaleString()} {item.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRibbons.length === 0 && (
            <div className="py-10 text-center bg-white text-gray-500">ไม่พบรายการริบบิ้นตามเงื่อนไข</div>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}
