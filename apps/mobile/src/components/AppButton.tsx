import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
};

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, styles[`${variant}Label`]]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  secondary: {
    backgroundColor: '#ecfeff',
    borderColor: '#67e8f9',
  },
  ghost: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
  },
  danger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryLabel: {
    color: '#ffffff',
  },
  secondaryLabel: {
    color: '#155e75',
  },
  ghostLabel: {
    color: '#1d4ed8',
  },
  dangerLabel: {
    color: '#b91c1c',
  },
});
