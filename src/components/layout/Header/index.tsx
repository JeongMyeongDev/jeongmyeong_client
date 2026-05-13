import styled from 'styled-components';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

const Header = ({ title, onBack }: HeaderProps) => {
  return (
    <Wrapper>
      {onBack && <BackButton onClick={onBack}>{'<'}</BackButton>}
      <Title>{title}</Title>
    </Wrapper>
  );
};

const Wrapper = styled.header`
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  z-index: 10;
`;

const BackButton = styled.button`
  margin-right: 8px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 600;
`;

export default Header;
