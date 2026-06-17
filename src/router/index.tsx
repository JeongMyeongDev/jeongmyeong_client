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
import NotificationSettingsPage from '../pages/notification/NotificationSettingsPage';
import MyDebatesPage from '../pages/myDebates/MyDebatesPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import MySanctionsPage from '../pages/sanctions/MySanctionsPage';
import { ROUTES } from '../constants/routes';

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
    path: ROUTES.HOME,
    element: <App />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <MainPage /> },
          { path: ROUTES.DEBATE_ROOM.slice(1), element: <DebatePage /> },
          { path: ROUTES.ONBOARDING.slice(1), element: <OnboardingPage /> },
          { path: ROUTES.DEBATE_INFO.slice(1), element: <DebateInfoPage /> },
          { path: ROUTES.DEBATE_DETAIL.slice(1), element: <DebateThreadPage /> },
          { path: ROUTES.DEBATE_CREATE.slice(1), element: <DebateCreatePage /> },
          { path: ROUTES.DEBATE_ARCHIVE.slice(1), element: <DebateArchivePage /> },
          { path: ROUTES.DEFINITIONS.slice(1), element: <DefinitionSearchPage /> },
          { path: 'message', element: <MessagePage /> },
          { path: ROUTES.PROFILE.slice(1), element: <ProfilePage /> },
          { path: ROUTES.NOTIFICATIONS.slice(1), element: <NotificationPage /> },
          { path: ROUTES.NOTIFICATION_SETTINGS.slice(1), element: <NotificationSettingsPage /> },
          { path: ROUTES.MY_DEBATES.slice(1), element: <MyDebatesPage /> },
          { path: ROUTES.MY_SANCTIONS.slice(1), element: <MySanctionsPage /> },
          { path: ROUTES.ADMIN_REPORTS.slice(1), element: <AdminReportsPage /> },
        ],
      },
    ],
  },
]);

export default router;
