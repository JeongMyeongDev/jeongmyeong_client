import styled from 'styled-components';

interface ProfileEditCardProps {
  nickname: string;
  profileImage: string;
  isSaving: boolean;
  errorMessage: string;
  onNicknameChange: (value: string) => void;
  onProfileImageChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const ProfileEditCard = ({
  nickname,
  profileImage,
  isSaving,
  errorMessage,
  onNicknameChange,
  onProfileImageChange,
  onCancel,
  onSave,
}: ProfileEditCardProps) => (
  <EditCard>
    <FieldGroup>
      <Label htmlFor="profile-nickname">닉네임</Label>
      <ProfileInput
        id="profile-nickname"
        value={nickname}
        onChange={(event) => onNicknameChange(event.target.value)}
        placeholder="닉네임"
        disabled={isSaving}
      />
    </FieldGroup>

    <FieldGroup>
      <Label htmlFor="profile-image">프로필 이미지 URL</Label>
      <ProfileInput
        id="profile-image"
        value={profileImage}
        onChange={(event) => onProfileImageChange(event.target.value)}
        placeholder="https://..."
        disabled={isSaving}
      />
    </FieldGroup>

    {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

    <ActionRow>
      <CancelButton type="button" onClick={onCancel} disabled={isSaving}>
        취소
      </CancelButton>
      <SaveButton type="button" onClick={onSave} disabled={isSaving || !nickname.trim()}>
        {isSaving ? '저장 중...' : '저장'}
      </SaveButton>
    </ActionRow>
  </EditCard>
);

const EditCard = styled.section`
  background: #efefef;
  border-radius: var(--card-radius);
  padding: clamp(14px, 3.7vw, 16px);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  text-align: left;
`;

const Label = styled.label`
  color: #5f6368;
  font-size: 13px;
  font-weight: 700;
`;

const ProfileInput = styled.input`
  height: 44px;
  border: 1.5px solid #c8c8c8;
  border-radius: 999px;
  background: #ffffff;
  color: #2f3238;
  padding: 0 14px;
  font-size: var(--body-sm);
  outline: none;

  &:focus {
    border-color: #2dcd97;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  color: #f04444;
  font-size: 13px;
  text-align: left;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
`;

const CancelButton = styled.button`
  flex: 1;
  height: 44px;
  border: 1.5px solid #c8c8c8;
  border-radius: 999px;
  background: #ffffff;
  color: #2f3238;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
  }
`;

const SaveButton = styled.button`
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: default;
  }
`;

export default ProfileEditCard;
