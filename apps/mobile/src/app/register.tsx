import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import AppTextInput from '@/components/AppTextInput';
import ScreenContainer from '@/components/ScreenContainer';
import { useAuth } from '@/context/AuthContext';

export default function Register() {
  const router = useRouter();
  const { register, authState } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authState.isAuthenticated) {
    return <Redirect href="/(client)/dashboard" />;
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      await register({ fullName, email, password, confirmPassword });
      router.replace('/(client)/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer showNavigation={false}>
      <View style={styles.card}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Register as a client to plan and manage your stays.</Text>
        <AppTextInput label="Full name" value={fullName} onChangeText={setFullName} />
        <AppTextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <AppTextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <AppTextInput label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label={isSubmitting ? 'Creating account...' : 'Create account'} onPress={handleSubmit} disabled={isSubmitting} />
        <AppButton label="Already have an account" variant="ghost" onPress={() => router.push('/login')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 22,
  },
  title: {
    color: '#172554',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
  },
  error: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    color: '#b91c1c',
    padding: 12,
  },
});
