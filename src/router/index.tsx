import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AuthRoute from '../components/common/AuthRoute';
import ProtectedRoute from '../components/common/ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import SignUpPage from '../pages/auth/SignUpPage';
import SuspendedAccountPage from '../pages/auth/SuspendedAccountPage';
import MainPage from '../pages/main/MainPage';
import DebatePage from '../pages/debate/DebatePage';
import DebateCreatePage from '../pages/debate/DebateCreatePage';
import DebateArchivePage from '../pages/debate/DebateArchivePage';
import DebateInfoPage from '../pages/debate/DebateInfoPage';
import DebateThreadPage from '../pages/debate/DebateThreadPage';
import OnboardingPage from '../pages/onboarding/OnboardingPage';
import DefinitionSearchPage from '../pages/definition/DefinitionSearchPage';
import MessagePage from '../pages/message/MessagePage';
import ProfilePage from '../pages/profile/ProfilePage';
import NotificationPage from '../pages/notification/NotificationPage';
import MyDebatesPage from '../pages/myDebates/MyDebatesPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import MySanctionsPage from '../pages/sanctions/MySanctionsPage';

const router = createBrowserRouter([
  {
    element: <AuthRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignUpPage /> },
      { path: '/account-suspended', element: <SuspendedAccountPage /> },
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
          { path: 'onboarding', element: <OnboardingPage /> },
          { path: 'debate/:id/info', element: <DebateInfoPage /> },
          { path: 'debate/:id', element: <DebateThreadPage /> },
          { path: 'debate/create', element: <DebateCreatePage /> },
          { path: 'debate/archive', element: <DebateArchivePage /> },
          { path: 'definitions', element: <DefinitionSearchPage /> },
          { path: 'message', element: <MessagePage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'notifications', element: <NotificationPage /> },
          { path: 'my-debates', element: <MyDebatesPage /> },
          { path: 'my-sanctions', element: <MySanctionsPage /> },
          { path: 'admin/reports', element: <AdminReportsPage /> },
        ],
      },
    ],
  },
]);

export default router;
