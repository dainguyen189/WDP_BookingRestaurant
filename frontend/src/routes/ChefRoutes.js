import { Routes, Route, Navigate } from 'react-router-dom';
import Chef from '../component/pages/Chef/Chef';
import ChefmenuItem from '../component/pages/Chef/ChefmenuItem';
import ChefOrder from '../component/pages/Chef/ChefOrder';
import ChOrder from '../component/pages/staff/ChOrder/ChOrder';
import UserProfile from '../component/pages/UserProfile/UserProfile';

// import ChefDashboard from '../component/pages/Dashboard/ChefDashboard';

const isChef = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.role === "chef";
};

const ChefRoutes = () => {
  return (
    <Routes>
      {isChef() ? (
        <>
          {/* Main Chef Order Management Page */}
          <Route path="/" element={<Chef />} />
          <Route path="/orders" element={<ChOrder />} />
          <Route path="item" element={<ChefmenuItem />} />
          {/* Redirect any unknown chef routes to main order page */}
          <Route path="*" element={<Navigate to="/chef" replace />} />
           <Route path="profile" element={<UserProfile />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default ChefRoutes;
