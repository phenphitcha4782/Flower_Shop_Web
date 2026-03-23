import { ArrowLeft, Edit, Save, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../figma/ImageWithFallback';

type ProductItem = {
  id: string;
  name: string;
  category: string;
  source: string;
  price: number;
  stockLabel: string;
  importDate: string;
  expiryDate: string;
  status: string;
  image: string;
};

export default function ProductManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [products, setProducts] = useState([] as ProductItem[]);
  const [editingProductId, setEditingProductId] = useState(null as string | null);
  const [editStockLabel, setEditStockLabel] = useState('');
  const [editImportDate, setEditImportDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');

  const formatDate = (value: any) => {
    if (!value) return '-';
    const raw = String(value);
    const match = raw.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '-';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        const [productsRes, vaseRes, cardsRes, flowersRes, fillerRes, wrappingRes, ribbonsRes] = await Promise.all([
          fetch('http://localhost:3000/api/products').then((r) => r.json()),
          fetch('http://localhost:3000/api/vase-shapes/all').then((r) => r.json()),
          fetch('http://localhost:3000/api/cards').then((r) => r.json()),
          fetch('http://localhost:3000/api/main-flowers').then((r) => r.json()),
          fetch('http://localhost:3000/api/filler-flowers').then((r) => r.json()),
          fetch('http://localhost:3000/api/wrappings/all').then((r) => r.json()),
          fetch('http://localhost:3000/api/ribbons').then((r) => r.json()),
        ]);

        const combined = [
          ...(Array.isArray(productsRes)
            ? productsRes.map((p: any) => ({
                id: `product-${p.product_id}`,
                name: String(p.product_name || '-'),
                category: String(p.product_type_name || 'product'),
                source: 'product',
                price: Number(p.product_price || 0),
                stockLabel: '-',
                importDate: '-',
                expiryDate: '-',
                status: 'ใช้งานอยู่',
                image: String(p.product_img || ''),
              }))
            : []),
          ...(Array.isArray(vaseRes)
            ? vaseRes.map((v: any) => ({
                id: `vase-${v.vase_id}`,
                name: String(v.vase_name || '-'),
                category: 'แจกัน',
                source: 'vase',
                price: Number(v.vase_price || 0),
                stockLabel: '-',
                importDate: '-',
                expiryDate: '-',
                status: 'ใช้งานอยู่',
                image: String(v.vase_img || ''),
              }))
            : []),
          ...(Array.isArray(cardsRes)
            ? cardsRes.map((c: any) => ({
                id: `card-${c.card_id}`,
                name: String(c.card_name || '-'),
                category: 'การ์ด',
                source: 'card',
                price: Number(c.card_price || 0),
                stockLabel: '-',
                importDate: '-',
                expiryDate: '-',
                status: 'ใช้งานอยู่',
                image: String(c.card_img || ''),
              }))
            : []),
          ...(Array.isArray(flowersRes)
            ? flowersRes.map((f: any) => ({
                id: `flower-${f.flower_id}`,
                name: String(f.flower_name || '-'),
                category: 'ดอกไม้หลัก',
                source: 'flower',
                price: Number(f.flower_price || 0),
                stockLabel: '-',
                importDate: formatDate(f.import_date),
                expiryDate: formatDate(f.expiry_date),
                status: 'ใช้งานอยู่',
                image: '',
              }))
            : []),
          ...(Array.isArray(fillerRes)
            ? fillerRes.map((f: any) => ({
                id: `filler-${f.flower_id}`,
                name: String(f.flower_name || '-'),
                category: 'ดอกแซม',
                source: 'filler_flower',
                price: Number(f.flower_price || 0),
                stockLabel: '-',
                importDate: formatDate(f.import_date),
                expiryDate: formatDate(f.expiry_date),
                status: 'ใช้งานอยู่',
                image: '',
              }))
            : []),
          ...(Array.isArray(wrappingRes)
            ? wrappingRes.map((w: any) => ({
                id: `wrapping-${w.wrapping_id}`,
                name: String(w.wrapping_name || '-'),
                category: 'วัสดุห่อ',
                source: 'wrapping',
                price: Number(w.wrapping_price || 0),
                stockLabel: '-',
                importDate: '-',
                expiryDate: '-',
                status: 'ใช้งานอยู่',
                image: String(w.wrapping_img || ''),
              }))
            : []),
          ...(Array.isArray(ribbonsRes)
            ? ribbonsRes.map((r: any) => ({
                id: `ribbon-${r.ribbon_id}`,
                name: String(r.ribbon_name || '-'),
                category: 'ริบบิ้น',
                source: 'ribbon',
                price: 0,
                stockLabel: '-',
                importDate: '-',
                expiryDate: '-',
                status: 'ใช้งานอยู่',
                image: String(r.ribbon_img || ''),
              }))
            : []),
        ];

        setProducts(combined);
      } catch (err: any) {
        console.error('Failed to load manager products:', err);
        setErrorMsg('ไม่สามารถโหลดข้อมูลสินค้าจากฐานข้อมูลได้');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return products.filter((product: ProductItem) => {
      if (!keyword) return true;
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.source.toLowerCase().includes(keyword)
      );
    });
  }, [products, searchTerm]);

  const sourceLabelMap: Record<string, string> = {
    product: 'สินค้า (product)',
    vase: 'แจกัน (vase)',
    card: 'การ์ด (card)',
    flower: 'ดอกไม้หลัก (flower)',
    filler_flower: 'ดอกแซม (filler_flower)',
    wrapping: 'วัสดุห่อ (wrapping)',
    ribbon: 'ริบบิ้น (ribbon)',
  };

  const sourceOrder = ['product', 'vase', 'card', 'flower', 'filler_flower', 'wrapping', 'ribbon'];

  const openEditModal = (product: ProductItem) => {
    setEditingProductId(product.id);
    const stockAsNumber = Number.parseInt(String(product.stockLabel), 10);
    setEditStockLabel(Number.isNaN(stockAsNumber) ? '' : String(stockAsNumber));
    setEditImportDate(product.importDate !== '-' ? product.importDate : '');
    setEditExpiryDate(product.expiryDate !== '-' ? product.expiryDate : '');
  };

  const closeEditModal = () => {
    setEditingProductId(null);
    setEditStockLabel('');
    setEditImportDate('');
    setEditExpiryDate('');
  };

  const saveProductEdit = () => {
    if (!editingProductId) return;
    const parsedStock = Number.parseInt(editStockLabel, 10);
    const normalizedStockLabel = Number.isNaN(parsedStock) ? '-' : String(parsedStock);

    setProducts((prev: ProductItem[]) =>
      prev.map((item: ProductItem) => {
        if (item.id !== editingProductId) return item;
        const nextItem: ProductItem = {
          ...item,
          stockLabel: normalizedStockLabel,
        };
        nextItem.importDate = editImportDate || '-';
        nextItem.expiryDate = editExpiryDate || '-';
        return nextItem;
      })
    );
    closeEditModal();
  };

  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof filteredProducts> = {};
    filteredProducts.forEach((item: ProductItem) => {
      if (!groups[item.source]) groups[item.source] = [];
      groups[item.source].push(item);
    });

    return sourceOrder
      .filter((source) => Array.isArray(groups[source]) && groups[source].length > 0)
      .map((source) => ({ source, items: groups[source] }));
  }, [filteredProducts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับสู่แดชบอร์ด</span>
          </button>
          <h1 className="text-2xl text-gray-900">จัดการสินค้า</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาสินค้า..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Branch Manager สามารถแก้ไขได้เฉพาะจำนวนสต๊อก และวันที่นำเข้า/วันหมดอายุ (เฉพาะดอกไม้หลักและดอกไม้แซม)</p>
        </div>

        {loading && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 text-gray-600">กำลังโหลดข้อมูลสินค้าจากฐานข้อมูล...</div>
        )}
        {!loading && errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{errorMsg}</div>
        )}

        {/* Horizontal Product Lists by Category */}
        {!loading && !errorMsg && groupedProducts.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 text-gray-600">ไม่พบข้อมูลสินค้าที่ตรงกับคำค้นหา</div>
        )}

        <div className="space-y-6">
          {groupedProducts.map((group: { source: string; items: ProductItem[] }) => (
            <section key={group.source} className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-gray-900">{sourceLabelMap[group.source] || group.source}</h3>
                <span className="text-sm text-gray-500">{group.items.length} รายการ</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] table-fixed">
                  <colgroup>
                    <col style={{ width: '70px' }} />
                    <col />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '72px' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500">
                      <th className="py-2 text-left font-medium">รูป</th>
                      <th className="py-2 text-left font-medium">ชื่อสินค้า</th>
                      <th className="py-2 text-right font-medium">ราคา</th>
                      <th className="py-2 text-right font-medium">สต็อก</th>
                      <th className="py-2 text-right font-medium">วันที่นำเข้า</th>
                      <th className="py-2 text-right font-medium">วันหมดอายุ</th>
                      <th className="py-2 text-center font-medium">แก้ไข</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 align-middle">
                        <td className="py-2 pr-2">
                          <div className="w-[50px] h-[50px] overflow-hidden rounded-md bg-gray-100">
                            <ImageWithFallback
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <p className="text-sm text-gray-900 break-words leading-5">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </td>
                        <td className="py-2 text-right text-sm text-blue-600">฿{product.price.toFixed(2)}</td>
                        <td className="py-2 text-right text-sm text-gray-700">{product.stockLabel}</td>
                        <td className="py-2 text-right text-sm text-gray-700">{product.importDate}</td>
                        <td className="py-2 text-right text-sm text-gray-700">{product.expiryDate}</td>
                        <td className="py-2 text-center">
                          <button
                            title="แก้ไขรายการ"
                            onClick={() => openEditModal(product)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Edit Product Modal (frontend-only) */}
      {editingProductId && (() => {
        const editingProduct = products.find((item) => item.id === editingProductId) || null;
        if (!editingProduct) return null;

        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl mb-1 text-gray-900">แก้ไขสินค้า</h3>
            <p className="text-sm text-gray-600 mb-6">{editingProduct.name} ({sourceLabelMap[editingProduct.source] || editingProduct.source})</p>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-gray-800">ชื่อสินค้า</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  readOnly
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-gray-800">หมวดหมู่</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    readOnly
                    className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-800">ราคาขาย</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    readOnly
                    className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Branch Manager ไม่สามารถแก้ราคาขายได้</p>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-gray-800">จำนวนสต็อก</label>
                <input
                  type="number"
                  value={editStockLabel}
                  onChange={(e) => setEditStockLabel(e.target.value)}
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="เช่น 120"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-gray-800">วันที่นำเข้า</label>
                  <input
                    type="date"
                    value={editImportDate}
                    onChange={(e) => setEditImportDate(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-800">วันหมดอายุ</label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEditModal}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveProductEdit}
                className="flex-1 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  บันทึกการแก้ไข
                </span>
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}