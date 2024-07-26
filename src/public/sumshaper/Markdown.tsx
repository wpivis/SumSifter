import Markdown from 'react-markdown';
import { Fragment } from 'react/jsx-runtime';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import {
  memo, useCallback, useEffect, useRef, useState,
} from 'react';
import style from './sumsifter.module.css';

const API_BASE_URL = import.meta.env.VITE_SUMSIFTER_API_URL;

function SourceItem({
  source, isBlockHovered, setIsBlockHovered, onClick, active,
}: {
  active: boolean,
  source: string,
  isBlockHovered: boolean,
  setIsBlockHovered: (_: boolean) => void,
  onClick: (_: HTMLDivElement, __: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleSourceClick = useCallback(() => {
    if (ref.current) {
      onClick(ref.current, source);
    }
  }, [source, onClick]);

  return (
    <div
      ref={ref}
      className={`${style.badge} ${isBlockHovered ? style.badgeHovered : ''} ${active ? style.badgeActive : ''}`}
      onMouseEnter={() => setIsBlockHovered(true)}
      onMouseLeave={() => setIsBlockHovered(false)}
      onClick={handleSourceClick}
    >
      {source}
    </div>
  );
}

function ReactMarkdown({ text, onImageSelection }: { text: string, onImageSelection?: (_: HTMLImageElement) => void }) {
  const handleImageSelection = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (onImageSelection) {
      onImageSelection(e.currentTarget);
    }
  }, [onImageSelection]);

  return (
    <Markdown
      rehypePlugins={[rehypeRaw, remarkGfm]}
      components={{
        // eslint-disable-next-line react/no-unstable-nested-components
        p: (props) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, react/prop-types
          const { node, children, ...rest } = props;
          return (
            <div style={{ display: 'inline' }} {...rest}>
              {children}
            </div>
          );
        },
        // eslint-disable-next-line react/no-unstable-nested-components
        table: (props) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, react/prop-types
          const { node, ...rest } = props;
          return <table className={style.markdownTable} {...rest} />;
        },
        // eslint-disable-next-line react/no-unstable-nested-components
        img: (props) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, react/prop-types
          const { node, src, ...rest } = props;
          return <img style={{ width: '100%' }} src={`${API_BASE_URL}/${src}`} {...rest} onClick={handleImageSelection} />;
        },
      }}
    >
      {text}
    </Markdown>
  );
}

const MemoizedReactMarkdown = memo(ReactMarkdown);

function MarkdownElement({
  element,
  active,
  activeSourceId,
  onSourceClick,
  onActiveRefChange,
  onImageSelection,
}: {
  element: {
    id: string;
    text: string;
    sources?: string[]
  },
  onSourceClick?: (
    elem: HTMLDivElement | null,
    id: string | null,
    sourceId: string | null
  ) => void
  active: boolean;
  activeSourceId: string | null;
  onActiveRefChange?: (_: HTMLDivElement | null) => void;
  onImageSelection?: (_: HTMLImageElement) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSourceClick = useCallback((elem: HTMLDivElement, sourceId: string | null) => {
    if (onSourceClick) {
      onSourceClick(elem, element.id, sourceId);
    }
  }, [element.id, onSourceClick]);

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (onActiveRefChange) {
        onActiveRefChange(ref.current);
      }
    }
  }, [active, onActiveRefChange]);

  return (
    <Fragment>
      {' '}
      <div
        ref={ref}
        style={
          {
            display: 'inline',
            backgroundColor: active ? '#f0f0f0' : 'transparent',
          }
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <MemoizedReactMarkdown
          text={element.text}
          onImageSelection={onImageSelection}
        />
      </div>

      {((element.sources?.length ?? 0) > 0)
        && (
          <div className={style.badgeContainer}>
            {element.sources?.map((source) => (
              <SourceItem
                key={source}
                source={source}
                active={source === activeSourceId}
                isBlockHovered={isHovered}
                setIsBlockHovered={setIsHovered}
                onClick={handleSourceClick}
              />
            ))}
          </div>
        )}
    </Fragment>
  );
}

function CustomMarkdown({
  data,
  activeId,
  activeSourceId,
  onSourceClick,
  onActiveRefChange,
  onImageSelection,
}: {
  data:{ id: string; text: string; sources?: string[] }[];
  activeId: string | null;
  activeSourceId: string | null;
  onSourceClick?: (elem: HTMLDivElement | null, id: string | null, sourceId: string | null) => void;
  onActiveRefChange?: (_: HTMLDivElement | null) => void;
  onImageSelection?: (_: HTMLImageElement) => void;
}) {
  const [wasUpdated, setWasUpdated] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      return () => {};
    }
    setWasUpdated(true);
    const t = setTimeout(() => {
      setWasUpdated(false);
    }, 1000);

    return () => {
      clearTimeout(t);
    };
  }, [data, isFirstRender]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  return (
    <div className={`${style.markdownContent} ${wasUpdated ? style.markdownHighlight : ''}`}>
      {data.map((item, index) => {
        if (item.text === '\n') {
          return (
            <Fragment key={index}>
              <br />
              <br />
            </Fragment>
          );
        }
        const isActive = activeId === item.id;
        return (
          <MarkdownElement
            key={index}
            element={item}
            onSourceClick={onSourceClick}
            active={isActive}
            activeSourceId={isActive ? activeSourceId : null}
            onActiveRefChange={onActiveRefChange}
            onImageSelection={onImageSelection}
          />
        );
      })}
    </div>
  );
}

export default memo(CustomMarkdown);
