import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface TNPLogoIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const TNPLogoIcon: React.FC<TNPLogoIconProps> = ({
  size = 28,
  color = '#1F5932',
  focused = false,
}) => {
  // Active state: green fill (#44DB6D) with dark green stroke (#1F5932)
  // Inactive state: gray fill and stroke (#737373)
  const mainFill = focused ? '#44DB6D' : 'none';
  const mainStroke = focused ? '#1F5932' : '#737373';
  const detailFill = focused ? '#1F5932' : '#737373';

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Pantry jar outline */}
      <Path
        d="M14.8774 1.46826C15.362 1.48858 15.8922 1.54149 16.2759 1.6333C17.2443 1.86502 18.1023 2.33698 18.8921 3.0415L19.2261 3.35791C19.8707 4.00216 20.2329 4.87624 20.2329 5.7876V6.97412H21.4487C22.3344 6.9743 23.052 7.69199 23.0522 8.57764V9.05713C23.0523 10.4808 23.2228 12.012 23.6255 14.1089C24.309 17.6677 24.4451 19.28 24.3999 23.2163L24.396 23.5151C24.3765 25.1924 23.0109 26.5415 21.3335 26.5415H7.83252C6.15522 26.5414 4.79053 25.1923 4.771 23.5151L4.76709 23.2163C4.72191 19.28 4.85801 17.6677 5.5415 14.1089C5.9442 12.012 6.11376 10.4808 6.11377 9.05713V8.57764C6.11398 7.69188 6.83246 6.97412 7.71826 6.97412H8.93311V5.68604C8.93311 4.87468 9.24224 4.09312 9.79639 3.50049C10.8383 2.3865 12.008 1.75055 13.479 1.51709C13.863 1.45615 14.3943 1.44802 14.8774 1.46826ZM14.2485 4.64209C13.9479 4.6606 13.677 4.69732 13.5913 4.72119C13.0854 4.86245 12.5257 5.18016 12.188 5.50439L12.187 5.50342C12.0976 5.58947 12.0474 5.70937 12.0474 5.8335V6.97412H17.1187V5.8335C17.1187 5.70922 17.0686 5.5895 16.979 5.50342C16.3901 4.93802 15.5751 4.61976 14.5532 4.63037L14.2485 4.64209Z"
        fill={mainFill}
        stroke={mainStroke}
        strokeWidth="1.75"
      />
      {/* Jar lid/top rectangle */}
      <Rect x="12.1997" y="5.0293" width="4.90286" height="2.10219" fill={detailFill} />
      {/* Left eyebrow/detail */}
      <Path
        d="M9.4844 16.3019C9.54248 16.0045 9.92504 15.3385 10.9907 15.053"
        stroke={detailFill}
        strokeWidth="1.45833"
        strokeLinecap="round"
      />
      {/* Right eyebrow/detail */}
      <Path
        d="M19.6821 16.3019C19.624 16.0045 19.2415 15.3385 18.1758 15.053"
        stroke={detailFill}
        strokeWidth="1.45833"
        strokeLinecap="round"
      />
      {/* Smile/bottom detail */}
      <Path
        d="M11.6711 17.7812C11.6711 17.7812 12.8505 19.4506 14.6287 19.4506C16.4069 19.4506 17.4956 17.7812 17.4956 17.7812"
        stroke={detailFill}
        strokeWidth="1.45833"
        strokeLinecap="round"
      />
    </Svg>
  );
};
