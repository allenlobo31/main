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
import { safeParse, loginSchema } from '../../src/utils/validators';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  const handleLogin = async () => {
    setErrors({});
    const result = safeParse(loginSchema, { email, password });
    if (!result.success) {
      setErrors({ general: result.error });
      return;
    }

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setErrors({ general: parseAuthError(err) });
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
            <Text style={styles.tagline}>Your recovery companion</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Welcome back</Text>

            {errors.general ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            ) : null}

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              error={errors.password}
            />

            <Button
              label="Sign In"
              onPress={handleLogin}
              isLoading={isLoading}
              fullWidth
              style={styles.loginBtn}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              style={styles.switchLink}
            >
              <Text style={styles.switchText}>
                Don't have an account?{' '}
                <Text style={styles.switchAction}>Create one</Text>
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
  header: { alignItems: 'center', marginBottom: theme.spacing.xxxl },
  headerCompact: { marginBottom: theme.spacing.xl },
  logo: { fontSize: 56, marginBottom: theme.spacing.sm },
  appName: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: 4 },
  tagline: { ...theme.typography.body, color: theme.colors.textMuted },
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
  errorBannerText: { ...theme.typography.body, color: theme.colors.dangerLight },
  loginBtn: { marginTop: theme.spacing.sm },
  switchLink: { alignItems: 'center', marginTop: theme.spacing.lg },
  switchText: { ...theme.typography.body, color: theme.colors.textMuted },
  switchAction: { color: theme.colors.primary, fontWeight: '700' },
});

import { parseAuthError } from '../../src/utils/validators';
