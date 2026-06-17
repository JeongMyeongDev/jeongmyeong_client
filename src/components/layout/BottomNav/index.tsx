import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import iconBtnGenerate from '../../../assets/icon_btn_generate.svg';
import { ROUTES } from '../../../constants/routes';
import { NAV_LABELS } from '../../../constants/ui';

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

const leftItems = [
  { to: ROUTES.HOME, label: NAV_LABELS.HOME, icon: HomeIcon, end: true },
  { to: ROUTES.DEBATE_ROOM, label: NAV_LABELS.DEBATE_ROOM, icon: DebateIcon, end: false },
] as const;

const centerAction = { to: ROUTES.DEBATE_CREATE, label: '토론 생성' } as const;

const rightItems = [
  { to: ROUTES.DEBATE_ARCHIVE, label: NAV_LABELS.ARCHIVE, icon: ArchiveIcon, end: false },
  { to: ROUTES.PROFILE, label: NAV_LABELS.PROFILE, icon: ProfileIcon, end: false },
] as const;

const BottomNav = () => {
  const navigate = useNavigate();

  return (
    <Wrapper>
      {leftItems.map(({ to, label, icon: Icon, end }) => (
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
        <Fab type="button" aria-label={centerAction.label} onClick={() => navigate(centerAction.to)}>
          <FabIcon src={iconBtnGenerate} alt="" />
        </Fab>
      </FabWrapper>

      {rightItems.map(({ to, label, icon: Icon, end }) => (
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
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 100%;
  max-width: var(--app-max-width);
  height: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  align-items: center;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  z-index: 100;
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
  width: clamp(40px, 10.2vw, 44px);
  height: clamp(54px, 14vw, 60px);
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
`;

const FabIcon = styled.img`
  width: clamp(40px, 10.2vw, 44px);
  height: clamp(54px, 14vw, 60px);
  display: block;
`;

export default BottomNav;
