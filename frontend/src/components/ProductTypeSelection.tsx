import { ProductType } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductTypeSelectionProps {
  onSelect: (type: ProductType) => void;
  onBack: () => void;
}

export function ProductTypeSelection({ onSelect, onBack }: ProductTypeSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-[#AEE6FF]/30 max-w-2xl mx-auto">
          <h1 className="mb-2 text-gray-900">เลือกประเภทสินค้า</h1>
          <p className="text-gray-700">คุณต้องการสั่งช่อดอกไม้หรือแจกันดอกไม้</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Bouquet Card */}
          <button
            onClick={() => onSelect('bouquet')}
            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border-2 hover:border-[#62C4FF]"
            style={{ borderColor: '#f3f4f6' }}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1599215966323-88d801b84771?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG93ZXIlMjBib3VxdWV0JTIwcGlua3xlbnwxfHx8fDE3NjQ2NzI2OTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="ช่อดอกไม้"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h3 className="mb-2 text-gray-800">ช่อดอกไม้</h3>
              <p className="text-gray-600 text-sm">ช่อดอกไม้สดสวยงาม เหมาะสำหรับมอบให้คนพิเศษ</p>
            </div>
          </button>

          {/* Vase Card */}
          <button
            onClick={() => onSelect('vase')}
            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border-2 hover:border-[#62C4FF]"
            style={{ borderColor: '#f3f4f6' }}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1646487134240-7262dfc8a830?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG93ZXIlMjB2YXNlJTIwYXJyYW5nZW1lbnR8ZW58MXx8fHwxNzY0NjUwNjQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="แจกันดอกไม้"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h3 className="mb-2 text-gray-800">แจกันดอกไม้</h3>
              <p className="text-gray-600 text-sm">แจกันดอกไม้สวยงาม เหมาะสำหรับตั้งโต๊ะและตกแต่ง</p>
            </div>
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onBack}
            className="w-full max-w-xs px-8 py-4 rounded-xl border-2 bg-white text-gray-700 text-lg font-semibold transition-all hover:bg-gray-50"
            style={{ borderColor: '#AEE6FF' }}
          >
            กลับไปหน้าแรก
          </button>
        </div>
      </div>
    </div>
  );
}