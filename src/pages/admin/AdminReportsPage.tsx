import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import styled from 'styled-components';
import { moderationService } from '../../services/moderationService';
import { useAuthStore } from '../../stores/authStore';
import type {
  ContentAction,
  Report,
  ReportStatus,
  ReportTargetType,
  Sanction,
  SanctionType,
} from '../../types/moderation';

const STATUS_OPTIONS: Array<{ value: '' | ReportStatus; label: string }> = [
  { value: '', label: '전체' },
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

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
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

  const selectedTargetUserId = useMemo(() => {
    if (!selectedReport) return null;
    if (selectedReport.targetType === 'USER') return selectedReport.targetId;
    return selectedReport.sanctions?.[0]?.userId ?? null;
  }, [selectedReport]);

  const canApplyContentAction = selectedReport
    ? CONTENT_ACTION_TARGETS.includes(selectedReport.targetType)
    : false;
  const contentActionOptions = canApplyContentAction ? ACTION_OPTIONS : ACTION_OPTIONS.slice(0, 1);

  const loadReports = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await moderationService.getAdminReports({
        status: status || undefined,
        targetType: targetType || undefined,
        limit: 50,
      });
      setReports(data.reports);
      if (selectedReport) {
        const refreshed = data.reports.find((report) => report.id === selectedReport.id);
        if (refreshed) setSelectedReport(refreshed);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, [status, targetType]);

  useEffect(() => {
    if (!selectedTargetUserId) {
      setSanctions([]);
      return;
    }
    void moderationService.getUserSanctions(selectedTargetUserId).then(({ data }) => {
      setSanctions(data.sanctions);
    });
  }, [selectedTargetUserId]);

  useEffect(() => {
    if (!canApplyContentAction) {
      setContentAction('NONE');
    }
  }, [canApplyContentAction]);

  const selectReport = async (report: Report) => {
    setError('');
    setMessage('');
    if (selectedReport?.id === report.id) {
      setSelectedReport(null);
      setSanctions([]);
      setResolutionNote('');
      return;
    }
    const { data } = await moderationService.getAdminReport(report.id);
    setSelectedReport(data.report);
    setResolutionNote(data.report.resolutionNote ?? '');
  };

  const handleReview = async () => {
    if (!selectedReport) return;
    try {
      const { data } = await moderationService.reviewReport(selectedReport.id, resolutionNote);
      setSelectedReport(data.report);
      setMessage('검토 상태로 변경했습니다.');
      await loadReports();
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleReject = async () => {
    if (!selectedReport) return;
    try {
      const { data } = await moderationService.rejectReport(selectedReport.id, resolutionNote);
      setSelectedReport(data.report);
      setMessage(data.message || '신고가 반려되었습니다.');
      await loadReports();
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleApplyAction = async () => {
    if (!selectedReport) return;
    const safeContentAction = canApplyContentAction ? contentAction : 'NONE';
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
    }
  };

  const handleRevoke = async (sanctionId: string) => {
    try {
      await moderationService.revokeSanction(sanctionId, '관리자에 의해 철회되었습니다.');
      setMessage('제재를 철회했습니다.');
      if (selectedTargetUserId) {
        const { data } = await moderationService.getUserSanctions(selectedTargetUserId);
        setSanctions(data.sanctions);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  if (user?.role !== 'ADMIN') {
    return <Page><Notice>관리자만 신고를 처리할 수 있습니다.</Notice></Page>;
  }

  return (
    <Page>
      <Header>
        <Title>신고 관리</Title>
        <RefreshButton type="button" onClick={() => void loadReports()} disabled={isLoading}>
          새로고침
        </RefreshButton>
      </Header>
      <FilterRow>
        <Select value={status} onChange={(event) => setStatus(event.target.value as '' | ReportStatus)}>
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
        <Select value={targetType} onChange={(event) => setTargetType(event.target.value as '' | ReportTargetType)}>
          {TARGET_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </FilterRow>
      {error && <ErrorText>{error}</ErrorText>}
      {message && <SuccessText>{message}</SuccessText>}
      <Grid>
        <List>
          {reports.map((report) => (
            <ReportItem
              key={report.id}
              type="button"
              data-active={selectedReport?.id === report.id}
              onClick={() => void selectReport(report)}
            >
              <strong>{report.targetType} · {report.reason}</strong>
              <span>{report.reporter?.nickname ?? '신고자'} · {report.status}</span>
            </ReportItem>
          ))}
        </List>
        <Detail>
          {selectedReport ? (
            <>
              <DetailTitle>{selectedReport.targetType} 신고</DetailTitle>
              <Meta>상태: {selectedReport.status}</Meta>
              <Meta>대상 ID: {selectedReport.targetId}</Meta>
              <Quote>{selectedReport.targetContentSnapshot || selectedReport.detail || '스냅샷 없음'}</Quote>
              <Textarea
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                placeholder="처리 메모"
              />
              <ActionRow>
                <SecondaryButton type="button" onClick={() => void handleReview()}>
                  검토
                </SecondaryButton>
                <SecondaryButton type="button" onClick={() => void handleReject()}>
                  반려
                </SecondaryButton>
              </ActionRow>
              <SectionTitle>처리</SectionTitle>
              <Select
                value={canApplyContentAction ? contentAction : 'NONE'}
                onChange={(event) => setContentAction(event.target.value as ContentAction)}
                disabled={!canApplyContentAction}
              >
                {contentActionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              {!canApplyContentAction && (
                <HelperText>이 대상은 콘텐츠 숨김/삭제 조치 대상이 아닙니다.</HelperText>
              )}
              <Select value={sanctionType} onChange={(event) => setSanctionType(event.target.value as '' | SanctionType)}>
                {SANCTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              {sanctionType && (
                <>
                  <Input
                    value={sanctionReason}
                    onChange={(event) => setSanctionReason(event.target.value)}
                    placeholder="제재 사유"
                  />
                  <Input
                    type="datetime-local"
                    value={sanctionEndsAt}
                    onChange={(event) => setSanctionEndsAt(event.target.value)}
                  />
                </>
              )}
              <PrimaryButton type="button" onClick={() => void handleApplyAction()}>
                신고 처리가 완료되었습니다.
              </PrimaryButton>
              <SectionTitle>제재 내역</SectionTitle>
              {sanctions.map((sanction) => (
                <SanctionItem key={sanction.id}>
                  <span>{sanction.type} · {sanction.status}</span>
                  {sanction.status === 'ACTIVE' && (
                    <SmallButton type="button" onClick={() => void handleRevoke(sanction.id)}>
                      철회
                    </SmallButton>
                  )}
                </SanctionItem>
              ))}
            </>
          ) : (
            <Notice>신고를 선택해 주세요.</Notice>
          )}
        </Detail>
      </Grid>
    </Page>
  );
};

const Page = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: 18px var(--page-x) 28px;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const Title = styled.h1`
  margin: 0;
  color: #2f3238;
  font-size: var(--title-sm);
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReportItem = styled.button`
  border: none;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
  text-align: left;

  strong,
  span {
    display: block;
  }

  strong {
    color: #555555;
    font-size: 13px;
  }

  span {
    margin-top: 4px;
    color: #9a9a9a;
    font-size: 12px;
  }

  &[data-active='true'] {
    outline: 2px solid #2dcd97;
  }
`;

const Detail = styled.section`
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
`;

const DetailTitle = styled.h2`
  margin: 0 0 8px;
  color: #2f3238;
  font-size: 16px;
`;

const Meta = styled.p`
  margin: 0 0 5px;
  color: #8f8f8f;
  font-size: 12px;
`;

const Quote = styled.blockquote`
  margin: 10px 0;
  border-left: 3px solid #2dcd97;
  color: #555555;
  font-size: 13px;
  line-height: 1.45;
  padding-left: 10px;
  white-space: pre-wrap;
`;

const Select = styled.select`
  width: 100%;
  height: 38px;
  border: none;
  border-radius: 8px;
  background: #ffffff;
  color: #555555;
  padding: 0 10px;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #555555;
  padding: 10px;
  resize: vertical;
`;

const Input = styled.input`
  width: 100%;
  height: 38px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #555555;
  padding: 0 10px;
  margin-top: 8px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin: 10px 0;
`;

const RefreshButton = styled.button`
  height: 34px;
  border: none;
  border-radius: 999px;
  background: #ffffff;
  color: #555555;
  padding: 0 14px;
  font-weight: 700;
`;

const SecondaryButton = styled(RefreshButton)`
  background: #f0f0f0;
`;

const PrimaryButton = styled.button`
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  font-weight: 700;
  margin-top: 10px;
`;

const SectionTitle = styled.h3`
  margin: 16px 0 8px;
  color: #555555;
  font-size: 13px;
`;

const SanctionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: 8px;
  background: #f7f7f7;
  padding: 8px 10px;
  color: #555555;
  font-size: 12px;
  margin-top: 6px;
`;

const SmallButton = styled.button`
  height: 28px;
  border: none;
  border-radius: 999px;
  background: #f04444;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 0 10px;
`;

const Notice = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: 13px;
`;

const ErrorText = styled(Notice)`
  color: #f04444;
  margin-bottom: 8px;
`;

const SuccessText = styled(Notice)`
  color: #2d8f73;
  margin-bottom: 8px;
`;

const HelperText = styled(Notice)`
  margin-top: 6px;
  color: #8f8f8f;
`;

export default AdminReportsPage;
