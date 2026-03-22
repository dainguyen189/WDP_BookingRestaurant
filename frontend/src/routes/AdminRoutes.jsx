import { Routes, Route, Navigate } from "react-router-dom";

import AdminMenuCategory from "../component/pages/Menu/AdminmenuCategory";
import AdminMenuItem from "../component/pages/Menu/AdminmenuItem";
import AdminTableQRPage from "../component/pages/ManagementTable/AdminTableQRPage";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="item" />} />
      <Route path="tables" element={<AdminTableQRPage />} />
      <Route path="category" element={<AdminMenuCategory />} />
      <Route path="item" element={<AdminMenuItem />} />
    </Routes>
  );
};

export default AdminRoutes;
