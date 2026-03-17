import { FormEvent, useState } from 'react';

interface LoginProps {
  onConfirm: (phone: string) => void;
  onBack: () => void;
}

export function Login({ onConfirm, onBack }: LoginProps) {
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Step 1: request OTP
    if (!otpSent) {
      if (phone.length !== 12) {
        alert('กรุณากรอกหมายเลขโทรศัพท์ให้ครบ 10 หลัก');
        return;
      }
      setMessage('ส่งรหัส OTP แล้ว');
      setOtpSent(true);
      return;
    }

    // Step 2: confirm login
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      alert('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    onConfirm(phone.replace(/\D/g, ''));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-[#AEE6FF]/30">
          <div className="text-center mb-6">
            <h1 className="text-4xl text-gray-900 mb-2">เข้าสู่ระบบสมาชิก</h1>
            <p className="text-gray-500">กรุณาใส่เบอร์โทรและรหัส OTP</p>
            {message && (
              <p className="text-green-600 text-sm mt-2 text-center">
                {message}
              </p>
            )}
          </div>

          <form id="loginForm" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-gray-700">หมายเลขโทรศัพท์</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, '').slice(0, 10);
                  const formatted = numbers.replace(
                    /^(\d{3})(\d{0,3})(\d{0,4})$/,
                    (_, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join('-')
                  );
                  setPhone(formatted);
                }}
                placeholder="000-000-0000"
                maxLength={12}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none shadow-inner"
              />
            </div>

            {otpSent && (
              <div>
                <label className="block mb-2 text-gray-700">รหัส OTP</label>
                <div className="flex justify-between space-x-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const newDigits = [...otpDigits];
                        newDigits[idx] = val;
                        setOtpDigits(newDigits);
                        if (val && idx < 5) {
                          const next = document.getElementById(`otp-${idx + 1}`);
                          next?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        <button
          type="submit"
          form="loginForm"
          className="mt-6 w-full max-w-md py-4 rounded-lg text-white transition-all mx-auto block"
          style={{ backgroundColor: '#62C4FF' }}
        >
          {otpSent ? 'เข้าสู่ระบบ' : 'ขอรหัส OTP'}
        </button>

        <button
          onClick={onBack}
          className="mt-3 w-full max-w-md py-4 rounded-lg border-2 bg-white text-gray-700 transition-all hover:bg-gray-50 mx-auto block"
          style={{ borderColor: '#AEE6FF' }}
        >
          กลับ
        </button>
      </div>
    </div>
  );
}
