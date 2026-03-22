import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { CSSProperties, ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { getCards, type CardOption } from '../api/card.api';
import { getFillerFlowers, getMainFlowers, type FlowerType as DbFlowerType } from '../api/flower.api';
import { getFoldingStyles, getMonetaryBouquets, type FoldingStyle, type MonetaryBouquet } from '../api/money-bouquet.api';
import { getRibbonColorsByRibbon, getRibbons, type Ribbon, type RibbonColor } from '../api/ribbon.api';
import { getVaseShapes, getVases, type Vase, type VaseShapeOption } from '../api/vase.api';
import { getWrappingTypes, getWrappingsByType, type WrappingMaterial, type WrappingType } from '../api/wrapping.api';
import { type CartCustomization, type MainFlowerItem, type ProductType } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

type BouquetKind = 'normal' | 'money-envelope';
type MoneyBillValue = 20 | 50 | 100 | 500 | 1000;
type MoneyFoldStyle = 'fan' | 'rose' | 'heart' | 'star';

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

const parseFlowerPrice = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const fillerFlowerUnitPrices: Record<string, number> = {
  'ดอกยิปโซ': 35,
  'gypsophila': 35,
  'ดอกคัตเตอร์': 40,
  'cutter': 40,
};

const normalizeLabel = (value: string) => value.trim().toLowerCase();

const inferBouquetKindFromProductName = (name: string): BouquetKind => {
  const normalizedName = String(name || '').trim().toLowerCase();
  if (normalizedName.includes('money') || normalizedName.includes('เงิน')) {
    return 'money-envelope';
  }
  return 'normal';
};

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
  const [vaseShapeOptions, setVaseShapeOptions] = useState<VaseShapeOption[]>([]);
  const [cardOptions, setCardOptions] = useState<CardOption[]>([]);
  const [ribbonOptions, setRibbonOptions] = useState<Ribbon[]>([]);
  const [ribbonColorOptions, setRibbonColorOptions] = useState<RibbonColor[]>([]);
  const [wrappingTypes, setWrappingTypes] = useState<WrappingType[]>([]);
  const [wrappingMaterials, setWrappingMaterials] = useState<WrappingMaterial[]>([]);
  const [mainFlowerTypes, setMainFlowerTypes] = useState<DbFlowerType[]>([]);
  const [fillerFlowerTypes, setFillerFlowerTypes] = useState<DbFlowerType[]>([]);
  const [monetaryBouquets, setMonetaryBouquets] = useState<MonetaryBouquet[]>([]);
  const [foldingStyles, setFoldingStyles] = useState<FoldingStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<number>(2);

  const [bouquetKind, setBouquetKind] = useState<BouquetKind | null>(null);
  const [selectedBouquetProduct, setSelectedBouquetProduct] = useState<Vase | null>(null);
  const [selectedVaseMaterial, setSelectedVaseMaterial] = useState<Vase | null>(null);
  const [selectedVaseShape, setSelectedVaseShape] = useState<VaseShapeOption | null>(null);

  const [mainFlowers, setMainFlowers] = useState<MainFlowerSelection[]>([]);
  const [fillerFlower, setFillerFlower] = useState<FlowerChoice | null>(null);

  const [selectedWrappingType, setSelectedWrappingType] = useState<WrappingType | null>(null);
  const [selectedWrappingMaterial, setSelectedWrappingMaterial] = useState<WrappingMaterial | null>(null);
  const [selectedRibbon, setSelectedRibbon] = useState<Ribbon | null>(null);
  const [selectedRibbonColor, setSelectedRibbonColor] = useState<RibbonColor | null>(null);

  const [moneyPackage, setMoneyPackage] = useState<MoneyBillValue | null>(null);
  const [moneyAmount, setMoneyAmount] = useState<number | null>(null);
  const [selectedMonetaryBouquetId, setSelectedMonetaryBouquetId] = useState<number | null>(null);
  const [selectedFoldingStyleId, setSelectedFoldingStyleId] = useState<number | null>(null);
  const [moneyFoldStyle, setMoneyFoldStyle] = useState<MoneyFoldStyle | null>(null);

  const [hasCard, setHasCard] = useState<boolean | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardOption | null>(null);
  const [cardMessage, setCardMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const productTypeId = productType === 'bouquet' ? 1 : 2;
        const [productRows, mainFlowerRows, fillerFlowerRows, cardRows, wrappingTypeRows, ribbonRows, monetaryBouquetRows, foldingStyleRows] = await Promise.all([
          getVases(productTypeId),
          getMainFlowers(),
          getFillerFlowers(),
          getCards(),
          getWrappingTypes(),
          getRibbons(),
          getMonetaryBouquets(),
          getFoldingStyles(),
        ]);
        if (!mounted) return;
        setProducts(productRows);
        setMainFlowerTypes(mainFlowerRows);
        setFillerFlowerTypes(fillerFlowerRows);
        setCardOptions(cardRows);
        setWrappingTypes(wrappingTypeRows);
        setRibbonOptions(ribbonRows);
        setMonetaryBouquets(monetaryBouquetRows);
        setFoldingStyles(foldingStyleRows);
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
    setSelectedBouquetProduct(null);
    setSelectedVaseMaterial(null);
    setSelectedVaseShape(null);
    setVaseShapeOptions([]);
    setMainFlowers([]);
    setFillerFlower(null);
    setSelectedWrappingType(null);
    setSelectedWrappingMaterial(null);
    setWrappingMaterials([]);
    setSelectedRibbon(null);
    setSelectedRibbonColor(null);
    setRibbonColorOptions([]);
    setMoneyPackage(null);
    setMoneyAmount(null);
    setSelectedMonetaryBouquetId(null);
    setSelectedFoldingStyleId(null);
    setMoneyFoldStyle(null);
    setHasCard(null);
    setSelectedCard(null);
    setCardMessage('');
  }, [productType]);

  const isNormalBouquet = productType === 'bouquet' && bouquetKind === 'normal';
  const isMoneyBouquet = productType === 'bouquet' && bouquetKind === 'money-envelope';
  const isVase = productType === 'vase';
  const isBouquet = productType === 'bouquet' && bouquetKind !== null;
  const needsFlowerFlow = isBouquet || isVase;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isVase || !selectedVaseMaterial?.product_id) {
        setVaseShapeOptions([]);
        setSelectedVaseShape(null);
        return;
      }

      try {
        const shapes = await getVaseShapes(selectedVaseMaterial.product_id);
        if (!mounted) return;
        setVaseShapeOptions(shapes);
        setSelectedVaseShape((prev) =>
          prev && shapes.some((shape) => shape.vase_id === prev.vase_id) ? prev : null
        );
      } catch {
        if (!mounted) return;
        setVaseShapeOptions([]);
        setSelectedVaseShape(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isVase, selectedVaseMaterial]);

  useEffect(() => {
    if (!isBouquet) {
      setSelectedWrappingType(null);
      setSelectedWrappingMaterial(null);
      setWrappingMaterials([]);
      setSelectedRibbon(null);
      setSelectedRibbonColor(null);
      setRibbonColorOptions([]);
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
    let mounted = true;
    (async () => {
      if (!selectedWrappingType?.wrapping_type_id) {
        setWrappingMaterials([]);
        setSelectedWrappingMaterial(null);
        return;
      }

      try {
        const rows = await getWrappingsByType(selectedWrappingType.wrapping_type_id);
        if (!mounted) return;
        setWrappingMaterials(rows);
        setSelectedWrappingMaterial((prev) =>
          prev && rows.some((item) => item.wrapping_id === prev.wrapping_id) ? prev : null
        );
      } catch {
        if (!mounted) return;
        setWrappingMaterials([]);
        setSelectedWrappingMaterial(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedWrappingType]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedRibbon?.ribbon_id) {
        setRibbonColorOptions([]);
        setSelectedRibbonColor(null);
        return;
      }

      try {
        const rows = await getRibbonColorsByRibbon(selectedRibbon.ribbon_id);
        if (!mounted) return;
        setRibbonColorOptions(rows);
        setSelectedRibbonColor((prev) =>
          prev && rows.some((item) => item.ribbon_color_id === prev.ribbon_color_id) ? prev : null
        );
      } catch {
        if (!mounted) return;
        setRibbonColorOptions([]);
        setSelectedRibbonColor(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedRibbon]);

  const mainFlowerOptions = useMemo<FlowerChoice[]>(() => {
    if (mainFlowerTypes.length > 0) {
      return mainFlowerTypes.map((ft: DbFlowerType) => ({
        id: ft.flower_id,
        label: ft.flower_name,
        unitPrice: parseFlowerPrice(ft.flower_price),
      }));
    }
    return [
      { id: null, label: 'กุหลาบ', unitPrice: 0 },
      { id: null, label: 'ทิวลิป', unitPrice: 0 },
      { id: null, label: 'ลิลลี่', unitPrice: 0 },
    ];
  }, [mainFlowerTypes]);

  const fillerFlowerOptions = useMemo<FlowerChoice[]>(() => {
    if (fillerFlowerTypes.length > 0) {
      return fillerFlowerTypes.map((ft: DbFlowerType) => ({ id: ft.flower_id, label: ft.flower_name }));
    }

    return [
      { id: null, label: 'ดอกยิปโซ' },
      { id: null, label: 'ดอกคัตเตอร์' },
    ];
  }, [fillerFlowerTypes]);

  const mainFlowerTotal = useMemo(
    () => mainFlowers.reduce((sum: number, flower: MainFlowerSelection) => sum + flower.count * flower.unitPrice, 0),
    [mainFlowers]
  );

  const fillerFlowerTotal = useMemo(() => {
    if (!fillerFlower) return 0;
    return getFillerFlowerUnitPrice(fillerFlower.label);
  }, [fillerFlower]);

  const isMoneyAmountValid = useMemo(() => {
    if (!selectedMonetaryBouquetId || moneyAmount === null) return false;
    const selectedBouquet = monetaryBouquets.find(b => b.monetary_bouquet_id === selectedMonetaryBouquetId);
    if (!selectedBouquet) return false;
    const minAmount = selectedBouquet.monetary_value * Math.ceil(300 / selectedBouquet.monetary_value);
    return moneyAmount >= minAmount && moneyAmount % selectedBouquet.monetary_value === 0;
  }, [moneyAmount, selectedMonetaryBouquetId, monetaryBouquets]);

  const moneyNoteCount = useMemo(() => {
    if (!isMoneyAmountValid || !selectedMonetaryBouquetId || moneyAmount === null) return 0;
    const selectedBouquet = monetaryBouquets.find(b => b.monetary_bouquet_id === selectedMonetaryBouquetId);
    if (!selectedBouquet) return 0;
    return moneyAmount / selectedBouquet.monetary_value;
  }, [isMoneyAmountValid, moneyAmount, selectedMonetaryBouquetId, monetaryBouquets]);

  const totalSteps = isMoneyBouquet ? 8 : 7;
  const isFlowerSelectionStep = (isMoneyBouquet && currentStep === 4) || (!isMoneyBouquet && currentStep === 3);
  const isFlowerCountStep = (isMoneyBouquet && currentStep === 5) || (!isMoneyBouquet && currentStep === 4);
  const isWrapperStep = isBouquet && currentStep === (isMoneyBouquet ? 6 : 5);
  const isRibbonStep = isBouquet && currentStep === (isMoneyBouquet ? 7 : 6);
  const isCardStep = currentStep === totalSteps;

  const estimatedPrice = useMemo(() => {
    let total = 0;

    if (productType === 'bouquet') {
      total += Number(selectedBouquetProduct?.price ?? 0);
    }

    if (productType === 'bouquet' && bouquetKind) {
      total += mainFlowerTotal;
      total += fillerFlowerTotal;
      total += Number(selectedWrappingMaterial?.wrapping_price ?? 0);
      if (selectedRibbon) total += 25;

      if (bouquetKind === 'money-envelope') {
        if (moneyAmount) total += moneyAmount;
        if (moneyFoldStyle === 'rose') total += 120;
        if (moneyFoldStyle === 'heart') total += 100;
        if (moneyFoldStyle === 'star') total += 140;
        if (moneyFoldStyle === 'fan') total += 80;
      }
    }

    if (productType === 'vase') {
      total += Number(selectedVaseMaterial?.price ?? 0);
      total += Number(selectedVaseShape?.vase_price ?? 0);

      total += mainFlowerTotal;
      total += fillerFlowerTotal;
    }

    if (hasCard) total += Number(selectedCard?.card_price ?? 0);

    return Math.round(total / 10) * 10;
  }, [
    bouquetKind,
    fillerFlowerTotal,
    hasCard,
    mainFlowerTotal,
    moneyAmount,
    moneyFoldStyle,
    productType,
    selectedRibbon,
    selectedBouquetProduct,
    selectedCard,
    selectedRibbonColor,
    selectedWrappingMaterial,
    selectedVaseMaterial,
    selectedVaseShape,
  ]);

  const resolvedProduct = useMemo(() => {
    if (products.length === 0) return null;

    if (productType === 'bouquet' && selectedBouquetProduct) {
      return selectedBouquetProduct;
    }

    if (isVase && selectedVaseMaterial) {
      return selectedVaseMaterial;
    }

    return products.reduce((closest: Vase, current: Vase) => {
      const currentDiff = Math.abs(Number(current.price || 0) - estimatedPrice);
      const closestDiff = Math.abs(Number(closest.price || 0) - estimatedPrice);
      return currentDiff < closestDiff ? current : closest;
    }, products[0]);
  }, [estimatedPrice, isVase, productType, products, selectedBouquetProduct, selectedVaseMaterial]);

  const previewImage = useMemo(() => {
    if (isVase) {
      if (selectedVaseShape?.vase_img) return selectedVaseShape.vase_img;
      if (selectedVaseMaterial?.product_img) return selectedVaseMaterial.product_img;
    }
    const dbImage = (resolvedProduct as any)?.product_img as string | undefined;
    if (dbImage) return dbImage;
    if (isMoneyBouquet) return moneyBouquetImage;
    if (isVase) return vaseImage;
    return bouquetImage;
  }, [isMoneyBouquet, isVase, resolvedProduct, selectedVaseMaterial, selectedVaseShape]);

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
    return selectedWrappingType !== null && selectedWrappingMaterial !== null;
  };

  const isCardConfigValid = () => {
    if (hasCard === null) return false;
    if (hasCard) return selectedCard !== null;
    return true;
  };

  const stepValid = (step: number) => {
    if (step === 2) {
      if (productType === 'bouquet') return bouquetKind !== null;
      return selectedVaseMaterial !== null && selectedVaseShape !== null;
    }
    if (isMoneyBouquet) {
      if (step === 3) return selectedMonetaryBouquetId !== null && selectedFoldingStyleId !== null && moneyAmount !== null;
      if (step === 4) return mainFlowers.length <= 2; // flowers are optional for money bouquet
      if (step === 5) return isFlowerConfigValid();
      if (step === 6) return isWrapperConfigValid();
      if (step === 7) return selectedRibbon !== null && selectedRibbonColor !== null;
      if (step === 8) return isCardConfigValid();
      return false;
    }

    if (step === 3) return mainFlowers.length >= 1 && mainFlowers.length <= 2;
    if (step === 4) return isFlowerConfigValid();
    if (step === 5) return isWrapperConfigValid();
    if (step === 6) return selectedRibbon !== null && selectedRibbonColor !== null;
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
      vaseMaterial: selectedVaseMaterial?.product_name,
      vaseShape: selectedVaseShape?.vase_name,
      mainFlowers: mainFlowerItems,
      mainFlower: mainFlowerItems.map((flower) => flower.name).join(', ') || undefined,
      fillerFlower: fillerFlower?.label,
      wrapperPaper: selectedWrappingType?.wrapping_type_name,
      wrapperKraftPattern: selectedWrappingMaterial?.wrapping_name,
      wrapperPastelColor: undefined,
      wrapperClearStyle: undefined,
      ribbonStyle: selectedRibbon?.ribbon_name,
      ribbonColor: selectedRibbonColor?.ribbon_color_name,
      moneyPackage: moneyPackage ?? undefined,
      moneyAmount: moneyAmount ?? undefined,
      monetaryBouquetId: selectedMonetaryBouquetId ?? undefined,
      foldingStyleId: selectedFoldingStyleId ?? undefined,
      moneyFoldStyle: moneyFoldStyle ?? undefined,
      hasCard: hasCard ?? undefined,
      cardTemplate: selectedCard?.card_name,
      cardMessage: hasCard && cardMessage.trim() ? cardMessage.trim() : undefined,
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
                  <span className="font-medium text-right">{selectedBouquetProduct?.product_name || (bouquetKind === 'normal' ? 'ช่อปกติ' : 'ช่อซองเงิน')}</span>
                </div>
              )}
              {selectedVaseMaterial && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>วัสดุแจกัน</span>
                  <span className="font-medium text-right">{selectedVaseMaterial.product_name}</span>
                </div>
              )}
              {selectedVaseShape && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>ทรงแจกัน</span>
                  <span className="font-medium text-right">{selectedVaseShape.vase_name}</span>
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
                  <span className="font-medium text-right">{monetaryBouquets.find(b => b.monetary_bouquet_id === selectedMonetaryBouquetId)?.monetary_bouquet_name || '-'}</span>
                </div>
              )}
              {moneyAmount !== null && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>จำนวนเงิน</span>
                  <span className="font-medium text-right">
                    {moneyAmount.toLocaleString()} บาท
                  </span>
                </div>
              )}
              {selectedFoldingStyleId && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>วิธีพับ</span>
                  <span className="font-medium text-right">
                    {foldingStyles.find(s => s.folding_style_id === selectedFoldingStyleId)?.folding_style_name || '-'}
                    {foldingStyles.find(s => s.folding_style_id === selectedFoldingStyleId)?.folding_style_price ? ` (+฿${Number(foldingStyles.find(s => s.folding_style_id === selectedFoldingStyleId)?.folding_style_price ?? 0).toLocaleString()})` : ''}
                  </span>
                </div>
              )}
              {selectedWrappingType && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>กระดาษห่อ</span>
                  <span className="font-medium text-right">
                    {selectedWrappingType.wrapping_type_name}
                    {selectedWrappingMaterial ? ` - ${selectedWrappingMaterial.wrapping_name}` : ''}
                    {selectedWrappingMaterial ? ` (+฿${Number(selectedWrappingMaterial.wrapping_price ?? 0).toLocaleString()})` : ''}
                  </span>
                </div>
              )}
              {selectedRibbon && selectedRibbonColor && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>ริบบิ้น</span>
                  <span className="font-medium text-right">{selectedRibbon.ribbon_name} {selectedRibbonColor.ribbon_color_name}</span>
                </div>
              )}
              {hasCard !== null && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>การ์ด</span>
                  <span className="font-medium text-right">{hasCard ? 'เพิ่มการ์ด' : 'ไม่เพิ่มการ์ด'}</span>
                </div>
              )}
              {hasCard && selectedCard && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>แบบการ์ด</span>
                  <span className="font-medium text-right">{selectedCard.card_name} (+฿{Number(selectedCard.card_price ?? 0).toLocaleString()})</span>
                </div>
              )}
              {hasCard && cardMessage.trim() && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-base">
                  <span>ข้อความการ์ด</span>
                  <span className="font-medium text-right">{cardMessage.trim()}</span>
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
                  {products.map((item) => {
                    const inferredKind = inferBouquetKindFromProductName(item.product_name);
                    const isSelected = selectedBouquetProduct?.product_id === item.product_id;
                    return (
                      <button
                        key={item.product_id}
                        onClick={() => {
                          setSelectedBouquetProduct(item);
                          setBouquetKind(inferredKind);
                        }}
                        className="p-4 rounded-xl border-2 transition-all"
                        style={getChoiceStyle(isSelected)}
                      >
                        <div className="text-left">{item.product_name}</div>
                        <div className="text-sm mt-1" style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : '#6b7280' }}>
                          ฿{Number(item.price ?? 0).toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {products.length === 0 && (
                  <p className="text-sm text-red-500">ไม่พบรายการช่อดอกไม้ในระบบ (product_type_id = 1)</p>
                )}
              </div>
            )}

            {currentStep === 2 && productType === 'vase' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-800 mb-3">เลือกวัสดุแจกัน</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {products.map((item) => (
                      <button
                        key={item.product_id}
                        onClick={() => {
                          setSelectedVaseMaterial(item);
                          setSelectedVaseShape(null);
                        }}
                        className="p-3 rounded-xl border-2 transition-all"
                        style={getChoiceStyle(selectedVaseMaterial?.product_id === item.product_id)}
                      >
                        <div className="text-left">{item.product_name}</div>
                        <div className="text-sm text-left mt-1" style={{ color: selectedVaseMaterial?.product_id === item.product_id ? 'rgba(255,255,255,0.9)' : '#6b7280' }}>
                          ฿{Number(item.price ?? 0).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-3">เลือกลักษณะทรงแจกัน</h3>
                  {selectedVaseMaterial ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vaseShapeOptions.map((item) => (
                        <button
                          key={item.vase_id}
                          onClick={() => setSelectedVaseShape(item)}
                          className="p-3 rounded-xl border-2 transition-all"
                          style={getChoiceStyle(selectedVaseShape?.vase_id === item.vase_id)}
                        >
                          <div className="text-left">{item.vase_name}</div>
                          <div className="text-sm text-left mt-1" style={{ color: selectedVaseShape?.vase_id === item.vase_id ? 'rgba(255,255,255,0.9)' : '#6b7280' }}>
                            ฿{Number(item.vase_price ?? 0).toLocaleString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">กรุณาเลือกวัสดุแจกันก่อน</div>
                  )}
                  {selectedVaseMaterial && vaseShapeOptions.length === 0 && (
                    <div className="text-sm text-red-500 mt-2">ไม่พบทรงแจกันสำหรับวัสดุที่เลือก</div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && isMoneyBouquet && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-800 mb-3">เลือกชนิดธนบัตร</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {monetaryBouquets.map((bouquet) => (
                      <button
                        key={bouquet.monetary_bouquet_id}
                        onClick={() => {
                          setSelectedMonetaryBouquetId(bouquet.monetary_bouquet_id);
                          const initialAmount = bouquet.monetary_value * Math.ceil(300 / bouquet.monetary_value);
                          setMoneyAmount(initialAmount);
                        }}
                        className="p-3 rounded-xl border-2 transition-all text-left"
                        style={getChoiceStyle(selectedMonetaryBouquetId === bouquet.monetary_bouquet_id)}
                      >
                        {bouquet.monetary_bouquet_name}
                      </button>
                    ))}
                  </div>
                  {monetaryBouquets.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">ไม่พบรายการธนบัตรในระบบ</p>
                  )}
                </div>

                <div>
                  <h3 className="text-gray-800 mb-3">เลือกจำนวนเงิน</h3>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const selectedBouquet = monetaryBouquets.find(b => b.monetary_bouquet_id === selectedMonetaryBouquetId);
                          if (selectedBouquet) {
                            const minAmount = selectedBouquet.monetary_value * Math.ceil(300 / selectedBouquet.monetary_value);
                            setMoneyAmount((prev) => Math.max(minAmount, (prev ?? minAmount) - selectedBouquet.monetary_value));
                          }
                        }}
                        className="w-12 h-12 rounded-xl border border-gray-300 bg-white text-gray-700 disabled:opacity-40"
                        disabled={!selectedMonetaryBouquetId}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <div className="text-sm text-gray-500 mb-1">
                          เพิ่มหรือลดครั้งละ {selectedMonetaryBouquetId && monetaryBouquets.find(b => b.monetary_bouquet_id === selectedMonetaryBouquetId) ? `${monetaryBouquets.find(b => b.monetary_bouquet_id === selectedMonetaryBouquetId)?.monetary_value} บาท` : '—'}
                        </div>
                        <div className="text-2xl text-gray-900">฿{(moneyAmount ?? 0).toLocaleString()}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const selectedBouquet = monetaryBouquets.find(b => b.monetary_bouquet_id === selectedMonetaryBouquetId);
                          if (selectedBouquet) {
                            setMoneyAmount((prev) => (prev ?? selectedBouquet.monetary_value) + selectedBouquet.monetary_value);
                          }
                        }}
                        className="w-12 h-12 rounded-xl border border-gray-300 bg-white text-gray-700 disabled:opacity-40"
                        disabled={!selectedMonetaryBouquetId}
                      >
                        +
                      </button>
                    </div>
                    {!selectedMonetaryBouquetId && (
                      <div className="text-xs text-amber-600 mt-3">กรุณาเลือกชนิดธนบัตรก่อนกำหนดจำนวนเงิน</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-3">เลือกวิธีพับเงิน</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {foldingStyles.map((style) => (
                      <button
                        key={style.folding_style_id}
                        onClick={() => setSelectedFoldingStyleId(style.folding_style_id)}
                        className="p-3 rounded-xl border-2 transition-all text-left"
                        style={getChoiceStyle(selectedFoldingStyleId === style.folding_style_id)}
                      >
                        <div>{style.folding_style_name}</div>
                        {style.folding_style_price && (
                          <div className="text-xs text-gray-500 mt-1">+฿{Number(style.folding_style_price).toLocaleString()}</div>
                        )}
                      </button>
                    ))}
                  </div>
                  {foldingStyles.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">ไม่พบรายการวิธีพับเงินในระบบ</p>
                  )}
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
                                  unitPrice: parseFlowerPrice(flower.unitPrice),
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
                            ฿{parseFlowerPrice(flower.unitPrice).toLocaleString()} / ดอก
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
                  {wrappingTypes.map((typeItem) => (
                    <button
                      key={typeItem.wrapping_type_id}
                      onClick={() => {
                        setSelectedWrappingType(typeItem);
                        setSelectedWrappingMaterial(null);
                      }}
                      className="p-4 rounded-xl border-2 transition-all text-left"
                      style={getChoiceStyle(selectedWrappingType?.wrapping_type_id === typeItem.wrapping_type_id)}
                    >
                      {typeItem.wrapping_type_name}
                    </button>
                  ))}
                </div>

                {wrappingTypes.length === 0 && (
                  <p className="text-sm text-red-500">ไม่พบประเภทกระดาษห่อในระบบ</p>
                )}

                {selectedWrappingType && (
                  <div>
                    <h3 className="text-gray-800 mb-3">เลือกแบบกระดาษห่อ</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {wrappingMaterials.map((option) => (
                        <button
                          key={option.wrapping_id}
                          onClick={() => setSelectedWrappingMaterial(option)}
                          className="p-3 rounded-xl border-2 transition-all text-left"
                          style={getChoiceStyle(selectedWrappingMaterial?.wrapping_id === option.wrapping_id)}
                        >
                          <div>{option.wrapping_name}</div>
                          <div className="text-xs mt-1" style={{ color: selectedWrappingMaterial?.wrapping_id === option.wrapping_id ? 'rgba(255,255,255,0.9)' : '#6b7280' }}>
                            ฿{Number(option.wrapping_price ?? 0).toLocaleString()}
                          </div>
                        </button>
                      ))}
                    </div>
                    {wrappingMaterials.length === 0 && (
                      <p className="text-sm text-red-500 mt-2">ไม่พบรายการกระดาษห่อสำหรับประเภทที่เลือก</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {isRibbonStep && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-800 mb-3">เลือกริบบิ้น</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {ribbonOptions.map((style) => (
                      <button
                        key={style.ribbon_id}
                        onClick={() => {
                          setSelectedRibbon(style);
                          setSelectedRibbonColor(null);
                        }}
                        className="p-3 rounded-xl border-2 transition-all"
                        style={getChoiceStyle(selectedRibbon?.ribbon_id === style.ribbon_id)}
                      >
                        {style.ribbon_name}
                      </button>
                    ))}
                  </div>
                  {ribbonOptions.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">ไม่พบรายการริบบิ้นในระบบ</p>
                  )}
                </div>

                <div>
                  <h3 className="text-gray-800 mb-3">เลือกสีริบบิ้น</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {ribbonColorOptions.map((color) => (
                      <button
                        key={color.ribbon_color_id}
                        onClick={() => setSelectedRibbonColor(color)}
                        className="p-3 rounded-xl border-2 transition-all"
                        style={getChoiceStyle(selectedRibbonColor?.ribbon_color_id === color.ribbon_color_id)}
                      >
                        <div>{color.ribbon_color_name}</div>
                        {color.hex && (
                          <div className="text-xs mt-1" style={{ color: selectedRibbonColor?.ribbon_color_id === color.ribbon_color_id ? 'rgba(255,255,255,0.9)' : '#6b7280' }}>
                            {color.hex}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedRibbon && ribbonColorOptions.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">ไม่พบสีริบบิ้นสำหรับแบบที่เลือก</p>
                  )}
                </div>
              </div>
            )}

            {isCardStep && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-800 mb-3">ต้องการเพิ่มการ์ดไหม</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setHasCard(true)}
                      className="p-4 rounded-xl border-2 transition-all"
                      style={getChoiceStyle(hasCard === true)}
                    >
                      เพิ่มการ์ด
                    </button>
                    <button
                      onClick={() => {
                        setHasCard(false);
                        setSelectedCard(null);
                        setCardMessage('');
                      }}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {cardOptions.map((card) => (
                          <button
                            key={card.card_id}
                            onClick={() => setSelectedCard(card)}
                            className="p-3 rounded-xl border-2 transition-all text-left"
                            style={getChoiceStyle(selectedCard?.card_id === card.card_id)}
                          >
                            <div>{card.card_name}</div>
                            <div className="text-xs mt-1" style={{ color: selectedCard?.card_id === card.card_id ? 'rgba(255,255,255,0.9)' : '#6b7280' }}>
                              ฿{Number(card.card_price ?? 0).toLocaleString()}
                            </div>
                          </button>
                        ))}
                      </div>
                      {cardOptions.length === 0 && (
                        <div className="rounded-xl bg-amber-50 text-amber-700 p-3 text-sm mt-3">
                          ไม่พบรายการการ์ดในระบบ
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 text-gray-800">ข้อความในการ์ด (ไม่บังคับ)</label>
                      <textarea
                        value={cardMessage}
                        onChange={(e) => setCardMessage(e.target.value)}
                        rows={3}
                        placeholder="พิมพ์ข้อความที่ต้องการใส่ในการ์ด"
                        className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none"
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
