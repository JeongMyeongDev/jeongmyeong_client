import ProfileMenuRow from './ProfileMenuRow';
import ProfileSection from './ProfileSection';

interface AccountManagementSectionProps {
  isLogoutLoading: boolean;
  onLogout: () => void;
}

const AccountManagementSection = ({ isLogoutLoading, onLogout }: AccountManagementSectionProps) => (
  <ProfileSection title="계정 관리">
    <ProfileMenuRow
      label={isLogoutLoading ? '로그아웃 중...' : '로그아웃'}
      tone="danger"
      disabled={isLogoutLoading}
      onClick={onLogout}
    />
  </ProfileSection>
);

export default AccountManagementSection;
