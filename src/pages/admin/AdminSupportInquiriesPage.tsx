import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { supportService } from '../../services/supportService';
import { useAuthStore } from '../../stores/authStore';
import type {
  SupportInquiry,
  SupportInquiryCategory,
  SupportInquiryStatus,
} from '../../types/supportInquiry';

const CATEGORY_LABEL_MAP: Record<SupportInquiryCategory, string> = {
  BUG: '오류 신고',
  ACCOUNT: '계정 문제',
  DEBATE: '토론/합의 관련',
  REPORT: '신고/제재 관련',
  ETC: '기타',
};

const STATUS_OPTIONS: Array<{ value: SupportInquiryStatus; label: string }> = [
  { value: 'PENDING', label: '접수됨' },
  { value: 'IN_PROGRESS', label: '처리 중' },
  { value: 'RESOLVED', label: '답변 완료' },
  { value: 'CLOSED', label: '종료됨' },
];

const STATUS_LABEL_MAP: Record<SupportInquiryStatus, string> = {
  PENDING: '접수됨',
  IN_PROGRESS: '처리 중',
  RESOLVED: '답변 완료',
  CLOSED: '종료됨',
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
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
  return '문의 처리에 실패했습니다.';
};

const AdminSupportInquiriesPage = () => {
  const { user } = useAuthStore();
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<SupportInquiry | null>(null);
  const [status, setStatus] = useState<SupportInquiryStatus>('PENDING');
  const [adminReply, setAdminReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const summary = useMemo(
    () => ({
      total: inquiries.length,
      pending: inquiries.filter((inquiry) => inquiry.status === 'PENDING').length,
      inProgress: inquiries.filter((inquiry) => inquiry.status === 'IN_PROGRESS').length,
      resolved: inquiries.filter((inquiry) => inquiry.status === 'RESOLVED').length,
    }),
    [inquiries],
  );

  const loadInquiries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await supportService.getAdminInquiries();
      setInquiries(data.inquiries);
      if (selectedInquiry) {
        const refreshed = data.inquiries.find((inquiry) => inquiry.id === selectedInquiry.id);
        if (refreshed) setSelectedInquiry(refreshed);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInquiries();
  }, []);

  const handleSelect = (inquiry: SupportInquiry) => {
    setSelectedInquiry(inquiry);
    setStatus(inquiry.status);
    setAdminReply(inquiry.adminReply ?? '');
    setMessage('');
    setError('');
  };

  const handleUpdate = async () => {
    if (!selectedInquiry || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const { data } = await supportService.updateAdminInquiry(selectedInquiry.id, {
        status,
        adminReply: adminReply.trim() || undefined,
      });
      setSelectedInquiry(data.inquiry);
      setMessage('문의 처리 내용이 저장되었습니다.');
      await loadInquiries();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Page>
        <AccessNotice>관리자만 문의를 처리할 수 있습니다.</AccessNotice>
      </Page>
    );
  }

  return (
    <Page>
      <Shell>
        <Header>
          <HeaderCopy>
            <Eyebrow>Admin Console</Eyebrow>
            <Title>문의 관리</Title>
            <Subtitle>사용자 문의를 확인하고 처리 상태와 답변을 저장합니다.</Subtitle>
          </HeaderCopy>
          <RefreshButton type="button" onClick={() => void loadInquiries()} disabled={isLoading}>
            {isLoading ? '불러오는 중' : '새로고침'}
          </RefreshButton>
        </Header>

        <SummaryGrid>
          <SummaryCard>
            <SummaryLabel>전체 문의</SummaryLabel>
            <SummaryValue>{summary.total}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>접수됨</SummaryLabel>
            <SummaryValue>{summary.pending}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>처리 중</SummaryLabel>
            <SummaryValue>{summary.inProgress}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>답변 완료</SummaryLabel>
            <SummaryValue>{summary.resolved}</SummaryValue>
          </SummaryCard>
        </SummaryGrid>

        {error && <ErrorText>{error}</ErrorText>}
        {message && <SuccessText>{message}</SuccessText>}

        <Workspace>
          <ListPanel>
            <PanelHeader>
              <PanelTitle>문의 목록</PanelTitle>
              <PanelHint>최신순</PanelHint>
            </PanelHeader>
            <InquiryList>
              {inquiries.map((inquiry) => (
                <InquiryItem
                  key={inquiry.id}
                  type="button"
                  data-active={selectedInquiry?.id === inquiry.id}
                  onClick={() => handleSelect(inquiry)}
                >
                  <InquiryItemTop>
                    <InquiryTitle>{inquiry.title}</InquiryTitle>
                    <StatusBadge $status={inquiry.status}>{STATUS_LABEL_MAP[inquiry.status]}</StatusBadge>
                  </InquiryItemTop>
                  <InquiryMeta>
                    {CATEGORY_LABEL_MAP[inquiry.category]} · {inquiry.user?.nickname ?? '사용자'}
                  </InquiryMeta>
                  <InquiryMeta>{formatDateTime(inquiry.createdAt)}</InquiryMeta>
                </InquiryItem>
              ))}
              {!isLoading && inquiries.length === 0 && (
                <EmptyState>접수된 문의가 없습니다.</EmptyState>
              )}
            </InquiryList>
          </ListPanel>

          <DetailPanel>
            {selectedInquiry ? (
              <>
                <PanelHeader>
                  <div>
                    <PanelTitle>{selectedInquiry.title}</PanelTitle>
                    <PanelHint>{selectedInquiry.id}</PanelHint>
                  </div>
                  <StatusBadge $status={selectedInquiry.status}>
                    {STATUS_LABEL_MAP[selectedInquiry.status]}
                  </StatusBadge>
                </PanelHeader>

                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>문의자</InfoLabel>
                    <InfoValue>
                      {selectedInquiry.user?.nickname ?? '사용자'}
                      {selectedInquiry.user?.email ? ` · ${selectedInquiry.user.email}` : ''}
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>문의 유형</InfoLabel>
                    <InfoValue>{CATEGORY_LABEL_MAP[selectedInquiry.category]}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>접수 일시</InfoLabel>
                    <InfoValue>{formatDateTime(selectedInquiry.createdAt)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>해결 일시</InfoLabel>
                    <InfoValue>{formatDateTime(selectedInquiry.resolvedAt)}</InfoValue>
                  </InfoItem>
                </InfoGrid>

                <Section>
                  <SectionTitle>문의 내용</SectionTitle>
                  <Quote>{selectedInquiry.content}</Quote>
                </Section>
              </>
            ) : (
              <LargeEmptyState>왼쪽 목록에서 처리할 문의를 선택해 주세요.</LargeEmptyState>
            )}
          </DetailPanel>

          <ActionPanel>
            <PanelHeader>
              <PanelTitle>처리 작업</PanelTitle>
              <PanelHint>상태와 답변</PanelHint>
            </PanelHeader>

            {selectedInquiry ? (
              <>
                <FieldGroup>
                  <FieldLabel htmlFor="support-status">처리 상태</FieldLabel>
                  <Select
                    id="support-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as SupportInquiryStatus)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="admin-reply">관리자 답변</FieldLabel>
                  <Textarea
                    id="admin-reply"
                    value={adminReply}
                    maxLength={2000}
                    placeholder="사용자에게 표시할 답변을 입력해 주세요."
                    onChange={(event) => setAdminReply(event.target.value)}
                  />
                  <HelperText>{adminReply.length}/2000</HelperText>
                </FieldGroup>

                <PrimaryButton type="button" onClick={() => void handleUpdate()} disabled={isSubmitting}>
                  {isSubmitting ? '저장 중' : '처리 내용 저장'}
                </PrimaryButton>
              </>
            ) : (
              <EmptyState>문의를 선택하면 처리 도구가 표시됩니다.</EmptyState>
            )}
          </ActionPanel>
        </Workspace>
      </Shell>
    </Page>
  );
};

const Page = styled.div`
  position: fixed;
  inset: 0;
  z-index: 500;
  min-width: 1024px;
  overflow: auto;
  background: #f3f5f7;
  color: #1f2937;
  text-align: left;
`;

const Shell = styled.div`
  width: min(1280px, calc(100vw - 48px));
  min-height: 100dvh;
  margin: 0 auto;
  padding: 28px 0 32px;
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Eyebrow = styled.span`
  color: #667085;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  color: #111827;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #667085;
  font-size: 14px;
  line-height: 1.5;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
`;

const SummaryCard = styled.div`
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px 16px;
`;

const SummaryLabel = styled.span`
  display: block;
  color: #667085;
  font-size: 12px;
  font-weight: 700;
`;

const SummaryValue = styled.strong`
  display: block;
  margin-top: 4px;
  color: #111827;
  font-size: 26px;
  line-height: 1.1;
`;

const Workspace = styled.div`
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr) 360px;
  gap: 12px;
  align-items: start;
`;

const Panel = styled.section`
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #ffffff;
  min-width: 0;
`;

const ListPanel = styled(Panel)`
  overflow: hidden;
`;

const DetailPanel = styled(Panel)`
  padding: 18px;
`;

const ActionPanel = styled(Panel)`
  position: sticky;
  top: 16px;
  padding: 18px;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.35;
`;

const PanelHint = styled.span`
  display: block;
  margin-top: 2px;
  color: #667085;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const InquiryList = styled.div`
  max-height: calc(100dvh - 236px);
  overflow: auto;
  border-top: 1px solid #eef0f3;
`;

const InquiryItem = styled.button`
  display: block;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #eef0f3;
  background: #ffffff;
  padding: 14px 16px;
  text-align: left;

  &:hover {
    background: #f9fafb;
  }

  &[data-active='true'] {
    background: #effaf5;
    box-shadow: inset 3px 0 0 #4dc891;
  }
`;

const InquiryItemTop = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const InquiryTitle = styled.strong`
  min-width: 0;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const InquiryMeta = styled.span`
  display: block;
  margin-top: 5px;
  color: #667085;
  font-size: 12px;
  line-height: 1.4;
`;

const StatusBadge = styled.span<{ $status: SupportInquiryStatus }>`
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 4px 9px;
  background: ${({ $status }) =>
    $status === 'PENDING'
      ? '#fff7e6'
      : $status === 'IN_PROGRESS'
        ? '#eaf2ff'
        : $status === 'RESOLVED'
          ? '#eaf8f0'
          : '#f2f4f7'};
  color: ${({ $status }) =>
    $status === 'PENDING'
      ? '#b54708'
      : $status === 'IN_PROGRESS'
        ? '#175cd3'
        : $status === 'RESOLVED'
          ? '#027a48'
          : '#475467'};
  font-size: 12px;
  font-weight: 800;
`;

const InfoGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 18px;
`;

const InfoItem = styled.div`
  border-radius: 8px;
  background: #f8fafc;
  padding: 11px 12px;
`;

const InfoLabel = styled.dt`
  color: #667085;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 5px;
`;

const InfoValue = styled.dd`
  margin: 0;
  color: #1f2937;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

const Section = styled.section`
  margin-top: 18px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 8px;
  color: #344054;
  font-size: 13px;
  font-weight: 800;
`;

const Quote = styled.blockquote`
  margin: 0;
  min-height: 220px;
  border: 1px solid #e4e7ec;
  border-left: 3px solid #4dc891;
  border-radius: 8px;
  background: #ffffff;
  color: #344054;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 14px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin-bottom: 12px;
`;

const FieldLabel = styled.label`
  color: #344054;
  font-size: 12px;
  font-weight: 800;
`;

const Select = styled.select`
  width: 100%;
  height: 40px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  padding: 0 10px;
  font-size: 14px;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 220px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
`;

const HelperText = styled.p`
  margin: 0;
  color: #667085;
  font-size: 12px;
  line-height: 1.4;
  text-align: right;
`;

const ButtonBase = styled.button`
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 800;

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }
`;

const RefreshButton = styled(ButtonBase)`
  background: #ffffff;
  color: #344054;
  border: 1px solid #d0d5dd;
`;

const PrimaryButton = styled(ButtonBase)`
  width: 100%;
  background: #31b981;
  color: #ffffff;
`;

const EmptyState = styled.p`
  margin: 0;
  border-radius: 8px;
  background: #f8fafc;
  color: #667085;
  font-size: 13px;
  line-height: 1.5;
  padding: 14px;
`;

const LargeEmptyState = styled(EmptyState)`
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const AccessNotice = styled(LargeEmptyState)`
  width: min(520px, calc(100vw - 48px));
  min-height: 160px;
  margin: 80px auto 0;
`;

const FeedbackText = styled.p`
  margin: 0 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  padding: 10px 12px;
`;

const ErrorText = styled(FeedbackText)`
  background: #fff1f3;
  color: #c01048;
`;

const SuccessText = styled(FeedbackText)`
  background: #effaf5;
  color: #027a48;
`;

export default AdminSupportInquiriesPage;
