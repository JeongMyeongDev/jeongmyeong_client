import { isAxiosError } from 'axios';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { authService } from '../../services/authService';

const PasswordResetPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
    }
    return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  };

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const { data } = await authService.requestPasswordReset({ email });
      setMessage(data.message);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const { data } = await authService.confirmPasswordReset({
        token,
        password,
        passwordConfirm,
      });
      setMessage(data.message);
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Wrapper>
      <Form onSubmit={token ? confirmReset : requestReset}>
        <Title>비밀번호 재설정</Title>
        {token ? (
          <>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="새 비밀번호"
              required
            />
            <Input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="새 비밀번호 확인"
              required
            />
          </>
        ) : (
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="가입한 이메일"
            required
          />
        )}
        {message && <InfoText>{message}</InfoText>}
        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? '처리 중...' : token ? '비밀번호 변경' : '재설정 메일 받기'}
        </SubmitButton>
        <TextButton type="button" onClick={() => navigate('/login')}>
          로그인으로 돌아가기
        </TextButton>
      </Form>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Form = styled.form`
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Title = styled.h1`
  margin: 0 0 12px;
  font-size: 22px;
  color: #2f3238;
  text-align: center;
`;

const Input = styled.input`
  height: 44px;
  border: none;
  border-bottom: 1px solid #d0d0d0;
  background: transparent;
  font-size: 15px;
  outline: none;
`;

const SubmitButton = styled.button`
  height: 48px;
  border: none;
  border-radius: 999px;
  background: #4dc891;
  color: #ffffff;
  font-weight: 700;
`;

const TextButton = styled.button`
  border: none;
  background: transparent;
  color: #888;
  text-decoration: underline;
`;

const InfoText = styled.p`
  margin: 0;
  color: #2dcd97;
  font-size: 13px;
`;

const ErrorText = styled.p`
  margin: 0;
  color: #f04444;
  font-size: 13px;
`;

export default PasswordResetPage;
