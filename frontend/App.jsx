import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './page/auth/Login';

function App() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* tạm thời: nếu chưa login thì luôn đưa về /login */}
      <Route
        path="*"
        element={
          currentUser ? <div>Home (sẽ làm sau)</div> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default App;