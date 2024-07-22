import {
  memo, useCallback, useEffect, useMemo, useState,
} from 'react';
import {
  Box, Flex, Grid, Loader, ScrollArea,
} from '@mantine/core';
import { initializeTrrack, Registry } from '@trrack/core';
import Summary from './Summary';
import { StimulusParams } from '../../store/types';
import {
  SumGlobalSummary, SumParams, SumSource, SumSummary,
} from './types';
import Source from './Source';
import GlobalSummary from './GlobalSummary';

const API_BASE_URL = import.meta.env.VITE_SUMSIFTER_API_URL;

function SummaryApp({ parameters, setAnswer }: StimulusParams<SumParams>) {
  const [activeSummaryBlockId, setActiveSummaryBlockId] = useState<string | null>(null);
  const [activeSourceBlockId, setActiveSourceBlockId] = useState<string | null>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [summaryBadgeTop, setSummaryBadgeTop] = useState(0);
  const [sourceBadgeTop, setSourceBadgeTop] = useState(0);
  const [sourceBadgeLeft, setSourceBadgeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [queryText, setQueryText] = useState('');

  const [globalSummary, setGlobalSummary] = useState<SumGlobalSummary | null>(null);
  const [localSummaries, setLocalSummaries] = useState<SumSummary[]>([]);
  const [sources, setSources] = useState<SumSource[]>([]);

  const [activeDocumentId, setActiveDocumentId] = useState<number | null>(null);

  // const [documentIds, setDocumentIds] = useState<string[]>([]);

  const { prompt: defaultPrompt, documents: _documentIds } = parameters;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const documentIds = useMemo(() => _documentIds, []);

  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();

    const mouseHoverAction = reg.register('mouseHover', (state, mouseEnter: { summaryId: string | null, sourceId: string | null }) => {
      state.activeSummaryId = mouseEnter.summaryId;
      state.activeSourceId = mouseEnter.sourceId;
      return state;
    });

    const trrackInst = initializeTrrack({
      registry: reg,
      initialState: {
        activeSummaryId: null, activeSourceId: null,
      },
    });

    return {
      actions: {
        mouseHoverAction,
      },
      trrack: trrackInst,
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/summaries/generate-multiple/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: null,
          documentIds,
          promptType: 'general',
          prompt: defaultPrompt,
        }),
      });

      const { summary, conversationId: globalConversationId, individualDocuments } = await response.json();

      setGlobalSummary({
        content: summary,
        id: 0,
        conversationId: globalConversationId,
      });

      const sourceList: SumSource[] = [];
      const summaryList: SumSummary[] = [];

      individualDocuments.forEach(({ conversationId: docConversationId, source, summary: docSummary }: {conversationId: string, source: { id: string, text: string, sources: string[] }[], summary: { id: string, text: string, sources: string[] }[]}, idx: number) => {
        sourceList.push({
          id: idx,
          content: source,
        });
        summaryList.push({
          id: idx,
          conversationId: docConversationId,
          content: docSummary,
        });
      });

      setLocalSummaries(summaryList);
      setSources(sourceList);
      setIsLoading(false);
    }

    fetchData();
  }, [defaultPrompt, documentIds]);

  const handleSourceClick = useCallback((summaryId: string | null, sourceId: string | null) => {
    trrack.apply('Clicked', actions.mouseHoverAction({ summaryId, sourceId }));

    setAnswer({
      status: true,
      provenanceGraph: trrack.graph.backend,
      answers: {},
    });

    setActiveSummaryBlockId(summaryId);
    setActiveSourceBlockId(sourceId);
  }, [actions, trrack, setAnswer]);

  const handleSummaryBadgePositionChange = useCallback((top: number) => {
    setSummaryBadgeTop(top);
  }, []);

  const handleSourceBadgePositionChange = useCallback((left: number, top: number) => {
    setSourceBadgeTop(top);
    setSourceBadgeLeft(left);
  }, []);

  const handleSubmitQuery = useCallback((queryPrompt: string) => {
    async function fetchData() {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/summaries/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          documentId: null, // TODO: change this to studyDocument
          promptType: 'general',
          prompt: queryPrompt,
        }),
      });
      const data = await response.json();

      const summary = data.summary.map((sentenceObj: { text: string, sources: string[] }, idx: number) => ({
        id: String(idx),
        text: sentenceObj.text,
        sources: sentenceObj.sources,
      }));

      const source = data.source.map((sourceObj: { id: string, text: string }) => ({
        id: sourceObj.id,
        text: sourceObj.text,
      }));

      // setSummaryData(summary);
      // setSourcesData(source);
      setIsLoading(false);
    }

    fetchData();
  }, [conversationId]);

  const handleUpdateSummary = useCallback((summaryText: string, sourcePrompt: string) => {
    async function fetchData() {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/summaries/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          documentId: null, // TODO: change this to studyDocument
          promptType: 'summary',
          summaryTargetText: summaryText,
          prompt: sourcePrompt,
        }),
      });
      const data = await response.json();

      const summary = data.summary.map((sentenceObj: { text: string, sources: string[] }, idx: number) => ({
        id: String(idx),
        text: sentenceObj.text,
        sources: sentenceObj.sources,
      }));

      const source = data.source.map((sourceObj: { id: string, text: string }) => ({
        id: sourceObj.id,
        text: sourceObj.text,
      }));

      // setSummaryData(summary);
      // setSourcesData(source);
      setIsLoading(false);
    }

    fetchData();
  }, [conversationId]);

  const handleAddToSummary = useCallback((sourceText: string, sourcePrompt: string) => {
    async function fetchData() {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/summaries/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          documentId: null, // TODO: change this to studyDocument
          promptType: 'source',
          sourceTargetText: sourceText,
          prompt: sourcePrompt,
        }),
      });
      const data = await response.json();

      const summary = data.summary.map((sentenceObj: { text: string, sources: string[] }, idx: number) => ({
        id: String(idx),
        text: sentenceObj.text,
        sources: sentenceObj.sources,
      }));

      const source = data.source.map((sourceObj: { id: string, text: string }) => ({
        id: sourceObj.id,
        text: sourceObj.text,
      }));

      // setSummaryData(summary);
      // setSourcesData(source);
      setIsLoading(false);
    }

    fetchData();
  }, [conversationId]);

  const updateActiveDocumentId = useCallback((documentId: number) => {
    setActiveDocumentId(documentId);
    setActiveSummaryBlockId(null);
    setActiveSourceBlockId(null);
  }, []);

  return (
    <>
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          // transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          height: '100vh',
          width: '100vw',
          background: 'rgba(255, 255, 255, 0.9)',
        }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
          >
            <Loader color="blue" />
            <div>
              Please wait while we summarize the document...
            </div>
          </div>
        </div>
      )}
      <Grid gutter={50} style={{ borderBottom: '1px solid #ddd', marginBottom: '10px', paddingBottom: '10px' }}>
        <Grid.Col span={4} pos="relative">
          {globalSummary && (
            <GlobalSummary
              sentences={globalSummary.content}
              onQueryTextChange={() => {}}
              queryText=""
              onSubmitQuery={() => {}}
              onSourceClick={(_, docSummaryId) => {
                if (docSummaryId) {
                  const documentId = +docSummaryId - 1;
                  updateActiveDocumentId(documentId);
                }
              }}
              onUpdateSummary={() => {}}
            />
          )}
        </Grid.Col>
        <Grid.Col span={4} pos="relative">
          <ScrollArea offsetScrollbars>
            <Flex>
              {localSummaries.map((summary, idx) => (
                <Box
                  key={idx}
                  style={{
                    backgroundColor: activeDocumentId === summary.id ? 'var(--mantine-color-blue-1)' : 'var(--mantine-color-gray-1)',
                    border: '1px solid #ddd',
                    borderRadius: 5,
                    padding: 5,
                    margin: 5,
                    width: 100,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => updateActiveDocumentId(summary.id)}
                >
                  Doc
                  {' '}
                  {idx + 1}
                </Box>
              ))}
            </Flex>
          </ScrollArea>
          {activeDocumentId !== null && (
            <Summary
              sentences={localSummaries[activeDocumentId].content}
              onSummaryBadgePositionChange={handleSummaryBadgePositionChange}
              onSourceClick={handleSourceClick}
              activeSummaryId={activeSummaryBlockId}
              activeSourceId={activeSourceBlockId}
              onSubmitQuery={handleSubmitQuery}
              queryText={queryText}
              onQueryTextChange={setQueryText}
              onUpdateSummary={handleUpdateSummary}
            />
          )}
        </Grid.Col>
        <Grid.Col span={4}>
          {activeDocumentId !== null && (
            <Source
              sourceList={sources[activeDocumentId].content}
              onSourceBadgePositionChange={handleSourceBadgePositionChange}
              activeSourceId={activeSourceBlockId}
              onAddToSummary={handleAddToSummary}
            />
          )}
        </Grid.Col>
      </Grid>
      {activeSourceBlockId && (
        <div style={{
          position: 'fixed',
          top: (summaryBadgeTop > sourceBadgeTop ? sourceBadgeTop : summaryBadgeTop) + 18,
          left: sourceBadgeLeft - 10,
          width: 2,
          height: Math.abs(summaryBadgeTop - sourceBadgeTop) - (summaryBadgeTop > sourceBadgeTop ? -2 : 2),
          backgroundColor: 'var(--mantine-color-blue-5)',
        }}
        />
      )}
    </>
  );
}

export default memo(SummaryApp);
