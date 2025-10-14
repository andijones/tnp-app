import React from 'react';
import Svg, { Path, Line, Rect } from 'react-native-svg';

interface ScannerIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const ScannerIcon: React.FC<ScannerIconProps> = ({
  size = 28,
  color = '#737373',
  focused = false,
}) => {
  const strokeColor = focused ? '#1F5932' : color;
  const barcodeColor = focused ? '#1F5932' : '#737373';
  const lineColor = focused ? '#44DB6D' : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Top-left corner */}
      <Path
        d="M3.5 9.333V5.833a2.333 2.333 0 012.333-2.333h3.5"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top-right corner */}
      <Path
        d="M18.667 3.5h3.5a2.333 2.333 0 012.333 2.333v3.5"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-left corner */}
      <Path
        d="M3.5 18.667v3.5a2.333 2.333 0 002.333 2.333h3.5"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-right corner */}
      <Path
        d="M18.667 24.5h3.5a2.333 2.333 0 002.333-2.333v-3.5"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center scan line */}
      <Line
        x1="0"
        y1="14.583"
        x2="28"
        y2="14.583"
        stroke={lineColor}
        strokeWidth="1.75"
      />

      {/* Barcode lines */}
      <Rect x="6.08" y="7.44" width="1.398" height="4.202" fill={barcodeColor} />
      <Rect x="6.08" y="16.36" width="1.398" height="4.202" fill={barcodeColor} />
      <Rect x="7.88" y="7.44" width="0.439" height="4.202" fill={barcodeColor} />
      <Rect x="7.88" y="16.36" width="0.439" height="4.202" fill={barcodeColor} />

      <Rect x="11.77" y="7.44" width="1.398" height="4.202" fill={barcodeColor} />
      <Rect x="11.77" y="16.36" width="1.398" height="4.202" fill={barcodeColor} />
      <Rect x="13.58" y="7.44" width="0.439" height="4.202" fill={barcodeColor} />
      <Rect x="13.58" y="16.36" width="0.439" height="4.202" fill={barcodeColor} />

      <Rect x="19.68" y="7.44" width="1.398" height="4.202" fill={barcodeColor} />
      <Rect x="19.68" y="16.36" width="1.398" height="4.202" fill={barcodeColor} />
      <Rect x="21.49" y="7.44" width="0.439" height="4.202" fill={barcodeColor} />
      <Rect x="21.49" y="16.36" width="0.439" height="4.202" fill={barcodeColor} />

      <Rect x="16.15" y="7.44" width="1.398" height="4.202" fill={barcodeColor} />
      <Rect x="16.15" y="16.36" width="1.398" height="4.202" fill={barcodeColor} />
      <Rect x="17.95" y="7.44" width="0.439" height="4.202" fill={barcodeColor} />
      <Rect x="17.95" y="16.36" width="0.439" height="4.202" fill={barcodeColor} />
      <Rect x="15.3" y="7.44" width="0.439" height="4.202" fill={barcodeColor} />
      <Rect x="15.3" y="16.36" width="0.439" height="4.202" fill={barcodeColor} />

      <Rect x="9.65" y="7.44" width="0.796" height="4.202" fill={barcodeColor} />
      <Rect x="9.65" y="16.36" width="0.796" height="4.202" fill={barcodeColor} />
    </Svg>
  );
};
