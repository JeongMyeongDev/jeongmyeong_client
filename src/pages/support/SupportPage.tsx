import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LoadingContent } from '../../components/common/LoadingContent';
import { supportService } from '../../services/supportService';
import type {
  SupportInquiry,
  SupportInquiryCategory,
  SupportInquiryStatus,
} from '../../types/supportInquiry';

const CATEGORY_OPTIONS: Array<{ value: SupportInquiryCategory; label: string }> = [
  { value: 'BUG', label: '오류 신고' },
  { value: 'ACCOUNT', label: '계정 문제' },
  { value: 'DEBATE', label: '토론/합의 관련' },
  { value: 'REPORT', label: '신고/제재 관련' },
  { value: 'ETC', label: '기타' },
];

const CATEGORY_LABEL_MAP: Record<SupportInquiryCategory, string> = {
  BUG: '오류 신고',
  ACCOUNT: '계정 문제',
  DEBATE: '토론/합의 관련',
  REPORT: '신고/제재 관련',
  ETC: '기타',
};

const STATUS_LABEL_MAP: Record<SupportInquiryStatus, string> = {
  PENDING: '접수됨',
  IN_PROGRESS: '처리 중',
  RESOLVED: '답변 완료',
  CLOSED: '종료됨',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
  }
  return fallback;
};

const formatDateTime = (value: string) => {
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

const SupportPage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<SupportInquiryCategory>('ETC');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingUI, setShowLoadingUI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadInquiries = async () => {
    const { data } = await supportService.getMyInquiries();
    setInquiries(data.inquiries);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLoadingUI(true), 200);

    const initialize = async () => {
      setErrorMessage('');
      try {
        await loadInquiries();
      } catch (error) {
        setErrorMessage(getErrorMessage(error, '문의 내역을 불러오지 못했습니다.'));
      } finally {
        window.clearTimeout(timer);
        setIsLoading(false);
        setShowLoadingUI(false);
      }
    };

    void initialize();

    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    setErrorMessage('');
    setSuccessMessage('');

    if (!trimmedTitle) {
      setErrorMessage('문의 제목을 입력해 주세요.');
      return;
    }

    if (!trimmedContent) {
      setErrorMessage('문의 내용을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await supportService.createInquiry({
        category,
        title: trimmedTitle,
        content: trimmedContent,
      });
      setSuccessMessage(data.message || '문의가 접수되었습니다.');
      setTitle('');
      setContent('');
      setCategory('ETC');
      await loadInquiries();
    } catch (error) {
      const fallback =
        isAxiosError(error) && error.response?.status === 401
          ? '로그인이 필요한 기능입니다.'
          : '문의 접수에 실패했습니다.';
      setErrorMessage(getErrorMessage(error, fallback));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Wrapper>
      <TopBar>
        <BackButton type="button" onClick={() => navigate(-1)} aria-label="뒤로">
          <BackIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="20" y1="12" x2="4" y2="12" />
            <polyline points="10 6 4 12 10 18" />
          </BackIcon>
        </BackButton>
        <TopTitle>문의하기</TopTitle>
      </TopBar>

      <LoadingContent
        isLoading={isLoading}
        showLoadingUI={showLoadingUI}
        skeleton={<SupportSkeleton />}
      >
        <Content>
          <IntroText>서비스 이용 중 불편한 점이나 개선 의견을 보내 주세요.</IntroText>

          <Card>
            <FieldGroup>
              <FieldLabel htmlFor="support-category">문의 유형</FieldLabel>
              <Select
                id="support-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as SupportInquiryCategory)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="support-title">문의 제목</FieldLabel>
              <Input
                id="support-title"
                value={title}
                maxLength={100}
                placeholder="문의 제목을 입력해 주세요."
                onChange={(event) => setTitle(event.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="support-content">문의 내용</FieldLabel>
              <Textarea
                id="support-content"
                value={content}
                maxLength={2000}
                placeholder="문의 내용을 입력해 주세요."
                onChange={(event) => setContent(event.target.value)}
              />
              <Counter>{content.length}/2000</Counter>
            </FieldGroup>

            {errorMessage && <FeedbackText $error>{errorMessage}</FeedbackText>}
            {successMessage && !errorMessage && <FeedbackText $success>{successMessage}</FeedbackText>}

            <ButtonRow>
              <SecondaryButton type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>
                취소
              </SecondaryButton>
              <PrimaryButton type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? '접수 중' : '문의 접수'}
              </PrimaryButton>
            </ButtonRow>
          </Card>

          <SectionTitle>내 문의 내역</SectionTitle>
          <InquiryList>
            {inquiries.map((inquiry) => (
              <InquiryItem key={inquiry.id}>
                <InquiryHeader>
                  <InquiryTitle>{inquiry.title}</InquiryTitle>
                  <StatusBadge $status={inquiry.status}>{STATUS_LABEL_MAP[inquiry.status]}</StatusBadge>
                </InquiryHeader>
                <InquiryMeta>
                  {CATEGORY_LABEL_MAP[inquiry.category]} · {formatDateTime(inquiry.createdAt)}
                </InquiryMeta>
                <InquiryContent>{inquiry.content}</InquiryContent>
                {inquiry.adminReply && (
                  <AdminReply>
                    <AdminReplyLabel>답변</AdminReplyLabel>
                    <AdminReplyContent>{inquiry.adminReply}</AdminReplyContent>
                  </AdminReply>
                )}
              </InquiryItem>
            ))}
            {inquiries.length === 0 && <EmptyState>아직 접수한 문의가 없습니다.</EmptyState>}
          </InquiryList>
        </Content>
      </LoadingContent>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 32px;
`;

const TopBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 16px 16px 12px;
`;

const BackButton = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #353535;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const BackIcon = styled.svg`
  width: 24px;
  height: 24px;
`;

const TopTitle = styled.h1`
  flex: 1;
  margin: 0;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 700;
`;

const Content = styled.div`
  padding: 16px;
`;

const IntroText = styled.p`
  margin: 0 0 12px;
  color: #6f6f6f;
  font-size: var(--body-sm);
  line-height: 1.45;
`;

const Card = styled.section`
  background: #fff;
  border-radius: var(--card-radius);
  padding: 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
`;

const FieldLabel = styled.label`
  color: #2f3238;
  font-size: 13px;
  font-weight: 700;
`;

const Input = styled.input`
  width: 100%;
  height: 44px;
  border: 1px solid #dedede;
  border-radius: 8px;
  background: #fff;
  color: #2f3238;
  font-size: 15px;
  padding: 0 12px;
`;

const Select = styled.select`
  width: 100%;
  height: 44px;
  border: 1px solid #dedede;
  border-radius: 8px;
  background: #fff;
  color: #2f3238;
  font-size: 15px;
  padding: 0 12px;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 148px;
  border: 1px solid #dedede;
  border-radius: 8px;
  background: #fff;
  color: #2f3238;
  font-size: 15px;
  line-height: 1.5;
  padding: 12px;
  resize: vertical;
`;

const Counter = styled.span`
  align-self: flex-end;
  color: #9a9a9a;
  font-size: 12px;
`;

const FeedbackText = styled.p<{ $error?: boolean; $success?: boolean }>`
  margin: 0 0 12px;
  color: ${({ $error, $success }) => {
    if ($error) return '#f04444';
    if ($success) return '#2dcd97';
    return '#6f6f6f';
  }};
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
`;

const ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 8px;
`;

const ButtonBase = styled.button`
  min-height: 44px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 800;

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(ButtonBase)`
  background: #eeeeee;
  color: #50545a;
`;

const PrimaryButton = styled(ButtonBase)`
  background: #2dcd97;
  color: #fff;
`;

const SectionTitle = styled.h2`
  margin: 22px 0 10px;
  color: #2f3238;
  font-size: clamp(15px, 4vw, 17px);
  font-weight: 700;
`;

const InquiryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InquiryItem = styled.article`
  background: #fff;
  border-radius: var(--card-radius);
  padding: 14px;
`;

const InquiryHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const InquiryTitle = styled.h3`
  min-width: 0;
  margin: 0;
  color: #2f3238;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

const StatusBadge = styled.span<{ $status: SupportInquiryStatus }>`
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 4px 9px;
  background: ${({ $status }) => {
    if ($status === 'PENDING') return '#fff7e6';
    if ($status === 'IN_PROGRESS') return '#eaf2ff';
    if ($status === 'RESOLVED') return '#eaf8f0';
    return '#f2f4f7';
  }};
  color: ${({ $status }) => {
    if ($status === 'PENDING') return '#b54708';
    if ($status === 'IN_PROGRESS') return '#175cd3';
    if ($status === 'RESOLVED') return '#027a48';
    return '#475467';
  }};
  font-size: 12px;
  font-weight: 800;
`;

const InquiryMeta = styled.p`
  margin: 6px 0 0;
  color: #8f8f8f;
  font-size: 12px;
  line-height: 1.4;
`;

const InquiryContent = styled.p`
  margin: 10px 0 0;
  color: #50545a;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const AdminReply = styled.div`
  margin-top: 12px;
  border-radius: 8px;
  background: #effaf5;
  padding: 12px;
`;

const AdminReplyLabel = styled.strong`
  display: block;
  color: #027a48;
  font-size: 12px;
  font-weight: 800;
`;

const AdminReplyContent = styled.p`
  margin: 6px 0 0;
  color: #344054;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const EmptyState = styled.p`
  margin: 0;
  border-radius: var(--card-radius);
  background: #fff;
  color: #8f8f8f;
  font-size: 14px;
  line-height: 1.5;
  padding: 18px 14px;
  text-align: center;
`;

const SupportSkeleton = () => (
  <Content>
    <SkeletonLine $width="84%" />
    <SkeletonCard>
      <SkeletonLine $width="38%" />
      <SkeletonBlock $height="44px" />
      <SkeletonLine $width="34%" />
      <SkeletonBlock $height="44px" />
      <SkeletonLine $width="36%" />
      <SkeletonBlock $height="148px" />
    </SkeletonCard>
  </Content>
);

const SkeletonCard = styled.div`
  margin-top: 12px;
  background: #fff;
  border-radius: var(--card-radius);
  padding: 16px;
`;

const SkeletonLine = styled.div<{ $width: string }>`
  width: ${({ $width }) => $width};
  max-width: 100%;
  height: 14px;
  border-radius: 999px;
  background: #ececec;
  margin-bottom: 12px;
`;

const SkeletonBlock = styled.div<{ $height: string }>`
  width: 100%;
  height: ${({ $height }) => $height};
  border-radius: 8px;
  background: #ececec;
  margin-bottom: 14px;
`;

export default SupportPage;
