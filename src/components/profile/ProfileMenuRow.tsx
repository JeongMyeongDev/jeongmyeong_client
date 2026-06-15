import styled from 'styled-components';

interface ProfileMenuRowProps {
  label: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}

const ProfileMenuRow = ({ label, tone = 'default', disabled = false, onClick }: ProfileMenuRowProps) => (
  <RowButton type="button" $tone={tone} onClick={onClick} disabled={disabled}>
    <Label>{label}</Label>
    <Chevron aria-hidden="true">›</Chevron>
  </RowButton>
);

const RowButton = styled.button<{ $tone: 'default' | 'danger' }>`
  width: 100%;
  min-height: 48px;
  border: none;
  border-bottom: 1px solid #e1e1e1;
  background: transparent;
  color: ${({ $tone }) => ($tone === 'danger' ? '#d84c4c' : '#2f3238')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  text-align: left;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const Label = styled.span`
  font-size: var(--body-sm);
  font-weight: 600;
  line-height: 1.35;
`;

const Chevron = styled.span`
  color: #a6a6a6;
  font-size: 24px;
  line-height: 1;
`;

export default ProfileMenuRow;
