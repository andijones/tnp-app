import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

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
 * Used for filter selections and other bottom-up overlays
 */
export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footerButtons,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
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
                      activeOpacity={0.7}
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
        </View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },

  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: 'System',
  },

  closeButton: {
    padding: 4,
  },

  content: {
    maxHeight: 400,
  },

  contentContainer: {
    flexGrow: 1,
  },

  footer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },

  footerButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerButtonPrimary: {
    backgroundColor: theme.colors.green[600],
  },

  footerButtonSecondary: {
    backgroundColor: theme.colors.neutral[100],
  },

  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: 'System',
  },

  footerButtonTextPrimary: {
    color: '#FFFFFF',
  },
});
