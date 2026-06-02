import { Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import BottomNav from './components/layout/BottomNav';

const App = () => {
  const location = useLocation();
  const hideBottomNav =
    location.pathname.startsWith('/debate/create') || location.pathname.startsWith('/message');

  return (
    <Layout>
      <Content $withBottomNav={!hideBottomNav}>
        <Outlet />
      </Content>
      {!hideBottomNav && <BottomNav />}
    </Layout>
  );
};

const Layout = styled.div`
  min-height: 100dvh;
  position: relative;
`;

const Content = styled.main<{ $withBottomNav: boolean }>`
  padding-bottom: ${({ $withBottomNav }) => ($withBottomNav ? '60px' : '0')};
`;

export default App;
