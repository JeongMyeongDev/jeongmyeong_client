import { Component } from 'react';
import { isAxiosError } from 'axios';
import styled from 'styled-components';
import { authService } from '../../services/authService';

const EMAIL_VERIFIED_EVENT_KEY = 'emailVerifiedEvent';

type VerifyStatus = 'loading' | 'success' | 'error';

interface VerifyEmailPageState {
  status: VerifyStatus;
  message: string;
}

class VerifyEmailPage extends Component<Record<string, never>, VerifyEmailPageState> {
  state: VerifyEmailPageState = {
    status: 'loading',
    message: '이메일 인증을 확인하고 있습니다.',
  };

  componentDidMount() {
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      this.setState({
        status: 'error',
        message: '이메일 인증 토큰이 없습니다.',
      });
      return;
    }

    authService
      .verifyEmail({ token })
      .then(({ data }) => {
        if (data.email) {
          localStorage.setItem(
            EMAIL_VERIFIED_EVENT_KEY,
            JSON.stringify({ email: data.email, verifiedAt: Date.now() }),
          );
        }

        this.setState({
          status: 'success',
          message: data.message,
        });
      })
      .catch((error) => {
        if (isAxiosError(error)) {
          const responseMessage = error.response?.data?.message;
          if (typeof responseMessage === 'string') {
            this.setState({
              status: 'error',
              message: responseMessage,
            });
            return;
          }
        }

        this.setState({
          status: 'error',
          message: '이메일 인증에 실패했습니다.',
        });
      });
  }

  render() {
    const { status, message } = this.state;

    return (
      <Wrapper>
        <Panel>
          <Title>
            {status === 'success' ? '인증 완료' : status === 'error' ? '인증 실패' : '인증 확인 중'}
          </Title>
          <Message>{message}</Message>
          {status !== 'loading' && <LoginLink href="/login">로그인으로 이동</LoginLink>}
        </Panel>
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f5f5f5;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 360px;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
`;

const Message = styled.p`
  margin: 0 0 28px;
  font-size: 15px;
  line-height: 1.6;
  color: #555;
`;

const LoginLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  background: #4dc891;
  color: #fff;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
`;

export default VerifyEmailPage;
