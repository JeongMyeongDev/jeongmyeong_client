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
    background: #d9d9d9;
    color: #1a1a1a;
    -webkit-font-smoothing: antialiased;
  }

  button {
    cursor: pointer;
  }
`;

const MobileShell = styled.div`
  width: 390px;
  min-height: 100dvh;
  margin: 0 auto;
  background: #f5f5f5;
  position: relative;
  overflow-x: hidden;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.12);

  @media (max-width: 390px) {
    width: 100%;
    box-shadow: none;
  }
`;

createRoot(document.getElementById('root')!).render(
  <>
    <GlobalStyle />
    <MobileShell>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </MobileShell>
  </>,
);
