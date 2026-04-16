import React from "react";
import { Box, Text } from "ink";

const LINES = [
  " ██████╗ ██╗   ██╗██████╗  ██████╗ ███████╗████████╗",
  " ██╔══██╗██║   ██║██╔══██╗██╔════╝ ██╔════╝╚══██╔══╝",
  " ██████╔╝██║   ██║██║  ██║██║  ███╗█████╗     ██║   ",
  " ██╔══██╗██║   ██║██║  ██║██║   ██║██╔══╝     ██║   ",
  " ██████╔╝╚██████╔╝██████╔╝╚██████╔╝███████╗   ██║   ",
  " ╚═════╝  ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝   ",
];

export default function Logo() {
  return (
    <Box flexDirection="column" alignItems="center">
      {LINES.map((line, i) => (
        <Text key={i} color="#555555">
          {line}
        </Text>
      ))}
    </Box>
  );
}
