import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import logoSymbol from '../../assets/logo_symbol.svg';
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
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
    }
    return '로그인에 실패했습니다. 입력 정보를 확인해 주세요.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user?.hasCompletedOnboarding === false ? '/onboarding' : '/', { replace: true });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Wrapper>
      <Logo src={logoSymbol} alt="정명" />
      <Form onSubmit={handleSubmit}>
        <FieldGroup>
          <Label>이메일</Label>
          <UnderlineInput
            type="email"
            placeholder="이메일을 입력하세요."
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
              placeholder="비밀번호를 입력하세요."
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
        {searchParams.get('expired') === '1' && (
          <InfoText>로그인이 만료되었습니다. 다시 로그인해 주세요.</InfoText>
        )}
        {error && <ErrorText>{error}</ErrorText>}
        <LoginButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? '로그인 중...' : '로그인하기'}
        </LoginButton>
        <SignUpLink type="button" onClick={() => navigate('/signup')}>
          회원가입
        </SignUpLink>
        <SignUpLink type="button" onClick={() => navigate('/password-reset')}>
          비밀번호를 잊으셨나요?
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
  padding: 0 clamp(24px, 7.4vw, 32px);
  background: #f5f5f5;
`;

const Logo = styled.img`
  width: var(--logo-width);
  height: var(--logo-height);
  display: block;
  margin-top: var(--page-top);
  margin-bottom: clamp(40px, 13vw, 56px);
`;

const Form = styled.form`
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: clamp(20px, 5.6vw, 24px);
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
  font-size: var(--body-sm);
  color: #1a1a1a;
  outline: none;
  background: transparent;

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
  cursor: pointer;

  &:hover {
    color: #555;
  }
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: #f04444;
  margin: -12px 0 0;
`;

const InfoText = styled.p`
  font-size: 13px;
  color: #2dcd97;
  margin: -12px 0 0;
`;

const LoginButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  height: clamp(48px, 12.1vw, 52px);
  background: ${({ disabled }) => (disabled ? '#a8e6c8' : '#4dc891')};
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-size: var(--body-md);
  font-weight: 600;
  margin-top: 8px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;

const SignUpLink = styled.button`
  align-self: center;
  background: none;
  border: none;
  font-size: var(--body-sm);
  color: #888;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
`;

export default LoginPage;
