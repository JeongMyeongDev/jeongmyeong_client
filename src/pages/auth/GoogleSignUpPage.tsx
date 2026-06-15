import { useState } from 'react';
import { isAxiosError } from 'axios';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';
import { sanitizePlainText } from '../../utils/textSanitizer';

type GoogleSignupState = {
  idToken?: string;
  email?: string;
};

const GoogleSignUpPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { googleSignup } = useAuth();
  const { idToken, email } = (state ?? {}) as GoogleSignupState;
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!idToken || !email) {
    return <Navigate to="/login" replace />;
  }

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
    }
    return '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError('닉네임을 입력해 주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await googleSignup(idToken, nickname.trim(), password, passwordConfirm);
      navigate('/', { replace: true });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Wrapper>
      <Title>Google 회원가입</Title>
      <Form onSubmit={handleSubmit}>
        <FieldGroup>
          <Label>이메일</Label>
          <ReadonlyValue>{email}</ReadonlyValue>
        </FieldGroup>
        <FieldGroup>
          <Label>닉네임</Label>
          <UnderlineInput
            type="text"
            placeholder="닉네임을 입력하세요."
            value={nickname}
            onChange={(e) => setNickname(sanitizePlainText(e.target.value))}
            required
          />
        </FieldGroup>
        <FieldGroup>
          <Label>비밀번호</Label>
          <UnderlineInput
            type="password"
            placeholder="비밀번호를 입력하세요."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FieldGroup>
        <FieldGroup>
          <Label>비밀번호 확인</Label>
          <UnderlineInput
            type="password"
            placeholder="비밀번호를 다시 입력하세요."
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        </FieldGroup>
        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? '가입 중...' : '가입 완료하기'}
        </SubmitButton>
      </Form>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  padding: 60px 32px 40px;
  background: #f5f5f5;
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

const ReadonlyValue = styled.div`
  min-height: 36px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #d0d0d0;
  font-size: 14px;
  color: #555;
`;

const UnderlineInput = styled.input`
  height: 36px;
  border: none;
  border-bottom: 1px solid #d0d0d0;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  background: transparent;

  &::placeholder {
    color: #b0b0b0;
  }
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: #f04444;
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

export default GoogleSignUpPage;
