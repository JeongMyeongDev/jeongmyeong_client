import styled from 'styled-components';
import type { User } from '../../types/user';
import { getDisplayNickname, getNicknameInitial, isDeletedUserNickname } from '../../utils/userDisplay';

interface ProfileHeaderCardProps {
  user: User;
  onEditClick: () => void;
}

const STATUS_LABEL: Record<NonNullable<User['status']>, string> = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
};

const ProfileHeaderCard = ({ user, onEditClick }: ProfileHeaderCardProps) => {
  const visibleStatus = user.status && user.status !== 'ACTIVE' ? user.status : null;
  const displayNickname = getDisplayNickname(user.nickname);
  const nicknameInitial = getNicknameInitial(user.nickname);
  const profileImage = isDeletedUserNickname(user.nickname) ? null : user.profileImage;

  return (
    <HeaderCard>
      <ProfileRow>
        <Avatar aria-label="프로필 이미지">
          {profileImage ? <AvatarImage src={profileImage} alt="" /> : <AvatarInitial>{nicknameInitial}</AvatarInitial>}
        </Avatar>
        <InfoWrap>
          <Name>{displayNickname}</Name>
          <Email>{user.email}</Email>
          <BadgeRow>
            {user.role && <RoleBadge>{user.role}</RoleBadge>}
            {visibleStatus && <StatusBadge>{STATUS_LABEL[visibleStatus]}</StatusBadge>}
          </BadgeRow>
        </InfoWrap>
      </ProfileRow>
      <EditButton type="button" onClick={onEditClick}>
        프로필 수정
      </EditButton>
    </HeaderCard>
  );
};

const HeaderCard = styled.section`
  background: #efefef;
  border-radius: var(--card-radius);
  padding: clamp(16px, 4.7vw, 20px);
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(14px, 4vw, 18px);
`;

const Avatar = styled.div`
  width: clamp(76px, 21vw, 96px);
  height: clamp(76px, 21vw, 96px);
  border-radius: 50%;
  background: #d4d4d6;
  color: #ffffff;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarInitial = styled.span`
  font-size: clamp(26px, 7vw, 32px);
  font-weight: 800;
`;

const InfoWrap = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
`;

const Name = styled.h1`
  margin: 0;
  color: #2f3238;
  font-size: var(--title-sm);
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const Email = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: var(--body-sm);
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const RoleBadge = styled.span`
  border-radius: 999px;
  background: rgba(45, 205, 151, 0.14);
  color: #168761;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  padding: 6px 9px;
`;

const StatusBadge = styled.span`
  border-radius: 999px;
  background: rgba(216, 76, 76, 0.12);
  color: #d84c4c;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  padding: 6px 9px;
`;

const EditButton = styled.button`
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
`;

export default ProfileHeaderCard;
