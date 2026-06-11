import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePageLoadingOptions {
  onError?: (error: Error | unknown) => void;
  /** 스켈레톤 표시 전 대기(ms). 이보다 빨리 끝나면 스켈레톤을 아예 보여주지 않음 */
  showDelay?: number;
  /** 스켈레톤이 한 번 표시된 뒤 최소 유지(ms). 짧은 깜빡임 방지 */
  minDisplayTime?: number;
}

interface UsePageLoadingReturn {
  /** 실제 비동기 작업 진행 여부 (버튼 비활성화 등) */
  isLoading: boolean;
  /** anti-flicker가 적용된 UI 로딩 표시 여부 (스켈레톤용) */
  showLoadingUI: boolean;
  error: string | null;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: string | null) => void;
  executeAsync: <T,>(asyncFn: () => Promise<T>) => Promise<T | null>;
}

const DEFAULT_SHOW_DELAY = 200;
const DEFAULT_MIN_DISPLAY = 350;

export const usePageLoading = (options?: UsePageLoadingOptions): UsePageLoadingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingUI, setShowLoadingUI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = useRef<number | null>(null);

  // options를 ref로 안정화하여 deps 배열에서 제거
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const showDelay = options?.showDelay ?? DEFAULT_SHOW_DELAY;
  const minDisplayTime = options?.minDisplayTime ?? DEFAULT_MIN_DISPLAY;

  const clearTimers = useCallback(() => {
    if (showDelayTimerRef.current) {
      clearTimeout(showDelayTimerRef.current);
      showDelayTimerRef.current = null;
    }
    if (hideDelayTimerRef.current) {
      clearTimeout(hideDelayTimerRef.current);
      hideDelayTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const scheduleShowLoadingUI = useCallback(() => {
    showDelayTimerRef.current = setTimeout(() => {
      shownAtRef.current = Date.now();
      setShowLoadingUI(true);
      showDelayTimerRef.current = null;
    }, showDelay);
  }, [showDelay]);

  const scheduleHideLoadingUI = useCallback(() => {
    if (showDelayTimerRef.current) {
      clearTimeout(showDelayTimerRef.current);
      showDelayTimerRef.current = null;
    }

    if (!shownAtRef.current) {
      setShowLoadingUI(false);
      return;
    }

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    hideDelayTimerRef.current = setTimeout(() => {
      setShowLoadingUI(false);
      shownAtRef.current = null;
      hideDelayTimerRef.current = null;
    }, remaining);
  }, [minDisplayTime]);

  const startLoading = useCallback(() => {
    clearTimers();
    shownAtRef.current = null;
    setShowLoadingUI(false);
    setIsLoading(true);
    setError(null);
    scheduleShowLoadingUI();
  }, [clearTimers, scheduleShowLoadingUI]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    scheduleHideLoadingUI();
  }, [scheduleHideLoadingUI]);

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
  }, []);

  const executeAsync = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
      startLoading();

      try {
        const result = await asyncFn();
        stopLoading();
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.';
        setErrorState(errorMessage);
        stopLoading();
        optionsRef.current?.onError?.(err);
        return null;
      }
    },
    [startLoading, stopLoading, setErrorState],
  );

  return {
    isLoading,
    showLoadingUI,
    error,
    startLoading,
    stopLoading,
    setError: setErrorState,
    executeAsync,
  };
};
