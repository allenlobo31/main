import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/authStore';
import { safeParse, registerSchema, parseAuthError } from '../../src/utils/validators';
import { theme } from '../../src/constants/theme';
import { UserRole } from '../../src/types';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [doctorCode, setDoctorCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  const handleRegister = async () => {
    setError(null);

    if (role === 'doctor' && doctorCode !== '2026') {
      setError('Invalid developer code for doctor registration.');
      return;
    }

    const result = safeParse(registerSchema, { name, email, password, role });
    if (!result.success) {
      setError(result.error);
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      // Navigation is handled by layout observer or store change
    } catch (err) {
      setError(parseAuthError(err));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingHorizontal: horizontalPadding },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.header, isCompact && styles.headerCompact]}>
            <Text style={styles.logo}>🩺</Text>
            <Text style={styles.appName}>HerniaCare</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Create your account</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.roleToggle}>
              <TouchableOpacity
                onPress={() => setRole('patient')}
                style={[styles.roleBtn, role === 'patient' && styles.roleBtnActive]}
              >
                <Text style={[styles.roleBtnText, role === 'patient' && styles.roleBtnTextActive]}>
                  Patient
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRole('doctor')}
                style={[styles.roleBtn, role === 'doctor' && styles.roleBtnActive]}
              >
                <Text style={[styles.roleBtnText, role === 'doctor' && styles.roleBtnTextActive]}>
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholder={role === 'doctor' ? 'Dr. Jane Smith' : 'Jane Smith'}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min. 6 characters"
            />

            {role === 'doctor' && (
              <Input
                label="Developer Code (Required for Doctors)"
                value={doctorCode}
                onChangeText={setDoctorCode}
                keyboardType="numeric"
                placeholder="Enter 4-digit code"
                secureTextEntry
              />
            )}

            <Button
              label={role === 'doctor' ? 'Register as Doctor' : 'Create Account'}
              onPress={handleRegister}
              isLoading={isLoading}
              fullWidth
              style={{ marginTop: theme.spacing.sm }}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.switchLink}
            >
              <Text style={styles.switchText}>
                Already have an account?{' '}
                <Text style={styles.switchAction}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, justifyContent: 'center', paddingVertical: theme.spacing.xl, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: theme.spacing.xl },
  headerCompact: { marginBottom: theme.spacing.lg },
  logo: { fontSize: 48, marginBottom: theme.spacing.xs },
  appName: { ...theme.typography.h1, color: theme.colors.textPrimary },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '100%',
    maxWidth: 440,
  },
  title: { ...theme.typography.h2, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  errorBanner: {
    backgroundColor: `${theme.colors.danger}22`,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: { ...theme.typography.body, color: theme.colors.dangerLight },
  switchLink: { alignItems: 'center', marginTop: theme.spacing.lg },
  switchText: { ...theme.typography.body, color: theme.colors.textMuted },
  switchAction: { color: theme.colors.primary, fontWeight: '700' },
  roleToggle: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    backgroundColor: '#f0f0f0',
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  roleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleBtnText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: theme.colors.primary,
  },
});
