import { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import logoSymbol from '../../assets/logo_symbol.svg';
import { useAuth } from '../../hooks/useAuth';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    renderButton: (
      parent: HTMLElement,
      options: {
        theme: 'outline' | 'filled_blue' | 'filled_black';
        size: 'large' | 'medium' | 'small';
        shape: 'pill' | 'rectangular' | 'circle' | 'square';
        text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
        width: string;
      },
    ) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

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
  const { login, googleLogin } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
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

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError('Google 로그인 정보를 받을 수 없습니다.');
        return;
      }

      setError('');
      setIsSubmitting(true);
      try {
        await googleLogin(response.credential);
        navigate('/', { replace: true });
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          const googleEmail = error.response.data?.email;
          if (typeof googleEmail === 'string') {
            navigate('/google-signup', {
              state: { idToken: response.credential, email: googleEmail },
              replace: true,
            });
            return;
          }
        }
        setError(getErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
    },
    [googleLogin, navigate],
  );

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: '320',
      });
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
  }, [handleGoogleCredential]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
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
        {error && <ErrorText>{error}</ErrorText>}
        <LoginButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? '로그인 중...' : '로그인하기'}
        </LoginButton>
        {googleClientId ? (
          <GoogleButtonContainer ref={googleButtonRef} aria-disabled={isSubmitting} />
        ) : (
          <ErrorText>Google 클라이언트 ID가 설정되지 않았습니다.</ErrorText>
        )}
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
  background: #f5f5f5;
`;

const Logo = styled.img`
  width: 68px;
  height: 40px;
  display: block;
  margin-top: 62px;
  margin-bottom: 56px;
`;

const Form = styled.form`
  width: 100%;
  max-width: 360px;
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

const LoginButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  height: 52px;
  background: ${({ disabled }) => (disabled ? '#a8e6c8' : '#4dc891')};
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;

const GoogleButtonContainer = styled.div`
  width: 100%;
  min-height: 44px;
  display: flex;
  justify-content: center;
  opacity: ${({ 'aria-disabled': ariaDisabled }) => (ariaDisabled ? 0.6 : 1)};
  pointer-events: ${({ 'aria-disabled': ariaDisabled }) => (ariaDisabled ? 'none' : 'auto')};
`;

const SignUpLink = styled.button`
  align-self: center;
  background: none;
  border: none;
  font-size: 14px;
  color: #888;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
`;

export default LoginPage;
