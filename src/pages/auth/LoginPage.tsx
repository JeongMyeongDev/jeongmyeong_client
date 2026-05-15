import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <Wrapper>
      <Logo>정명</Logo>
      <Form onSubmit={handleSubmit}>
        <FieldGroup>
          <Label>이메일</Label>
          <UnderlineInput
            type="email"
            placeholder="이메일을 입력하세요..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FieldGroup>
        <FieldGroup>
          <Label>비밀번호</Label>
          <InputRow>
            <UnderlineInput
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <IconGroup>
              <IconButton type="button" onClick={() => setShowPassword((v) => !v)}>
                <EyeIcon />
              </IconButton>
              {password && (
                <IconButton type="button" onClick={() => setPassword('')}>
                  <CloseIcon />
                </IconButton>
              )}
            </IconGroup>
          </InputRow>
        </FieldGroup>
        {error && <ErrorText>{error}</ErrorText>}
        <LoginButton type="submit">로그인하기</LoginButton>
        <GoogleButton type="button">Google로 연동하기</GoogleButton>
        <SignUpLink type="button" onClick={() => navigate('/signup')}>
          회원가입
        </SignUpLink>
      </Form>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 0 32px;
  background: #ffffff;
`;

const Logo = styled.h1`
  font-size: 52px;
  font-weight: 800;
  color: #4dc891;
  margin-bottom: 56px;
  letter-spacing: -1px;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1px solid #d0d0d0;
`;

const UnderlineInput = styled.input`
  flex: 1;
  height: 36px;
  border: none;
  border-bottom: 1px solid #d0d0d0;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  background: transparent;

  /* InputRow 내부일 때는 border-bottom 제거 */
  ${InputRow} & {
    border-bottom: none;
  }

  &::placeholder {
    color: #b0b0b0;
  }
`;

const IconGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 8px;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #999;
  padding: 0;

  &:hover {
    color: #555;
  }
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: #f04444;
  margin-top: -12px;
`;

const LoginButton = styled.button`
  width: 100%;
  height: 52px;
  background: #4dc891;
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
`;

const GoogleButton = styled.button`
  width: 100%;
  height: 52px;
  background: #ffffff;
  color: #1a1a1a;
  border: 1.5px solid #1a1a1a;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 500;
`;

const SignUpLink = styled.button`
  align-self: center;
  background: none;
  border: none;
  font-size: 14px;
  color: #888;
  text-decoration: underline;
  text-underline-offset: 3px;
`;

export default LoginPage;
