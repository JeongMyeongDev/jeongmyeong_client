import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AuthRoute from '../components/common/AuthRoute';
import ProtectedRoute from '../components/common/ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import SignUpPage from '../pages/auth/SignUpPage';
import MainPage from '../pages/main/MainPage';
import DebatePage from '../pages/debate/DebatePage';
import DebateCreatePage from '../pages/debate/DebateCreatePage';
import DebateArchivePage from '../pages/debate/DebateArchivePage';
import DebateInfoPage from '../pages/debate/DebateInfoPage';
import DebateThreadPage from '../pages/debate/DebateThreadPage';
import MessagePage from '../pages/message/MessagePage';
import ProfilePage from '../pages/profile/ProfilePage';
import NotificationPage from '../pages/notification/NotificationPage';
import MyDebatesPage from '../pages/myDebates/MyDebatesPage';

const router = createBrowserRouter([
  {
    element: <AuthRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignUpPage /> },
    ],
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <MainPage /> },
          { path: 'debate-room', element: <DebatePage /> },
          { path: 'debate/:id/info', element: <DebateInfoPage /> },
          { path: 'debate/:id', element: <DebateThreadPage /> },
          { path: 'debate/create', element: <DebateCreatePage /> },
          { path: 'debate/archive', element: <DebateArchivePage /> },
          { path: 'message', element: <MessagePage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'notifications', element: <NotificationPage /> },
          { path: 'my-debates', element: <MyDebatesPage /> },
        ],
      },
    ],
  },
]);

export default router;
