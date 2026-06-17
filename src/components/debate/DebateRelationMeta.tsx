import type { MouseEvent } from 'react';
import styled from 'styled-components';
import type { Debate } from '../../types/debate';

const SOURCE_PREVIEW_LIMIT = 56;

const truncateText = (value: string, maxLength = SOURCE_PREVIEW_LIMIT) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
};

interface DebateRelationMetaProps {
  debate: Pick<Debate, 'parentDebateId' | 'parentDebate' | 'sourceSelectionTarget'>;
  onParentClick?: (parentDebateId: string) => void;
  compact?: boolean;
}

const DebateRelationMeta = ({
  debate,
  onParentClick,
  compact = false,
}: DebateRelationMetaProps) => {
  if (!debate.parentDebateId) return null;

  const selectedText = debate.sourceSelectionTarget?.selectedText?.trim();
  const parentTitle = debate.parentDebate?.title;

  const handleParentClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (debate.parentDebateId) {
      onParentClick?.(debate.parentDebateId);
    }
  };

  return (
    <Wrapper $compact={compact}>
      <ChildBadge>하위 토론</ChildBadge>
      {parentTitle && (
        <ParentLine>
          <ParentLabel>상위 토론:</ParentLabel>
          {onParentClick ? (
            <ParentButton type="button" onClick={handleParentClick}>
              {parentTitle}
            </ParentButton>
          ) : (
            <ParentTitle>{parentTitle}</ParentTitle>
          )}
        </ParentLine>
      )}
      {selectedText && (
        <SourcePreview>
          <SourceLabel>분기 기준:</SourceLabel> "{truncateText(selectedText)}"
        </SourcePreview>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div<{ $compact: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ $compact }) => ($compact ? '3px' : '5px')};
  min-width: 0;
`;

const ChildBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 21px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eefaf6;
  color: #2d8f73;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
`;

const ParentLine = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-width: 0;
  color: #7f7f7f;
  font-size: 12px;
  line-height: 1.35;
`;

const ParentLabel = styled.span`
  flex-shrink: 0;
  font-weight: 700;
`;

const parentTitleStyle = `
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #555555;
  font-size: 12px;
  font-weight: 700;
`;

const ParentTitle = styled.span`
  ${parentTitleStyle}
`;

const ParentButton = styled.button`
  ${parentTitleStyle}
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;
`;

const SourcePreview = styled.p`
  max-width: 100%;
  margin: 0;
  color: #9a9a9a;
  font-size: 12px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SourceLabel = styled.span`
  color: #7f7f7f;
  font-weight: 700;
`;

export default DebateRelationMeta;
