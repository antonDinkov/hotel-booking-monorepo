import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  title: {
    color: '#172554',
    fontSize: 20,
    fontWeight: '900',
  },
  message: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
});
