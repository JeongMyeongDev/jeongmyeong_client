import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { label: '홈', path: '/' },
  { label: '토론 방', path: '/debate-room' },
  { label: '보관함', path: '/debate/archive' },
  { label: '프로필', path: '/profile' },
];

const SideDrawer = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <Overlay $visible={isOpen} onClick={onClose} />
      <Drawer $open={isOpen}>
        <DrawerHeader>
          <CloseButton type="button" onClick={onClose} aria-label="메뉴 닫기">
            <CloseIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </CloseIcon>
          </CloseButton>
        </DrawerHeader>
        <NavList>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.path}
              type="button"
              $active={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
            >
              {item.label}
            </NavItem>
          ))}
        </NavList>
      </Drawer>
    </>
  );
};

const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 400;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition: opacity 0.25s;
`;

const Drawer = styled.div<{ $open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100dvh;
  width: 260px;
  background: #ffffff;
  z-index: 500;
  transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
  transition: transform 0.25s ease;
  display: flex;
  flex-direction: column;
  padding: 0 0 32px;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 20px 20px 12px;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #555;
  border-radius: 50%;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;

  @media (hover: hover) {
    &:hover {
      background: rgba(45, 205, 151, 0.08);
      color: #2dcd97;
    }
  }

  &:active {
    transform: scale(0.96);
  }
`;

const CloseIcon = styled.svg`
  width: 24px;
  height: 24px;
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  gap: 4px;
`;

const NavItem = styled.button<{ $active: boolean }>`
  text-align: left;
  border: none;
  border-radius: 12px;
  background: ${({ $active }) => ($active ? '#edfaf4' : 'transparent')};
  color: ${({ $active }) => ($active ? '#2dcd97' : '#2f3238')};
  font-size: 16px;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  padding: 14px 16px;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;

  @media (hover: hover) {
    &:hover {
      background: ${({ $active }) => ($active ? '#edfaf4' : '#f5f5f5')};
    }
  }

  &:active {
    transform: scale(0.98);
  }
`;

export default SideDrawer;
