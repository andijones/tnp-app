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
    title: 'Whole Food',
    description: 'Foods just as nature made them. Fresh, whole, and unprocessed',
    backgroundColor: '#E6F9F0',
    borderColor: '#22C55E',
  },
  2: {
    image: require('../../../assets/ef.png'),
    title: 'Extracted Foods',
    description: 'Single-ingredient foods made by extracting or pressing from nature sources',
    backgroundColor: '#F0F9E6',
    borderColor: '#84CC16',
  },
  3: {
    image: require('../../../assets/lp.png'),
    title: 'Lightly Processed',
    description: 'Foods made by combining just a few simple ingredients, prepared without additives',
    backgroundColor: '#FFF8E6',
    borderColor: '#F59E0B',
  },
  4: {
    image: require('../../../assets/up.png'),
    title: 'Ultra Processed',
    description: 'Factory-made foods packed with additives and chemicals you\'d never use at home',
    backgroundColor: '#FFE6E6',
    borderColor: '#EF4444',
  },
};

export const ProcessingLevelCard: React.FC<ProcessingLevelCardProps> = ({ level }) => {
  const config = PROCESSING_CONFIG[level];

  return (
    <View style={[styles.card, { backgroundColor: config.backgroundColor, borderColor: config.borderColor }]}>
      {/* Image */}
      <Image source={config.image} style={styles.image} resizeMode="contain" />

      {/* Title */}
      <Text style={styles.title}>{config.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{config.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: '#525252',
    textAlign: 'center',
    lineHeight: 18,
  },
});
