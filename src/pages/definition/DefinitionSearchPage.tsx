import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { LoadingContent } from '../../components/common/LoadingContent';
import { DefinitionListSkeleton } from '../../components/common/PageSkeletons';
import { definitionService } from '../../services/definitionService';
import { usePageLoading } from '../../hooks/usePageLoading';
import type { Definition } from '../../types/debate';

const DefinitionSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get('keyword') ?? '';
  const [keyword, setKeyword] = useState(initialKeyword);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const { isLoading, showLoadingUI, error, executeAsync } = usePageLoading();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadDefinitions = async () => {
      setMessage('');
      const result = await executeAsync(async () => {
        const { data } = await definitionService.search(initialKeyword);
        return data;
      });
      
      if (result) {
        setDefinitions(result.definitions);
        if (result.definitions.length === 0) {
          setMessage('검색된 기준 정의가 없습니다.');
        }
      }
    };

    void loadDefinitions();
  }, [initialKeyword, executeAsync]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextKeyword = keyword.trim();
    setSearchParams(nextKeyword ? { keyword: nextKeyword } : {});
  };

  return (
    <Wrapper>
      <HeaderRow>
        <BackButton type="button" onClick={() => navigate(-1)}>
          ←
        </BackButton>
        <Title>기준 정의 검색</Title>
      </HeaderRow>

      <SearchForm onSubmit={handleSubmit}>
        <SearchInput
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="용어 또는 내용을 검색하세요"
        />
        <SearchButton type="submit">검색</SearchButton>
      </SearchForm>

      {error && <StateText>{error}</StateText>}
      {!isLoading && message && <StateText>{message}</StateText>}

      <ResultList>
        <LoadingContent
          isLoading={isLoading}
          showLoadingUI={showLoadingUI}
          skeleton={<DefinitionListSkeleton count={3} />}
        >
          {definitions.map((definition) => (
          <DefinitionCard key={definition.id}>
            <DefinitionTerm>{definition.term}</DefinitionTerm>
            <DefinitionContent>{definition.content}</DefinitionContent>
            {definition.sourceDebate && (
              <SourceButton
                type="button"
                onClick={() => navigate(`/debate/${definition.sourceDebate!.id}`)}
              >
                출처 토론 보기 · {definition.sourceDebate.title}
              </SourceButton>
            )}
            {definition.sourceConsensus && (
              <SourceMeta>출처 합의안 · {definition.sourceConsensus.title}</SourceMeta>
            )}
          </DefinitionCard>
          ))}
        </LoadingContent>
      </ResultList>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  min-height: 100dvh;
  background: #f5f5f5;
  padding: clamp(20px, 5.6vw, 24px) var(--page-x) clamp(26px, 7vw, 30px);
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
`;

const BackButton = styled.button`
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #353535;
  font-size: 24px;
`;

const Title = styled.h1`
  margin: 0;
  color: #2f3238;
  font-size: clamp(22px, 6vw, 28px);
  line-height: 1.25;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 44px;
  border: 1px solid #e0e0e0;
  border-radius: 999px;
  background: #ffffff;
  padding: 0 14px;
  color: #555555;
  font-size: var(--body-sm);
`;

const SearchButton = styled.button`
  height: 44px;
  border: none;
  border-radius: 999px;
  background: #2dcd97;
  color: #ffffff;
  padding: 0 16px;
  font-size: var(--body-sm);
  font-weight: 700;
`;

const StateText = styled.p`
  margin: 8px 0 14px;
  color: #8f8f8f;
  font-size: var(--body-sm);
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DefinitionCard = styled.article`
  border-radius: var(--card-radius);
  background: #ffffff;
  padding: 14px;
`;

const DefinitionTerm = styled.h2`
  margin: 0 0 8px;
  color: #555555;
  font-size: var(--body-md);
  line-height: 1.35;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const DefinitionContent = styled.p`
  margin: 0;
  color: #8f8f8f;
  font-size: var(--body-sm);
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const SourceButton = styled.button`
  margin-top: 12px;
  border: none;
  background: transparent;
  color: #2dcd97;
  padding: 0;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
`;

const SourceMeta = styled.p`
  margin: 8px 0 0;
  color: #a0a0a0;
  font-size: 12px;
`;

export default DefinitionSearchPage;
