import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../../theme';

type ProcessingLevel = 1 | 2 | 3 | 4;

interface ProcessingLevelCardProps {
  level: ProcessingLevel;
}

const PROCESSING_CONFIG = {
  1: {
    image: require('../../../assets/wf.png'),
    title: 'Whole Foods',
    description: 'Foods just as nature made them.\nFresh, simple, and untouched.',
    backgroundColor: 'rgba(76, 255, 48, 0.2)',
    titleColor: '#26733E',
  },
  2: {
    image: require('../../../assets/ef.png'),
    title: 'Extracted Foods',
    description: 'Single-ingredient foods made by separating or pressing from whole sources.',
    backgroundColor: 'rgba(207, 255, 48, 0.2)',
    titleColor: '#48561D',
  },
  3: {
    image: require('../../../assets/lp.png'),
    title: 'Lightly Processed',
    description: 'Foods made by combining natural ingredients, prepared without additives.',
    backgroundColor: 'rgba(250, 225, 203, 1)',
    titleColor: '#AE611E',
  },
  4: {
    image: require('../../../assets/up.png'),
    title: 'Ultra Processed',
    description: 'Factory-made foods packed with additives and chemicals you\'d never use at home',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    titleColor: '#9A2019',
  },
};

export const ProcessingLevelCard: React.FC<ProcessingLevelCardProps> = ({ level }) => {
  const config = PROCESSING_CONFIG[level];

  return (
    <View style={[styles.card, { backgroundColor: config.backgroundColor }]}>
      {/* Image */}
      <Image source={config.image} style={styles.image} resizeMode="contain" />

      {/* Text Content */}
      <View style={styles.textContainer}>
        {/* Title */}
        <Text style={[styles.title, { color: config.titleColor }]}>{config.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{config.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19.15, // 1.197 ratio
    letterSpacing: -0.48,
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.neutral[600],
    lineHeight: 17,
    letterSpacing: -0.13,
  },
});
