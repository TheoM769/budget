import React, { useState } from 'react';
import { Box, useApp, useStdout } from 'ink';
import BottomBar from './components/BottomBar.jsx';
import CLIMode from './cli/CLIMode.jsx';
import TransactionWindow from './windows/TransactionWindow.jsx';
import LabelWindow from './windows/LabelWindow.jsx';
import LabelizerWindow from './windows/LabelizerWindow.jsx';
import AnalyticsWindow from './windows/AnalyticsWindow.jsx';
import ImportWindow from './windows/ImportWindow.jsx';

export default function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [activeWindow, setActiveWindow] = useState(null);

  const rows = stdout?.rows || 24;
  const cols = stdout?.columns || 80;

  const handleCommand = (cmd) => {
    if (cmd === 'quit') {
      exit();
      return;
    }
    const windowMap = {
      transactions: 'transactions',
      labels: 'labels',
      labelize: 'labelize',
      analyze: 'analyze',
      import: 'import',
    };
    if (windowMap[cmd]) setActiveWindow(windowMap[cmd]);
  };

  const goHome = () => setActiveWindow(null);

  return (
    <Box flexDirection="column" height={rows}>
      <Box flexGrow={1}>
        {activeWindow === null && <CLIMode onCommand={handleCommand} rows={rows} cols={cols} />}
        {activeWindow === 'transactions' && <TransactionWindow onClose={goHome} cols={cols} />}
        {activeWindow === 'labels' && <LabelWindow onClose={goHome} />}
        {activeWindow === 'labelize' && <LabelizerWindow onClose={goHome} cols={cols} />}
        {activeWindow === 'analyze' && <AnalyticsWindow onClose={goHome} cols={cols} />}
        {activeWindow === 'import' && <ImportWindow onClose={goHome} />}
      </Box>
      <BottomBar />
    </Box>
  );
}
