import { BarChart3, Building2, Flower2, Truck, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const roles = [
    { name: 'Cashier', icon: UserCircle, path: '/cashier/login', color: 'bg-cyan-500',Sname: 'พนักงานขาย' },
    { name: 'Florist', icon: Flower2, path: '/florist/login', color: 'bg-teal-500', Sname: 'พนักงานจัดดอกไม้' },
    //{ name: 'Rider', icon: Truck, path: '/rider/login', color: 'bg-sky-500', Sname: 'ไรเดอร์' },
    { name: 'Branch Manager', icon: Building2, path: '/manager/login', color: 'bg-indigo-500', Sname: 'ผู้จัดการสาขา' },
    { name: 'Executive', icon: BarChart3, path: '/executive/login', color: 'bg-blue-600', Sname: 'ผู้บริหาร' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Flower2 className="w-16 h-16 text-blue-500" />
          </div>
          <h1 className="text-5xl mb-4 text-blue-900">สายฟ้าดอกไม้สด</h1>
          <p className="text-xl text-blue-700">ระบบจัดการร้านดอกไม้</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl mb-8 text-center text-gray-800">เลือกตำแหน่งของคุณ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <button
                  key={role.name}
                  onClick={() => navigate(role.path)}
                  className="group p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className={`w-16 h-16 ${role.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <role.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-center text-gray-800">{role.Sname}</h3>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}