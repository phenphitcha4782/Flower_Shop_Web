import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { CSSProperties, ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { getFlowerTypes, type FlowerType as DbFlowerType } from '../api/flower.api';
import { getVases, type Vase } from '../api/vase.api';
import { type CartCustomization, type MainFlowerItem, type ProductType } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

type BouquetKind = 'normal' | 'money-envelope';
type VaseMaterial = 'glass' | 'ceramic' | 'clay';
type VaseShape = 'cylinder' | 'bottle' | 'round';
type WrapperPaper = 'kraft' | 'clear' | 'pastel';
type KraftPattern = 'kraft-plain' | 'kraft-newsprint' | 'kraft-floral';
type PastelColor = 'pastel-pink' | 'pastel-peach' | 'pastel-mint' | 'pastel-lilac';
type ClearWrapStyle = 'clear-transparent' | 'clear-rainbow';
type RibbonStyle = 'style-1' | 'style-2';
type RibbonColor = 'blue' | 'red';
type MoneyBillValue = 20 | 50 | 100 | 500 | 1000;
type MoneyFoldStyle = 'fan' | 'rose' | 'heart' | 'star';
type CardTemplate = 'classic' | 'minimal' | 'romantic';

type FlowerChoice = {
  id: number | null;
  label: string;
  unitPrice?: number;
};

type MainFlowerSelection = {
  id: number | null;
  label: string;
  unitPrice: number;
  count: number;
};

export interface CustomArrangementResult {
  productId: number | null;
  bouquetStyleId?: number | null;
  vaseColorId?: number | null;
  price: number;
  imageUrl: string;
  flowerTypeIds: number[];
  flowerNames: string[];
  customization: CartCustomization;
}

interface CustomArrangementFlowProps {
  productType: ProductType;
  onBack: () => void;
  onComplete: (result: CustomArrangementResult) => void;
}

const moneyPackages: Array<{ value: MoneyBillValue; label: string }> = [
  { value: 20, label: 'ธนบัตร 20 บาท' },
  { value: 50, label: 'ธนบัตร 50 บาท' },
  { value: 100, label: 'ธนบัตร 100 บาท' },
  { value: 500, label: 'ธนบัตร 500 บาท' },
  { value: 1000, label: 'ธนบัตร 1000 บาท' },
];

const wrapperPaperOptions: Array<{ value: WrapperPaper; label: string }> = [
  { value: 'kraft', label: 'กระดาษคราฟท์' },
  { value: 'clear', label: 'กระดาษใส' },
  { value: 'pastel', label: 'กระดาษสีพาสเทล' },
];

const kraftPatternOptions: Array<{ value: KraftPattern; label: string }> = [
  { value: 'kraft-plain', label: 'ลายเรียบธรรมชาติ' },
  { value: 'kraft-newsprint', label: 'ลายหนังสือพิมพ์' },
  { value: 'kraft-floral', label: 'ลายดอกไม้' },
];

const pastelColorOptions: Array<{ value: PastelColor; label: string }> = [
  { value: 'pastel-pink', label: 'ชมพูพาสเทล' },
  { value: 'pastel-peach', label: 'พีชพาสเทล' },
  { value: 'pastel-mint', label: 'เขียวมิ้นต์พาสเทล' },
  { value: 'pastel-lilac', label: 'ม่วงไลแลคพาสเทล' },
];

const clearWrapStyleOptions: Array<{ value: ClearWrapStyle; label: string }> = [
  { value: 'clear-transparent', label: 'สีใส' },
  { value: 'clear-rainbow', label: 'สีรุ้ง' },
];

const ribbonStyleOptions: Array<{ value: RibbonStyle; label: string }> = [
  { value: 'style-1', label: 'แบบที่ 1' },
  { value: 'style-2', label: 'แบบที่ 2' },
];

const ribbonColorOptions: Array<{ value: RibbonColor; label: string }> = [
  { value: 'blue', label: 'สีฟ้า' },
  { value: 'red', label: 'สีแดง' },
];

const cardTemplateOptions: Array<{ value: CardTemplate; label: string }> = [
  { value: 'classic', label: 'การ์ดคลาสสิก' },
  { value: 'minimal', label: 'การ์ดมินิมอล' },
  { value: 'romantic', label: 'การ์ดโรแมนติก' },
];

const bouquetImage = 'https://images.unsplash.com/photo-1599215966323-88d801b84771?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
const moneyBouquetImage = 'https://images.unsplash.com/photo-1616108637472-aee7a8f17787?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
const vaseImage = 'https://images.unsplash.com/photo-1646487134240-7262dfc8a830?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

const selectedChoiceStyle: CSSProperties = {
  borderColor: '#62C4FF',
  backgroundColor: '#62C4FF',
  color: '#FFFFFF',
};

const unselectedChoiceStyle: CSSProperties = {
  borderColor: '#e5e7eb',
  backgroundColor: '#FFFFFF',
  color: '#374151',
};

const getChoiceStyle = (selected: boolean): CSSProperties =>
  selected ? selectedChoiceStyle : unselectedChoiceStyle;

const mainFlowerUnitPrices: Record<string, number> = {
  'กุหลาบ': 10,
  'rose': 10,
  'ทิวลิป': 18,
  'tulip': 18,
  'ลิลลี่': 25,
  'lily': 25,
  'กล้วยไม้': 20,
  'orchid': 20,
  'ทานตะวัน': 15,
  'sunflower': 15,
};

const fillerFlowerUnitPrices: Record<string, number> = {
  'ดอกยิปโซ': 35,
  'gypsophila': 35,
  'ดอกคัตเตอร์': 40,
  'cutter': 40,
};

const normalizeLabel = (value: string) => value.trim().toLowerCase();

const getMainFlowerUnitPrice = (label: string) => mainFlowerUnitPrices[normalizeLabel(label)] ?? 12;

const getFillerFlowerUnitPrice = (label: string) => fillerFlowerUnitPrices[normalizeLabel(label)] ?? 45;

const getMinimumMoneyAmount = (billValue: MoneyBillValue) => Math.max(300, billValue);

const normalizeMoneyAmount = (amount: number, billValue: MoneyBillValue) => {
  const minimumAmount = getMinimumMoneyAmount(billValue);
  const normalizedAmount = Math.max(amount, minimumAmount);
  return normalizedAmount % billValue === 0
    ? normalizedAmount
    : Math.ceil(normalizedAmount / billValue) * billValue;
};

export function CustomArrangementFlow({ productType, onBack, onComplete }: CustomArrangementFlowProps) {
  const [products, setProducts] = useState<Vase[]>([]);
  const [flowerTypes, setFlowerTypes] = useState<DbFlowerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<number>(2);

  const [bouquetKind, setBouquetKind] = useState<BouquetKind | null>(null);
  const [vaseMaterial, setVaseMaterial] = useState<VaseMaterial | null>(null);
  const [vaseShape, setVaseShape] = useState<VaseShape | null>(null);

  const [mainFlowers, setMainFlowers] = useState<MainFlowerSelection[]>([]);
  const [fillerFlower, setFillerFlower] = useState<FlowerChoice | null>(null);

  const [wrapperPaper, setWrapperPaper] = useState<WrapperPaper | null>(null);
  const [kraftPattern, setKraftPattern] = useState<KraftPattern | null>(null);
  const [pastelColor, setPastelColor] = useState<PastelColor | null>(null);
  const [clearWrapStyle, setClearWrapStyle] = useState<ClearWrapStyle | null>(null);
  const [ribbonStyle, setRibbonStyle] = useState<RibbonStyle | null>(null);
  const [ribbonColor, setRibbonColor] = useState<RibbonColor | null>(null);

  const [moneyPackage, setMoneyPackage] = useState<MoneyBillValue | null>(null);
  const [moneyAmount, setMoneyAmount] = useState<number | null>(null);
  const [moneyFoldStyle, setMoneyFoldStyle] = useState<MoneyFoldStyle | null>(null);

  const [hasCard, setHasCard] = useState<boolean | null>(null);
  const [cardTemplate, setCardTemplate] = useState<CardTemplate | null>(null);
  const [cardMessage, setCardMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const productTypeId = productType === 'bouquet' ? 1 : 2;
        const [productRows, flowerRows] = await Promise.all([
          getVases(productTypeId),
          getFlowerTypes(),
        ]);
        if (!mounted) return;
        setProducts(productRows);
        setFlowerTypes(flowerRows);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'โหลดข้อมูลไม่สำเร็จ');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [productType]);

  useEffect(() => {
    setCurrentStep(2);
    setBouquetKind(null);
    setVaseMaterial(null);
    setVaseShape(null);
    setMainFlowers([]);
    setFillerFlower(null);
    setWrapperPaper(null);
    setKraftPattern(null);
    setPastelColor(null);
    setClearWrapStyle(null);
    setRibbonStyle(null);
    setRibbonColor(null);
    setMoneyPackage(null);
    setMoneyAmount(null);
    setMoneyFoldStyle(null);
    setHasCard(null);
    setCardTemplate(null);
    setCardMessage('');
  }, [productType]);

  const isNormalBouquet = productType === 'bouquet' && bouquetKind === 'normal';
  const isMoneyBouquet = productType === 'bouquet' && bouquetKind === 'money-envelope';
  const isVase = productType === 'vase';
  const isBouquet = productType === 'bouquet' && bouquetKind !== null;
  const needsFlowerFlow = isBouquet || isVase;

  useEffect(() => {
    if (!isBouquet) {
      setWrapperPaper(null);
      setKraftPattern(null);
      setPastelColor(null);
      setClearWrapStyle(null);
      setRibbonStyle(null);
      setRibbonColor(null);
    }

    if (!isMoneyBouquet) {
      setMoneyPackage(null);
      setMoneyAmount(null);
      setMoneyFoldStyle(null);
    }

    if (!needsFlowerFlow) {
      setMainFlowers([]);
      setFillerFlower(null);
    }
  }, [isBouquet, isMoneyBouquet, needsFlowerFlow]);

  useEffect(() => {
    if (wrapperPaper !== 'kraft') {
      setKraftPattern(null);
    }
    if (wrapperPaper !== 'pastel') {
      setPastelColor(null);
    }
    if (wrapperPaper !== 'clear') {
      setClearWrapStyle(null);
    }
  }, [wrapperPaper]);

  const mainFlowerOptions = useMemo<FlowerChoice[]>(() => {
    if (flowerTypes.length > 0) {
      return flowerTypes.map((ft: DbFlowerType) => ({
        id: ft.flower_id,
        label: ft.flower_name,
        unitPrice: getMainFlowerUnitPrice(ft.flower_name),
      }));
    }
    return [
      { id: null, label: 'กุหลาบ', unitPrice: getMainFlowerUnitPrice('กุหลาบ') },
      { id: null, label: 'ทิวลิป', unitPrice: getMainFlowerUnitPrice('ทิวลิป') },
      { id: null, label: 'ลิลลี่', unitPrice: getMainFlowerUnitPrice('ลิลลี่') },
    ];
  }, [flowerTypes]);

  const fillerFlowerOptions = useMemo<FlowerChoice[]>(() => {
    const merged: FlowerChoice[] = [
      { id: null, label: 'ดอกยิปโซ' },
      { id: null, label: 'ดอกคัตเตอร์' },
      ...flowerTypes.map((ft: DbFlowerType) => ({ id: ft.flower_id, label: ft.flower_name })),
    ];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.label)) return false;
      seen.add(item.label);
      return true;
    });
  }, [flowerTypes]);

  const mainFlowerTotal = useMemo(
    () => mainFlowers.reduce((sum: number, flower: MainFlowerSelection) => sum + flower.count * flower.unitPrice, 0),
    [mainFlowers]
  );

  const fillerFlowerTotal = useMemo(() => {
    if (!fillerFlower) return 0;
    return getFillerFlowerUnitPrice(fillerFlower.label);
  }, [fillerFlower]);

  const isMoneyAmountValid = useMemo(() => {
    if (!moneyPackage || moneyAmount === null) return false;
    return moneyAmount >= getMinimumMoneyAmount(moneyPackage) && moneyAmount % moneyPackage === 0;
  }, [moneyAmount, moneyPackage]);

  const moneyNoteCount = useMemo(() => {
    if (!isMoneyAmountValid || !moneyPackage || moneyAmount === null) return 0;
    return moneyAmount / moneyPackage;
  }, [isMoneyAmountValid, moneyAmount, moneyPackage]);

  const totalSteps = isMoneyBouquet ? 8 : 7;
  const isFlowerSelectionStep = (isMoneyBouquet && currentStep === 4) || (!isMoneyBouquet && currentStep === 3);
  const isFlowerCountStep = (isMoneyBouquet && currentStep === 5) || (!isMoneyBouquet && currentStep === 4);
  const isWrapperStep = isBouquet && currentStep === (isMoneyBouquet ? 6 : 5);
  const isRibbonStep = isBouquet && currentStep === (isMoneyBouquet ? 7 : 6);
  const isCardStep = currentStep === totalSteps;

  const estimatedPrice = useMemo(() => {
    let total = productType === 'vase' ? 420 : 320;

    if (productType === 'bouquet' && bouquetKind) {
      total += mainFlowerTotal;
      total += fillerFlowerTotal;
      if (wrapperPaper === 'kraft') total += 30;
      if (wrapperPaper === 'clear') total += 40;
      if (wrapperPaper === 'pastel') total += 50;
      if (ribbonStyle) total += 25;
      if (ribbonColor === 'red') total += 10;

      if (bouquetKind === 'money-envelope') {
        if (moneyAmount) total += moneyAmount;
        if (moneyFoldStyle === 'rose') total += 120;
        if (moneyFoldStyle === 'heart') total += 100;
        if (moneyFoldStyle === 'star') total += 140;
        if (moneyFoldStyle === 'fan') total += 80;
      }
    }

    if (productType === 'vase') {
      if (vaseMaterial === 'glass') total += 120;
      if (vaseMaterial === 'ceramic') total += 180;
      if (vaseMaterial === 'clay') total += 140;

      if (vaseShape === 'cylinder') total += 50;
      if (vaseShape === 'bottle') total += 40;
      if (vaseShape === 'round') total += 60;

      total += mainFlowerTotal;
      total += fillerFlowerTotal;
    }

    if (hasCard) total += 35;

    return Math.round(total / 10) * 10;
  }, [
    bouquetKind,
    fillerFlowerTotal,
    hasCard,
    mainFlowerTotal,
    moneyAmount,
    moneyFoldStyle,
    productType,
    ribbonColor,
    ribbonStyle,
    vaseMaterial,
    vaseShape,
    wrapperPaper,
  ]);

  const resolvedProduct = useMemo(() => {
    if (products.length === 0) return null;
    return products.reduce((closest: Vase, current: Vase) => {
      const currentDiff = Math.abs(Number(current.price || 0) - estimatedPrice);
      const closestDiff = Math.abs(Number(closest.price || 0) - estimatedPrice);
      return currentDiff < closestDiff ? current : closest;
    }, products[0]);
  }, [estimatedPrice, products]);

  const previewImage = useMemo(() => {
    const dbImage = (resolvedProduct as any)?.product_img as string | undefined;
    if (dbImage) return dbImage;
    if (isMoneyBouquet) return moneyBouquetImage;
    if (isVase) return vaseImage;
    return bouquetImage;
  }, [isMoneyBouquet, isVase, resolvedProduct]);

  const stepLabel = useMemo(() => {
    if (currentStep === 2) {
      return productType === 'bouquet' ? 'เลือกประเภทช่อ' : 'เลือกวัสดุและทรงแจกัน';
    }
    if (currentStep === 3) {
      return isMoneyBouquet ? 'เลือกธนบัตร จำนวนเงิน และวิธีพับ' : 'เลือกดอกไม้หลักและดอกแซม';
    }
    if (currentStep === 4) {
      return isMoneyBouquet ? 'เลือกดอกไม้หลักและดอกแซม (ไม่บังคับ)' : 'ระบุจำนวนดอกไม้หลัก';
    }
    if (currentStep === 5) {
      return isMoneyBouquet ? 'ระบุจำนวนดอกไม้หลัก' : 'เลือกกระดาษห่อ';
    }
    if (currentStep === 6) {
      return isMoneyBouquet ? 'เลือกกระดาษห่อ' : 'เลือกริบบิ้น';
    }
    if (currentStep === 7 && isMoneyBouquet) {
      return 'เลือกริบบิ้น';
    }
    return 'เลือกการ์ดและยืนยัน';
  }, [currentStep, isMoneyBouquet, productType]);

  const getNextStep = (step: number) => {
    if (isMoneyBouquet) {
      if (step === 2) return 3;
      if (step === 3) return 4;
      if (step === 4) return mainFlowers.length === 0 ? 6 : 5;
      if (step === 5) return 6;
      if (step === 6) return 7;
      if (step === 7) return 8;
      return 8;
    }

    if (step === 2) return 3;
    if (step === 3) return 4;
    if (step === 4) {
      if (isBouquet) return 5;
      return 7;
    }
    if (step === 5) return 6;
    if (step === 6) return 7;
    return 7;
  };

  const getPrevStep = (step: number) => {
    if (isMoneyBouquet) {
      if (step === 8) return 7;
      if (step === 7) return 6;
      if (step === 6) return mainFlowers.length === 0 ? 4 : 5;
      if (step === 5) return 4;
      if (step === 4) return 3;
      if (step === 3) return 2;
      return 2;
    }

    if (step === 7) {
      if (isVase) return 4;
      return 6;
    }
    if (step === 6) return 5;
    if (step === 5) return 4;
    if (step === 4) return 3;
    if (step === 3) return 2;
    return 2;
  };

  const isFlowerConfigValid = () => {
    if (mainFlowers.length === 0) {
      return isMoneyBouquet || !!fillerFlower;
    }
    return mainFlowers.every((flower: MainFlowerSelection) => flower.count >= 1);
  };

  const isWrapperConfigValid = () => {
    if (!wrapperPaper) return false;
    if (wrapperPaper === 'kraft') return kraftPattern !== null;
    if (wrapperPaper === 'pastel') return pastelColor !== null;
    if (wrapperPaper === 'clear') return clearWrapStyle !== null;
    return false;
  };

  const isCardConfigValid = () => {
    if (hasCard === null) return false;
    if (hasCard) return cardTemplate !== null && cardMessage.trim().length > 0;
    return true;
  };

  const stepValid = (step: number) => {
    if (step === 2) {
      if (productType === 'bouquet') return bouquetKind !== null;
      return vaseMaterial !== null && vaseShape !== null;
    }
    if (isMoneyBouquet) {
      if (step === 3) return moneyPackage !== null && moneyFoldStyle !== null && isMoneyAmountValid;
      if (step === 4) return mainFlowers.length <= 2; // flowers are optional for money bouquet
      if (step === 5) return isFlowerConfigValid();
      if (step === 6) return isWrapperConfigValid();
      if (step === 7) return ribbonStyle !== null && ribbonColor !== null;
      if (step === 8) return isCardConfigValid();
      return false;
    }

    if (step === 3) return mainFlowers.length >= 1 && mainFlowers.length <= 2;
    if (step === 4) return isFlowerConfigValid();
    if (step === 5) return isWrapperConfigValid();
    if (step === 6) return ribbonStyle !== null && ribbonColor !== null;
    if (step === 7) return isCardConfigValid();
    return false;
  };

  const handleNext = () => {
    if (!stepValid(currentStep)) return;
    const nextStep = getNextStep(currentStep);
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      onBack();
      return;
    }
    setCurrentStep(getPrevStep(currentStep));
  };

  const handleAddToCart = () => {
    if (!stepValid(totalSteps) || !resolvedProduct) return;

    const flowerIds = [...mainFlowers.map((flower: MainFlowerSelection) => flower.id), fillerFlower?.id].filter(
      (id): id is number => Number.isInteger(id)
    );
    const flowerNames = [...mainFlowers.map((flower: MainFlowerSelection) => `${flower.label} x${flower.count}`), fillerFlower?.label].filter(
      (name): name is string => Boolean(name)
    );

    const mainFlowerItems: MainFlowerItem[] = mainFlowers.map((flower: MainFlowerSelection) => ({
      id: flower.id,
      name: flower.label,
      count: flower.count,
      unitPrice: flower.unitPrice,
    }));

    const customization: CartCustomization = {
      bouquetKind: bouquetKind ?? undefined,
      vaseMaterial: vaseMaterial ?? undefined,
      vaseShape: vaseShape ?? undefined,
      mainFlowers: mainFlowerItems,
      mainFlower: mainFlowerItems.map((flower) => flower.name).join(', ') || undefined,
      fillerFlower: fillerFlower?.label,
      wrapperPaper: wrapperPaper ?? undefined,
      wrapperKraftPattern: kraftPattern ?? undefined,
      wrapperPastelColor: pastelColor ?? undefined,
      wrapperClearStyle: clearWrapStyle ?? undefined,
      ribbonStyle: ribbonStyle ?? undefined,
      ribbonColor: ribbonColor ?? undefined,
      moneyPackage: moneyPackage ?? undefined,
      moneyAmount: moneyAmount ?? undefined,
      moneyFoldStyle: moneyFoldStyle ?? undefined,
      hasCard: hasCard ?? undefined,
      cardTemplate: cardTemplate ?? undefined,
      cardMessage: hasCard ? cardMessage.trim() : undefined,
    };

    onComplete({
      productId: resolvedProduct.product_id ?? null,
      bouquetStyleId: isNormalBouquet ? 1 : null,
      vaseColorId: null,
      price: estimatedPrice,
      imageUrl: previewImage,
      flowerTypeIds: flowerIds,
      flowerNames,
      customization,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl px-8 py-6 shadow-md text-gray-700">กำลังโหลดตัวเลือกสินค้า...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl px-8 py-6 shadow-md text-red-600">{error}</div>
      </div>
    );
  }

  const finalStepDisabled = !stepValid(totalSteps) || !resolvedProduct;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-[#AEE6FF]/30 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-2" style={{ color: '#1F7DA8' }}>
            <span className="text-sm">ขั้นตอน {currentStep}/{totalSteps}</span>
          </div>
          <h1 className="mb-2 text-gray-900">{stepLabel}</h1>
          <p className="text-gray-700">ปรับแต่งชิ้นงานให้ตรงใจ แล้วใส่ตะกร้าได้ทันที</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-10 items-start">
          <div>
            <div className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-xl mb-5 bg-white border border-[#AEE6FF]/40">
              <ImageWithFallback src={previewImage} alt="ตัวอย่างสินค้า" className="w-full h-auto" />
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#AEE6FF]/40 ring-1 ring-[#DFF4FF] space-y-1 text-gray-700">
              <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                <span>ประเภท</span>
                <span className="font-medium text-right">{productType === 'bouquet' ? 'ช่อดอกไม้' : 'แจกันดอกไม้'}</span>
              </div>
              {bouquetKind && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>ชนิดช่อ</span>
                  <span className="font-medium text-right">{bouquetKind === 'normal' ? 'ช่อปกติ' : 'ช่อซองเงิน'}</span>
                </div>
              )}
              {vaseMaterial && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>วัสดุแจกัน</span>
                  <span className="font-medium text-right">{vaseMaterial === 'glass' ? 'แจกันแก้ว' : vaseMaterial === 'ceramic' ? 'แจกันเซรามิค' : 'แจกันดินเผา'}</span>
                </div>
              )}
              {vaseShape && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>ทรงแจกัน</span>
                  <span className="font-medium text-right">{vaseShape === 'cylinder' ? 'ทรงกระบอก' : vaseShape === 'bottle' ? 'ทรงขวด' : 'ทรงกลม'}</span>
                </div>
              )}
              {mainFlowers.map((flower) => (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base" key={`summary-main-${flower.label}`}>
                  <span>ดอกไม้หลัก</span>
                  <span className="font-medium text-right">{flower.label} {flower.count} ดอก</span>
                </div>
              ))}
              {fillerFlower && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>ดอกแซม</span>
                  <span className="font-medium text-right">{fillerFlower.label} (+฿{getFillerFlowerUnitPrice(fillerFlower.label).toLocaleString()})</span>
                </div>
              )}
              {moneyPackage && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>ธนบัตร</span>
                  <span className="font-medium text-right">{moneyPackage} บาท</span>
                </div>
              )}
              {moneyAmount !== null && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>จำนวนเงิน</span>
                  <span className="font-medium text-right">
                    {moneyAmount.toLocaleString()} บาท
                    {isMoneyAmountValid && moneyNoteCount > 0 ? ` (${moneyNoteCount} ใบ)` : ''}
                  </span>
                </div>
              )}
              {moneyFoldStyle && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>วิธีพับ</span>
                  <span className="font-medium text-right">{moneyFoldStyle === 'fan' ? 'พัด' : moneyFoldStyle === 'rose' ? 'กุหลาบ' : moneyFoldStyle === 'heart' ? 'หัวใจ' : 'ดาว'}</span>
                </div>
              )}
              {wrapperPaper && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>กระดาษห่อ</span>
                  <span className="font-medium text-right">
                    {wrapperPaper === 'kraft' ? 'คราฟท์' : wrapperPaper === 'clear' ? 'ใส' : 'พาสเทล'}
                    {wrapperPaper === 'kraft' && kraftPattern && ` - ${kraftPatternOptions.find((item) => item.value === kraftPattern)?.label}`}
                    {wrapperPaper === 'pastel' && pastelColor && ` - ${pastelColorOptions.find((item) => item.value === pastelColor)?.label}`}
                    {wrapperPaper === 'clear' && clearWrapStyle && ` - ${clearWrapStyleOptions.find((item) => item.value === clearWrapStyle)?.label}`}
                  </span>
                </div>
              )}
              {ribbonStyle && ribbonColor && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>ริบบิ้น</span>
                  <span className="font-medium text-right">{ribbonStyle === 'style-1' ? 'แบบที่ 1' : 'แบบที่ 2'} {ribbonColor === 'blue' ? 'สีฟ้า' : 'สีแดง'}</span>
                </div>
              )}
              {hasCard !== null && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>การ์ด</span>
                  <span className="font-medium text-right">{hasCard ? 'เพิ่มการ์ด' : 'ไม่เพิ่มการ์ด'}</span>
                </div>
              )}
              {hasCard && cardTemplate && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>แบบการ์ด</span>
                  <span className="font-medium text-right">{cardTemplate === 'classic' ? 'คลาสสิก' : cardTemplate === 'minimal' ? 'มินิมอล' : 'โรแมนติก'}</span>
                </div>
              )}
              <div className="pt-4 mt-2 border-t border-[#D7E9F8] flex items-end justify-between gap-4 text-gray-900">
                <span className="text-xl sm:text-2xl">ราคาโดยประมาณ</span>
                <strong className="text-3xl sm:text-4xl leading-none">฿{estimatedPrice.toLocaleString()}</strong>
              </div>
              <div className="text-sm text-gray-500 pt-1">
                ระบบจะผูกสินค้าใกล้เคียงอัตโนมัติ: {resolvedProduct?.product_name ?? 'ไม่พบรายการสินค้า'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col">
            {currentStep === 2 && productType === 'bouquet' && (
              <div className="space-y-4">
                <h3 className="text-gray-800">เลือกชนิดช่อ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setBouquetKind('normal')}
                    className="p-4 rounded-xl border-2 transition-all"
                    style={getChoiceStyle(bouquetKind === 'normal')}
                  >
                    <div className="text-left">ช่อปกติ</div>
                    <div className="text-sm mt-1" style={{ color: bouquetKind === 'normal' ? 'rgba(255,255,255,0.9)' : '#6b7280' }}>
                      เลือกดอกไม้หลัก/แซม กระดาษ และริบบิ้น
                    </div>
                  </button>
                  <button
                    onClick={() => setBouquetKind('money-envelope')}
                    className="p-4 rounded-xl border-2 transition-all"
                    style={getChoiceStyle(bouquetKind === 'money-envelope')}
                  >
                    <div className="text-left">ช่อซองเงิน</div>
                    <div className="text-sm mt-1" style={{ color: bouquetKind === 'money-envelope' ? 'rgba(255,255,255,0.9)' : '#6b7280' }}>
                      เลือกธนบัตร จำนวนเงิน วิธีพับ และตกแต่งช่อเหมือนช่อปกติ
                    </div>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && productType === 'vase' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-800 mb-3">เลือกวัสดุแจกัน</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'glass', label: 'แจกันแก้ว' },
                      { key: 'ceramic', label: 'แจกันเซรามิค' },
                      { key: 'clay', label: 'แจกันดินเผา' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setVaseMaterial(item.key as VaseMaterial)}
                        className="p-3 rounded-xl border-2 transition-all"
                        style={getChoiceStyle(vaseMaterial === item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-3">เลือกลักษณะทรงแจกัน</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'cylinder', label: 'ทรงกระบอก' },
                      { key: 'bottle', label: 'ทรงขวด' },
                      { key: 'round', label: 'ทรงกลม' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setVaseShape(item.key as VaseShape)}
                        className="p-3 rounded-xl border-2 transition-all"
                        style={getChoiceStyle(vaseShape === item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && isMoneyBouquet && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-800 mb-3">เลือกชนิดธนบัตร</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {moneyPackages.map((pack) => (
                      <button
                        key={pack.value}
                        onClick={() => {
                          setMoneyPackage(pack.value);
                          setMoneyAmount((prev) => {
                            const seedAmount = Math.max(prev ?? 300, 300);
                            return normalizeMoneyAmount(seedAmount, pack.value);
                          });
                        }}
                        className="p-3 rounded-xl border-2 transition-all text-left"
                        style={getChoiceStyle(moneyPackage === pack.value)}
                      >
                        {pack.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-3">เลือกจำนวนเงิน</h3>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (!moneyPackage) return;
                          const minimum = getMinimumMoneyAmount(moneyPackage);
                          setMoneyAmount((prev) => Math.max(minimum, (prev ?? minimum) - moneyPackage));
                        }}
                        className="w-12 h-12 rounded-xl border border-gray-300 bg-white text-gray-700 disabled:opacity-40"
                        disabled={!moneyPackage}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <div className="text-sm text-gray-500 mb-1">เพิ่มหรือลดครั้งละ {moneyPackage ? `${moneyPackage} บาท` : '—'}</div>
                        <div className="text-2xl text-gray-900">฿{(moneyAmount ?? 0).toLocaleString()}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!moneyPackage) return;
                          const minimum = getMinimumMoneyAmount(moneyPackage);
                          setMoneyAmount((prev) => (prev ?? minimum) + moneyPackage);
                        }}
                        className="w-12 h-12 rounded-xl border border-gray-300 bg-white text-gray-700 disabled:opacity-40"
                        disabled={!moneyPackage}
                      >
                        +
                      </button>
                    </div>
                    {!moneyPackage && (
                      <div className="text-xs text-amber-600 mt-3">กรุณาเลือกชนิดธนบัตรก่อนกำหนดจำนวนเงิน</div>
                    )}
                    {moneyPackage && moneyAmount !== null && !isMoneyAmountValid && (
                      <div className="text-xs text-red-600 mt-3">
                        ธนบัตร {moneyPackage} บาทไม่สามารถจัดเป็น {moneyAmount.toLocaleString()} บาทได้ กรุณาเลือกจำนวนเงินที่หารด้วย {moneyPackage} ลงตัว
                      </div>
                    )}
                    {moneyPackage && moneyAmount !== null && isMoneyAmountValid && (
                      <div className="text-xs text-emerald-700 mt-3">ใช้ธนบัตร {moneyPackage} บาท จำนวน {moneyNoteCount} ใบ</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-3">เลือกวิธีพับเงิน</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'fan', label: 'พัด' },
                      { key: 'rose', label: 'กุหลาบ' },
                      { key: 'heart', label: 'หัวใจ' },
                      { key: 'star', label: 'ดาว' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setMoneyFoldStyle(item.key as MoneyFoldStyle)}
                        className="p-3 rounded-xl border-2 transition-all"
                        style={getChoiceStyle(moneyFoldStyle === item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isFlowerSelectionStep && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-800 mb-3">เลือกดอกไม้หลักได้สูงสุด 2 ชนิด</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {mainFlowerOptions.map((flower) => {
                      const isSelected = mainFlowers.some((item) => item.label === flower.label);
                      const reachedLimit = mainFlowers.length >= 2 && !isSelected;

                      return (
                        <button
                          key={`main-${flower.label}`}
                          onClick={() => {
                            setMainFlowers((prev) => {
                              const exists = prev.find((item) => item.label === flower.label);
                              if (exists) {
                                return prev.filter((item) => item.label !== flower.label);
                              }
                              if (prev.length >= 2) {
                                return prev;
                              }
                              return [
                                ...prev,
                                {
                                  id: flower.id,
                                  label: flower.label,
                                  unitPrice: flower.unitPrice ?? getMainFlowerUnitPrice(flower.label),
                                  count: 1,
                                },
                              ];
                            });
                          }}
                          disabled={reachedLimit}
                          className={`p-3 rounded-xl border-2 transition-all ${reachedLimit ? 'opacity-40 cursor-not-allowed' : ''}`}
                          style={getChoiceStyle(isSelected)}
                        >
                          <div>{flower.label}</div>
                          <div className="text-xs mt-1" style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : '#6b7280' }}>
                            ฿{(flower.unitPrice ?? getMainFlowerUnitPrice(flower.label)).toLocaleString()} / ดอก
                          </div>
                        </button>
                      );
                    })}
                  </div>
                                  {isMoneyBouquet
                                    ? <p className="text-xs text-emerald-700 mt-2">ไม่บังคับ — สำหรับช่อเงินสามารถข้ามดอกไม้ได้ เลือกได้สูงสุด 2 ชนิด</p>
                                    : <p className="text-xs text-gray-500 mt-2">ต้องเลือกอย่างน้อย 1 ชนิด และเลือกได้ไม่เกิน 2 ชนิด</p>
                                  }
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-gray-800">เลือกดอกแซมเพิ่มเติม (ไม่บังคับ)</h3>
                    {fillerFlower && (
                      <button
                        type="button"
                        onClick={() => {
                          setFillerFlower(null);
                        }}
                        className="text-sm text-red-500"
                      >
                        ล้างดอกแซม
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {fillerFlowerOptions.map((flower) => {
                      const isSameAsMain = mainFlowers.some((item) => item.label === flower.label);
                      return (
                        <button
                          key={`filler-${flower.label}`}
                          onClick={() => setFillerFlower(flower)}
                          disabled={isSameAsMain}
                          className={`p-3 rounded-xl border-2 transition-all ${isSameAsMain ? 'opacity-40 cursor-not-allowed' : ''}`}
                          style={getChoiceStyle(fillerFlower?.label === flower.label)}
                        >
                          {flower.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">ดอกแซมต้องไม่ซ้ำกับดอกไม้หลัก และสามารถไม่เลือกได้</p>
                </div>
              </div>
            )}

            {isFlowerCountStep && (
              <div className="space-y-4">
                <h3 className="text-gray-800">ระบุจำนวนดอกไม้หลักแต่ละชนิด</h3>
                <div className="space-y-3">
                  {mainFlowers.map((flower) => (
                    <div key={`count-${flower.label}`} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-gray-900">{flower.label}</div>
                          <div className="text-sm text-gray-500">ราคาดอกละ ฿{flower.unitPrice.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMainFlowers((prev) =>
                                prev.map((item) =>
                                  item.label === flower.label
                                    ? { ...item, count: Math.max(1, item.count - 1) }
                                    : item
                                )
                              );
                            }}
                            className="w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={flower.count}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const nextCount = Math.max(1, Number(e.target.value) || 1);
                              setMainFlowers((prev) =>
                                prev.map((item) =>
                                  item.label === flower.label ? { ...item, count: nextCount } : item
                                )
                              );
                            }}
                            className="w-20 px-3 py-2 rounded-lg border border-gray-300 bg-white text-center text-gray-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMainFlowers((prev) =>
                                prev.map((item) =>
                                  item.label === flower.label ? { ...item, count: item.count + 1 } : item
                                )
                              );
                            }}
                            className="w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-blue-900 mt-3">รวม {flower.count} ดอก = ฿{(flower.count * flower.unitPrice).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <h3 className="text-gray-800 mb-3">ดอกแซมที่เลือก</h3>
                  {fillerFlower ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                      {fillerFlower.label} คิดราคาเหมารวม ฿{getFillerFlowerUnitPrice(fillerFlower.label).toLocaleString()}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 text-gray-500 p-3 text-sm">ไม่ได้เลือกดอกแซม</div>
                  )}
                </div>
              </div>
            )}

            {isWrapperStep && (
              <div className="space-y-4">
                <h3 className="text-gray-800">เลือกกระดาษห่อ</h3>
                <div className="grid grid-cols-1 gap-3">
                  {wrapperPaperOptions.map((paper) => (
                    <button
                      key={paper.value}
                      onClick={() => setWrapperPaper(paper.value)}
                      className="p-4 rounded-xl border-2 transition-all text-left"
                      style={getChoiceStyle(wrapperPaper === paper.value)}
                    >
                      {paper.label}
                    </button>
                  ))}
                </div>

                {wrapperPaper === 'kraft' && (
                  <div>
                    <h3 className="text-gray-800 mb-3">เลือกลายกระดาษคราฟท์</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {kraftPatternOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setKraftPattern(option.value)}
                          className="p-3 rounded-xl border-2 transition-all text-left"
                          style={getChoiceStyle(kraftPattern === option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {wrapperPaper === 'pastel' && (
                  <div>
                    <h3 className="text-gray-800 mb-3">เลือกสีพาสเทล</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pastelColorOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setPastelColor(option.value)}
                          className="p-3 rounded-xl border-2 transition-all text-left"
                          style={getChoiceStyle(pastelColor === option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {wrapperPaper === 'clear' && (
                  <div>
                    <h3 className="text-gray-800 mb-3">เลือกโทนกระดาษใส</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {clearWrapStyleOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setClearWrapStyle(option.value)}
                          className="p-3 rounded-xl border-2 transition-all text-left"
                          style={getChoiceStyle(clearWrapStyle === option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isRibbonStep && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-800 mb-3">เลือกรูปแบบริบบิ้น</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {ribbonStyleOptions.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setRibbonStyle(style.value)}
                        className="p-3 rounded-xl border-2 transition-all"
                        style={getChoiceStyle(ribbonStyle === style.value)}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-3">เลือกสีริบบิ้น</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {ribbonColorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setRibbonColor(color.value)}
                        className="p-3 rounded-xl border-2 transition-all"
                        style={getChoiceStyle(ribbonColor === color.value)}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isCardStep && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-800 mb-3">ต้องการเพิ่มข้อความบนการ์ดไหม</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setHasCard(true)}
                      className="p-4 rounded-xl border-2 transition-all"
                      style={getChoiceStyle(hasCard === true)}
                    >
                      เพิ่มการ์ด
                    </button>
                    <button
                      onClick={() => setHasCard(false)}
                      className="p-4 rounded-xl border-2 transition-all"
                      style={getChoiceStyle(hasCard === false)}
                    >
                      ไม่เพิ่มการ์ด
                    </button>
                  </div>
                </div>

                {hasCard && (
                  <>
                    <div>
                      <h3 className="text-gray-800 mb-3">เลือกแบบการ์ด</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {cardTemplateOptions.map((template) => (
                          <button
                            key={template.value}
                            onClick={() => setCardTemplate(template.value)}
                            className="p-3 rounded-xl border-2 transition-all"
                            style={getChoiceStyle(cardTemplate === template.value)}
                          >
                            {template.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-gray-800">ข้อความบนการ์ด</label>
                      <textarea
                        value={cardMessage}
                        onChange={(e) => setCardMessage(e.target.value)}
                        rows={4}
                        placeholder="พิมพ์ข้อความที่ต้องการใส่"
                        className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all"
                        style={{ borderColor: cardMessage.trim() ? '#62C4FF' : '#e5e7eb' }}
                      />
                    </div>
                  </>
                )}

                {!resolvedProduct && (
                  <div className="rounded-xl bg-amber-50 text-amber-700 p-3 text-sm">
                    ไม่พบสินค้าที่พร้อมผูกจากฐานข้อมูล กรุณาลองใหม่อีกครั้ง
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 pt-6 border-t grid grid-cols-2 gap-3">
              <button
                onClick={handleBack}
                className="py-3 rounded-xl border-2 bg-white flex items-center justify-center gap-2"
                style={{ borderColor: '#62C4FF', color: '#1F7DA8' }}
              >
                <ArrowLeft className="w-4 h-4" />
                ย้อนกลับ
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={!stepValid(currentStep)}
                  className="py-3 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#62C4FF' }}
                >
                  ถัดไป
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={finalStepDisabled}
                  className="py-3 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#62C4FF' }}
                >
                  ใส่ตะกร้า
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
