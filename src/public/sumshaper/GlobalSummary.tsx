import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Title, ScrollArea, Box, Textarea, Button, Tooltip, ActionIcon, Divider, Input,
} from '@mantine/core';
import { IconArrowBack, IconCircleMinus, IconPencil } from '@tabler/icons-react';
import { useFocusTrap } from '@mantine/hooks';
import Markdown from './Markdown';
import style from './sumsifter.module.css';
import { SumContent } from './types';

interface GlobalSummaryProps {
  conversationId: string;
  sentences: SumContent[];
  onSourceClick: (summaryBlockId: string | null, documentId: string | null) => void;
  onSubmitQuery: (conversationId: string, queryText: string) => void;
  queryText: string;
  onQueryTextChange: (queryText: string) => void;
  onUpdateSummary: (conversationId: string, text: string, prompt: string) => void;
}

function GlobalSummary({
  conversationId,
  sentences,
  onSourceClick,
  onSubmitQuery,
  queryText,
  onQueryTextChange,
  onUpdateSummary,
}: GlobalSummaryProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const activeRef = React.useRef<HTMLSpanElement | null>(null);

  const [userSelection, setUserSelection] = React.useState<string | null>(null);
  const [userSelectionRect, setUserSelectionRect] = React.useState<DOMRect | null>(null);
  const [summaryQuery, setSummaryQuery] = React.useState<string>('');
  const [highlightClientRects, setHighlightClientRects] = React.useState<DOMRect[] | null>(null);

  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      const handleMouseUp = () => {
        // get selected text
        const selection = window.getSelection();
        if (selection && selection.toString() !== '') {
          setUserSelection(selection.toString());

          // get the bounding box of the selection
          setUserSelectionRect(selection.getRangeAt(0).getBoundingClientRect());

          const ranges = selection.getRangeAt(0);

          setHighlightClientRects(Array.from(ranges.getClientRects()).map((rect) => (
            new DOMRect(
              rect.left - (contentRef.current?.getBoundingClientRect().left || 0),
              rect.top - (contentRef.current?.getBoundingClientRect().top || 0),
              rect.width,
              rect.height,
            )
          )));
        }
      };

      element.addEventListener('mouseup', handleMouseUp);
      return () => {
        element.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return () => { };
  }, [ref]);

  useEffect(() => {
    if (highlightClientRects) {
      const removeHighlight = () => {
        setHighlightClientRects(null);
        setUserSelection(null);
        setSummaryQuery('');
      };
      window.addEventListener('mousedown', removeHighlight);
      return () => {
        window.removeEventListener('mousedown', removeHighlight);
      };
    }
    return () => { };
  }, [highlightClientRects]);

  const userSelectionActionBox = useMemo(() => ({
    top: (userSelectionRect?.top || 0) - (contentRef.current?.getBoundingClientRect().top || 0),
    left: 0,
    bottom: (userSelectionRect?.bottom || 0) - (contentRef.current?.getBoundingClientRect().top || 0),
  }), [userSelectionRect, contentRef]);

  const handleRemoveFromSummary = useCallback(() => {
    onUpdateSummary(conversationId, userSelection || '', 'Remove this from the summary.');
    setUserSelection(null);
    setHighlightClientRects(null);
  }, [userSelection, onUpdateSummary, conversationId]);

  const handleMakeDescriptive = useCallback(() => {
    onUpdateSummary(conversationId, userSelection || '', 'Make this more descriptive. Add more details and similify the language. Add more details from the source to enhance the explanation and readability.');
    setUserSelection(null);
    setHighlightClientRects(null);
  }, [userSelection, onUpdateSummary, conversationId]);

  const handleSummaryQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSummaryQuery(event.target.value);
  }, []);

  const handleSummaryQueryKeyUp = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onUpdateSummary(conversationId, userSelection || '', summaryQuery);
      setSummaryQuery('');
      setUserSelection(null);
      setHighlightClientRects(null);
    }
  }, [summaryQuery, userSelection, onUpdateSummary, conversationId]);

  const handleSourceClick = useCallback((elem: HTMLDivElement | null, summaryId: string | null, sourceId: string | null) => {
    onSourceClick(summaryId, sourceId);
    activeRef.current = elem;
  }, [onSourceClick]);

  return (
    <ScrollArea style={{ height: 'calc(100vh - 160px)' }} pos="relative" viewportRef={ref}>
      <div ref={contentRef} style={{ position: 'relative' }}>
        {/* background highlight */}
        {highlightClientRects && (
          <div className={style.textHighlightContainer}>
            {highlightClientRects.map((rect, index) => (
              <div
                key={index}
                className={style.textHighlight}
                style={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                }}
              />
            ))}
          </div>
        )}
        <Title order={2} mb={16}>Global Summary</Title>
        <Box pos="relative">
          <Markdown
            data={sentences}
            activeSourceId={null}
            activeId={null}
            onSourceClick={handleSourceClick}
          />
        </Box>

        {userSelection && (
          <div
            className={style.summaryContextPopup}
            style={{
              top: userSelectionActionBox.bottom,
              left: userSelectionActionBox.left,
            }}
            onMouseDown={(e) => { e.stopPropagation(); }}
          >
            <Tooltip label="Remove from summary" position="bottom" arrowOffset={50} arrowSize={8} withArrow>
              <ActionIcon variant="transparent" size="md" color="gray" onClick={handleRemoveFromSummary}>
                <IconCircleMinus />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Simplify" position="bottom" arrowOffset={50} arrowSize={8} withArrow>
              <ActionIcon variant="transparent" size="md" color="gray" onClick={handleMakeDescriptive}>
                <IconPencil />
              </ActionIcon>
            </Tooltip>
            <Divider orientation="vertical" />
            <Input
              ref={focusTrapRef}
              size="xs"
              value={summaryQuery}
              onChange={handleSummaryQueryChange}
              onKeyUp={handleSummaryQueryKeyUp}
              flex={1}
              ml={4}
              placeholder="What do you want to do this selection?"
              rightSection={
                (
                  (summaryQuery.length ? (
                    <IconArrowBack
                      color="var(--mantine-color-gray-5)"
                    />
                  ) : null)
                )
              }
            />
          </div>
        )}

        <Box display="flex" pos="sticky" bottom={0} pt={10} mt={10} bg="#fff" style={{ borderTop: '1px solid #ddd' }}>
          <Textarea minRows={1} maxRows={4} autosize placeholder="Message LLM." value={queryText} onChange={(e) => { onQueryTextChange(e.target.value); }} mr={10} flex={1} />
          <Button onClick={() => { onSubmitQuery(conversationId, queryText); }}>Send</Button>
        </Box>
      </div>
    </ScrollArea>
  );
}

export default GlobalSummary;
