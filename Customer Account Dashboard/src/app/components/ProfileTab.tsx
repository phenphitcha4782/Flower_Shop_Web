import { useState } from "react";
import { Button } from "./ui/button";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  memberSince: string;
  memberLevel: string;
  currentSpending: number;
  nextLevelSpending: number;
}

interface Props {
  profileImage: string;
  setProfileImage: (url: string) => void;
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
}

export function ProfileTab({
  profileImage,
  setProfileImage,
  profileData,
  setProfileData,
}: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [formData, setFormData] = useState(profileData);
  const [phoneError, setPhoneError] = useState("");

  const handleSave = () => {
    // Validate phone number (required field)
    if (!formData.phone || formData.phone.trim() === "") {
      setPhoneError("กรุณากรอกหมายเลขโทรศัพท์");
      return;
    }
    
    setPhoneError("");
    
    if (image) {
      setProfileImage(image);
    }
    setProfileData(formData);
    alert("บันทึกข้อมูลเรียบร้อย");
  };

  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImage(url);
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear phone error when user starts typing
    if (field === 'phone' && phoneError) {
      setPhoneError("");
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const years = Array.from({ length: 80 }, (_, i) => 2024 - i);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-1">
        ข้อมูลของฉัน
      </h2>

      <p className="text-sm text-gray-500 mb-6">
        จัดการข้อมูลส่วนตัวของคุณเพื่อความปลอดภัยของบัญชีผู้ใช้นี้ 
        <span className="text-red-500 ml-1">* จำเป็นต้องกรอก</span>
      </p>

      <div className="grid grid-cols-2 gap-10">
        {/* LEFT FORM */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">
              ชื่อ
            </label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="ไม่บังคับ"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              นามสกุล
            </label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="ไม่บังคับ"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              อีเมล
            </label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="ไม่บังคับ"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border rounded-md px-3 py-2 ${
                phoneError ? 'border-red-500' : ''
              }`}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="กรุณากรอกหมายเลขโทรศัพท์"
            />
            {phoneError && (
              <p className="text-red-500 text-xs mt-1">{phoneError}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm text-gray-600">เพศ</label>

            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1">
                <input 
                  type="radio" 
                  name="gender" 
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                />
                ชาย
              </label>

              <label className="flex items-center gap-1">
                <input 
                  type="radio" 
                  name="gender" 
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                />
                หญิง
              </label>

              <label className="flex items-center gap-1">
                <input 
                  type="radio" 
                  name="gender" 
                  value="other"
                  checked={formData.gender === 'other'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                />
                อื่น ๆ
              </label>
            </div>
          </div>

          {/* Birthday */}
          <div>
            <label className="text-sm text-gray-600">
              วัน/เดือน/ปี เกิด
            </label>

            <div className="flex gap-2 mt-2">
              <select 
                className="border rounded-md px-3 py-2"
                value={formData.birthDay}
                onChange={(e) => handleInputChange('birthDay', e.target.value)}
              >
                <option>วัน</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select 
                className="border rounded-md px-3 py-2"
                value={formData.birthMonth}
                onChange={(e) => handleInputChange('birthMonth', e.target.value)}
              >
                <option>เดือน</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select 
                className="border rounded-md px-3 py-2"
                value={formData.birthYear}
                onChange={(e) => handleInputChange('birthYear', e.target.value)}
              >
                <option>ปี</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="bg-[#3D6FEB] hover:bg-[#2D5FDB]"
          >
            บันทึก
          </Button>
        </div>

        {/* RIGHT IMAGE */}

        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full overflow-hidden border mb-4">
            <img
              src={image || profileImage}
              className="w-full h-full object-cover"
            />
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />

            <div className="border px-4 py-2 rounded-md hover:bg-gray-50">
              เลือกรูป
            </div>
          </label>

          <p className="text-xs text-gray-500 mt-3">
            ขนาดไฟล์: สูงสุด 1 MB
          </p>
        </div>
      </div>
    </div>
  );
}