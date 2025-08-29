import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
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

  const handlePress = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    await onToggle(foodId);
    setIsProcessing(false);
  };

  return (
    <TouchableOpacity 
      style={[styles.button, isProcessing && styles.buttonDisabled]} 
      onPress={handlePress}
      disabled={isProcessing}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? theme.colors.error : color}
      />
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