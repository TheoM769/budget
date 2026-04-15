import React, { useState } from "react";
import { Box } from "ink";
import CLIMode from "./cli/CLIMode.jsx";
import TransactionWindow from "./windows/TransactionWindow.jsx";
import LabelWindow from "./windows/LabelWindow.jsx";
import LabelizerWindow from "./windows/LabelizerWindow.jsx";
import AnalyticsWindow from "./windows/AnalyticsWindow.jsx";
import ImportWindow from "./windows/ImportWindow.jsx";

export default function App() {
  const [window, setWindow] = useState(null);

  const openWindow = (name) => setWindow(name);
  const closeWindow = () => setWindow(null);

  return (
    <Box flexDirection="column" width="100%">
      {window === null && <CLIMode onOpenWindow={openWindow} />}
      {window === "transactions" && (
        <TransactionWindow onClose={closeWindow} />
      )}
      {window === "labels" && <LabelWindow onClose={closeWindow} />}
      {window === "labelize" && <LabelizerWindow onClose={closeWindow} />}
      {window === "analyze" && <AnalyticsWindow onClose={closeWindow} />}
      {window === "import" && <ImportWindow onClose={closeWindow} />}
    </Box>
  );
}
