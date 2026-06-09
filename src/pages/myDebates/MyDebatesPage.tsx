import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { debateService } from '../../services/debateService';
import type { Debate } from '../../types/debate';

const STATUS_LABEL: Record<string, string> = {
  OPEN: '진행중',
  CLOSED: '종료',
  ARCHIVED: '보관',
};

const MyDebatesPage = () => {
  const navigate = useNavigate();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await debateService.getMyDebates({ sort: 'createdAt', direction: 'desc', limit: 50 });
        setDebates(Array.isArray(data.debates) ? data.debates : []);
      } catch {
        setError('내 토론을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <Wrapper>
      <TopBar>
        <BackButton type="button" onClick={() => navigate(-1)} aria-label="뒤로">
          <BackIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="20" y1="12" x2="4" y2="12" />
            <polyline points="10 6 4 12 10 18" />
          </BackIcon>
        </BackButton>
        <TopTitle>내 토론</TopTitle>
      </TopBar>

      {loading && <CenterText>불러오는 중...</CenterText>}
      {error && <CenterText $error>{error}</CenterText>}
      {!loading && !error && debates.length === 0 && (
        <CenterText>만든 토론이 없습니다.</CenterText>
      )}

      <List>
        {debates.map((debate) => (
          <Card key={debate.id} onClick={() => navigate(`/debate/${debate.id}`)}>
            <CardTop>
              <StatusBadge $status={debate.status}>
                {STATUS_LABEL[debate.status] ?? debate.status}
              </StatusBadge>
            </CardTop>
            <CardTitle>{debate.title}</CardTitle>
            <CardDesc>{debate.description}</CardDesc>
            {debate.tagMaps && debate.tagMaps.length > 0 && (
              <CardTag>#{debate.tagMaps[0].tag.name}</CardTag>
            )}
          </Card>
        ))}
      </List>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 32px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  gap: 8px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackButton = styled.button`
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #353535;
  flex-shrink: 0;
`;

const BackIcon = styled.svg`
  width: 24px;
  height: 24px;
`;

const TopTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
`;

const CenterText = styled.p<{ $error?: boolean }>`
  text-align: center;
  color: ${({ $error }) => ($error ? '#f04444' : '#999')};
  font-size: 14px;
  margin-top: 60px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 16px;
  cursor: pointer;
`;

const CardTop = styled.div`
  margin-bottom: 8px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1.2px solid ${({ $status }) => ($status === 'OPEN' ? '#2dcd97' : '#aaa')};
  color: ${({ $status }) => ($status === 'OPEN' ? '#2dcd97' : '#999')};
  font-size: 11px;
  font-weight: 700;
`;

const CardTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #2f3238;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardDesc = styled.p`
  margin: 0 0 8px;
  font-size: 13px;
  color: #8f8f8f;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const CardTag = styled.span`
  font-size: 12px;
  color: #b0b0b0;
`;

export default MyDebatesPage;
