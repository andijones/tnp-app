import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface HeartIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const HeartIcon: React.FC<HeartIconProps> = ({
  size = 28,
  color = '#1F5932',
  focused = false,
}) => {
  // Active state: green fill (#44DB6D) with dark green stroke (#1F5932)
  // Inactive state: gray stroke (#737373), no fill
  const heartFill = focused ? '#44DB6D' : 'none';
  const strokeColor = focused ? '#1F5932' : '#737373';

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M19.299 4.37598C15.7487 4.37598 13.9987 7.87598 13.9987 7.87598C13.9987 7.87598 12.2487 4.37598 8.69842 4.37598C5.8131 4.37598 3.52826 6.78988 3.49873 9.67027C3.43857 15.6493 8.24178 19.9012 13.5065 23.4745C13.6517 23.5732 13.8232 23.626 13.9987 23.626C14.1743 23.626 14.3458 23.5732 14.4909 23.4745C19.7551 19.9012 24.5583 15.6493 24.4987 9.67027C24.4692 6.78988 22.1844 4.37598 19.299 4.37598Z"
        fill={heartFill}
        stroke={strokeColor}
        strokeWidth="1.75293"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
