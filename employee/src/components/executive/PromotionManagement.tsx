import { ArrowLeft, Calendar, DollarSign, Edit2, Plus, Tag, Trash2, TrendingUp, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

type PromotionStatus = 'active' | 'scheduled' | 'expired';

interface PromotionOption {
  id: number;
  name: string;
}

interface PromotionItem {
  id: number;
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  minAmount: number;
  discount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  promotionTypeId: number | null;
  promotionTypeName: string;
  totalUsage: number;
  isActive: boolean;
  isAllBranch: boolean;
  isAllFlower: boolean;
  branchIds: number[];
  branchNames: string[];
  channelIds: number[];
  channelNames: string[];
  flowerIds: number[];
  flowerNames: string[];
  memberLevelIds: number[];
  memberLevelNames: string[];
  status: PromotionStatus;
}

interface PromotionOptionsResponse {
  promotionTypes: Array<{ promotion_type_id: number; promotion_type_name: string }>;
  channels: Array<{ channel_id: number; channel_name: string }>;
  branches: Array<{ branch_id: number; branch_name: string }>;
  flowers: Array<{ flower_id: number; flower_name: string }>;
  memberLevels: Array<{ member_level_id: number; member_level_name: string }>;
}

interface PromotionFormData {
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  discount: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  promotionTypeId: string;
  isAllBranch: boolean;
  isAllFlower: boolean;
  branchIds: number[];
  channelIds: number[];
  flowerIds: number[];
  memberLevelIds: number[];
  isActive: boolean;
}

const API_BASE = 'http://localhost:3000';

const toInputDate = (value: string | null | undefined) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const toNumberArray = (raw: any) => {
  if (Array.isArray(raw)) {
    return raw.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0);
  }
  return [];
};

const resolvePromotionStatus = (startDate: string, endDate: string, isActive: boolean): PromotionStatus => {
  if (!isActive) return 'expired';
  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (startDate && startDate > todayText) return 'scheduled';
  if (endDate && endDate < todayText) return 'expired';
  return 'active';
};

const emptyFormData = (): PromotionFormData => ({
  code: '',
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  discount: '',
  maxDiscount: '',
  usageLimit: '',
  perUserLimit: '',
  promotionTypeId: '',
  isAllBranch: true,
  isAllFlower: true,
  branchIds: [],
  channelIds: [],
  flowerIds: [],
  memberLevelIds: [],
  isActive: true,
});

const toggleInArray = (items: number[], item: number) => {
  if (items.includes(item)) {
    return items.filter((x) => x !== item);
  }
  return [...items, item];
};

const normalizePromotion = (row: any): PromotionItem => {
  const startDate = toInputDate(row.startDate || row.start_date);
  const endDate = toInputDate(row.endDate || row.end_date);
  const isActive = Boolean(Number(row.isActive ?? row.is_active ?? 1));
  const isAllBranch = Boolean(Number(row.isAllBranch ?? row.is_allbranch ?? 0));
  const isAllFlower = Boolean(Number(row.isAllFlower ?? row.is_allflower ?? 0));

  return {
    id: Number(row.id || row.promotion_id || 0),
    code: String(row.code || row.promotion_code || '').toUpperCase(),
    name: String(row.name || row.promotion_name || ''),
    description: String(row.description || ''),
    startDate,
    endDate,
    minAmount: Number(row.minAmount || row.minimum_order_amount || 0),
    discount: Number(row.discount || 0),
    maxDiscount: row.maxDiscount === null || row.max_discount === null ? null : Number(row.maxDiscount ?? row.max_discount ?? 0),
    usageLimit: row.usageLimit === null || row.usage_limit === null ? null : Number(row.usageLimit ?? row.usage_limit ?? 0),
    perUserLimit: row.perUserLimit === null || row.per_user_limit === null ? null : Number(row.perUserLimit ?? row.per_user_limit ?? 0),
    promotionTypeId: row.promotionTypeId ? Number(row.promotionTypeId) : (row.promotion_type_id ? Number(row.promotion_type_id) : null),
    promotionTypeName: String(row.promotionTypeName || row.promotion_type_name || ''),
    totalUsage: Number(row.totalUsage || row.total_usage || 0),
    isActive,
    isAllBranch,
    isAllFlower,
    branchIds: toNumberArray(row.branchIds || row.branch_ids),
    branchNames: Array.isArray(row.branchNames) ? row.branchNames : (Array.isArray(row.branch_names) ? row.branch_names : []),
    channelIds: toNumberArray(row.channelIds || row.channel_ids),
    channelNames: Array.isArray(row.channelNames) ? row.channelNames : (Array.isArray(row.channel_names) ? row.channel_names : []),
    flowerIds: toNumberArray(row.flowerIds || row.flower_ids),
    flowerNames: Array.isArray(row.flowerNames) ? row.flowerNames : (Array.isArray(row.flower_names) ? row.flower_names : []),
    memberLevelIds: toNumberArray(row.memberLevelIds || row.member_level_ids),
    memberLevelNames: Array.isArray(row.memberLevelNames) ? row.memberLevelNames : (Array.isArray(row.member_level_names) ? row.member_level_names : []),
    status: resolvePromotionStatus(startDate, endDate, isActive),
  };
};

export default function ExecutivePromotionManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionItem | null>(null);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [promotionTypes, setPromotionTypes] = useState<PromotionOption[]>([]);
  const [channels, setChannels] = useState<PromotionOption[]>([]);
  const [branches, setBranches] = useState<PromotionOption[]>([]);
  const [flowers, setFlowers] = useState<PromotionOption[]>([]);
  const [memberLevels, setMemberLevels] = useState<PromotionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<PromotionFormData>(emptyFormData());

  const fetchOptions = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/executive/promotions/options`);
      if (!response.ok) {
        throw new Error('โหลดตัวเลือกโปรโมชั่นไม่สำเร็จ');
      }
      const data: PromotionOptionsResponse = await response.json();

      setPromotionTypes((data.promotionTypes || []).map((row) => ({ id: Number(row.promotion_type_id), name: String(row.promotion_type_name || '') })));
      setChannels((data.channels || []).map((row) => ({ id: Number(row.channel_id), name: String(row.channel_name || '') })));
      setBranches((data.branches || []).map((row) => ({ id: Number(row.branch_id), name: String(row.branch_name || '') })));
      setFlowers((data.flowers || []).map((row) => ({ id: Number(row.flower_id), name: String(row.flower_name || '') })));
      setMemberLevels((data.memberLevels || []).map((row) => ({ id: Number(row.member_level_id), name: String(row.member_level_name || '') })));
    } catch (_error) {
      // Keep UI usable even if options endpoint has partial issues.
    }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/executive/promotions`);
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error || detail.detail || 'โหลดข้อมูลโปรโมชั่นไม่สำเร็จ');
      }

      const rows = await response.json();
      const nextPromotions = Array.isArray(rows) ? rows.map(normalizePromotion) : [];
      setPromotions(nextPromotions);
    } catch (error: any) {
      setErrorMessage(error?.message || 'โหลดข้อมูลโปรโมชั่นไม่สำเร็จ');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchPromotions();
  }, []);

  const filteredPromotions = activeTab === 'all' ? promotions : promotions.filter((p) => p.status === activeTab);

  const activePromotionsCount = promotions.filter((p) => p.status === 'active').length;
  const scheduledPromotionsCount = promotions.filter((p) => p.status === 'scheduled').length;
  const expiredPromotionsCount = promotions.filter((p) => p.status === 'expired').length;

  const stats = useMemo(
    () => [
      {
        label: 'โปรโมชั่นทั้งหมด',
        value: promotions.length.toString(),
        color: 'bg-blue-500',
        icon: Tag,
      },
      {
        label: 'โปรโมชั่นที่ใช้งานอยู่',
        value: activePromotionsCount.toString(),
        color: 'bg-green-500',
        icon: DollarSign,
      },
      {
        label: 'จำนวนการใช้ทั้งหมด',
        value: promotions.reduce((sum, promo) => sum + promo.totalUsage, 0).toLocaleString(),
        color: 'bg-purple-500',
        icon: Users,
      },
      {
        label: 'อัตราการใช้งานโปรโมชั่น',
        value: `${promotions.length > 0 ? Math.round((activePromotionsCount / promotions.length) * 100) : 0}%`,
        color: 'bg-orange-500',
        icon: TrendingUp,
      },
    ],
    [activePromotionsCount, promotions]
  );

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData(emptyFormData());
    setShowEditModal(false);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingPromo(null);
    setFormData(emptyFormData());
  };

  const openEditModal = (promo: PromotionItem) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description,
      startDate: promo.startDate,
      endDate: promo.endDate,
      minAmount: promo.minAmount.toString(),
      discount: promo.discount.toString(),
      maxDiscount: promo.maxDiscount === null ? '' : promo.maxDiscount.toString(),
      usageLimit: promo.usageLimit === null ? '' : promo.usageLimit.toString(),
      perUserLimit: promo.perUserLimit === null ? '' : promo.perUserLimit.toString(),
      promotionTypeId: promo.promotionTypeId ? String(promo.promotionTypeId) : '',
      isAllBranch: promo.isAllBranch,
      isAllFlower: promo.isAllFlower,
      branchIds: promo.branchIds,
      channelIds: promo.channelIds,
      flowerIds: promo.flowerIds,
      memberLevelIds: promo.memberLevelIds,
      isActive: promo.isActive,
    });
    setShowCreateModal(false);
    setShowEditModal(true);
  };

  const validateForm = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      void Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณากรอกโค้ดและชื่อโปรโมชั่น',
        confirmButtonText: 'ตกลง',
      });
      return false;
    }
    if (!formData.promotionTypeId) {
      void Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณาเลือกชนิดโปรโมชั่น',
        confirmButtonText: 'ตกลง',
      });
      return false;
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      void Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลวันที่ไม่ถูกต้อง',
        text: 'วันที่เริ่มต้นต้องน้อยกว่าหรือเท่ากับวันที่สิ้นสุด',
        confirmButtonText: 'ตกลง',
      });
      return false;
    }

    const minAmount = Number(formData.minAmount || 0);
    const discount = Number(formData.discount || 0);
    const maxDiscount = formData.maxDiscount.trim() === '' ? null : Number(formData.maxDiscount);
    const usageLimit = formData.usageLimit.trim() === '' ? null : Number(formData.usageLimit);
    const perUserLimit = formData.perUserLimit.trim() === '' ? null : Number(formData.perUserLimit);

    if (!Number.isFinite(minAmount) || minAmount < 0) {
      void Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'ยอดขั้นต่ำต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0', confirmButtonText: 'ตกลง' });
      return false;
    }
    if (!Number.isFinite(discount) || discount < 0) {
      void Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'จำนวนส่วนลดต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0', confirmButtonText: 'ตกลง' });
      return false;
    }
    if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) {
      void Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'ยอดลดสูงสุดต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0', confirmButtonText: 'ตกลง' });
      return false;
    }
    if (usageLimit !== null && (!Number.isFinite(usageLimit) || usageLimit < 0)) {
      void Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'จำนวนโค้ด/สิทธิ์ใช้รวมต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0', confirmButtonText: 'ตกลง' });
      return false;
    }
    if (perUserLimit !== null && (!Number.isFinite(perUserLimit) || perUserLimit < 0)) {
      void Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'จำนวนใช้ต่อบัญชีต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0', confirmButtonText: 'ตกลง' });
      return false;
    }

    if (!formData.isAllBranch && formData.branchIds.length === 0) {
      void Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกอย่างน้อย 1 สาขา', confirmButtonText: 'ตกลง' });
      return false;
    }

    if (!formData.isAllFlower && formData.flowerIds.length === 0) {
      void Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกอย่างน้อย 1 ชนิดดอกไม้', confirmButtonText: 'ตกลง' });
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    code: formData.code.trim().toUpperCase(),
    name: formData.name.trim(),
    description: formData.description.trim(),
    startDate: formData.startDate || null,
    endDate: formData.endDate || null,
    minAmount: Number(formData.minAmount || 0),
    discount: Number(formData.discount || 0),
    maxDiscount: formData.maxDiscount.trim() === '' ? null : Number(formData.maxDiscount),
    usageLimit: formData.usageLimit.trim() === '' ? null : Number(formData.usageLimit),
    perUserLimit: formData.perUserLimit.trim() === '' ? null : Number(formData.perUserLimit),
    promotionTypeId: Number(formData.promotionTypeId || 0),
    isAllBranch: formData.isAllBranch,
    isAllFlower: formData.isAllFlower,
    branchIds: formData.branchIds,
    channelIds: formData.channelIds,
    flowerIds: formData.flowerIds,
    memberLevelIds: formData.memberLevelIds,
    isActive: formData.isActive,
  });

  const handleCreatePromotion = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/executive/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || result.detail || 'สร้างโปรโมชั่นไม่สำเร็จ');
      }

      await fetchPromotions();
      closeModal();
      await Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'สร้างโปรโมชั่นสำเร็จ', confirmButtonText: 'ตกลง' });
    } catch (error: any) {
      await Swal.fire({ icon: 'error', title: 'ไม่สำเร็จ', text: error?.message || 'สร้างโปรโมชั่นไม่สำเร็จ', confirmButtonText: 'ตกลง' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditPromotion = async () => {
    if (!editingPromo) return;
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/executive/promotions/${editingPromo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || result.detail || 'แก้ไขโปรโมชั่นไม่สำเร็จ');
      }

      await fetchPromotions();
      closeModal();
      await Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกการแก้ไขสำเร็จ', confirmButtonText: 'ตกลง' });
    } catch (error: any) {
      await Swal.fire({ icon: 'error', title: 'ไม่สำเร็จ', text: error?.message || 'แก้ไขโปรโมชั่นไม่สำเร็จ', confirmButtonText: 'ตกลง' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromotion = async (promoId: number) => {
    const confirmResult = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการลบโปรโมชั่น',
      text: 'คุณแน่ใจหรือไม่ที่จะลบโปรโมชั่นนี้?',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });

    if (confirmResult.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE}/api/executive/promotions/${promoId}`, {
          method: 'DELETE',
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || result.detail || 'ลบโปรโมชั่นไม่สำเร็จ');
        }

        await fetchPromotions();
        await Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'ลบโปรโมชั่นสำเร็จ', confirmButtonText: 'ตกลง' });
      } catch (error: any) {
        await Swal.fire({ icon: 'error', title: 'ไม่สำเร็จ', text: error?.message || 'ลบโปรโมชั่นไม่สำเร็จ', confirmButtonText: 'ตกลง' });
      }
    }
  };

  const getStatusBadge = (status: PromotionStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">ใช้งานอยู่</span>;
      case 'scheduled':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">กำหนดการ</span>;
      case 'expired':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">หมดอายุ</span>;
      default:
        return null;
    }
  };

  const resolveTypeName = (promotionTypeId: string) => {
    const found = promotionTypes.find((type) => String(type.id) === promotionTypeId);
    return found ? found.name : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/executive/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl text-gray-900">จัดการโปรโมชั่น</h1>
                <p className="text-sm text-gray-600">สร้างและจัดการโปรโมชั่นตามโครงสร้างฐานข้อมูล</p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              สร้างโปรโมชั่นใหม่
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {errorMessage && <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700 border border-red-200">{errorMessage}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-4 transition-colors ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                ทั้งหมด ({promotions.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-4 transition-colors ${activeTab === 'active' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                ใช้งานอยู่ ({activePromotionsCount})
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-6 py-4 transition-colors ${activeTab === 'scheduled' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                กำหนดการ ({scheduledPromotionsCount})
              </button>
              <button
                onClick={() => setActiveTab('expired')}
                className={`px-6 py-4 transition-colors ${activeTab === 'expired' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                หมดอายุ ({expiredPromotionsCount})
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-10 text-gray-500">กำลังโหลดโปรโมชั่น...</div>
            ) : (
              <div className="space-y-4">
                {filteredPromotions.map((promo) => (
                  <div key={promo.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-sm font-mono">{promo.code}</span>
                          <h3 className="text-lg text-gray-900">{promo.name}</h3>
                          {getStatusBadge(promo.status)}
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">ลด {promo.discount}</span>
                          {promo.promotionTypeName && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">{promo.promotionTypeName}</span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-4">{promo.description || '-'}</p>

                        <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>เริ่ม: {promo.startDate ? new Date(promo.startDate).toLocaleDateString('th-TH') : '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-red-500" />
                            <span>สิ้นสุด: {promo.endDate ? new Date(promo.endDate).toLocaleDateString('th-TH') : '-'}</span>
                          </div>
                          <div className="text-gray-700">
                            <span className="text-gray-600">ยอดขั้นต่ำ:</span> ฿{promo.minAmount.toLocaleString()}
                          </div>
                          <div className="text-gray-700">
                            <span className="text-gray-600">ยอดลดสูงสุด:</span> {promo.maxDiscount === null ? '-' : `฿${promo.maxDiscount.toLocaleString()}`}
                          </div>
                          <div className="text-gray-700">
                            <span className="text-gray-600">จำนวนโค้ด:</span> {promo.usageLimit === null ? '-' : promo.usageLimit.toLocaleString()}
                          </div>
                          <div className="text-gray-700">
                            <span className="text-gray-600">ใช้ต่อบัญชี:</span> {promo.perUserLimit === null ? '-' : promo.perUserLimit.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mb-2">
                          <span className="px-2 py-1 bg-slate-100 rounded">{promo.isAllBranch ? 'ทุกสาขา' : `เฉพาะ ${promo.branchNames.length || promo.branchIds.length} สาขา`}</span>
                          <span className="px-2 py-1 bg-slate-100 rounded">{promo.isAllFlower ? 'ดอกไม้ทั้งหมด' : `เฉพาะ ${promo.flowerNames.length || promo.flowerIds.length} ชนิด`}</span>
                          {promo.channelNames.length > 0 && (
                            <span className="px-2 py-1 bg-slate-100 rounded">ช่องทาง: {promo.channelNames.join(', ')}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">ใช้งานแล้ว: {promo.totalUsage} ครั้ง</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">สถานะในระบบ: {promo.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() => openEditModal(promo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(promo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPromotions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">ไม่พบโปรโมชั่นในหมวดนี้</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl text-gray-900">{showCreateModal ? 'สร้างโปรโมชั่นใหม่' : 'แก้ไขโปรโมชั่น'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">โค้ดส่วนลด</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono"
                    placeholder="NEWYEAR500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">ชื่อโปรโมชั่น</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="ปีใหม่ลดแรง"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">รายละเอียด</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="รายละเอียดโปรโมชั่น"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">ชนิดโปรโมชั่น</label>
                  <select
                    value={formData.promotionTypeId}
                    onChange={(e) => setFormData({ ...formData, promotionTypeId: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">เลือกชนิดโปรโมชั่น</option>
                    {promotionTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">ยอดขั้นต่ำ (฿)</label>
                  <input
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">จำนวนส่วนลด ({resolveTypeName(formData.promotionTypeId).includes('จัดส่ง') ? 'บาท' : 'เปอร์เซ็นต์/บาท'})</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="20"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">ยอดลดสูงสุด (฿)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="เช่น 500"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">จำนวนโค้ด/สิทธิ์ใช้รวม</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="เช่น 500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">จำนวนใช้ต่อบัญชี</label>
                  <input
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="เช่น 1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">สถานะ</label>
                  <select
                    value={formData.isActive ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === '1' })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="1">เปิดใช้งาน</option>
                    <option value="0">ปิดใช้งาน</option>
                  </select>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-slate-50">
                <label className="block text-sm text-gray-700 mb-2">ช่องทางที่ใช้โปรโมชั่น</label>
                <div className="grid md:grid-cols-3 gap-2">
                  {channels.map((channel) => (
                    <label key={channel.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.channelIds.includes(channel.id)}
                        onChange={() => setFormData({ ...formData, channelIds: toggleInArray(formData.channelIds, channel.id) })}
                      />
                      {channel.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isAllBranch}
                    onChange={(e) => setFormData({ ...formData, isAllBranch: e.target.checked, branchIds: e.target.checked ? [] : formData.branchIds })}
                  />
                  ใช้ได้ทุกสาขา
                </label>
                {!formData.isAllBranch && (
                  <div className="grid md:grid-cols-3 gap-2">
                    {branches.map((branch) => (
                      <label key={branch.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.branchIds.includes(branch.id)}
                          onChange={() => setFormData({ ...formData, branchIds: toggleInArray(formData.branchIds, branch.id) })}
                        />
                        {branch.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isAllFlower}
                    onChange={(e) => setFormData({ ...formData, isAllFlower: e.target.checked, flowerIds: e.target.checked ? [] : formData.flowerIds })}
                  />
                  ใช้ได้กับดอกไม้ทั้งหมด
                </label>
                {!formData.isAllFlower && (
                  <div className="grid md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-2 bg-white">
                    {flowers.map((flower) => (
                      <label key={flower.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.flowerIds.includes(flower.id)}
                          onChange={() => setFormData({ ...formData, flowerIds: toggleInArray(formData.flowerIds, flower.id) })}
                        />
                        {flower.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-slate-50">
                <label className="block text-sm text-gray-700 mb-2">ระดับสมาชิกที่ใช้ได้ (ไม่เลือก = ทุกระดับ)</label>
                <div className="grid md:grid-cols-3 gap-2">
                  {memberLevels.map((memberLevel) => (
                    <label key={memberLevel.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.memberLevelIds.includes(memberLevel.id)}
                        onChange={() => setFormData({ ...formData, memberLevelIds: toggleInArray(formData.memberLevelIds, memberLevel.id) })}
                      />
                      {memberLevel.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={closeModal} className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                ยกเลิก
              </button>
              <button
                onClick={showCreateModal ? handleCreatePromotion : handleEditPromotion}
                disabled={saving}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {saving ? 'กำลังบันทึก...' : showCreateModal ? 'สร้างโปรโมชั่น' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
