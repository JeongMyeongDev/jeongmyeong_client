import ProfileMenuRow from './ProfileMenuRow';
import ProfileSection from './ProfileSection';

interface AccountManagementSectionProps {
  isLogoutLoading: boolean;
  isDeleteLoading: boolean;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const AccountManagementSection = ({
  isLogoutLoading,
  isDeleteLoading,
  onLogout,
  onDeleteAccount,
}: AccountManagementSectionProps) => (
  <ProfileSection title="계정 관리">
    <ProfileMenuRow
      label={isLogoutLoading ? '로그아웃 중...' : '로그아웃'}
      tone="danger"
      disabled={isLogoutLoading || isDeleteLoading}
      onClick={onLogout}
    />
    <ProfileMenuRow
      label={isDeleteLoading ? '회원 탈퇴 처리 중...' : '회원 탈퇴'}
      tone="danger"
      disabled={isLogoutLoading || isDeleteLoading}
      onClick={onDeleteAccount}
    />
  </ProfileSection>
);

export default AccountManagementSection;
