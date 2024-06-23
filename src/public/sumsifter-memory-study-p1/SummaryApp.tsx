import { useEffect, useMemo, useState } from 'react';
import { Box, Grid, NavLink } from '@mantine/core';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from '../../store/types';
import { SumParams } from './types';
import { PREFIX } from '../../utils/Prefix';
import { useNextStep } from '../../store/hooks/useNextStep';

import '@react-pdf-viewer/core/lib/styles/index.css';

const TOTAL_TIME = 5 * 60 * 1000; // 5 minutes

function SummaryApp({ parameters, setAnswer }: StimulusParams<SumParams>) {
  const [docIndex, setDocIndex] = useState(0);
  const [startTime] = useState(Date.now());
  const { goToNextStep } = useNextStep();

  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setTimeLeft(TOTAL_TIME - elapsed);
      if (elapsed >= TOTAL_TIME) goToNextStep();
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, goToNextStep]);

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
    if (parameters.documents.length) {
      setDocIndex(0);
    }
  }, [parameters]);

  return (
    <Box pos="relative">
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
      }}
      >
        <div style={{
          position: 'fixed',
          width: 100,
          background: '#fff',
          zIndex: 2,
          color: 'orange',
          fontSize: 32,
          fontWeight: 'bold',
          transform: 'translateX(-100%)',
        }}
        >
          <p>
            {/* minutes */}
            {Math.floor(timeLeft / 1000 / 60)}
            :
            {/* seconds */}
            {Math.floor((timeLeft / 1000) % 60).toString().length === 1 ? '0' : ''}
            {Math.floor((timeLeft / 1000) % 60)}
          </p>
        </div>
      </div>

      <Grid gutter={50}>
        <Grid.Col span={2}>
          <div style={{ position: 'sticky', top: 100 }}>
            {parameters.documents.map((doc, index) => (
              <NavLink key={index} onClick={() => setDocIndex(index)} label={`Doc ${index + 1}`} active={index === docIndex} />
            ))}
          </div>
        </Grid.Col>
        <Grid.Col span={8}>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            {parameters.documents.length > 0 && <Viewer fileUrl={`${PREFIX}${parameters.documents[docIndex]}`} />}
          </Worker>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export default SummaryApp;
