interface TabSwitcherProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "profile", label: "ข้อมูลส่วนตัว" },
  { id: "overview", label: "ภาพรวม" },
  { id: "orders", label: "คำสั่งซื้อ" },
  { id: "promotions", label: "โปรโมชั่น" },
];
export function TabSwitcher({
  activeTab,
  onTabChange,
}: TabSwitcherProps) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col gap-2 min-w-[200px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-3 rounded-lg font-medium transition-all text-left ${
            activeTab === tab.id
              ? "bg-[#3D6FEB] text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}