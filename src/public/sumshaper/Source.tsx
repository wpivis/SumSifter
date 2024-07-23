import React, { useCallback, useEffect, useMemo } from 'react';
import {
  IconArrowBack, IconCirclePlus, IconPencil, IconNotebook, IconWritingSign, IconMail,
} from '@tabler/icons-react';
import {
  Title, ScrollArea, Badge, Input, ActionIcon, Tooltip, Divider, Box, Modal, Textarea, Button,
} from '@mantine/core';
import { useFocusTrap } from '@mantine/hooks';
import style from './sumsifter.module.css';
import Markdown from './Markdown';

const API_BASE_URL = import.meta.env.VITE_SUMSIFTER_API_URL;

interface SourceProps {
  conversationId: string;
  sourceList: { id: string; text: string, sources: string[] }[];
  activeSourceId: string | null;
  onSourceBadgePositionChange: (badgeLeft: number, badgeTop: number) => void;
  onAddToSummary: (conversationId:string, text: string, prompt: string) => void;
}

function Source({
  conversationId,
  sourceList, activeSourceId, onSourceBadgePositionChange, onAddToSummary,
}: SourceProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const activeRef = React.useRef<HTMLSpanElement | null>(null);
  const [positionTop, setPositionTop] = React.useState(0);
  const [positionLeft, setPositionLeft] = React.useState(0);
  const [userSelection, setUserSelection] = React.useState<string | null>(null);
  const [userSelectionRect, setUserSelectionRect] = React.useState<DOMRect | null>(null);
  const [sourceQuery, setSourceQuery] = React.useState<string>('');
  const [highlightClientRects, setHighlightClientRects] = React.useState<DOMRect[] | null>(null);
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [issues, setIssues] = React.useState<Array<Record<string, string>>>([]);
  const [issuesModalVisible, setIssuesModalVisible] = React.useState(false);
  const [emailContent, setEmailContent] = React.useState<string | null>(null);
  const [emailModalVisible, setEmailModalVisible] = React.useState(false);

  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      const handleScroll = () => {
        if (element && activeRef.current) {
          setPositionLeft(element.getBoundingClientRect().left);
          setPositionTop(activeRef.current.getBoundingClientRect().top);
          onSourceBadgePositionChange(element.getBoundingClientRect().left, activeRef.current.getBoundingClientRect().top);
        }
      };
      element.addEventListener('scroll', handleScroll);

      return () => {
        element.removeEventListener('scroll', handleScroll);
      };
    }
    return () => { };
  }, [ref, onSourceBadgePositionChange]);

  const handleActiveRefChange = useCallback((e: HTMLDivElement | null) => {
    activeRef.current = e;
  }, []);

  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      const handleMouseUp = () => {
        const selection = window.getSelection();
        if (selection && selection.toString() !== '') {
          setUserSelection(selection.toString());
          setUserSelectionRect(selection.getRangeAt(0).getBoundingClientRect());

          const range = selection.getRangeAt(0);
          setHighlightClientRects(Array.from(range.getClientRects()).map((rect) => (
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
        setSourceQuery('');
      };
      window.addEventListener('mousedown', removeHighlight);
      return () => {
        window.removeEventListener('mousedown', removeHighlight);
      };
    }
    return () => { };
  }, [highlightClientRects]);

  useEffect(() => {
    if (ref.current && activeRef.current) {
      const element = ref.current;
      setPositionLeft(element.getBoundingClientRect().left);
      setPositionTop(activeRef.current.getBoundingClientRect().top);
      onSourceBadgePositionChange(element.getBoundingClientRect().left, activeRef.current.getBoundingClientRect().top);
    }
  }, [activeSourceId, onSourceBadgePositionChange]);

  const userSelectionActionBox = useMemo(() => ({
    top: (userSelectionRect?.top || 0) - (contentRef.current?.getBoundingClientRect().top || 0),
    left: 0,
    bottom: (userSelectionRect?.bottom || 0) - (contentRef.current?.getBoundingClientRect().top || 0),
  }), [userSelectionRect, contentRef]);

  const handleAddToSummary = useCallback(() => {
    onAddToSummary(conversationId, userSelection || '', 'Include this to the summary. Add more details about this. Use it in the context of the entire summary and do not just copy paste. ');
    setUserSelection(null);
    setHighlightClientRects(null);
  }, [userSelection, conversationId, onAddToSummary]);

  const handleMakeDescriptive = useCallback(() => {
    onAddToSummary(conversationId, userSelection || '', 'Include this to the summary and make this more descriptive. Add more details about this and similify the language so that it is more readable.');
    setUserSelection(null);
    setHighlightClientRects(null);
  }, [userSelection, conversationId, onAddToSummary]);

  const handleCreateTicket = useCallback(() => {
    setPopupVisible(true);
    setHighlightClientRects(null);
  }, []);

  const handleCreateEmail = useCallback(async () => {
    if (userSelection) {
      const response = await fetch(`${API_BASE_URL}/summaries/generate-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          documentId: '2024 Problem Book_sumsifter_short_2.docx',
          promptType: 'general',
          sourceTargetText: null,
          summaryTargetText: null,
          prompt: userSelection,
        }),
      });

      const data = await response.json();
      const emailContentWithSelection = `${data.emailContent}\n\n---\nText of Interest from the Report:\n${userSelection}`;
      setEmailContent(emailContentWithSelection);
      setEmailModalVisible(true);
    }
  }, [userSelection, conversationId]);

  const handleSourceQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSourceQuery(event.target.value);
  }, []);

  const handleSourceQueryKeyUp = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onAddToSummary(conversationId, userSelection || '', sourceQuery);
      setSourceQuery('');
      setUserSelection(null);
      setHighlightClientRects(null);
    }
  }, [sourceQuery, userSelection, onAddToSummary, conversationId]);

  const handleFormSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const issue = event.currentTarget.issue.value;
    const documentTitle = event.currentTarget.documentTitle.value;
    const summary = event.currentTarget.summary.value;
    const description = event.currentTarget.description.value;
    const priority = event.currentTarget.priority.value;

    const newIssue = {
      issue,
      documentTitle,
      summary,
      description,
      priority,
    };

    setIssues((prevIssues) => [...prevIssues, newIssue]);
    setPopupVisible(false);
  }, []);

  const handlePrintIssues = useCallback(() => {
    setIssuesModalVisible(true);
  }, [issues]);

  return (
    <>
      <ScrollArea
        style={{
          height: 'calc(100vh - 160px)',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
          border: '1px solid #d0d0d0',
          // background: '#f6f6f6',
          padding: 0,
          borderRadius: 10,
        }}
        pos="relative"
        viewportRef={ref}
      >
        <div ref={contentRef} style={{ position: 'relative', padding: 5 }}>
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

          <Title order={2}>Source Document</Title>

          <Box pos="relative">
            <Markdown
              data={sourceList}
              activeId={activeSourceId}
              activeSourceId={null}
              onActiveRefChange={handleActiveRefChange}
            />
          </Box>

          {userSelection && (
            <div
              className={style.sourceContextPopup}
              style={{
                top: userSelectionActionBox.bottom,
                left: userSelectionActionBox.left,
              }}
              onMouseDown={(e) => { e.stopPropagation(); }}
            >
              <Tooltip label="Include in summary" position="bottom" arrowOffset={50} arrowSize={8} withArrow>
                <ActionIcon variant="transparent" size="md" color="gray" onClick={handleAddToSummary}>
                  <IconCirclePlus />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Simplify and add to Summary" position="bottom" arrowOffset={50} arrowSize={8} withArrow>
                <ActionIcon variant="transparent" size="md" color="gray" onClick={handleMakeDescriptive}>
                  <IconPencil />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Create Custom Notes" position="bottom" arrowOffset={50} arrowSize={8} withArrow>
                <ActionIcon variant="transparent" size="md" color="gray" onClick={handleCreateTicket}>
                  <IconWritingSign />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Open Collected Notes" position="bottom" arrowOffset={50} arrowSize={8} withArrow>
                <ActionIcon variant="transparent" size="md" color="gray" onClick={handlePrintIssues}>
                  <IconNotebook />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Create Email" position="bottom" arrowOffset={50} arrowSize={8} withArrow>
                <ActionIcon variant="transparent" size="md" color="gray" onClick={handleCreateEmail}>
                  <IconMail />
                </ActionIcon>
              </Tooltip>
              <Divider orientation="vertical" />
              <Input
                ref={focusTrapRef}
                size="xs"
                value={sourceQuery}
                onChange={handleSourceQueryChange}
                onKeyUp={handleSourceQueryKeyUp}
                flex={1}
                ml={4}
                placeholder="What do you want to do with this selection to shape the summary?"
                rightSection={
                  sourceQuery.length ? (
                    <IconArrowBack
                      color="var(--mantine-color-gray-5)"
                    />
                  ) : null
                }
              />
            </div>
          )}

          {activeSourceId && (
            <>
              <Badge
                key={activeSourceId}
                className={style.sourceItemBadge}
                color="blue.5"
                style={{
                  position: 'fixed',
                  left: positionLeft - 10,
                  top: positionTop,
                  transform: 'translate(-100%, 0)',
                }}
              >
                {activeSourceId}
              </Badge>
              <div style={{
                position: 'fixed',
                left: positionLeft - 10,
                top: positionTop + 16,
                backgroundColor: 'var(--mantine-color-blue-5)',
                height: 2,
                width: 4,
              }}
              />
            </>
          )}
        </div>
      </ScrollArea>

      <Modal
        opened={popupVisible}
        onClose={() => setPopupVisible(false)}
        title="Add / Create Custom Notes"
      >
        <form onSubmit={handleFormSubmit} className={style.modalForm}>
          <div className={style.formGroup}>
            <label htmlFor="issue" className={style.formLabel}>Topic:</label>
            <select id="issue" name="issue" className={style.formSelect} required>
              <option value="technicalReview">Technical Review</option>
              <option value="translationReview">Translation Support from Language Analyst</option>
            </select>
          </div>

          <div className={style.formGroup}>
            <label htmlFor="documentTitle" className={style.formLabel}>Document Title:</label>
            <input type="text" id="documentTitle" name="documentTitle" className={style.formInput} required />
          </div>

          <div className={style.formGroup}>
            <label htmlFor="summary" className={style.formLabel}>Notes:</label>
            <input type="text" id="summary" name="summary" className={style.formInput} required />
          </div>

          <div className={style.formGroup}>
            <label htmlFor="description" className={style.formLabel}>Text of Interest:</label>
            <textarea id="description" name="description" rows={6} className={style.formTextarea} required defaultValue={userSelection || ''} />
          </div>

          <div className={style.formGroup}>
            <label htmlFor="priority" className={style.formLabel}>Priority Level:</label>
            <select id="priority" name="priority" className={style.formSelect} required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className={style.buttonGroup}>
            <Button type="submit" className={style.formButton}>Add / Create</Button>
            <Button type="button" onClick={() => setPopupVisible(false)} className={style.formButton}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal
        opened={issuesModalVisible}
        onClose={() => setIssuesModalVisible(false)}
        title="Open Collected Notes"
      >
        <Textarea
          readOnly
          value={issues.map((issue, index) => (
            `Note${index + 1}:
            Issue Type: ${issue.issue}
            Document Title: ${issue.documentTitle}
            Summary: ${issue.summary}
            Description: ${issue.description}
            Priority: ${issue.priority}`
          )).join('\n\n')}
          rows={10}
          style={{ width: '100%' }}
        />
        <Button onClick={() => setIssuesModalVisible(false)}>Close</Button>
      </Modal>

      <Modal
        opened={emailModalVisible}
        onClose={() => setEmailModalVisible(false)}
        title="AI Generated Email Content"
      >
        <Textarea
          readOnly
          value={emailContent || ''}
          rows={20}
          style={{ width: '100%' }}
        />
        <Button onClick={() => setEmailModalVisible(false)}>Close</Button>
      </Modal>
    </>
  );
}

export default Source;
