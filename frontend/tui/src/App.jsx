import React, { useState, useEffect } from "react";
import { Box, useStdout } from "ink";
import CLIMode from "./cli/CLIMode.jsx";
import TransactionWindow from "./windows/TransactionWindow.jsx";
import LabelWindow from "./windows/LabelWindow.jsx";
import LabelizerWindow from "./windows/LabelizerWindow.jsx";
import AnalyticsWindow from "./windows/AnalyticsWindow.jsx";
import ImportWindow from "./windows/ImportWindow.jsx";
import BottomBar from "./components/BottomBar.jsx";

export default function App() {
  const [activeWindow, setActiveWindow] = useState(null);
  const { stdout } = useStdout();

  const [size, setSize] = useState({
    rows: stdout?.rows || 24,
    cols: stdout?.columns || 80,
  });

  useEffect(() => {
    const handleResize = () =>
      setSize({ rows: stdout?.rows || 24, cols: stdout?.columns || 80 });
    stdout?.on("resize", handleResize);
    return () => stdout?.off("resize", handleResize);
  }, [stdout]);

  const openWindow = (name) => setActiveWindow(name);
  const closeWindow = () => setActiveWindow(null);

  return (
    <Box flexDirection="column" height={size.rows} width={size.cols}>
      <Box flexGrow={1} flexDirection="column">
        {activeWindow === null && (
          <Box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
            <CLIMode onOpenWindow={openWindow} cols={size.cols} />
          </Box>
        )}
        {activeWindow === "transactions" && <TransactionWindow onClose={closeWindow} />}
        {activeWindow === "labels" && <LabelWindow onClose={closeWindow} />}
        {activeWindow === "labelize" && <LabelizerWindow onClose={closeWindow} />}
        {activeWindow === "analyze" && <AnalyticsWindow onClose={closeWindow} />}
        {activeWindow === "import" && <ImportWindow onClose={closeWindow} />}
      </Box>
      <BottomBar />
    </Box>
  );
}
