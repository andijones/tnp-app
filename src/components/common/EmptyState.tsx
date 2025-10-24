import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface EmptyStateProps {
  title?: string;
  message?: string;
  image?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No foods found',
  message = "We couldn't find any foods matching your search. Please try a different term.",
  image = require('../../../assets/NoFoodFound.png'),
}) => {
  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 160,
    backgroundColor: theme.colors.background,
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  textContainer: {
    width: 300,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: theme.colors.neutral[800],
    letterSpacing: -0.44,
    textAlign: 'center',
    width: '100%',
  },
  message: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
    color: theme.colors.neutral[500],
    letterSpacing: -0.15,
    textAlign: 'center',
    width: '100%',
  },
});
