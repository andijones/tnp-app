import React, { useState } from 'react';
import { View, Image, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

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
    
    // If it's a storage path, construct the full URL
    const supabaseUrl = 'https://uacihrlnwlqhpbobzajs.supabase.co';
    
    // Handle both bucket paths and direct paths
    if (url.startsWith('food-images/')) {
      // Already includes bucket name
      return `${supabaseUrl}/storage/v1/object/public/${url}`;
    } else {
      // Assume it's just the file path without bucket name
      return `${supabaseUrl}/storage/v1/object/public/food-images/${url}`;
    }
  };

  const getNovaColor = (novaGroup?: number) => {
    switch (novaGroup) {
      case 1:
        return theme.colors.nova.group1;
      case 2:
        return theme.colors.nova.group2;
      case 3:
        return theme.colors.nova.group3;
      case 4:
        return theme.colors.nova.group4;
      default:
        return theme.colors.text.tertiary;
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
      
      {/* NOVA Tag - only show if not in grid layout (when borderRadius isn't 0) */}
      {novaGroup && style?.borderRadius !== 0 && (
        <View style={{
          position: 'absolute',
          top: -4,
          right: -4,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: getNovaColor(novaGroup),
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 10,
            fontWeight: '700',
            color: '#FFFFFF',
            fontFamily: 'System',
            textAlign: 'center',
          }}>
            {novaGroup}
          </Text>
        </View>
      )}
    </View>
  );
};