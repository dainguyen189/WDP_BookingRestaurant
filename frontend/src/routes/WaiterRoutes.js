import { Routes, Route, Navigate } from 'react-router-dom';
import WaiterCheckout from "../component/pages/Checkout/WaiterCheckout";
import WaiterTablePage from "../component/pages/ManagementTable/WaiterTablePage";
import WaiterReservation from '../component/pages/Reservation/WaiterReservation';
import UserProfile from '../component/pages/UserProfile/UserProfile';
import PreOrder from '../component/pages/Reservation/PreOrder';
import OrdersList from '../component/pages/Revenue/OrdersList';


const isWaiter = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.role === "waiter";
};

const WaiterRoutes = () => {
  return (
    <Routes>
      {isWaiter() ? (
        <>
          <Route path="/" element={<WaiterTablePage />} />
          <Route path="/checkout" element={<WaiterCheckout />} />
          <Route path="reservation" element={<WaiterReservation />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="tables" element={<WaiterTablePage />} />

          <Route path="pre-order" element={<PreOrder />} />

          <Route path="orders" element={<OrdersList />} />


        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default WaiterRoutes;