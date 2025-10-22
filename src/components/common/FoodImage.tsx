import React, { useState } from 'react';
import { View, Image, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { API_CONFIG } from '../../constants';

interface FoodImageProps {
  imageUrl?: string | null;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  novaGroup?: number;
}

export const FoodImage: React.FC<FoodImageProps> = ({ 
  imageUrl, 
  size = 'medium',
  style,
  novaGroup
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Size configurations to match your current design
  const sizeConfig = {
    small: { width: 40, height: 40, iconSize: 16 },
    medium: { width: 60, height: 60, iconSize: 24 },
    large: { width: '100%', height: '100%', iconSize: 40 }
  };

  const config = sizeConfig[size];

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  // Helper function to ensure we have a full URL
  const getImageUrl = (url?: string | null) => {
    if (!url) return null;

    // If it's already a full URL, return it
    if (url.startsWith('http')) return url;

    // If it's a storage path, construct the full URL using config
    // Handle both bucket paths and direct paths
    if (url.startsWith('food-images/')) {
      // Already includes bucket name
      return `${API_CONFIG.supabaseUrl}/storage/v1/object/public/${url}`;
    } else {
      // Assume it's just the file path without bucket name
      return `${API_CONFIG.supabaseUrl}/storage/v1/object/public/food-images/${url}`;
    }
  };

  const getProcessingColor = (novaGroup?: number) => {
    switch (novaGroup) {
      case 1:
        return theme.colors.processing.wholeFood.color;
      case 2:
        return theme.colors.processing.extractedFoods.color;
      case 3:
        return theme.colors.processing.lightlyProcessed.color;
      case 4:
        return theme.colors.processing.processed.color;
      default:
        return theme.colors.text.tertiary;
    }
  };

  const getProcessingLabel = (novaGroup?: number): string => {
    switch (novaGroup) {
      case 1:
        return 'W'; // Whole
      case 2:
        return 'E'; // Extracted
      case 3:
        return 'L'; // Lightly
      case 4:
        return 'P'; // Processed
      default:
        return '?';
    }
  };

  const fullImageUrl = getImageUrl(imageUrl);

  return (
    <View 
      style={[
        {
          width: config.width,
          height: config.height,
          borderRadius: theme.borderRadius.sm,
          backgroundColor: style?.borderRadius === 0 ? 'transparent' : theme.colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        },
        style
      ]}
    >
      {fullImageUrl && !error ? (
        <>
          <Image
            source={{ uri: fullImageUrl }}
            style={{
              width: config.width,
              height: config.height,
              borderRadius: style?.borderRadius === 0 ? 0 : theme.borderRadius.sm,
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            resizeMode="contain"
          />
          {loading && (
            <View 
              style={{
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                width: '100%',
                height: '100%',
                borderRadius: style?.borderRadius === 0 ? 0 : theme.borderRadius.sm,
              }}
            >
              <ActivityIndicator size="small" color={theme.colors.text.secondary} />
            </View>
          )}
        </>
      ) : (
        <Ionicons 
          name="image-outline" 
          size={config.iconSize} 
          color={theme.colors.text.tertiary} 
        />
      )}
      
      {/* Processing Level Tag - only show if not in grid layout (when borderRadius isn't 0) */}
      {novaGroup && style?.borderRadius !== 0 && (
        <View style={{
          position: 'absolute',
          top: -4,
          right: -4,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: getProcessingColor(novaGroup),
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#FFFFFF',
          // Shadow for depth
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 9,
            fontWeight: '800',
            color: '#FFFFFF',
            fontFamily: 'System',
            textAlign: 'center',
          }}>
            {getProcessingLabel(novaGroup)}
          </Text>
        </View>
      )}
    </View>
  );
};