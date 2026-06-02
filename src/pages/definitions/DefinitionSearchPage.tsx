import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { definitionService } from '../../services/definitionService';
import type { Definition } from '../../types/debate';

const DefinitionSearchPage = () => {
  const [query, setQuery] = useState('');
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDefinitions = async () => {
      try {
        const { data } = await definitionService.getList({
          q: query.trim() || undefined,
          limit: 30,
        });
        setDefinitions(data.definitions);
        setError('');
      } catch {
        setError('정의 목록을 불러오지 못했습니다.');
      }
    };
    const timer = window.setTimeout(() => {
      void loadDefinitions();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <Wrapper>
      <Title>정의 검색</Title>
      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="단어, 개념, 합의 내용을 검색하세요."
      />
      {error && <ErrorText>{error}</ErrorText>}
      <DefinitionList>
        {definitions.length === 0 && !error && <EmptyText>검색 가능한 정의가 없습니다.</EmptyText>}
        {definitions.map((definition) => (
          <DefinitionCard key={definition.id}>
            <CardTop>
              <Term>{definition.term}</Term>
              <Scope>{definition.scope === 'IN_DEBATE' ? '토론 기준' : '전체 참조'}</Scope>
            </CardTop>
            <Content>{definition.content}</Content>
            <Source>
              출처: {definition.sourceDebate?.title ?? '토론'} ·{' '}
              {definition.sourceConsensus?.title ?? '직접 정의'}
            </Source>
          </DefinitionCard>
        ))}
      </DefinitionList>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: 62px 16px 90px;
`;

const Title = styled.h1`
  margin: 0 0 16px;
  color: #2f3238;
  font-size: 28px;
  font-weight: 800;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 999px;
  background: #ffffff;
  padding: 0 16px;
  color: #333333;
  font-size: 14px;
  outline: none;
`;

const DefinitionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
`;

const DefinitionCard = styled.article`
  background: #ffffff;
  border-radius: 16px;
  padding: 14px;
  text-align: left;
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const Term = styled.strong`
  color: #2dcd97;
  font-size: 17px;
`;

const Scope = styled.span`
  color: #9a9a9a;
  font-size: 11px;
  border: 1px solid #dedede;
  border-radius: 999px;
  padding: 4px 8px;
`;

const Content = styled.p`
  color: #555555;
  font-size: 14px;
  line-height: 1.5;
`;

const Source = styled.p`
  margin-top: 10px;
  color: #9a9a9a;
  font-size: 12px;
`;

const EmptyText = styled.p`
  color: #9a9a9a;
  font-size: 13px;
  text-align: center;
`;

const ErrorText = styled.p`
  margin-top: 10px;
  color: #f04444;
  font-size: 13px;
`;

export default DefinitionSearchPage;
