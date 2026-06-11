import styled, { keyframes } from 'styled-components';

const ThreadSkeleton = () => {
  return (
    <>
      <SkeletonHeader>
        <SkeletonTitle />
        <SkeletonDescription />
      </SkeletonHeader>

      <SkeletonPrompt />

      <SkeletonThreadArea>
        {[...Array(3)].map((_, i) => (
          <SkeletonMessage key={i}>
            <SkeletonMeta>
              <SkeletonNumber />
              <SkeletonAvatar />
              <SkeletonName />
            </SkeletonMeta>
            <SkeletonText />
            <SkeletonText $short />
          </SkeletonMessage>
        ))}
      </SkeletonThreadArea>
    </>
  );
};

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite;
  border-radius: 4px;
`;

const SkeletonHeader = styled.div`
  padding: 16px;
  gap: 8px;
  display: flex;
  flex-direction: column;
`;

const SkeletonTitle = styled(SkeletonBase)`
  height: 28px;
  width: 60%;
  margin-bottom: 8px;
`;

const SkeletonDescription = styled(SkeletonBase)`
  height: 16px;
  width: 40%;
`;

const SkeletonPrompt = styled(SkeletonBase)`
  height: 48px;
  margin: 16px;
  border-radius: 8px;
`;

const SkeletonThreadArea = styled.div`
  padding: 0 16px;
  gap: 16px;
  display: flex;
  flex-direction: column;
`;

const SkeletonMessage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`;

const SkeletonMeta = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SkeletonNumber = styled(SkeletonBase)`
  width: 40px;
  height: 16px;
`;

const SkeletonAvatar = styled(SkeletonBase)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`;

const SkeletonName = styled(SkeletonBase)`
  width: 100px;
  height: 16px;
  flex: 1;
`;

const SkeletonText = styled(SkeletonBase)<{ $short?: boolean }>`
  height: 14px;
  width: ${(props) => (props.$short ? '70%' : '100%')};
`;

export default ThreadSkeleton;
