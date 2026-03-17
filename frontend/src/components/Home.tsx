import { MapPin } from "lucide-react";

interface HomeProps {
  onNext: () => void;
  onLogin?: () => void;
  onLogout?: () => void;
  loggedInPhone?: string | null;
  onCheckOrder?: () => void;
}

export function Home({ onNext, onLogin, onLogout, loggedInPhone, onCheckOrder }: HomeProps) {




  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-[#AEE6FF]/30">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-white shadow-lg">
            <MapPin className="w-10 h-10" style={{ color: "#62C4FF" }} />
          </div>
          <h1 className="mb-2 text-gray-900">ยินดีต้อนรับสู่ร้านดอกไม้</h1>
          <p className="text-gray-700">กรุณาเมนูที่คุณต้องการ</p>
        </div>

        <button
          onClick={onNext}
          className="w-full py-4 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "#62C4FF",
          }}
        >
          เลือกซื้อสินค้า
        </button>

        {onCheckOrder && (
          <button
            onClick={onCheckOrder}
            className="w-full py-4 rounded-lg border-2 bg-white text-gray-700 transition-all hover:bg-gray-50 mt-3"
            style={{ borderColor: "#AEE6FF" }}
          >
            ตรวจสอบคำสั่งซื้อ
          </button>
        )}

        {loggedInPhone ? (
          onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-4 rounded-lg border-2 bg-white text-gray-700 transition-all hover:bg-gray-50 mt-3"
              style={{ borderColor: '#FCA5A5' }}
            >
              ออกจากระบบ
            </button>
          )
        ) : (
          onLogin && (
            <button
              onClick={onLogin}
              className="w-full py-4 rounded-lg border-2 bg-white text-gray-700 transition-all hover:bg-gray-50 mt-3"
              style={{ borderColor: '#AEE6FF' }}
            >
              เข้าสู่ระบบ
            </button>
          )
        )}
      </div>
    </div>
  );
}
