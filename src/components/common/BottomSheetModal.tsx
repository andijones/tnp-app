import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerButtons?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

/**
 * Reusable bottom sheet modal component
 * Updated to match Figma design specifications (node-id=2421:9830)
 *
 * Design specs:
 * - Border radius: 16px (top corners only)
 * - Padding: 16px horizontal, 20px vertical
 * - Shadow: 0px -12px 24px rgba(16, 24, 40, 0.18)
 * - Backdrop: rgba(23, 23, 23, 0.5)
 * - Close icon: close-circle (24px)
 * - Button height: 52px with fully rounded borders
 */
export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footerButtons,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.overlayTouchable,
              {
                opacity: fadeAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.neutral[800]} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {/* Footer */}
          {footerButtons && footerButtons.length > 0 && (
            <View style={styles.footer}>
              {footerButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.footerButton,
                    button.variant === 'primary'
                      ? styles.footerButtonPrimary
                      : styles.footerButtonSecondary,
                  ]}
                  onPress={button.onPress}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.footerButtonText,
                      button.variant === 'primary' && styles.footerButtonTextPrimary,
                    ]}
                  >
                    {button.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 23, 23, 0.5)', // Figma backdrop color
  },

  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16, // Figma spec: 16px
    borderTopRightRadius: 16,
    paddingHorizontal: 16, // Figma spec: 16px
    paddingTop: 20, // Figma spec: 20px
    paddingBottom: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -12 }, // Figma spec
    shadowOpacity: 0.18, // Figma spec
    shadowRadius: 24, // Figma spec
    elevation: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24, // Figma spec: 24px
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100], // Figma spec
  },

  title: {
    flex: 1,
    fontSize: 16, // Figma spec: 16px
    fontWeight: 'bold',
    lineHeight: 19, // Figma spec: 1.197 ratio
    letterSpacing: -0.48, // Figma spec
    color: theme.colors.neutral[800],
    fontFamily: 'System',
  },

  content: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },

  contentContainer: {
    paddingTop: 12, // Reduced spacing for better visual balance
    flexGrow: 1,
  },

  footer: {
    flexDirection: 'row',
    gap: 16, // Figma spec: 16px gap
    paddingTop: 24, // Figma spec: 24px
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100], // Figma spec
  },

  footerButton: {
    flex: 1,
    height: 52, // Figma spec: 52px
    borderRadius: 9999, // Figma spec: fully rounded (pill shape)
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerButtonPrimary: {
    backgroundColor: theme.colors.green[950], // Figma spec: green-950
    borderWidth: 1,
    borderColor: '#043614', // Figma spec: darker green border
  },

  footerButtonSecondary: {
    backgroundColor: theme.colors.neutral.BG2, // Figma spec: neutral-BG2 (#EBEAE4)
  },

  footerButtonText: {
    fontSize: 16, // Figma spec: 16px
    fontWeight: 'bold',
    lineHeight: 19, // Figma spec: 1.197 ratio
    letterSpacing: -0.48, // Figma spec
    color: theme.colors.neutral[600], // Secondary button text
    fontFamily: 'System',
  },

  footerButtonTextPrimary: {
    color: theme.colors.neutral.white, // Primary button text
  },
});
