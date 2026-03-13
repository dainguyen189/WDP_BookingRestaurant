import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './page/auth/Login';
import Register from './page/auth/Register';

const App = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Trang chính tạm thời chỉ hiển thị text, bạn có thể thay bằng Home sau */}
      <Route
        path="/"
        element={
          currentUser ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>Trang chủ</h2>
              <p>Đăng nhập thành công. Sau này sẽ điều hướng theo role (admin, staff, chef,...)</p>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Bất kỳ route nào khác cũng đưa về login nếu chưa đăng nhập */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
