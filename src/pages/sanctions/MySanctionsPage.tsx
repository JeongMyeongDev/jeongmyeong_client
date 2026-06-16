import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { moderationService } from '../../services/moderationService';
import type { Sanction } from '../../types/moderation';

const SANCTION_TYPE_LABEL: Record<Sanction['type'], string> = {
  WARNING: 'Warning',
  WRITE_RESTRICTION: 'Write restriction',
  DEBATE_CREATE_RESTRICTION: 'Debate creation restriction',
  TEMP_SUSPENSION: 'Temporary suspension',
  PERMANENT_SUSPENSION: 'Permanent suspension',
};

const SANCTION_STATUS_LABEL: Record<Sanction['status'], string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'No end date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
  }

  return 'Failed to load sanction history.';
};

const MySanctionsPage = () => {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchSanctions = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data } = await moderationService.getMySanctions();
      setSanctions(data.sanctions);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSanctions();
  }, []);

  const handleAcknowledge = async (sanctionId: string) => {
    if (acknowledgingId) return;

    setAcknowledgingId(sanctionId);
    setErrorMessage('');

    try {
      await moderationService.acknowledgeSanction(sanctionId);
      await fetchSanctions();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <Wrapper>
      <TopSpacing />
      <Header>
        <Title>Sanction history</Title>
        <Subtitle>Review account sanctions and confirm that you have read them.</Subtitle>
      </Header>

      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      {isLoading && <StateText>Loading sanctions...</StateText>}

      {!isLoading && sanctions.length === 0 && <EmptyState>No sanction history found.</EmptyState>}

      <List>
        {sanctions.map((sanction) => {
          const acknowledgedAt = sanction.acknowledgements?.[0]?.acknowledgedAt;
          const isAcknowledged = Boolean(acknowledgedAt);

          return (
            <SanctionItem key={sanction.id}>
              <ItemHeader>
                <TypeText>{SANCTION_TYPE_LABEL[sanction.type]}</TypeText>
                <StatusBadge $status={sanction.status}>{SANCTION_STATUS_LABEL[sanction.status]}</StatusBadge>
              </ItemHeader>

              <Reason>{sanction.reason}</Reason>

              <DetailGrid>
                <DetailLabel>Start date</DetailLabel>
                <DetailValue>{formatDateTime(sanction.startsAt)}</DetailValue>
                <DetailLabel>End date</DetailLabel>
                <DetailValue>{formatDateTime(sanction.endsAt)}</DetailValue>
                <DetailLabel>Acknowledgement</DetailLabel>
                <DetailValue>
                  {isAcknowledged ? `Acknowledged at ${formatDateTime(acknowledgedAt)}` : 'Not acknowledged'}
                </DetailValue>
              </DetailGrid>

              {!isAcknowledged && (
                <AcknowledgeButton
                  type="button"
                  onClick={() => void handleAcknowledge(sanction.id)}
                  disabled={acknowledgingId === sanction.id}
                >
                  {acknowledgingId === sanction.id ? 'Acknowledging...' : 'Acknowledge'}
                </AcknowledgeButton>
              )}
            </SanctionItem>
          );
        })}
      </List>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: 0 var(--page-x) var(--page-bottom);
`;

const TopSpacing = styled.div`
  height: var(--page-top);
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
`;

const Title = styled.h1`
  margin: 0;
  color: #202329;
  font-size: clamp(24px, 7vw, 32px);
  line-height: 1.2;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: var(--body-sm);
  line-height: 1.5;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const SanctionItem = styled.article`
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #ffffff;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  padding: clamp(16px, 4.6vw, 20px);
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const TypeText = styled.h2`
  margin: 0;
  color: #202329;
  font-size: clamp(17px, 4.6vw, 20px);
  line-height: 1.35;
`;

const StatusBadge = styled.span<{ $status: Sanction['status'] }>`
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 5px 10px;
  background: ${({ $status }) =>
    $status === 'ACTIVE' ? '#fff4e5' : $status === 'REVOKED' ? '#eef2f7' : '#e9f8ef'};
  color: ${({ $status }) =>
    $status === 'ACTIVE' ? '#b54708' : $status === 'REVOKED' ? '#475467' : '#027a48'};
  font-size: 12px;
  font-weight: 700;
`;

const Reason = styled.p`
  margin: 0;
  color: #344054;
  font-size: var(--body-sm);
  line-height: 1.55;
`;

const DetailGrid = styled.dl`
  display: grid;
  grid-template-columns: minmax(104px, 36%) 1fr;
  gap: 8px 12px;
  margin: 0;
`;

const DetailLabel = styled.dt`
  color: #667085;
  font-size: 13px;
  font-weight: 700;
`;

const DetailValue = styled.dd`
  margin: 0;
  min-width: 0;
  color: #202329;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

const AcknowledgeButton = styled.button`
  align-self: flex-start;
  min-height: 40px;
  border: none;
  border-radius: 999px;
  background: #4dc891;
  color: #ffffff;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const StateText = styled.p`
  margin: 0 0 14px;
  color: #667085;
  font-size: var(--body-sm);
`;

const EmptyState = styled.p`
  margin: 0;
  background: #ffffff;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  color: #667085;
  font-size: var(--body-sm);
  padding: 18px;
  text-align: center;
`;

const ErrorText = styled.p`
  margin: 0 0 14px;
  color: #d92d20;
  font-size: var(--body-sm);
  line-height: 1.45;
`;

export default MySanctionsPage;
