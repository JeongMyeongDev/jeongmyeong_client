import type { ReactNode } from 'react';

interface LoadingContentProps {
  isLoading: boolean;
  showLoadingUI: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

/** anti-flicker: 콘텐츠 영역에만 스켈레톤 표시, 페이지 레이아웃은 유지 */
export const LoadingContent = ({
  isLoading,
  showLoadingUI,
  skeleton,
  children,
}: LoadingContentProps) => {
  if (showLoadingUI) return <>{skeleton}</>;
  if (isLoading) return null;
  return <>{children}</>;
};
