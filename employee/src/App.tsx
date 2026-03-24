import { useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner@2.0.3';

// Cashier Pages
import CashierDashboard from './components/cashier/CashierDashboard';
import CashierLogin from './components/cashier/CashierLogin';
import CashierOrderDetail from './components/cashier/CashierOrderDetail';

// Florist Pages
import FloristDashboard from './components/florist/FloristDashboard';
import FloristLogin from './components/florist/FloristLogin';
import FloristOrderDetail from './components/florist/FloristOrderDetail';

// Rider Pages
import RiderDashboard from './components/rider/RiderDashboard';
import RiderDeliveryDetail from './components/rider/RiderDeliveryDetail';
import RiderLogin from './components/rider/RiderLogin';

// Manager Pages
import ManagerDashboard from './components/manager/ManagerDashboard';
import ManagerEmployees from './components/manager/ManagerEmployees';
import ManagerLogin from './components/manager/ManagerLogin';
import OrderHistory from './components/manager/OrderHistory';
import ProductManagement from './components/manager/ProductManagement';

// Executive Pages
import ExecutiveCustomers from './components/executive/ExecutiveCustomers';
import ExecutiveDashboard from './components/executive/ExecutiveDashboard';
import ExecutiveLogin from './components/executive/ExecutiveLogin';
import ExecutiveProductList from './components/executive/ExecutiveProductList';
import ExecutivePromotionManagement from './components/executive/PromotionManagement';
import UserManagement from './components/executive/UserManagement';

// Home/Landing
import Landing from './components/Landing';

export default function App() {
  const [userRole, setUserRole] = useState<string | null>(null);

  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Landing />} />
        
        {/* Cashier */}
        <Route path="/cashier/login" element={<CashierLogin onLogin={() => setUserRole('cashier')} />} />
        <Route path="/cashier/dashboard" element={<CashierDashboard />} />
        <Route path="/cashier/order/:orderId" element={<CashierOrderDetail />} />
        
        {/* Florist */}
        <Route path="/florist/login" element={<FloristLogin onLogin={() => setUserRole('florist')} />} />
        <Route path="/florist/dashboard" element={<FloristDashboard />} />
        <Route path="/florist/order/:orderId" element={<FloristOrderDetail />} />
        
        {/* Rider */}
        <Route path="/rider/login" element={<RiderLogin onLogin={() => setUserRole('rider')} />} />
        <Route path="/rider/dashboard" element={<RiderDashboard />} />
        <Route path="/rider/delivery/:orderId" element={<RiderDeliveryDetail />} />
        
        {/* Manager */}
        <Route path="/manager/login" element={<ManagerLogin onLogin={() => setUserRole('manager')} />} />
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/employees" element={<ManagerEmployees />} />
        <Route path="/manager/products" element={<ProductManagement />} />
        <Route path="/manager/orders" element={<OrderHistory />} />
        
        {/* Executive */}
        <Route path="/executive/login" element={<ExecutiveLogin onLogin={() => setUserRole('executive')} />} />
        <Route path="/executive/dashboard" element={<ExecutiveDashboard />} />
        <Route path="/executive/promotions" element={<ExecutivePromotionManagement />} />
        <Route path="/executive/users" element={<UserManagement />} />
        <Route path="/executive/products" element={<ExecutiveProductList />} />
        <Route path="/executive/customers" element={<ExecutiveCustomers />} />
      </Routes>
    </Router>
  );
}