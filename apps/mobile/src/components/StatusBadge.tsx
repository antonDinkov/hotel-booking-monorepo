import { StyleSheet, Text } from 'react-native';

type StatusBadgeProps = {
  label: string;
  tone?: 'blue' | 'green' | 'amber' | 'red';
};

export default function StatusBadge({ label, tone = 'blue' }: StatusBadgeProps) {
  return <Text style={[styles.badge, styles[tone]]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  blue: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    color: '#1d4ed8',
  },
  green: {
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0',
    color: '#047857',
  },
  amber: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    color: '#b45309',
  },
  red: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    color: '#b91c1c',
  },
});
