import { ArrowLeft, Boxes, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type FlowerCategory = 'fresh-core' | 'filler';
type StockStatus = 'available' | 'expired' | 'out-of-stock';

interface ExecutiveProductItem {
  id: string;
  name: string;
  branch: string;
  flowerCategory: FlowerCategory;
  status: StockStatus;
  quantity: number;
  unit: string;
  expiryDate: string;
  costPrice: number;
  sellPrice: number;
}

type ArrangementType = 'bouquet' | 'vase';
type VaseKind = 'แจกันแก้ว' | 'แจกันขวด' | 'แจกันเซรามิก' | 'แจกันทรงกลม';

interface ExecutiveArrangementItem {
  id: string;
  name: string;
  branch: string;
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
  branch: string;
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
    branch: 'พิจิตร',
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
    branch: 'พิจิตร',
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
    branch: 'แพร่',
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
    branch: 'แพร่',
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
    branch: 'สงขลา',
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
    branch: 'สงขลา',
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
    branch: 'พิจิตร',
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
    branch: 'แพร่',
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
    branch: 'สงขลา',
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
    branch: 'พิจิตร',
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
    branch: 'แพร่',
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
    branch: 'พิจิตร',
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
    branch: 'แพร่',
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
    branch: 'สงขลา',
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
    branch: 'พิจิตร',
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
    branch: 'แพร่',
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
    branch: 'สงขลา',
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
    branch: 'พิจิตร',
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
    branch: 'แพร่',
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
    branch: 'สงขลา',
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
    branch: 'พิจิตร',
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
    branch: 'แพร่',
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
    branch: 'สงขลา',
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
  const [flowerBranchFilter, setFlowerBranchFilter] = useState('all');
  const [flowerStatusFilter, setFlowerStatusFilter] = useState<'all' | StockStatus>('all');
  const [bouquetBranchFilter, setBouquetBranchFilter] = useState('all');
  const [bouquetStatusFilter, setBouquetStatusFilter] = useState<'all' | StockStatus>('all');
  const [vaseBranchFilter, setVaseBranchFilter] = useState('all');
  const [vaseStatusFilter, setVaseStatusFilter] = useState<'all' | StockStatus>('all');
  const [cardBranchFilter, setCardBranchFilter] = useState('all');
  const [cardStatusFilter, setCardStatusFilter] = useState<'all' | StockStatus>('all');
  const [wrappingBranchFilter, setWrappingBranchFilter] = useState('all');
  const [wrappingStatusFilter, setWrappingStatusFilter] = useState<'all' | StockStatus>('all');
  const [ribbonBranchFilter, setRibbonBranchFilter] = useState('all');
  const [ribbonStatusFilter, setRibbonStatusFilter] = useState<'all' | StockStatus>('all');

  const branches = useMemo(() => {
    const unique = new Set([
      ...products.map((item) => item.branch),
      ...arrangements.map((item) => item.branch),
      ...supplies.map((item) => item.branch),
    ]);
    return Array.from(unique);
  }, [products, arrangements, supplies]);

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

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = flowerBranchFilter === 'all' || item.branch === flowerBranchFilter;
      const matchesStatus = flowerStatusFilter === 'all' || item.status === flowerStatusFilter;
      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [products, searchTerm, flowerBranchFilter, flowerStatusFilter]);

  const filteredBouquets = useMemo(() => {
    return arrangements.filter((item) => {
      const matchesType = item.type === 'bouquet';
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBouquetBranch = bouquetBranchFilter === 'all' || item.branch === bouquetBranchFilter;
      const matchesBouquetStatus = bouquetStatusFilter === 'all' || item.status === bouquetStatusFilter;
      return matchesType && matchesSearch && matchesBouquetBranch && matchesBouquetStatus;
    });
  }, [arrangements, searchTerm, bouquetBranchFilter, bouquetStatusFilter]);

  const filteredVases = useMemo(() => {
    return arrangements.filter((item) => {
      const matchesType = item.type === 'vase';
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVaseBranch = vaseBranchFilter === 'all' || item.branch === vaseBranchFilter;
      const matchesVaseStatus = vaseStatusFilter === 'all' || item.status === vaseStatusFilter;
      return matchesType && matchesSearch && matchesVaseBranch && matchesVaseStatus;
    });
  }, [arrangements, searchTerm, vaseBranchFilter, vaseStatusFilter]);

  const filteredCards = useMemo(() => {
    return supplies.filter((item) => {
      const matchesType = item.type === 'card';
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = cardBranchFilter === 'all' || item.branch === cardBranchFilter;
      const matchesStatus = cardStatusFilter === 'all' || item.status === cardStatusFilter;
      return matchesType && matchesSearch && matchesBranch && matchesStatus;
    });
  }, [supplies, searchTerm, cardBranchFilter, cardStatusFilter]);

  const filteredWrappings = useMemo(() => {
    return supplies.filter((item) => {
      const matchesType = item.type === 'wrapping';
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.wrappingMainType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.wrappingSubType || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWrappingBranch = wrappingBranchFilter === 'all' || item.branch === wrappingBranchFilter;
      const matchesWrappingStatus = wrappingStatusFilter === 'all' || item.status === wrappingStatusFilter;
      return matchesType && matchesSearch && matchesWrappingBranch && matchesWrappingStatus;
    });
  }, [supplies, searchTerm, wrappingBranchFilter, wrappingStatusFilter]);

  const filteredRibbons = useMemo(() => {
    return supplies.filter((item) => {
      const matchesType = item.type === 'ribbon';
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRibbonBranch = ribbonBranchFilter === 'all' || item.branch === ribbonBranchFilter;
      const matchesRibbonStatus = ribbonStatusFilter === 'all' || item.status === ribbonStatusFilter;
      return matchesType && matchesSearch && matchesRibbonBranch && matchesRibbonStatus;
    });
  }, [supplies, searchTerm, ribbonBranchFilter, ribbonStatusFilter]);

  const stats = useMemo(() => {
    const available = filteredProducts.filter((item) => item.status === 'available').length;
    const expired = filteredProducts.filter((item) => item.status === 'expired').length;
    const outOfStock = filteredProducts.filter((item) => item.status === 'out-of-stock').length;
    return { available, expired, outOfStock };
  }, [filteredProducts]);

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
                <p className="text-sm text-gray-600">ภาพรวมสต๊อกสินค้าแยกตามสาขาและสถานะ</p>
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
              <div>
                <h2 className="text-lg text-gray-900">ตารางดอกไม้</h2>
                <p className="text-sm text-gray-600">จัดการสินค้าดอกไม้สด แก้ไขราคาต้นทุนและราคาขายได้ทันที</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สาขา (เฉพาะตารางดอกไม้)</label>
                  <select
                    value={flowerBranchFilter}
                    onChange={(e) => setFlowerBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทุกสาขา</option>
                    {branches.map((branch) => (
                      <option key={`flower-${branch}`} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สถานะ (เฉพาะตารางดอกไม้)</label>
                  <select
                    value={flowerStatusFilter}
                    onChange={(e) => setFlowerStatusFilter(e.target.value as 'all' | StockStatus)}
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
                  <th className="px-6 py-3 text-left text-sm text-gray-700">รหัส</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สินค้า</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สาขา</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">หมวดหมู่</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">วันหมดอายุ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">{item.id}</td>
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.branch}</td>
                    <td className="px-6 py-4 text-gray-700">{getCategoryText(item.flowerCategory)}</td>
                    <td className="px-6 py-4 text-gray-700">
                      <input
                        type="number"
                        min={0}
                        value={item.costPrice}
                        onChange={(e) => handleProductPriceChange(item.id, 'costPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <input
                        type="number"
                        min={0}
                        value={item.sellPrice}
                        onChange={(e) => handleProductPriceChange(item.id, 'sellPrice', e.target.value)}
                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{new Date(item.expiryDate).toLocaleDateString('th-TH')}</td>
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

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center bg-white">
              <Boxes className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">ไม่พบรายการสินค้าที่ตรงกับเงื่อนไข</p>
            </div>
          )}
        </section>

        <div className="h-8 md:h-10" />

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-lg text-gray-900">ตารางช่อดอกไม้</h2>
                <p className="text-sm text-gray-600">รายการช่อดอกไม้พร้อมช่องแก้ไขราคาต้นทุนและราคาขาย</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สาขา (เฉพาะตารางช่อ)</label>
                  <select
                    value={bouquetBranchFilter}
                    onChange={(e) => setBouquetBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทุกสาขา</option>
                    {branches.map((branch) => (
                      <option key={`bouquet-${branch}`} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สถานะ (เฉพาะตารางช่อ)</label>
                  <select
                    value={bouquetStatusFilter}
                    onChange={(e) => setBouquetStatusFilter(e.target.value as 'all' | StockStatus)}
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
                  <th className="px-6 py-3 text-left text-sm text-gray-700">รหัส</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อช่อ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สาขา</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBouquets.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">{item.id}</td>
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.branch}</td>
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
          {filteredBouquets.length === 0 && (
            <div className="py-10 text-center bg-white text-gray-500">ไม่พบรายการช่อดอกไม้ตามเงื่อนไข</div>
          )}
        </section>

        <div className="h-8 md:h-10" />

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-lg text-gray-900">ตารางแจกัน</h2>
                <p className="text-sm text-gray-600">แยกชนิดแจกันชัดเจน เช่น แจกันแก้ว แจกันขวด และแจกันเซรามิก</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สาขา (เฉพาะตารางแจกัน)</label>
                  <select
                    value={vaseBranchFilter}
                    onChange={(e) => setVaseBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทุกสาขา</option>
                    {branches.map((branch) => (
                      <option key={`vase-${branch}`} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <th className="px-6 py-3 text-left text-sm text-gray-700">รหัส</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อรายการ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สาขา</th>
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
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">{item.id}</td>
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.branch}</td>
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
              <div>
                <h2 className="text-lg text-gray-900">ตารางการ์ด</h2>
                <p className="text-sm text-gray-600">รายการการ์ดที่ใช้ประกอบสินค้า พร้อมจำนวนคงเหลือ</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สาขา (เฉพาะตารางการ์ด)</label>
                  <select
                    value={cardBranchFilter}
                    onChange={(e) => setCardBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทุกสาขา</option>
                    {branches.map((branch) => (
                      <option key={`card-${branch}`} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <th className="px-6 py-3 text-left text-sm text-gray-700">รหัส</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อการ์ด</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สาขา</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCards.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">{item.id}</td>
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.branch}</td>
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
              <div>
                <h2 className="text-lg text-gray-900">ตารางกระดาษห่อ</h2>
                <p className="text-sm text-gray-600">มี 3 ชนิดใหญ่ และชนิดย่อยในแต่ละประเภท</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สาขา (เฉพาะตารางกระดาษห่อ)</label>
                  <select
                    value={wrappingBranchFilter}
                    onChange={(e) => setWrappingBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทุกสาขา</option>
                    {branches.map((branch) => (
                      <option key={`wrapping-${branch}`} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
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
            <table className="w-full min-w-[1020px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">รหัส</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อรายการ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สาขา</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชนิดใหญ่</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชนิดย่อย</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWrappings.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">{item.id}</td>
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.branch}</td>
                    <td className="px-6 py-4 text-gray-700">{item.wrappingMainType || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{item.wrappingSubType || '-'}</td>
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
              <div>
                <h2 className="text-lg text-gray-900">ตารางริบบิ้น</h2>
                <p className="text-sm text-gray-600">รายการริบบิ้นสำหรับตกแต่งสินค้าและจำนวนคงเหลือ</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">สาขา (เฉพาะตารางริบบิ้น)</label>
                  <select
                    value={ribbonBranchFilter}
                    onChange={(e) => setRibbonBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">ทุกสาขา</option>
                    {branches.map((branch) => (
                      <option key={`ribbon-${branch}`} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <th className="px-6 py-3 text-left text-sm text-gray-700">รหัส</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อริบบิ้น</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สาขา</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาต้นทุน (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ราคาขาย (บาท)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">จำนวนคงเหลือ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRibbons.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">{item.id}</td>
                    <td className="px-6 py-4 text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.branch}</td>
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
