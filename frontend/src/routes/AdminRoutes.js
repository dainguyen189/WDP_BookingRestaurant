import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '../component/pages/Dashboard/AdminDashboard';
import AdminTableQRPage from '../component/pages/ManagementTable/AdminTableQRPage';

import AdminReservation from '../component/pages/Reservation/AdminReservation';
// import AdminCheckoutPage from "../component/pages/Checkout/AdminCheckoutPage";
import AdminMenuCategory from '../component/pages/Menu/AdminmenuCategory';
import AdminMEnuItem from '../component/pages/Menu/AdminmenuItem';
import PromotionManagement from '../component/pages/PromotionManagement/PromotionManagement';
import UserManagement from '../component/pages/UserManagement/UserManagement';
import AdminOrdersList from '../component/pages/Revenue/AdminOrdersList';

const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.role === "admin";
};

const AdminRoutes = () => {
  return (
    <Routes>
      {isAdmin() ? (
        <>
          <Route path="/" element={<AdminDashboard />} />

          {/* <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} /> */}
          <Route path="reservation" element={<AdminReservation />} />
          <Route path="tables" element={<AdminTableQRPage />} />

          {/* <Route path="checkout" element={<AdminCheckoutPage />} /> */}
          <Route path="category" element={<AdminMenuCategory />} />
          <Route path="item" element={<AdminMEnuItem />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/promotions" element={<PromotionManagement />} />
          <Route path="orders" element={<AdminOrdersList />} />
          
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default AdminRoutes;
