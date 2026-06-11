import styled, { css, keyframes } from 'styled-components';

export const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

export const skeletonStyle = css`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite;
`;

export const SkeletonBlock = styled.div<{
  $width?: string;
  $height?: string;
  $radius?: string;
}>`
  ${skeletonStyle}
  width: ${({ $width }) => $width ?? '100%'};
  height: ${({ $height }) => $height ?? '14px'};
  border-radius: ${({ $radius }) => $radius ?? '4px'};
  flex-shrink: 0;
`;

export const SkeletonCircle = styled(SkeletonBlock)`
  border-radius: 50%;
`;
