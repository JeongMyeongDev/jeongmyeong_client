import { Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import BottomNav from './components/layout/BottomNav';
import SanctionNotice from './components/moderation/SanctionNotice';
import { shouldHideBottomNav } from './constants/routes';

const App = () => {
  const location = useLocation();
  const hideBottomNav = shouldHideBottomNav(location.pathname);

  return (
    <Layout>
      <SanctionNotice />
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
  padding-bottom: ${({ $withBottomNav }) =>
    $withBottomNav ? 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' : '0'};
`;

export default App;
