import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface FavoriteButtonProps {
  foodId: string;
  isFavorite: boolean;
  onToggle: (foodId: string) => Promise<boolean>;
  size?: number;
  color?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  foodId,
  isFavorite,
  onToggle,
  size = 20,
  color = theme.colors.text.secondary,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    if (isProcessing) return;
    
    // Immediate press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setIsProcessing(true);
    const success = await onToggle(foodId);
    
    if (success) {
      // Success pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    setIsProcessing(false);
  };

  return (
    <TouchableOpacity 
      style={[styles.button, isProcessing && styles.buttonDisabled]} 
      onPress={handlePress}
      disabled={isProcessing}
      activeOpacity={0.8}
    >
      <Animated.View
        style={{
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) }
          ]
        }}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isFavorite ? theme.colors.error : color}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
});