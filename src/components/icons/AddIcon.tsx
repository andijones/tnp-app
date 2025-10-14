import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface AddIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const AddIcon: React.FC<AddIconProps> = ({
  size = 28,
  color = '#1F5932',
  focused = false,
}) => {
  // Active state: green fill (#44DB6D) with dark green stroke (#1F5932)
  // Inactive state: gray stroke (#737373), no fill
  const circleFill = focused ? '#44DB6D' : 'none';
  const strokeColor = focused ? '#1F5932' : '#737373';

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Circle background (filled when active) */}
      {focused && (
        <Path
          d="M24.4988 14.001C24.4988 8.2041 19.7957 3.50098 13.9988 3.50098C8.20191 3.50098 3.49878 8.2041 3.49878 14.001C3.49878 19.7979 8.20191 24.501 13.9988 24.501C19.7957 24.501 24.4988 19.7979 24.4988 14.001Z"
          fill={circleFill}
        />
      )}
      {/* Plus sign and circle outline */}
      <Path
        d="M13.9988 9.62598V18.376M18.3738 14.001H9.62378M24.4988 14.001C24.4988 8.2041 19.7957 3.50098 13.9988 3.50098C8.20191 3.50098 3.49878 8.2041 3.49878 14.001C3.49878 19.7979 8.20191 24.501 13.9988 24.501C19.7957 24.501 24.4988 19.7979 24.4988 14.001Z"
        stroke={strokeColor}
        strokeWidth="1.75293"
        strokeLinecap="round"
      />
    </Svg>
  );
};
