import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface ProfilePictureProps {
  imageUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: any;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  imageUrl,
  fullName,
  email,
  size = 'medium',
  style,
}) => {
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: { width: 24, height: 24, fontSize: 10 },
    medium: { width: 40, height: 40, fontSize: 16 },
    large: { width: 100, height: 100, fontSize: 36 },
    xlarge: { width: 120, height: 120, fontSize: 42 },
  };

  const config = sizeConfig[size];

  // Generate initials from full name or email
  const getInitials = () => {
    if (fullName?.trim()) {
      const names = fullName.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    if (email?.trim()) {
      return email[0].toUpperCase();
    }
    
    return '?';
  };

  // Generate consistent background color based on name or email
  const getBackgroundColor = () => {
    const text = fullName || email || 'default';
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const containerStyle = [
    {
      width: config.width,
      height: config.height,
      borderRadius: config.width / 2,
      backgroundColor: getBackgroundColor(),
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    style,
  ];

  // If we have a valid image URL and no error, show the image
  if (imageUrl && !imageError) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: config.width,
            height: config.height,
            borderRadius: config.width / 2,
          }}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Otherwise, show initials with colored background
  return (
    <View style={containerStyle}>
      <Text
        style={[
          styles.initialsText,
          {
            fontSize: config.fontSize,
            color: '#FFFFFF',
          },
        ]}
      >
        {getInitials()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  initialsText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});