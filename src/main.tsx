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
    background: #f5f5f5;
    color: #1a1a1a;
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  button {
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
  }

  button:focus-visible,
  a:focus-visible,
  [role='button']:focus-visible {
    outline: 3px solid rgba(45, 205, 151, 0.45);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
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
  }
`;

const ViewportFrame = styled.div`
  width: 100%;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-x: hidden;
  background: #f5f5f5;
`;

const MobileShell = styled.div`
  width: 100%;
  max-width: var(--app-max-width);
  min-height: 100dvh;
  background: #f5f5f5;
  position: relative;
  overflow-x: hidden;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.12);

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
