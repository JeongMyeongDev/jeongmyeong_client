import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import styled from 'styled-components';
import { moderationService } from '../../services/moderationService';
import { useAuthStore } from '../../stores/authStore';
import type {
  ContentAction,
  Report,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  Sanction,
  SanctionStatus,
  SanctionType,
} from '../../types/moderation';

const STATUS_OPTIONS: Array<{ value: '' | ReportStatus; label: string }> = [
  { value: '', label: '전체 상태' },
  { value: 'PENDING', label: '대기' },
  { value: 'REVIEWING', label: '검토 중' },
  { value: 'ACTION_TAKEN', label: '처리 완료' },
  { value: 'REJECTED', label: '반려' },
  { value: 'DUPLICATE', label: '중복' },
];

const TARGET_OPTIONS: Array<{ value: '' | ReportTargetType; label: string }> = [
  { value: '', label: '전체 대상' },
  { value: 'DEBATE', label: '토론' },
  { value: 'POST', label: '의견' },
  { value: 'COMMENT', label: '댓글' },
  { value: 'CONSENSUS', label: '합의안' },
  { value: 'USER', label: '사용자' },
];

const SANCTION_OPTIONS: Array<{ value: '' | SanctionType; label: string }> = [
  { value: '', label: '제재 없음' },
  { value: 'WARNING', label: '경고' },
  { value: 'WRITE_RESTRICTION', label: '작성 제한' },
  { value: 'DEBATE_CREATE_RESTRICTION', label: '토론 생성 제한' },
  { value: 'TEMP_SUSPENSION', label: '임시 정지' },
  { value: 'PERMANENT_SUSPENSION', label: '영구 정지' },
];

const ACTION_OPTIONS: Array<{ value: ContentAction; label: string }> = [
  { value: 'NONE', label: '콘텐츠 조치 없음' },
  { value: 'HIDE', label: '숨김' },
  { value: 'DELETE', label: '삭제' },
  { value: 'RESTORE', label: '복구' },
];

const CONTENT_ACTION_TARGETS: ReportTargetType[] = ['POST', 'COMMENT'];

const REASON_LABEL_MAP: Record<ReportReason, string> = {
  SPAM: '스팸',
  ABUSE: '욕설/괴롭힘',
  HATE: '혐오 표현',
  SEXUAL: '성적 콘텐츠',
  VIOLENCE: '폭력적 콘텐츠',
  MISINFORMATION: '허위 정보',
  OFF_TOPIC: '주제와 무관함',
  ETC: '기타',
};

const TARGET_LABEL_MAP: Record<ReportTargetType, string> = {
  DEBATE: '토론',
  POST: '의견',
  COMMENT: '댓글',
  CONSENSUS: '합의안',
  USER: '사용자',
};

const STATUS_LABEL_MAP: Record<ReportStatus, string> = {
  PENDING: '대기',
  REVIEWING: '검토 중',
  ACTION_TAKEN: '처리 완료',
  REJECTED: '반려',
  DUPLICATE: '중복',
};

const SANCTION_TYPE_LABEL_MAP: Record<SanctionType, string> = {
  WARNING: '경고',
  WRITE_RESTRICTION: '작성 제한',
  DEBATE_CREATE_RESTRICTION: '토론 생성 제한',
  TEMP_SUSPENSION: '임시 정지',
  PERMANENT_SUSPENSION: '영구 정지',
};

const SANCTION_STATUS_LABEL_MAP: Record<SanctionStatus, string> = {
  ACTIVE: '적용 중',
  EXPIRED: '만료',
  REVOKED: '철회',
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
  return '요청 처리에 실패했습니다.';
};

const AdminReportsPage = () => {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [status, setStatus] = useState<'' | ReportStatus>('PENDING');
  const [targetType, setTargetType] = useState<'' | ReportTargetType>('');
  const [contentAction, setContentAction] = useState<ContentAction>('NONE');
  const [sanctionType, setSanctionType] = useState<'' | SanctionType>('');
  const [sanctionReason, setSanctionReason] = useState('');
  const [sanctionEndsAt, setSanctionEndsAt] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedReportId = selectedReport?.id;

  const selectedTargetUserId = useMemo(() => {
    if (!selectedReport) return null;
    if (selectedReport.targetType === 'USER') return selectedReport.targetId;
    return selectedReport.sanctions?.[0]?.userId ?? null;
  }, [selectedReport]);

  const reportSummary = useMemo(
    () => ({
      total: reports.length,
      pending: reports.filter((report) => report.status === 'PENDING').length,
      reviewing: reports.filter((report) => report.status === 'REVIEWING').length,
      done: reports.filter((report) => report.status === 'ACTION_TAKEN').length,
    }),
    [reports],
  );

  const canApplyContentAction = selectedReport
    ? CONTENT_ACTION_TARGETS.includes(selectedReport.targetType)
    : false;
  const contentActionOptions = canApplyContentAction ? ACTION_OPTIONS : ACTION_OPTIONS.slice(0, 1);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await moderationService.getAdminReports({
        status: status || undefined,
        targetType: targetType || undefined,
        limit: 50,
      });
      setReports(data.reports);
      if (selectedReportId) {
        const refreshed = data.reports.find((report) => report.id === selectedReportId);
        if (refreshed) setSelectedReport(refreshed);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [selectedReportId, status, targetType]);

  useEffect(() => {
    void Promise.resolve().then(loadReports);
  }, [loadReports]);

  useEffect(() => {
    if (!selectedTargetUserId) return;

    void moderationService.getUserSanctions(selectedTargetUserId).then(({ data }) => {
      setSanctions(data.sanctions);
    });
  }, [selectedTargetUserId]);

  const selectReport = async (report: Report) => {
    setError('');
    setMessage('');
    if (selectedReport?.id === report.id) {
      setSelectedReport(null);
      setSanctions([]);
      setResolutionNote('');
      return;
    }

    try {
      const { data } = await moderationService.getAdminReport(report.id);
      setSelectedReport(data.report);
      setResolutionNote(data.report.resolutionNote ?? '');
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleReview = async () => {
    if (!selectedReport || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await moderationService.reviewReport(selectedReport.id, resolutionNote);
      setSelectedReport(data.report);
      setMessage('검토 상태로 변경했습니다.');
      await loadReports();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReport || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await moderationService.rejectReport(selectedReport.id, resolutionNote);
      setSelectedReport(data.report);
      setMessage(data.message || '신고가 반려되었습니다.');
      await loadReports();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyAction = async () => {
    if (!selectedReport || isSubmitting) return;
    const safeContentAction = canApplyContentAction ? contentAction : 'NONE';
    setIsSubmitting(true);

    try {
      const { data } = await moderationService.applyReportAction(selectedReport.id, {
        contentAction: safeContentAction,
        resolutionNote,
        sanctionType: sanctionType || undefined,
        sanctionReason: sanctionType ? sanctionReason : undefined,
        sanctionEndsAt: sanctionEndsAt ? new Date(sanctionEndsAt).toISOString() : undefined,
      });
      setSelectedReport(data.report);
      setMessage(data.message || '신고 처리가 완료되었습니다.');
      setSanctionReason('');
      setSanctionEndsAt('');
      await loadReports();
      if (selectedTargetUserId) {
        const sanctionsResponse = await moderationService.getUserSanctions(selectedTargetUserId);
        setSanctions(sanctionsResponse.data.sanctions);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (sanctionId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await moderationService.revokeSanction(sanctionId, '관리자에 의해 철회되었습니다.');
      setMessage('제재를 철회했습니다.');
      if (selectedTargetUserId) {
        const { data } = await moderationService.getUserSanctions(selectedTargetUserId);
        setSanctions(data.sanctions);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Page>
        <AccessNotice>관리자만 신고를 처리할 수 있습니다.</AccessNotice>
      </Page>
    );
  }

  return (
    <Page>
      <Shell>
        <Header>
          <HeaderCopy>
            <Eyebrow>Admin Console</Eyebrow>
            <Title>신고 관리</Title>
            <Subtitle>신고 목록을 검토하고 콘텐츠 조치와 사용자 제재를 한 화면에서 처리합니다.</Subtitle>
          </HeaderCopy>
          <RefreshButton type="button" onClick={() => void loadReports()} disabled={isLoading}>
            {isLoading ? '불러오는 중' : '새로고침'}
          </RefreshButton>
        </Header>

        <SummaryGrid>
          <SummaryCard>
            <SummaryLabel>현재 목록</SummaryLabel>
            <SummaryValue>{reportSummary.total}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>대기</SummaryLabel>
            <SummaryValue>{reportSummary.pending}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>검토 중</SummaryLabel>
            <SummaryValue>{reportSummary.reviewing}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>처리 완료</SummaryLabel>
            <SummaryValue>{reportSummary.done}</SummaryValue>
          </SummaryCard>
        </SummaryGrid>

        <Toolbar>
          <FieldGroup>
            <FieldLabel htmlFor="report-status">상태</FieldLabel>
            <Select
              id="report-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as '' | ReportStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="report-target">대상</FieldLabel>
            <Select
              id="report-target"
              value={targetType}
              onChange={(event) => setTargetType(event.target.value as '' | ReportTargetType)}
            >
              {TARGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <ToolbarMeta>{reports.length}건 표시 중</ToolbarMeta>
        </Toolbar>

        {error && <ErrorText>{error}</ErrorText>}
        {message && <SuccessText>{message}</SuccessText>}

        <Workspace>
          <ListPanel>
            <PanelHeader>
              <PanelTitle>신고 목록</PanelTitle>
              <PanelHint>최근 50건</PanelHint>
            </PanelHeader>
            <ReportList>
              {reports.map((report) => (
                <ReportItem
                  key={report.id}
                  type="button"
                  data-active={selectedReport?.id === report.id}
                  onClick={() => void selectReport(report)}
                >
                  <ReportItemTop>
                    <ReasonText>{REASON_LABEL_MAP[report.reason]}</ReasonText>
                    <StatusBadge $status={report.status}>{STATUS_LABEL_MAP[report.status]}</StatusBadge>
                  </ReportItemTop>
                  <ReportTarget>{TARGET_LABEL_MAP[report.targetType]} · {report.targetId}</ReportTarget>
                  <ReportMeta>{report.reporter?.nickname ?? '신고자'} · {formatDateTime(report.createdAt)}</ReportMeta>
                </ReportItem>
              ))}
              {!isLoading && reports.length === 0 && <EmptyState>조건에 맞는 신고가 없습니다.</EmptyState>}
            </ReportList>
          </ListPanel>

          <DetailPanel>
            {selectedReport ? (
              <>
                <PanelHeader>
                  <div>
                    <PanelTitle>{TARGET_LABEL_MAP[selectedReport.targetType]} 신고 상세</PanelTitle>
                    <PanelHint>{selectedReport.id}</PanelHint>
                  </div>
                  <StatusBadge $status={selectedReport.status}>{STATUS_LABEL_MAP[selectedReport.status]}</StatusBadge>
                </PanelHeader>

                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>신고 일시</InfoLabel>
                    <InfoValue>{formatDateTime(selectedReport.createdAt)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>처리 일시</InfoLabel>
                    <InfoValue>{formatDateTime(selectedReport.handledAt)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>신고자</InfoLabel>
                    <InfoValue>
                      {selectedReport.reporter?.nickname ?? '신고자'}
                      {selectedReport.reporter?.email ? ` · ${selectedReport.reporter.email}` : ''}
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>대상</InfoLabel>
                    <InfoValue>{TARGET_LABEL_MAP[selectedReport.targetType]} · {selectedReport.targetId}</InfoValue>
                  </InfoItem>
                </InfoGrid>

                <Section>
                  <SectionTitle>신고 사유</SectionTitle>
                  <ReasonBadge>{REASON_LABEL_MAP[selectedReport.reason]}</ReasonBadge>
                </Section>

                <Section>
                  <SectionTitle>제보자의 의견</SectionTitle>
                  <Quote>{selectedReport.detail || '제보자가 별도 의견을 작성하지 않았습니다.'}</Quote>
                </Section>

                <Section>
                  <SectionTitle>원문 스냅샷</SectionTitle>
                  <Quote>{selectedReport.targetContentSnapshot || '원문 스냅샷이 없습니다.'}</Quote>
                </Section>
              </>
            ) : (
              <LargeEmptyState>왼쪽 목록에서 처리할 신고를 선택해 주세요.</LargeEmptyState>
            )}
          </DetailPanel>

          <ActionPanel>
            <PanelHeader>
              <PanelTitle>처리 작업</PanelTitle>
              <PanelHint>메모, 조치, 제재</PanelHint>
            </PanelHeader>

            {selectedReport ? (
              <>
                <FieldGroup>
                  <FieldLabel htmlFor="resolution-note">처리 메모</FieldLabel>
                  <Textarea
                    id="resolution-note"
                    value={resolutionNote}
                    onChange={(event) => setResolutionNote(event.target.value)}
                    placeholder="검토 근거와 처리 내용을 남겨 주세요."
                  />
                </FieldGroup>

                <ButtonRow>
                  <SecondaryButton type="button" onClick={() => void handleReview()} disabled={isSubmitting}>
                    검토로 변경
                  </SecondaryButton>
                  <DangerGhostButton type="button" onClick={() => void handleReject()} disabled={isSubmitting}>
                    반려
                  </DangerGhostButton>
                </ButtonRow>

                <Divider />

                <FieldGroup>
                  <FieldLabel htmlFor="content-action">콘텐츠 조치</FieldLabel>
                  <Select
                    id="content-action"
                    value={canApplyContentAction ? contentAction : 'NONE'}
                    onChange={(event) => setContentAction(event.target.value as ContentAction)}
                    disabled={!canApplyContentAction}
                  >
                    {contentActionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  {!canApplyContentAction && (
                    <HelperText>이 대상은 콘텐츠 숨김/삭제 조치 대상이 아닙니다.</HelperText>
                  )}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="sanction-type">사용자 제재</FieldLabel>
                  <Select
                    id="sanction-type"
                    value={sanctionType}
                    onChange={(event) => setSanctionType(event.target.value as '' | SanctionType)}
                  >
                    {SANCTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FieldGroup>

                {sanctionType && (
                  <>
                    <FieldGroup>
                      <FieldLabel htmlFor="sanction-reason">제재 사유</FieldLabel>
                      <Input
                        id="sanction-reason"
                        value={sanctionReason}
                        onChange={(event) => setSanctionReason(event.target.value)}
                        placeholder="사용자에게 표시될 제재 사유"
                      />
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel htmlFor="sanction-end">종료 일시</FieldLabel>
                      <Input
                        id="sanction-end"
                        type="datetime-local"
                        value={sanctionEndsAt}
                        onChange={(event) => setSanctionEndsAt(event.target.value)}
                      />
                    </FieldGroup>
                  </>
                )}

                <PrimaryButton type="button" onClick={() => void handleApplyAction()} disabled={isSubmitting}>
                  처리 완료
                </PrimaryButton>

                <Divider />

                <SectionTitle>제재 내역</SectionTitle>
                <SanctionList>
                  {sanctions.map((sanction) => (
                    <SanctionItem key={sanction.id}>
                      <SanctionCopy>
                        <SanctionTitle>{SANCTION_TYPE_LABEL_MAP[sanction.type]}</SanctionTitle>
                        <SanctionMeta>
                          {SANCTION_STATUS_LABEL_MAP[sanction.status]} · {formatDateTime(sanction.startsAt)}
                        </SanctionMeta>
                      </SanctionCopy>
                      {sanction.status === 'ACTIVE' && (
                        <SmallDangerButton
                          type="button"
                          onClick={() => void handleRevoke(sanction.id)}
                          disabled={isSubmitting}
                        >
                          철회
                        </SmallDangerButton>
                      )}
                    </SanctionItem>
                  ))}
                  {sanctions.length === 0 && <EmptyState>대상 사용자 제재 내역이 없습니다.</EmptyState>}
                </SanctionList>
              </>
            ) : (
              <EmptyState>신고를 선택하면 처리 도구가 활성화됩니다.</EmptyState>
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

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: 180px 180px 1fr;
  align-items: end;
  gap: 12px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
  margin-bottom: 12px;
`;

const ToolbarMeta = styled.span`
  justify-self: end;
  color: #667085;
  font-size: 13px;
  font-weight: 700;
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
  padding-bottom: 14px;
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

const ReportList = styled.div`
  max-height: calc(100dvh - 282px);
  overflow: auto;
  border-top: 1px solid #eef0f3;
`;

const ReportItem = styled.button`
  display: block;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #eef0f3;
  background: #ffffff;
  padding: 14px 16px;
  text-align: left;
  transition:
    background 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    background: #f9fafb;
  }

  &[data-active='true'] {
    background: #effaf5;
    box-shadow: inset 3px 0 0 #4dc891;
  }
`;

const ReportItemTop = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const ReasonText = styled.strong`
  min-width: 0;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
`;

const ReportTarget = styled.span`
  display: block;
  margin-top: 8px;
  color: #344054;
  font-size: 13px;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const ReportMeta = styled.span`
  display: block;
  margin-top: 4px;
  color: #667085;
  font-size: 12px;
  line-height: 1.4;
`;

const StatusBadge = styled.span<{ $status: ReportStatus }>`
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 4px 9px;
  background: ${({ $status }) =>
    $status === 'PENDING'
      ? '#fff7e6'
      : $status === 'REVIEWING'
        ? '#eaf2ff'
        : $status === 'ACTION_TAKEN'
          ? '#eaf8f0'
          : '#f2f4f7'};
  color: ${({ $status }) =>
    $status === 'PENDING'
      ? '#b54708'
      : $status === 'REVIEWING'
        ? '#175cd3'
        : $status === 'ACTION_TAKEN'
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

const ReasonBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  background: #effaf5;
  color: #027a48;
  font-size: 13px;
  font-weight: 800;
  padding: 0 12px;
`;

const Quote = styled.blockquote`
  margin: 0;
  min-height: 86px;
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

  &:disabled {
    background: #f2f4f7;
    color: #98a2b3;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 104px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
`;

const Input = styled.input`
  width: 100%;
  height: 40px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  padding: 0 10px;
  font-size: 14px;
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

const SecondaryButton = styled(ButtonBase)`
  flex: 1;
  background: #eef4ff;
  color: #175cd3;
`;

const DangerGhostButton = styled(ButtonBase)`
  flex: 1;
  background: #fff1f3;
  color: #c01048;
`;

const SmallDangerButton = styled(ButtonBase)`
  min-height: 32px;
  padding: 0 10px;
  background: #f04438;
  color: #ffffff;
  font-size: 12px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
`;

const Divider = styled.hr`
  border: 0;
  border-top: 1px solid #eef0f3;
  margin: 16px 0;
`;

const SanctionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SanctionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  padding: 10px;
`;

const SanctionCopy = styled.div`
  min-width: 0;
`;

const SanctionTitle = styled.strong`
  display: block;
  color: #111827;
  font-size: 13px;
`;

const SanctionMeta = styled.span`
  display: block;
  margin-top: 3px;
  color: #667085;
  font-size: 12px;
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

const HelperText = styled.p`
  margin: 0;
  color: #667085;
  font-size: 12px;
  line-height: 1.4;
`;

export default AdminReportsPage;
