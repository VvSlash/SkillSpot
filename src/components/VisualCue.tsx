// src/components/VisualCue.tsx
import React from 'react';

type VisualCueProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

const VisualCue: React.FC<VisualCueProps> = ({ x, y, width, height, color }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: color,
        borderRadius: '50%',
      }}
    />
  );
};

export default VisualCue;
