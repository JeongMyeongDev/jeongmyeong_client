import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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

const TERMS_TEXT = `본 약관은 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「개인정보 보호법」 등 관계 법령을 준수하여, 토론 플랫폼 서비스 이용에 관한 사항을 규정합니다.`;

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    // TODO: 회원가입 API 연동
    navigate('/login');
  };

  return (
    <Wrapper>
      <Title>회원가입</Title>
      <Form onSubmit={handleSubmit}>
        <FieldGroup>
          <Label>이름</Label>
          <UnderlineInput
            type="text"
            placeholder="이름을 지어주세요..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FieldGroup>
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
        <PasswordField
          label="비밀번호"
          placeholder="비밀번호를 입력하세요..."
          value={password}
          onChange={setPassword}
        />
        <PasswordField
          label="비밀번호 확인"
          placeholder="작성한 비밀번호를 입력하세요..."
          value={passwordConfirm}
          onChange={setPasswordConfirm}
        />
        <ConsentSection>
          <ConsentTitle>개인정보 약관에 동의하세요</ConsentTitle>
          <CheckboxRow>
            <Checkbox
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <CheckboxLabel htmlFor="agree">네, 동의하겠습니다.</CheckboxLabel>
          </CheckboxRow>
          <TermsBox>{TERMS_TEXT}</TermsBox>
        </ConsentSection>
        <SubmitButton type="submit" disabled={!agreed}>
          계정 만들기
        </SubmitButton>
      </Form>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  padding: 60px 32px 40px;
  background: #ffffff;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: #1a1a1a;
  margin-bottom: 40px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 28px;
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
