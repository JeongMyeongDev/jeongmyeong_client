import styled from 'styled-components';
import { SkeletonBlock, SkeletonCircle } from './Skeleton';

const repeat = (count: number) => Array.from({ length: count }, (_, i) => i);

export const FeaturedCardSkeleton = () => (
  <FeaturedCardWrap>
    <SkeletonBlock $height="22px" $width="70%" style={{ margin: '4px auto 10px' }} />
    <SkeletonBlock $height="14px" $width="85%" style={{ margin: '0 auto 8px' }} />
    <SkeletonBlock $height="14px" $width="60%" style={{ margin: '0 auto 18px' }} />
    <MetaRow>
      <AuthorRow>
        <SkeletonCircle $width="36px" $height="36px" />
        <SkeletonBlock $height="14px" $width="72px" />
      </AuthorRow>
      <SkeletonBlock $height="14px" $width="48px" />
    </MetaRow>
    <TagRow>
      <SkeletonBlock $height="32px" $width="78px" $radius="999px" />
      <SkeletonBlock $height="32px" $width="96px" $radius="999px" />
    </TagRow>
  </FeaturedCardWrap>
);

export const DebateListItemSkeleton = ({ count = 4 }: { count?: number }) => (
  <>
    {repeat(count).map((i) => (
      <ListItemWrap key={i}>
        <LeftCol>
          <SkeletonBlock $height="22px" $width="67px" $radius="999px" />
          <SkeletonBlock $height="18px" $width="75%" />
          <SkeletonBlock $height="14px" $width="90%" />
          <SkeletonBlock $height="14px" $width="55%" />
        </LeftCol>
        <SkeletonCircle $width="60px" $height="60px" />
      </ListItemWrap>
    ))}
  </>
);

export const DebateRoomCardSkeleton = ({ count = 4 }: { count?: number }) => (
  <>
    {repeat(count).map((i) => (
      <RoomCardWrap key={i}>
        <TopRow>
          <SkeletonBlock $height="24px" $width="60px" $radius="999px" />
          <SkeletonCircle $width="28px" $height="28px" />
        </TopRow>
        <SkeletonBlock $height="18px" $width="80%" style={{ marginBottom: 8 }} />
        <SkeletonBlock $height="14px" $width="100%" />
        <SkeletonBlock $height="14px" $width="70%" />
      </RoomCardWrap>
    ))}
  </>
);

export const NotificationListSkeleton = ({ count = 5 }: { count?: number }) => (
  <>
    {repeat(count).map((i) => (
      <NotificationItemWrap key={i}>
        <SkeletonCircle $width="40px" $height="40px" />
        <NotificationBody>
          <SkeletonBlock $height="14px" $width="80px" />
          <SkeletonBlock $height="13px" $width="90%" style={{ marginTop: 6 }} />
          <SkeletonBlock $height="12px" $width="60%" style={{ marginTop: 6 }} />
          <SkeletonBlock $height="11px" $width="48px" style={{ marginTop: 6 }} />
        </NotificationBody>
      </NotificationItemWrap>
    ))}
  </>
);

export const DefinitionListSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {repeat(count).map((i) => (
      <DefinitionCardWrap key={i}>
        <SkeletonBlock $height="16px" $width="40%" style={{ marginBottom: 10 }} />
        <SkeletonBlock $height="14px" $width="100%" />
        <SkeletonBlock $height="14px" $width="92%" style={{ marginTop: 6 }} />
        <SkeletonBlock $height="14px" $width="75%" style={{ marginTop: 6 }} />
      </DefinitionCardWrap>
    ))}
  </>
);

export const MessagePageSkeleton = () => (
  <>
    <TabRow>
      <SkeletonBlock $height="32px" $width="88px" $radius="999px" />
      <SkeletonBlock $height="32px" $width="96px" $radius="999px" />
      <SkeletonBlock $height="32px" $width="72px" $radius="999px" />
    </TabRow>
    <ChatPanelWrap>
      <SkeletonBlock $height="18px" $width="45%" style={{ marginBottom: 8 }} />
      <SkeletonBlock $height="13px" $width="65%" style={{ marginBottom: 16 }} />
      <MessageArea>
        <SkeletonBlock $height="56px" $width="72%" $radius="16px" />
        <SkeletonBlock $height="48px" $width="58%" $radius="16px" style={{ alignSelf: 'flex-end' }} />
        <SkeletonBlock $height="64px" $width="76%" $radius="16px" />
      </MessageArea>
      <ComposerRow>
        <SkeletonBlock $height="42px" $width="100%" $radius="999px" />
        <SkeletonBlock $height="42px" $width="64px" $radius="999px" />
      </ComposerRow>
    </ChatPanelWrap>
  </>
);

export const DebateInfoSkeleton = () => (
  <>
    <SkeletonBlock $height="40px" $width="80%" style={{ margin: '0 auto 12px' }} />
    <SkeletonBlock $height="16px" $width="90%" style={{ margin: '0 auto 8px' }} />
    <SkeletonBlock $height="16px" $width="70%" style={{ margin: '0 auto 22px' }} />
    <SkeletonBlock $height="48px" $width="100%" $radius="999px" style={{ marginBottom: 14 }} />
    <InfoCardWrap>
      <SkeletonBlock $height="14px" $width="64px" $radius="999px" style={{ marginBottom: 12 }} />
      <AuthorRow>
        <SkeletonCircle $width="36px" $height="36px" />
        <SkeletonBlock $height="14px" $width="88px" />
      </AuthorRow>
      <SkeletonBlock $height="14px" $width="55%" style={{ marginTop: 12 }} />
      <SkeletonBlock $height="14px" $width="48%" style={{ marginTop: 8 }} />
      <SkeletonBlock $height="14px" $width="42%" style={{ marginTop: 8 }} />
    </InfoCardWrap>
    <InfoCardWrap>
      <SkeletonBlock $height="16px" $width="88px" style={{ marginBottom: 12 }} />
      {repeat(3).map((i) => (
        <AuthorRow key={i} style={{ marginBottom: 10 }}>
          <SkeletonCircle $width="32px" $height="32px" />
          <SkeletonBlock $height="14px" $width="72px" />
        </AuthorRow>
      ))}
    </InfoCardWrap>
  </>
);

const FeaturedCardWrap = styled.div`
  width: min(330px, calc(100vw - var(--page-x) - var(--page-x)));
  min-width: min(330px, calc(100vw - var(--page-x) - var(--page-x)));
  min-height: clamp(220px, 57.7vw, 248px);
  background: #fff;
  border-radius: var(--card-radius);
  padding: clamp(18px, 5.1vw, 22px) clamp(16px, 4.7vw, 20px) clamp(16px, 4.2vw, 18px);
  box-sizing: border-box;
  position: relative;
  scroll-snap-align: start;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 clamp(16px, 6.9vw, 29.5px) clamp(14px, 4.2vw, 18px);
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TagRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  position: absolute;
  left: clamp(24px, 11.5vw, 49.5px);
  right: clamp(24px, 11.5vw, 49.5px);
  bottom: clamp(36px, 11.1vw, 48px);
`;

const ListItemWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(330px, calc(100vw - var(--page-x) - var(--page-x)));
  min-height: clamp(126px, 33.5vw, 144px);
  background: #ffffff;
  border-radius: var(--card-radius);
  padding: clamp(16px, 4.2vw, 18px) clamp(14px, 3.7vw, 16px);
  margin: 0 auto;
  box-sizing: border-box;
  gap: 12px;
`;

const LeftCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
`;

const RoomCardWrap = styled.article`
  background: #ffffff;
  border-radius: clamp(18px, 4.7vw, 20px);
  padding: clamp(10px, 2.8vw, 12px) clamp(12px, 3.3vw, 14px) clamp(12px, 3.3vw, 14px);
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const NotificationItemWrap = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
`;

const NotificationBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const DefinitionCardWrap = styled.article`
  border-radius: var(--card-radius);
  background: #ffffff;
  padding: 14px;
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const ChatPanelWrap = styled.section`
  background: #efefef;
  border-radius: var(--card-radius);
  padding: clamp(12px, 3.3vw, 14px);
  min-height: min(520px, calc(100dvh - 190px));
  display: flex;
  flex-direction: column;
`;

const MessageArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 2px;
`;

const ComposerRow = styled.div`
  margin-top: 10px;
  display: flex;
  gap: 8px;
`;

const InfoCardWrap = styled.div`
  background: #ffffff;
  border-radius: var(--card-radius);
  padding: 16px;
  margin-bottom: 12px;
`;
