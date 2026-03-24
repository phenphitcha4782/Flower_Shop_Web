import { ArrowLeft, Filter, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Gender = 'ชาย' | 'หญิง' | 'ไม่ระบุ';
type MemberLevel = string;

interface PurchaseRecord {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  branch?: string;
  amount: number;
}

interface CustomerItem {
  id: string;
  branch: string;
  phone: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string | null;
  memberLevel: MemberLevel;
  purchases: PurchaseRecord[];
}

const mockCustomers: CustomerItem[] = [
  {
    id: 'CUS-001',
    branch: 'พิจิตร',
    phone: '081-234-5678',
    firstName: 'อรทัย',
    lastName: 'แสงจันทร์',
    gender: 'หญิง',
    birthDate: '1995-04-12',
    memberLevel: 'Gold',
    purchases: [
      { date: '2026-01-10', time: '06:20', amount: 1200 },
      { date: '2026-01-28', time: '07:40', amount: 860 },
      { date: '2026-02-15', time: '10:20', amount: 1450 },
      { date: '2026-03-03', time: '12:35', amount: 990 },
      { date: '2026-03-20', time: '16:10', amount: 1650 },
      { date: '2026-04-07', time: '19:45', amount: 2200 },
    ],
  },
  {
    id: 'CUS-002',
    branch: 'แพร่',
    phone: '082-345-6789',
    firstName: 'นรินทร์',
    lastName: 'บุญยืน',
    gender: 'ชาย',
    birthDate: '1990-09-01',
    memberLevel: 'Silver',
    purchases: [
      { date: '2026-01-22', time: '06:55', amount: 540 },
      { date: '2026-02-11', time: '09:15', amount: 750 },
      { date: '2026-03-05', time: '14:40', amount: 680 },
      { date: '2026-06-14', time: '18:25', amount: 1250 },
    ],
  },
  {
    id: 'CUS-003',
    branch: 'สงขลา',
    phone: '083-456-7890',
    firstName: 'ปรียา',
    lastName: 'อ่อนหวาน',
    gender: 'หญิง',
    birthDate: '1998-12-20',
    memberLevel: 'Platinum',
    purchases: [
      { date: '2026-01-03', time: '08:10', amount: 3100 },
      { date: '2026-01-19', time: '11:50', amount: 2800 },
      { date: '2026-02-09', time: '13:05', amount: 3600 },
      { date: '2026-03-01', time: '15:20', amount: 2950 },
      { date: '2026-03-18', time: '17:30', amount: 4200 },
      { date: '2026-04-11', time: '20:10', amount: 2550 },
      { date: '2026-05-02', time: '21:05', amount: 3380 },
    ],
  },
  {
    id: 'CUS-004',
    branch: 'พิจิตร',
    phone: '084-567-8901',
    firstName: 'สุธา',
    lastName: 'จิตดี',
    gender: 'ชาย',
    birthDate: '1988-06-15',
    memberLevel: 'Bronze',
    purchases: [
      { date: '2026-02-07', time: '07:15', amount: 420 },
      { date: '2026-07-19', time: '18:55', amount: 590 },
    ],
  },
  {
    id: 'CUS-005',
    branch: 'แพร่',
    phone: '085-678-9012',
    firstName: 'ธัญญ่า',
    lastName: 'พรมมา',
    gender: 'หญิง',
    birthDate: '1993-01-27',
    memberLevel: 'Gold',
    purchases: [
      { date: '2026-01-14', time: '09:35', amount: 1500 },
      { date: '2026-02-18', time: '11:10', amount: 1780 },
      { date: '2026-02-27', time: '14:05', amount: 920 },
      { date: '2026-03-22', time: '16:25', amount: 1320 },
      { date: '2026-05-10', time: '19:15', amount: 1100 },
    ],
  },
  {
    id: 'CUS-006',
    branch: 'สงขลา',
    phone: '086-789-0123',
    firstName: 'กรกมล',
    lastName: 'อินทร์ทอง',
    gender: 'ไม่ระบุ',
    birthDate: '2000-11-08',
    memberLevel: 'Silver',
    purchases: [
      { date: '2026-03-06', time: '08:45', amount: 730 },
      { date: '2026-03-29', time: '12:20', amount: 880 },
      { date: '2026-04-23', time: '17:05', amount: 960 },
    ],
  },
];

const monthLabels = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const isPurchaseInRange = (dateValue: string, dateRange: string) => {
  if (dateRange === 'all') return true;

  const target = new Date(`${dateValue}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateRange === 'today') {
    return (
      target.getFullYear() === today.getFullYear() &&
      target.getMonth() === today.getMonth() &&
      target.getDate() === today.getDate()
    );
  }

  if (dateRange === 'this-week') {
    const monday = new Date(today);
    const day = monday.getDay();
    const diffToMonday = (day + 6) % 7;
    monday.setDate(monday.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return target >= monday && target <= sunday;
  }

  if (dateRange === 'this-month') {
    return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
  }

  if (dateRange === 'this-year') {
    return target.getFullYear() === today.getFullYear();
  }

  if (dateRange === 'last-month') {
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return (
      target.getFullYear() === lastMonthDate.getFullYear() &&
      target.getMonth() === lastMonthDate.getMonth()
    );
  }

  if (dateRange === 'last-year') {
    return target.getFullYear() === today.getFullYear() - 1;
  }

  return true;
};

const inAmountRange = (value: number, range: string) => {
  if (range === 'all') return true;
  if (range === '0-999') return value <= 999;
  if (range === '1000-2999') return value >= 1000 && value <= 2999;
  return value >= 3000;
};

const calculateAge = (birthDate: string | null) => {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  if (!Number.isFinite(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const isBirthdayPassed = monthDiff > 0 || (monthDiff === 0 && today.getDate() >= birth.getDate());
  if (!isBirthdayPassed) age -= 1;
  return Math.max(age, 0);
};

const inAgeRange = (age: number | null, range: string) => {
  if (range === 'all') return true;
  if (age === null) return false;
  if (range === '18-24') return age >= 18 && age <= 24;
  if (range === '25-34') return age >= 25 && age <= 34;
  if (range === '35-44') return age >= 35 && age <= 44;
  if (range === '45+') return age >= 45;
  return true;
};

export default function ExecutiveCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [memberLevelOptions, setMemberLevelOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('this-year');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedGender, setSelectedGender] = useState<'all' | Gender>('all');
  const [selectedAmountRange, setSelectedAmountRange] = useState('all');
  const [selectedAgeRange, setSelectedAgeRange] = useState('all');
  const [selectedMemberLevel, setSelectedMemberLevel] = useState('all');
  const [customerTableSearch, setCustomerTableSearch] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const [customersRes, levelsRes, branchesRes] = await Promise.all([
          fetch('http://localhost:3000/api/executive/customers-analytics'),
          fetch('http://localhost:3000/api/executive/member-levels').catch(() => null),
          fetch('http://localhost:3000/api/branches').catch(() => null),
        ]);

        if (!customersRes.ok) throw new Error('Failed to load customers analytics');
        const customersData = await customersRes.json();
        setCustomers(Array.isArray(customersData) ? customersData : []);

        const levelsData = levelsRes && levelsRes.ok ? await levelsRes.json() : [];
        const options = Array.isArray(levelsData)
          ? levelsData
              .map((item: any) => String(item.member_level_name || '').trim())
              .filter((name: string) => Boolean(name))
          : [];
        setMemberLevelOptions(options);

        const branchesData = branchesRes && branchesRes.ok ? await branchesRes.json() : [];
        const branchNames = Array.isArray(branchesData)
          ? branchesData
              .map((branch: any) => String(branch.branch_name || '').trim())
              .filter((name: string) => Boolean(name))
          : [];
        setBranchOptions(branchNames);
      } catch (err) {
        console.error('Failed to load executive customers:', err);
        setCustomers([]);
        setMemberLevelOptions([]);
        setBranchOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedBranch !== 'all' && !branchOptions.includes(selectedBranch)) {
      setSelectedBranch('all');
    }
  }, [branchOptions, selectedBranch]);

  const customerRows = useMemo(() => {
    return customers
      .map((customer) => {
        const purchasesByBranch = selectedBranch === 'all'
          ? customer.purchases
          : customer.purchases.filter((purchase) => (purchase.branch || customer.branch) === selectedBranch);

        const filteredPurchases = purchasesByBranch.filter((purchase) => {
          return isPurchaseInRange(purchase.date, selectedDateRange);
        });

        const totalSpent = filteredPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
        const age = calculateAge(customer.birthDate);
        return {
          ...customer,
          filteredPurchases,
          purchaseCount: filteredPurchases.length,
          totalSpent,
          age,
        };
      })
      .filter((customer) => {
        const matchesGender = selectedGender === 'all' || customer.gender === selectedGender;
        const matchesAmount = inAmountRange(customer.totalSpent, selectedAmountRange);
        const matchesAge = inAgeRange(customer.age, selectedAgeRange);
        const matchesMemberLevel = selectedMemberLevel === 'all' || customer.memberLevel === selectedMemberLevel;
        const hasPurchaseInPeriod = customer.purchaseCount > 0;
        return matchesGender && matchesAmount && matchesAge && matchesMemberLevel && hasPurchaseInPeriod;
      });
  }, [customers, selectedDateRange, selectedBranch, selectedGender, selectedAmountRange, selectedAgeRange, selectedMemberLevel]);

  const purchaseFrequencyData = useMemo(() => {
    return monthLabels.map((monthLabel, monthIndex) => {
      const month = String(monthIndex + 1).padStart(2, '0');
      const count = customerRows.reduce((total, customer) => {
        const monthCount = customer.filteredPurchases.filter((purchase) => purchase.date.slice(5, 7) === month).length;
        return total + monthCount;
      }, 0);

      return {
        month: monthLabel,
        frequency: count,
      };
    });
  }, [customerRows]);

  const repeatPurchaseData = useMemo(() => {
    const bucket = {
      'ซื้อ 1 ครั้ง': 0,
      'ซื้อ 2-3 ครั้ง': 0,
      'ซื้อ 4-5 ครั้ง': 0,
      'ซื้อ 6+ ครั้ง': 0,
    };

    customerRows.forEach((customer) => {
      const count = customer.purchaseCount;
      if (count <= 1) {
        bucket['ซื้อ 1 ครั้ง'] += 1;
      } else if (count <= 3) {
        bucket['ซื้อ 2-3 ครั้ง'] += 1;
      } else if (count <= 5) {
        bucket['ซื้อ 4-5 ครั้ง'] += 1;
      } else {
        bucket['ซื้อ 6+ ครั้ง'] += 1;
      }
    });

    return Object.entries(bucket).map(([label, count]) => ({ label, count }));
  }, [customerRows]);

  const timeSlotFrequencyData = useMemo(() => {
    const slots = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      count: 0,
    }));

    customerRows.forEach((customer) => {
      customer.filteredPurchases.forEach((purchase) => {
        const hour = Number(purchase.time.split(':')[0]);
        const slot = slots.find((item) => item.hour === hour);
        if (slot) slot.count += 1;
      });
    });

    return slots.map(({ label, count }) => ({ label, count }));
  }, [customerRows]);

  const hasPurchaseFrequencyData = useMemo(
    () => purchaseFrequencyData.some((item) => item.frequency > 0),
    [purchaseFrequencyData]
  );

  const hasRepeatPurchaseData = useMemo(
    () => repeatPurchaseData.some((item) => item.count > 0),
    [repeatPurchaseData]
  );

  const hasTimeSlotFrequencyData = useMemo(
    () => timeSlotFrequencyData.some((item) => item.count > 0),
    [timeSlotFrequencyData]
  );

  const filteredCustomerTableRows = useMemo(() => {
    const keyword = customerTableSearch.trim().toLowerCase();
    if (!keyword) return customerRows;

    return customerRows.filter((customer) => {
      return (
        customer.phone.toLowerCase().includes(keyword) ||
        customer.firstName.toLowerCase().includes(keyword) ||
        customer.lastName.toLowerCase().includes(keyword) ||
        customer.branch.toLowerCase().includes(keyword) ||
        customer.memberLevel.toLowerCase().includes(keyword)
      );
    });
  }, [customerRows, customerTableSearch]);

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
              <h1 className="text-2xl text-gray-900">ข้อมูลลูกค้า</h1>
              <p className="text-sm text-gray-600">วิเคราะห์พฤติกรรมการซื้อและความถี่การซื้อซ้ำของลูกค้า</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg text-gray-900">ฟิลเตอร์ข้อมูลลูกค้า</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="min-w-0">
              <label className="block text-xs text-gray-700 mb-1">ช่วงเวลา</label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="today">วันนี้</option>
                <option value="this-week">สัปดาห์นี้</option>
                <option value="this-month">เดือนนี้</option>
                <option value="this-year">ปีนี้</option>
                <option value="last-month">เดือนที่แล้ว</option>
                <option value="last-year">ปีที่แล้ว</option>
                <option value="all">ทั้งหมด</option>
              </select>
              </div>
              <div className="min-w-0">
              <label className="block text-xs text-gray-700 mb-1">สาขา</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="all">ทุกสาขา</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              </div>
              <div className="min-w-0">
              <label className="block text-xs text-gray-700 mb-1">เพศ</label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value as 'all' | Gender)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="all">ทั้งหมด</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="ไม่ระบุ">ไม่ระบุ</option>
              </select>
              </div>
              <div className="min-w-0">
              <label className="block text-xs text-gray-700 mb-1">จำนวนเงินสะสม</label>
              <select
                value={selectedAmountRange}
                onChange={(e) => setSelectedAmountRange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="all">ทั้งหมด</option>
                <option value="0-999">0 - 999 บาท</option>
                <option value="1000-2999">1,000 - 2,999 บาท</option>
                <option value="3000+">3,000 บาทขึ้นไป</option>
              </select>
              </div>
              <div className="min-w-0">
              <label className="block text-xs text-gray-700 mb-1">ช่วงอายุ</label>
              <select
                value={selectedAgeRange}
                onChange={(e) => setSelectedAgeRange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="all">ทั้งหมด</option>
                <option value="18-24">18-24 ปี</option>
                <option value="25-34">25-34 ปี</option>
                <option value="35-44">35-44 ปี</option>
                <option value="45+">45 ปีขึ้นไป</option>
              </select>
              </div>
              <div className="min-w-0">
              <label className="block text-xs text-gray-700 mb-1">ระดับสมาชิก</label>
              <select
                value={selectedMemberLevel}
                onChange={(e) => setSelectedMemberLevel(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="all">ทั้งหมด</option>
                {memberLevelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg text-gray-900 mb-4">กราฟความถี่การซื้อในแต่ละช่วงเวลา</h3>
            {hasPurchaseFrequencyData ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={purchaseFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="frequency" name="จำนวนครั้งการซื้อ" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] grid place-items-center rounded-xl border border-dashed border-slate-300 text-slate-500">
                ไม่มีข้อมูลกราฟความถี่การซื้อในเงื่อนไขนี้
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg text-gray-900 mb-4">กราฟความถี่การซื้อซ้ำ</h3>
            {hasRepeatPurchaseData ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={repeatPurchaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="จำนวนลูกค้า" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] grid place-items-center rounded-xl border border-dashed border-slate-300 text-slate-500">
                ไม่มีข้อมูลกราฟความถี่การซื้อซ้ำในเงื่อนไขนี้
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-lg text-gray-900 mb-4">กราฟช่วงเวลาที่มีการสั่งซื้อ</h3>
          {hasTimeSlotFrequencyData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSlotFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  interval={0}
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={62}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="จำนวนคำสั่งซื้อ" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] grid place-items-center rounded-xl border border-dashed border-slate-300 text-slate-500">
              ไม่มีข้อมูลช่วงเวลาการสั่งซื้อในเงื่อนไขนี้
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg text-gray-900">ข้อมูลลูกค้า</h3>
          </div>
          <div className="px-6 py-4 border-b border-slate-200 bg-white">
            <div className="max-w-md">
              <div className="flex items-center gap-2 border-2 border-gray-200 rounded-lg px-3 focus-within:border-blue-500 transition-colors">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={customerTableSearch}
                  onChange={(e) => setCustomerTableSearch(e.target.value)}
                  placeholder="ค้นหาเบอร์ ชื่อ นามสกุล สาขา หรือระดับสมาชิก"
                  className="w-full py-2 text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">เบอร์</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ชื่อ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">นามสกุล</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">เพศ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">อายุ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">ระดับสมาชิก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">กำลังโหลดข้อมูลลูกค้า...</td>
                  </tr>
                )}
                {filteredCustomerTableRows.map((customer) => (
                  <tr key={customer.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 text-gray-700">{customer.phone}</td>
                    <td className="px-6 py-4 text-gray-900">{customer.firstName}</td>
                    <td className="px-6 py-4 text-gray-900">{customer.lastName}</td>
                    <td className="px-6 py-4 text-gray-700">{customer.gender}</td>
                    <td className="px-6 py-4 text-gray-700">{customer.age === null ? '-' : `${customer.age} ปี`}</td>
                    <td className="px-6 py-4 text-gray-700">{customer.memberLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredCustomerTableRows.length === 0 && (
            <div className="py-10 text-center text-gray-500">ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไข</div>
          )}
        </section>
      </div>
    </div>
  );
}
