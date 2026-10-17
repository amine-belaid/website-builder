import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TemplatePage  from './pages/TemplatePage';
import EditorPage    from './pages/EditorPage';

// Wrapper: redirect to /login if not authenticated
//children : a prop that allows you to pass components or elements as children to another component.
const Protected = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={
          <Protected><DashboardPage /></Protected>
        } />
        <Route path="/templates" element={
          <Protected><TemplatePage /></Protected>
        } />
        <Route path="/editor/:pageId" element={
          <Protected><EditorPage /></Protected>
        } />
      </Routes>
    </BrowserRouter>
  );
}