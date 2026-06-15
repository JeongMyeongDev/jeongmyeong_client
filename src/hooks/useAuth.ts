import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, clearAuth, setInitialized } = useAuthStore();

  const signup = useCallback(async (
    email: string,
    nickname: string,
    password: string,
    passwordConfirm = password,
  ) => {
    await authService.signup({ email, nickname, password, passwordConfirm });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    setInitialized();
    return data.user;
  }, [setInitialized, setUser]);

  const googleLogin = useCallback(async (idToken: string) => {
    const { data } = await authService.googleLogin({ idToken });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    setInitialized();
    return data.user;
  }, [setInitialized, setUser]);

  const googleSignup = useCallback(async (
    idToken: string,
    nickname: string,
    password: string,
    passwordConfirm: string,
  ) => {
    const { data } = await authService.googleSignup({
      idToken,
      nickname,
      password,
      passwordConfirm,
    });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    setInitialized();
    return data.user;
  }, [setInitialized, setUser]);

  const completeOnboarding = useCallback(async () => {
    const { data } = await userService.completeOnboarding();
    setUser(data.user);
    return data.user;
  }, [setUser]);

  const logout = useCallback(async () => {
    await authService.logout();
    localStorage.removeItem('accessToken');
    clearAuth();
  }, [clearAuth]);

  return {
    user,
    isAuthenticated,
    signup,
    login,
    googleLogin,
    googleSignup,
    completeOnboarding,
    logout,
  };
};
