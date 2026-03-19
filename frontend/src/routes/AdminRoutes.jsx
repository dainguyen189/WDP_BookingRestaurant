import { Routes, Route, Navigate } from "react-router-dom";

import AdminMenuCategory from "../component/pages/Menu/AdminmenuCategory";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="item" />} />
      <Route path="category" element={<AdminMenuCategory />} />
    </Routes>
  );
};

export default AdminRoutes;
