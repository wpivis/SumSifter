import React, {
  memo, useCallback, useEffect, useMemo,
} from 'react';
import {
  Title, ScrollArea, Box, Textarea, Tooltip, ActionIcon, Divider, Input,
} from '@mantine/core';
import {
  IconArrowBack, IconCircleMinus, IconPencil, IconSend2,
} from '@tabler/icons-react';
import { useFocusTrap } from '@mantine/hooks';
import Markdown from './Markdown';
import style from './sumsifter.module.css';

interface SummaryProps {
  conversationId: string;
  sentences: { id: string, text: string; sources: string[] }[];
  onSourceClick: (summaryId: string | null, sourceId: string | null) => void;
  activeSummaryId: string | null;
  activeSourceId: string | null;
  onSummaryBadgePositionChange: (badgeTop: number) => void;
  onSubmitQuery: (conversationId: string, queryText: string) => void;
  queryText: string;
  onQueryTextChange: (queryText: string) => void;
  onUpdateSummary: (conversationId: string, text: string, prompt: string) => void;
}

function Summary({
  conversationId,
  sentences,
  onSourceClick,
  activeSummaryId,
  activeSourceId,
  onSummaryBadgePositionChange,
  onSubmitQuery,
  queryText,
  onQueryTextChange,
  onUpdateSummary,
}: SummaryProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const activeRef = React.useRef<HTMLSpanElement | null>(null);
  const [positionTop, setPositionTop] = React.useState(0);
  const [positionLeft, setPositionLeft] = React.useState(0);
  const [positionLeftSummary, setPositionLeftSummary] = React.useState(0);

  const [userSelection, setUserSelection] = React.useState<string | null>(null);
  const [userSelectionRect, setUserSelectionRect] = React.useState<DOMRect | null>(null);
  const [summaryQuery, setSummaryQuery] = React.useState<string>('');
  const [highlightClientRects, setHighlightClientRects] = React.useState<DOMRect[] | null>(null);

  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      const handleScroll = () => {
        setPositionTop(activeRef.current?.getBoundingClientRect().top || 0);
        setPositionLeftSummary(activeRef.current?.getBoundingClientRect().left || 0);
        setPositionLeft(ref.current?.getBoundingClientRect().right || 0);
        onSummaryBadgePositionChange(activeRef.current?.getBoundingClientRect().top || 0);
      };
      ref.current.addEventListener('scroll', handleScroll);

      return () => {
        element.removeEventListener('scroll', handleScroll);
      };
    }
    return () => { };
  }, [ref, onSummaryBadgePositionChange]);

  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
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
  }, [userSelection, conversationId, onUpdateSummary]);

  const handleMakeDescriptive = useCallback(() => {
    onUpdateSummary(conversationId, userSelection || '', 'Make this more descriptive. Add more details about this and similify the language. Add more references from the source to enhance the explanation and readability.');
    setUserSelection(null);
    setHighlightClientRects(null);
  }, [userSelection, conversationId, onUpdateSummary]);

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
  }, [summaryQuery, conversationId, userSelection, onUpdateSummary]);

  const handleSourceClick = useCallback((elem: HTMLDivElement | null, summaryId: string | null, sourceId: string | null) => {
    onSourceClick(summaryId, sourceId);
    onSummaryBadgePositionChange(elem?.getBoundingClientRect().top || 0);
    activeRef.current = elem;
    setPositionTop(elem?.getBoundingClientRect().top || 0);
    setPositionLeftSummary(elem?.getBoundingClientRect().left || 0);
    setPositionLeft(ref.current?.getBoundingClientRect().right || 0);
  }, [onSourceClick, onSummaryBadgePositionChange]);

  return (
    <ScrollArea
      style={{ height: 'calc(100vh - 220px)' }}
      pos="relative"
      viewportRef={ref}
      scrollbars="y"
      offsetScrollbars
    >
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
        <Title order={2} mb={16}>Document Summary</Title>
        <Box pos="relative">
          <Markdown
            data={sentences}
            activeSourceId={activeSourceId}
            activeId={activeSummaryId}
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

      </div>
      <Box
        display="flex"
        pos="sticky"
        bottom={-1}
        pb={10}
        pt={10}
        mt={10}
        bg="#fff"
        style={{ borderTop: '1px solid #ddd' }}
      >
        <Textarea
          minRows={1}
          maxRows={4}
          autosize
          placeholder="Message LLM"
          value={queryText}
          onChange={(e) => { onQueryTextChange(e.target.value); }}
          mr={10}
          flex={1}
          rightSection={(
            <ActionIcon variant="subtle" aria-label="Send" onClick={() => onSubmitQuery(conversationId, queryText)}>
              <IconSend2 />
            </ActionIcon>
            )}
        />
      </Box>
      {activeSummaryId && (
      <div style={{
        position: 'fixed',
        top: positionTop + 18,
        left: positionLeftSummary + 5,
        backgroundColor: 'var(--mantine-color-blue-5)',
        height: 2,
        width: positionLeft - positionLeftSummary + 8,
      }}
      />
      )}
    </ScrollArea>
  );
}

export default memo(Summary);