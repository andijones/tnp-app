import * as Font from 'expo-font';

export const loadFonts = async () => {
  await Font.loadAsync({
    'BricolageGrotesque-Light': require('../../assets/fonts/BricolageGrotesque-Light.ttf'),
    'BricolageGrotesque-Regular': require('../../assets/fonts/BricolageGrotesque-Regular.ttf'),
    'BricolageGrotesque-Medium': require('../../assets/fonts/BricolageGrotesque-Medium.ttf'),
    'BricolageGrotesque-SemiBold': require('../../assets/fonts/BricolageGrotesque-SemiBold.ttf'),
    'BricolageGrotesque-Bold': require('../../assets/fonts/BricolageGrotesque-Bold.ttf'),
  });
};

export const fontFamilies = {
  light: 'BricolageGrotesque-Light',
  regular: 'BricolageGrotesque-Regular',
  medium: 'BricolageGrotesque-Medium',
  semibold: 'BricolageGrotesque-SemiBold',
  bold: 'BricolageGrotesque-Bold',
} as const;