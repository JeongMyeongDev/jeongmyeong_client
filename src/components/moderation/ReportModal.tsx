import { isAxiosError } from 'axios';
import { useState } from 'react';
import styled from 'styled-components';
import { moderationService } from '../../services/moderationService';
import type { ReportReason, ReportTargetType } from '../../types/moderation';

const REASON_OPTIONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'SPAM', label: '스팸' },
  { value: 'ABUSE', label: '욕설/괴롭힘' },
  { value: 'HATE', label: '혐오 표현' },
  { value: 'SEXUAL', label: '성적 콘텐츠' },
  { value: 'VIOLENCE', label: '폭력적 콘텐츠' },
  { value: 'MISINFORMATION', label: '허위 정보' },
  { value: 'OFF_TOPIC', label: '주제와 무관함' },
  { value: 'ETC', label: '기타' },
];

interface ReportModalProps {
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
  onSubmitted?: (message: string) => void;
}

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
  }
  return '신고 접수에 실패했습니다.';
};

const ReportModal = ({ targetType, targetId, onClose, onSubmitted }: ReportModalProps) => {
  const [reason, setReason] = useState<ReportReason>('ABUSE');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      const { data } = await moderationService.createReport({
        targetType,
        targetId,
        reason,
        detail: detail.trim() || undefined,
      });
      onSubmitted?.(data.message || '신고가 접수되었습니다.');
      onClose();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Backdrop>
      <Sheet>
        <Title>신고하기</Title>
        {error && <ErrorText>{error}</ErrorText>}
        <Field>
          <Label>신고 사유</Label>
          <Select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
            {REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>상세 내용</Label>
          <Textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="필요한 내용을 입력해 주세요."
            maxLength={1000}
          />
        </Field>
        <ActionRow>
          <SecondaryButton type="button" onClick={onClose}>
            취소
          </SecondaryButton>
          <PrimaryButton type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? '접수 중...' : '제출'}
          </PrimaryButton>
        </ActionRow>
      </Sheet>
    </Backdrop>
  );
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.28);
`;

const Sheet = styled.section`
  width: 100%;
  max-width: var(--app-max-width);
  border-radius: 18px 18px 0 0;
  background: #ffffff;
  padding: 18px var(--page-x) max(18px, env(safe-area-inset-bottom));
`;

const Title = styled.h2`
  margin: 0 0 12px;
  color: #2f3238;
  font-size: var(--title-sm);
`;

const ErrorText = styled.p`
  margin: -4px 0 12px;
  color: #f04444;
  font-size: 12px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
`;

const Label = styled.span`
  color: #7f7f7f;
  font-size: 12px;
  font-weight: 700;
`;

const Select = styled.select`
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #555555;
  padding: 0 12px;
`;

const Textarea = styled.textarea`
  min-height: 108px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #555555;
  line-height: 1.45;
  padding: 10px 12px;
  resize: vertical;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const SecondaryButton = styled.button`
  height: 38px;
  border: none;
  border-radius: 999px;
  background: #f0f0f0;
  color: #7f7f7f;
  font-size: 14px;
  font-weight: 700;
  padding: 0 16px;
`;

const PrimaryButton = styled(SecondaryButton)`
  background: #2dcd97;
  color: #ffffff;

  &:disabled {
    opacity: 0.6;
  }
`;

export default ReportModal;
