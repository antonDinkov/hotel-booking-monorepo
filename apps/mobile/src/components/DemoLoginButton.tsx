import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type DemoLoginButtonProps = {
  label: string;
  email: string;
  password: string;
  onFill: (email: string, password: string) => void;
};

export default function DemoLoginButton({ label, email, password, onFill }: DemoLoginButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  function handlePress() {
    onFill(email, password);
    setShowSuccess(true);
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={handlePress}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
      {showSuccess && <Text style={styles.successMessage}>Demo credentials loaded</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  button: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  buttonPressed: {
    backgroundColor: '#6d28d9',
    borderColor: '#6d28d9',
    opacity: 0.9,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  successMessage: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '500',
  },
});
