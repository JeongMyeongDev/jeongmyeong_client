import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { createGlobalStyle, styled } from 'styled-components';
import AuthInitializer from './components/common/AuthInitializer';
import router from './router';

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background:
      radial-gradient(circle at 16% 0%, rgba(77, 200, 145, 0.18), transparent 36%),
      radial-gradient(circle at 90% 20%, rgba(102, 196, 255, 0.14), transparent 34%),
      linear-gradient(180deg, #f8fbfa 0%, #eef5f2 48%, #f7f7f7 100%);
    color: #1a1a1a;
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  button {
    cursor: pointer;
  }

  :root {
    --app-max-width: 430px;
    --page-x: clamp(12px, 4.1vw, 18px);
    --page-top: clamp(44px, 14.4vw, 62px);
    --page-bottom: calc(clamp(78px, 20.9vw, 90px) + env(safe-area-inset-bottom));
    --logo-width: clamp(58px, 15.8vw, 68px);
    --logo-height: clamp(34px, 9.3vw, 40px);
    --card-radius: clamp(20px, 5.6vw, 24px);
    --surface-radius: clamp(20px, 5.6vw, 24px);
    --bottom-nav-height: clamp(58px, 14.9vw, 64px);
    --tap-size: clamp(34px, 9.8vw, 42px);
    --icon-size: clamp(24px, 7.2vw, 30px);
    --title-lg: clamp(28px, 8.8vw, 40px);
    --title-md: clamp(18px, 5.1vw, 22px);
    --title-sm: clamp(16px, 4.7vw, 20px);
    --body-md: clamp(13px, 3.7vw, 16px);
    --body-sm: clamp(12px, 3.3vw, 14px);
    --glass-surface: rgba(255, 255, 255, 0.68);
    --glass-surface-strong: rgba(255, 255, 255, 0.84);
    --glass-surface-soft: rgba(255, 255, 255, 0.42);
    --glass-border: rgba(255, 255, 255, 0.72);
    --glass-line: rgba(216, 216, 216, 0.86);
    --glass-shadow: 0 18px 40px rgba(64, 88, 79, 0.14);
    --glass-shadow-soft: 0 10px 28px rgba(64, 88, 79, 0.1);
    --glass-blur: blur(18px) saturate(1.18);
    --brand-primary: #2dcd97;
    --brand-primary-soft: rgba(45, 205, 151, 0.16);
  }
`;

const ViewportFrame = styled.div`
  width: 100%;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 18% 12%, rgba(45, 205, 151, 0.16), transparent 34%),
    radial-gradient(circle at 82% 8%, rgba(122, 189, 255, 0.14), transparent 32%),
    linear-gradient(160deg, #f9fbfa 0%, #eef6f3 45%, #f7f7f7 100%);
`;

const MobileShell = styled.div`
  width: 100%;
  max-width: var(--app-max-width);
  min-height: 100dvh;
  background: rgba(245, 247, 246, 0.6);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  position: relative;
  overflow-x: hidden;
  box-shadow: 0 0 44px rgba(52, 74, 66, 0.16);

  @media (max-width: 430px) {
    box-shadow: none;
  }
`;

createRoot(document.getElementById('root')!).render(
  <>
    <GlobalStyle />
    <ViewportFrame>
      <MobileShell>
        <AuthInitializer>
          <RouterProvider router={router} />
        </AuthInitializer>
      </MobileShell>
    </ViewportFrame>
  </>,
);
