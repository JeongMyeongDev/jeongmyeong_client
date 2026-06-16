import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useModerationStore } from '../../stores/moderationStore';
import type { Sanction, SanctionType } from '../../types/moderation';

const SANCTION_LABEL: Record<SanctionType, string> = {
  WARNING: '경고',
  WRITE_RESTRICTION: '작성 제한',
  DEBATE_CREATE_RESTRICTION: '토론 생성 제한',
  TEMP_SUSPENSION: '임시 정지',
  PERMANENT_SUSPENSION: '영구 정지',
};

const formatPeriod = (sanction: Sanction) => {
  const start = new Date(sanction.startsAt).toLocaleString('ko-KR');
  const end = sanction.endsAt ? new Date(sanction.endsAt).toLocaleString('ko-KR') : '제한 없음';
  return `${start} ~ ${end}`;
};

const SanctionNotice = () => {
  const { activeSanctions, acknowledgeSanction } = useModerationStore();
  const [error, setError] = useState('');
  const unacknowledged = useMemo(
    () => activeSanctions.find((sanction) => !sanction.acknowledgements?.length),
    [activeSanctions],
  );
  const mostSevere = activeSanctions[0];

  const handleAcknowledge = async (sanctionId: string) => {
    setError('');
    try {
      await acknowledgeSanction(sanctionId);
    } catch {
      setError('제재 확인 처리에 실패했습니다.');
    }
  };

  if (activeSanctions.length === 0) return null;

  return (
    <>
      <Banner>
        <strong>{SANCTION_LABEL[mostSevere.type]}</strong>
        <span>{mostSevere.reason}</span>
      </Banner>
      {unacknowledged && (
        <Backdrop>
          <Modal>
            <Title>제재 내역</Title>
            <InfoRow>
              <span>유형</span>
              <strong>{SANCTION_LABEL[unacknowledged.type]}</strong>
            </InfoRow>
            <InfoRow>
              <span>기간</span>
              <strong>{formatPeriod(unacknowledged)}</strong>
            </InfoRow>
            <Reason>{unacknowledged.reason}</Reason>
            {error && <ErrorText>{error}</ErrorText>}
            <PrimaryButton type="button" onClick={() => void handleAcknowledge(unacknowledged.id)}>
              제재 내역을 확인했습니다.
            </PrimaryButton>
          </Modal>
        </Backdrop>
      )}
    </>
  );
};

const Banner = styled.div`
  position: sticky;
  top: 0;
  z-index: 80;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px var(--page-x);
  background: #fff4e8;
  color: #9b5518;
  font-size: 12px;
  line-height: 1.35;
  word-break: keep-all;
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.34);
`;

const Modal = styled.section`
  width: min(100%, 360px);
  border-radius: 12px;
  background: #ffffff;
  padding: 18px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
`;

const Title = styled.h2`
  margin: 0 0 14px;
  color: #2f3238;
  font-size: var(--title-sm);
`;

const InfoRow = styled.p`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 8px;
  color: #8f8f8f;
  font-size: 13px;

  strong {
    color: #555555;
    text-align: right;
  }
`;

const Reason = styled.p`
  margin: 12px 0;
  border-radius: 8px;
  background: #f7f7f7;
  color: #555555;
  font-size: 13px;
  line-height: 1.45;
  padding: 10px;
  white-space: pre-wrap;
`;

const ErrorText = styled.p`
  margin: 0 0 8px;
  color: #f04444;
  font-size: 12px;
`;

const PrimaryButton = styled.button`
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-weight: 700;
`;

export default SanctionNotice;
