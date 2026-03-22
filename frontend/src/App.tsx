import { useCallback, useEffect, useState } from 'react';
import { Cart } from './components/Cart';
import { type CustomArrangementResult, CustomArrangementFlow } from './components/CustomArrangementFlow';
import { DeliveryInfo } from './components/DeliveryInfo';
import { Home } from './components/Home';
import { Login } from './components/Login';
import { OrderComplete } from './components/OrderComplete';
import { OrderTracking } from './components/OrderTracking';
import { Payment } from './components/Payment';
import { ProductTypeSelection } from './components/ProductTypeSelection';
import { SnowEffect } from './components/SnowEffect';
import { DashboardNew as Dashboard } from './components/dashboard/DashboardNew';

export type ProductType = 'bouquet' | 'vase';
export type FlowerType = string;

export interface MainFlowerItem {
  id?: number | null;
  name: string;
  count: number;
  unitPrice: number;
}

export interface CartCustomization {
  bouquetKind?: 'normal' | 'money-envelope';
  vaseMaterial?: string;
  vaseShape?: string;
  mainFlowers?: MainFlowerItem[];
  mainFlower?: string;
  fillerFlower?: string;
  mainFlowerStemCount?: number;
  wrapperPaper?: string;
  wrapperKraftPattern?: string;
  wrapperPastelColor?: string;
  wrapperClearStyle?: string;
  ribbonStyle?: string;
  ribbonColor?: string;
  moneyPackage?: 20 | 50 | 100 | 500 | 1000;
  moneyAmount?: number;
  monetaryBouquetId?: number;
  foldingStyleId?: number;
  moneyFoldStyle?: 'fan' | 'rose' | 'heart' | 'star';
  hasCard?: boolean;
  cardTemplate?: string;
  cardMessage?: string;
}

export interface CartItem {
  id: string;
  productType: ProductType;
  bouquetStyle?: number; // bouquet_style_id (1 = round, 2 = long)
  price: number;
  flowerTypes: FlowerType[];
  customization?: CartCustomization;
  imageUrl: string;
  productId?: number | null;
  vaseColorId?: number | null;
  flowerTypeIds?: number[];
}

export interface OrderData {
  orderId: string;
  items: CartItem[];
  totalAmount: number;
  customerName: string;
  address: string;
  phone: string;
  branch: number | null;
  deliveryType: 'pickup' | 'delivery';
  cardMessage?: string;
}

export interface CheckoutPricing {
  subtotal: number;
  promotionCode: string | null;
  promotionDiscount: number;
  usePoints: boolean;
  pointsUsed: number;
  pointsDiscount: number;
  totalDiscount: number;
  finalAmount: number;
}

const ORDER_SHIPPING_FEE = 39;
const FREE_SHIPPING_CODE = 'FREESHIP';

type Step = 
  | 'home'
  | 'login'
  | 'dashboard'
  | 'productType' 
  | 'customize' 
  | 'cart' 
  | 'payment' 
  | 'delivery' 
  | 'complete'
  | 'tracking';

export default function App() {
  const [step, setStep] = useState<Step>('home');
  const [loginReturnStep, setLoginReturnStep] = useState<Exclude<Step, 'login'>>('home');
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [pendingResult, setPendingResult] = useState<CustomArrangementResult | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [productType, setProductType] = useState<ProductType>('bouquet');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [savedOrders, setSavedOrders] = useState<OrderData[]>([]);
  const [currentUserPoints, setCurrentUserPoints] = useState(0);
  const [currentCustomerName, setCurrentCustomerName] = useState('-');
  const [currentMemberLevelName, setCurrentMemberLevelName] = useState('-');
  const [isUserPointsLoading, setIsUserPointsLoading] = useState(false);
  const [checkoutPricing, setCheckoutPricing] = useState<CheckoutPricing>({
    subtotal: 0,
    promotionCode: null,
    promotionDiscount: 0,
    usePoints: false,
    pointsUsed: 0,
    pointsDiscount: 0,
    totalDiscount: 0,
    finalAmount: 0,
  });
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price, 0);

   
  const handleProduct = () => {
    setStep('productType');
  };

  const handleOpenLogin = (returnStep: Exclude<Step, 'login'> = 'home') => {
    setLoginReturnStep(returnStep);
    setStep('login');
  };

  const addResultToCart = (result: CustomArrangementResult) => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      productType,
      bouquetStyle: productType === 'bouquet' ? result.bouquetStyleId ?? undefined : undefined,
      price: result.price,
      flowerTypes: result.flowerNames,
      productId: result.productId ?? undefined,
      vaseColorId: result.vaseColorId ?? undefined,
      flowerTypeIds: result.flowerTypeIds,
      imageUrl: result.imageUrl,
      customization: result.customization,
    };
    setCart((prev) => [...prev, newItem]);
    setStep('cart');
  };

  const handleLoginSuccess = (phone: string) => {
    setUserPhone(phone);
    if (pendingResult) {
      addResultToCart(pendingResult);
      setPendingResult(null);
      setStep('cart');
    } else {
      setStep('dashboard');
    }
  };

  const handleLoginBack = () => {
    setPendingResult(null);
    if (loginReturnStep === 'customize' && pendingResult) {
      addResultToCart(pendingResult);
      setStep('cart');
    } else {
      setStep(loginReturnStep);
    }
  };

  const handleLogout = () => {
    setUserPhone(null);
    setPendingResult(null);
    setStep('home');
  };

  const handleProductTypeSelect = (type: ProductType) => {
    setProductType(type);
    setStep('customize');
  };

  const handleCustomizationComplete = (result: CustomArrangementResult) => {
    if (!userPhone) {
      setPendingResult(result);
      handleOpenLogin('customize');
      return;
    }
    addResultToCart(result);
  };



  const handleAddMoreItems = () => {
    setStep('productType');
  };
  const handleToDelivery = () => {
    setStep('delivery');
  }


  // Determine API base (use VITE env if provided, otherwise use localhost:3000 for dev)
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

  useEffect(() => {
    if (!userPhone) {
      setCurrentUserPoints(0);
      setCurrentCustomerName('-');
      setCurrentMemberLevelName('-');
      setIsUserPointsLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchCurrentUserProfile = async () => {
      setIsUserPointsLoading(true);
      try {
        const url = `${API_BASE ? `${API_BASE}/api/customers/profile` : '/api/customers/profile'}?phone=${encodeURIComponent(userPhone)}`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Failed to fetch customer profile: ${response.status}`);
        }

        const data = await response.json();
        const points = Number(data?.points || 0);
        setCurrentUserPoints(Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0);
        setCurrentCustomerName(data?.customer_name || '-');
        setCurrentMemberLevelName(data?.member_level_name || '-');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to load customer profile', error);
          setCurrentUserPoints(0);
          setCurrentCustomerName('-');
          setCurrentMemberLevelName('-');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsUserPointsLoading(false);
        }
      }
    };

    fetchCurrentUserProfile();

    return () => {
      controller.abort();
    };
  }, [API_BASE, userPhone]);
  
  const [Sendername, setSendername] = useState<string | null>(null);
  const [Senderaddress, setSenderaddress] = useState<string | null>(null);
  const [Senderphone, setSenderphone] = useState<string | null>(null);
  const [Deliverytype, setDeliverytype] = useState<'pickup' | 'delivery'>('delivery');

  const normalizedPromotionCode = checkoutPricing.promotionCode?.trim().toUpperCase() || null;
  const hasFreeShippingCode = normalizedPromotionCode === FREE_SHIPPING_CODE;
  const shippingFee = Deliverytype === 'delivery' ? ORDER_SHIPPING_FEE : 0;
  const shippingDiscount = Deliverytype === 'delivery' && hasFreeShippingCode ? ORDER_SHIPPING_FEE : 0;
  const basePayableTotal =
    checkoutPricing.subtotal === cartSubtotal ? checkoutPricing.finalAmount : cartSubtotal;
  const payableTotal = Math.max(basePayableTotal + shippingFee - shippingDiscount, 0);

  const handleDeliveryConfirm = (name: string, address: string, phone: string, deliveryType: 'pickup' | 'delivery', selectedBranchId: number) => {
    setSendername(name);
    setSenderaddress(address);
    setSenderphone(phone);
    setDeliverytype(deliveryType);
    setBranchId(selectedBranchId);
    if (deliveryType === 'pickup' && hasFreeShippingCode) {
      setCheckoutPricing((prev) => ({
        ...prev,
        promotionCode: null,
      }));
    }
    setStep('payment');
  }
  const AssigeToDatabase = (slipOkData: JSON) => {
    (async () => {
      try {
        // validate cart items have productId (database product_id required)
        const missingProduct = cart.find(it => !it.productId);
        if (missingProduct) {
          throw new Error('พบสินค้าที่ยังไม่มี product_id จากการเลือก โปรดเลือกรายการใหม่อีกครั้ง');
        }
        console.log("Submitting",slipOkData)
        console.log("Submitting method",slipOkData.method)
        const payload: any = {
          branch_id: branchId || null,
          pickup: Deliverytype === 'pickup',
          promotion_id: null,
          promotion_code: checkoutPricing.promotionCode,
          points_used: checkoutPricing.pointsUsed,
          promotion_discount: checkoutPricing.promotionDiscount,
          points_discount: checkoutPricing.pointsDiscount,
          total_discount: checkoutPricing.totalDiscount,
          customer: { name: Sendername, phone: Senderphone },
          receiver: { name: Sendername, phone: Senderphone, address: Deliverytype === 'pickup' ? 'ที่ร้าน' : Senderaddress },
          customer_note: null,
          total_amount: payableTotal,
          payment: slipOkData.data,
          method: slipOkData.method ,
          items: cart.map((it) => ({
            product_id: (it as any).productId,
            qty: 1,
            price_total: it.price,
            bouquet_style_id: it.productType === 'bouquet' ? it.bouquetStyle : undefined,
            vase_color_id: it.productType === 'vase' ? it.vaseColorId : undefined,
            flowers: (it as any).flowerTypeIds || [],
            customization: it.customization || undefined,
          }))
        };

        const url = API_BASE ? `${API_BASE}/api/orders` : '/api/orders';
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        let data: any = null;
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await resp.json();
        } else {
          const txt = await resp.text();
          // surface non-JSON response for debugging
          throw new Error(`Server returned non-JSON response (status ${resp.status}): ${txt.slice(0,200)}`);
        }
        if (!resp.ok) throw new Error(data?.detail || data?.error || 'Failed to create order');
        const order: OrderData = {
          orderId: data.order_code || `ORD${Date.now().toString().slice(-8)}`,
          items: cart,
          totalAmount: payload.total_amount,
          customerName: Sendername || '',
          address: Senderaddress || '',
          phone: Senderphone || '',
          branch: branchId,
          deliveryType: Deliverytype,
          cardMessage: undefined,
        };
        setOrderData(order);
        setSavedOrders([...savedOrders, order]);
        // optionally clear cart
        setCart([]);
        setCheckoutPricing({
          subtotal: 0,
          promotionCode: null,
          promotionDiscount: 0,
          usePoints: false,
          pointsUsed: 0,
          pointsDiscount: 0,
          totalDiscount: 0,
          finalAmount: 0,
        });
        setStep('complete');
      } catch (err: any) {
        console.error('Order create failed', err);
        alert('ไม่สามารถบันทึกคำสั่งซื้อได้: ' + (err.message || err));
      }
    })();
  };

  const handleBackToHome = () => {
    setBranchId(null);
    setProductType('bouquet');
    setCart([]);
    setCheckoutPricing({
      subtotal: 0,
      promotionCode: null,
      promotionDiscount: 0,
      usePoints: false,
      pointsUsed: 0,
      pointsDiscount: 0,
      totalDiscount: 0,
      finalAmount: 0,
    });
    setOrderData(null);
    setStep('home');
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handlePricingChange = useCallback((pricing: CheckoutPricing) => {
    setCheckoutPricing(pricing);
  }, []);

  const handleCheckOrder = () => {
    setStep('tracking');
  };

  return (
    <div className="min-h-screen bg-white">
      <SnowEffect />
      {step === 'home' && (
        <Home
          onNext={handleProduct}
          onLogin={() => handleOpenLogin('home')}
          onLogout={userPhone ? handleLogout : undefined}
          onGoDashboard={userPhone ? () => setStep('dashboard') : undefined}
          loggedInPhone={userPhone}
          onCheckOrder={() => setStep('tracking')}
        />
      )}
      {step === 'login' && (
        <Login
          onConfirm={handleLoginSuccess}
          onBack={handleLoginBack}
        />
      )}
      {step === 'dashboard' && (
        <Dashboard
          userPhone={userPhone ?? undefined}
          onLogout={handleLogout}
          onBackHome={() => setStep('home')}
          onGoShopping={() => setStep('productType')}
        />
      )}
      {step === 'productType' && (
        <ProductTypeSelection
          onSelect={handleProductTypeSelect}
          onBack={() => setStep('home')}
        />
      )}
      {step === 'customize' && (
        <CustomArrangementFlow
          productType={productType}
          onBack={() => setStep('productType')}
          onComplete={handleCustomizationComplete}
        />
      )}
      {step === 'cart' && (
        <Cart
          items={cart}
          currentDeliveryType={Deliverytype}
          customerName={currentCustomerName}
          memberLevelName={currentMemberLevelName}
          currentUserPoints={currentUserPoints}
          isUserPointsLoading={isUserPointsLoading}
          onAddMore={handleAddMoreItems}
          onCheckout={handleToDelivery}
          onRemove={handleRemoveFromCart}
          onPricingChange={handlePricingChange}
        />
      )}
      {step === 'payment' && (
        <Payment
          totalAmount={payableTotal}
          onConfirm={(slipFile) => {
      // slipFile คือ File object ที่ได้จาก Payment
      console.log('Payment slip:', slipFile);
      console.log('method',slipFile.method);
      console.log('data qr',slipFile.data);
      AssigeToDatabase(slipFile);
      
    }}
          onCancel={() => setStep('cart')}
        />
      )}
      {step === 'delivery' && (
        <DeliveryInfo
          cartItems={cart}
          orderId={`ORD${Date.now().toString().slice(-8)}`}
          loggedInPhone={userPhone ?? undefined}
          onConfirm={handleDeliveryConfirm}
        />
      )}
      {step === 'complete' && orderData && (
        <OrderComplete
          orderId={orderData.orderId}
          onCheckOrder={handleCheckOrder}
          onBackToHome={handleBackToHome}
        />
      )}
      {step === 'tracking' && (
        <OrderTracking
          savedOrders={savedOrders}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
}
