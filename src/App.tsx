import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import BottomNav from './components/layout/BottomNav';
import { authService } from './services/authService';
import { useAuthStore } from './stores/authStore';

const App = () => {
  const { setUser, clearAuth, setInitialized } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setInitialized();
      return;
    }

    authService
      .getMe()
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('accessToken');
        clearAuth();
      })
      .finally(() => setInitialized());
  }, [clearAuth, setInitialized, setUser]);

  return (
    <Layout>
      <Content>
        <Outlet />
      </Content>
      <BottomNav />
    </Layout>
  );
};

const Layout = styled.div`
  min-height: 100dvh;
  position: relative;
`;

const Content = styled.main`
  padding-bottom: 60px;
`;

export default App;
