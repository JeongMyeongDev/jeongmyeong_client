import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#4dc891' : 'none'} stroke={active ? '#4dc891' : '#bbb'} strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const DebateIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#4dc891' : '#bbb'} strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ArchiveIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#4dc891' : '#bbb'} strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#4dc891' : '#bbb'} strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const NAV_ITEMS = [
  { to: '/', label: '홈', icon: HomeIcon, end: true },
  { to: '/debate-room', label: '토론방', icon: DebateIcon, end: false },
  { to: '/debate/archive', label: '저장소', icon: ArchiveIcon, end: false },
  { to: '/profile', label: '프로필', icon: ProfileIcon, end: false },
];

const BottomNav = () => {
  const navigate = useNavigate();

  return (
    <Wrapper>
      {NAV_ITEMS.slice(0, 2).map(({ to, label, icon: Icon, end }) => (
        <Tab key={to} to={to} end={end}>
          {({ isActive }) => (
            <>
              <Icon active={isActive} />
              <TabLabel $active={isActive}>{label}</TabLabel>
            </>
          )}
        </Tab>
      ))}

      <FabWrapper>
        <Fab onClick={() => navigate('/debate/create')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Fab>
      </FabWrapper>

      {NAV_ITEMS.slice(2).map(({ to, label, icon: Icon, end }) => (
        <Tab key={to} to={to} end={end}>
          {({ isActive }) => (
            <>
              <Icon active={isActive} />
              <TabLabel $active={isActive}>{label}</TabLabel>
            </>
          )}
        </Tab>
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.nav`
  position: fixed;
  bottom: 0;
  width: 390px;
  height: 64px;
  display: flex;
  align-items: center;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  z-index: 100;

  @media (max-width: 390px) {
    width: 100%;
  }
`;

const Tab = styled(NavLink)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-decoration: none;
  height: 100%;
`;

const TabLabel = styled.span<{ $active: boolean }>`
  font-size: 10px;
  color: ${({ $active }) => ($active ? '#4dc891' : '#bbb')};
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
`;

const FabWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Fab = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #4dc891;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(77, 200, 145, 0.4);
  margin-bottom: 12px;
`;

export default BottomNav;
