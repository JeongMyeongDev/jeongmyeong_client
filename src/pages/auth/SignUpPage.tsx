import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';

const EMAIL_VERIFIED_EVENT_KEY = 'emailVerifiedEvent';

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

const TERMS_TEXT =
  '정명 서비스 이용을 위해 개인정보 수집 및 이용에 동의해 주세요. 수집된 정보는 회원 식별, 로그인, 서비스 제공 목적에만 사용됩니다.';

interface PasswordFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}

const PasswordField = ({ label, placeholder, value, onChange }: PasswordFieldProps) => {
  const [show, setShow] = useState(false);
  return (
    <FieldGroup>
      <Label>{label}</Label>
      <InputRow>
        <UnderlineInput
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <IconGroup>
          <IconButton type="button" onClick={() => setShow((v) => !v)}>
            <EyeIcon />
          </IconButton>
          {value && (
            <IconButton type="button" onClick={() => onChange('')}>
              <CloseIcon />
            </IconButton>
          )}
        </IconGroup>
      </InputRow>
    </FieldGroup>
  );
};

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== EMAIL_VERIFIED_EVENT_KEY || !event.newValue) return;

      try {
        const payload = JSON.parse(event.newValue) as { email?: string };
        if (payload.email === email) {
          setIsEmailVerified(true);
          setSuccessMessage('이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.');
        }
      } catch {
        return;
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [email]);

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
      if (!error.response) return '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요.';
    }
    return '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsEmailVerified(false);

    if (!agreed) return;
    if (password !== passwordConfirm) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(email, nickname, password, passwordConfirm);
      setSuccessMessage('인증 메일을 보냈습니다. 이메일 인증을 완료하면 계정이 생성됩니다.');
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Wrapper>
      <Title>회원가입</Title>
      <Form onSubmit={handleSubmit}>
        <FieldGroup>
          <Label>닉네임</Label>
          <UnderlineInput
            type="text"
            placeholder="닉네임을 입력하세요."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </FieldGroup>
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
        <PasswordField
          label="비밀번호"
          placeholder="비밀번호를 입력하세요."
          value={password}
          onChange={setPassword}
        />
        <PasswordField
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력하세요."
          value={passwordConfirm}
          onChange={setPasswordConfirm}
        />
        <ConsentSection>
          <ConsentTitle>개인정보 수집 및 이용에 동의해 주세요.</ConsentTitle>
          <CheckboxRow>
            <Checkbox
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <CheckboxLabel htmlFor="agree">동의합니다.</CheckboxLabel>
          </CheckboxRow>
          <TermsBox>{TERMS_TEXT}</TermsBox>
        </ConsentSection>
        {error && <ErrorText>{error}</ErrorText>}
        {successMessage && <SuccessText>{successMessage}</SuccessText>}
        {isEmailVerified ? (
          <SubmitButton type="button" disabled={false} onClick={() => navigate('/login')}>
            로그인하러 가기
          </SubmitButton>
        ) : (
          <SubmitButton type="submit" disabled={!agreed || isSubmitting}>
            {isSubmitting ? '가입 요청 중...' : '계정 만들기'}
          </SubmitButton>
        )}
      </Form>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  padding: 60px 32px 40px;
  background: #f5f5f5;

  @media (max-width: 375px) {
    padding: 42px 24px 32px;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: #1a1a1a;
  margin-bottom: 40px;

  @media (max-width: 375px) {
    margin-bottom: 28px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 28px;

  @media (max-width: 375px) {
    gap: 22px;
  }
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

const ConsentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ConsentTitle = styled.p`
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #4dc891;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;
`;

const TermsBox = styled.div`
  padding: 14px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  line-height: 1.6;
  max-height: 100px;
  overflow-y: auto;
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: #f04444;
`;

const SuccessText = styled.p`
  font-size: 13px;
  color: #1f9f6b;
`;

const SubmitButton = styled.button<{ disabled: boolean }>`
  width: 100%;
  height: 52px;
  background: ${({ disabled }) => (disabled ? '#a8e6c8' : '#4dc891')};
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;

export default SignUpPage;
