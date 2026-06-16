import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const SuspendedAccountPage = () => {
  const navigate = useNavigate();

  return (
    <Wrapper>
      <Panel>
        <Title>Account suspended</Title>
        <Message>This account is suspended. Please check your sanction history.</Message>
        <Description>
          Suspended accounts cannot sign in right now. Contact support if you need help reviewing
          or appealing this sanction.
        </Description>
        <BackButton type="button" onClick={() => navigate('/login')}>
          Back to login
        </BackButton>
      </Panel>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: #f5f5f5;
  padding: 0 clamp(24px, 7.4vw, 32px);
`;

const Panel = styled.section`
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Title = styled.h1`
  margin: 0;
  color: #202329;
  font-size: clamp(26px, 7vw, 34px);
  line-height: 1.2;
`;

const Message = styled.p`
  margin: 0;
  color: #d92d20;
  font-size: var(--body-md);
  font-weight: 700;
  line-height: 1.45;
`;

const Description = styled.p`
  margin: 0;
  color: #667085;
  font-size: var(--body-sm);
  line-height: 1.55;
`;

const BackButton = styled.button`
  width: 100%;
  height: clamp(48px, 12.1vw, 52px);
  border: none;
  border-radius: 999px;
  background: #4dc891;
  color: #ffffff;
  font-size: var(--body-md);
  font-weight: 700;
  margin-top: 10px;
  cursor: pointer;
`;

export default SuspendedAccountPage;
