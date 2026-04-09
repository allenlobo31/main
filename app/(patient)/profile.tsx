import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { userDoc, updateDoc } from '../../src/services/firebase/firestore';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';

type ProfileFormState = {
  name: string;
  place: string;
  phoneNumber: string;
  address: string;
  emergencyContactNumber: string;
};

export default function PatientProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const { horizontalPadding } = useResponsiveLayout();

  const initialValues = useMemo<ProfileFormState>(
    () => ({
      name: user?.name ?? '',
      place: user?.place ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      address: user?.address ?? '',
      emergencyContactNumber: user?.emergencyContactNumber ?? '',
    }),
    [user],
  );

  const [form, setForm] = useState<ProfileFormState>(initialValues);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const onChange = (key: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (!user?.uid) return;
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    const updates = {
      name: form.name.trim(),
      place: form.place.trim(),
      phoneNumber: form.phoneNumber.trim(),
      address: form.address.trim(),
      emergencyContactNumber: form.emergencyContactNumber.trim(),
    };

    setIsSaving(true);
    try {
      await updateDoc(userDoc(user.uid), updates);
      updateProfile(updates);
      setIsEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (error) {
      console.error('[Profile] save error:', error);
      Alert.alert('Save failed', 'Could not update your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const onStartEdit = () => {
    setForm({
      name: user?.name ?? '',
      place: user?.place ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      address: user?.address ?? '',
      emergencyContactNumber: user?.emergencyContactNumber ?? '',
    });
    setIsEditing(true);
  };

  const onCancelEdit = () => {
    setForm({
      name: user?.name ?? '',
      place: user?.place ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      address: user?.address ?? '',
      emergencyContactNumber: user?.emergencyContactNumber ?? '',
    });
    setIsEditing(false);
  };

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('[Profile] logout error:', error);
      Alert.alert('Logout failed', 'Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Profile</Text>
            <Button
              label="Back"
              variant="ghost"
              onPress={() => router.back()}
              style={styles.backBtn}
            />
          </View>

          <Card style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <Avatar name={form.name} size={64} />
              <View style={styles.identityBlock}>
                <Text style={styles.name}>{form.name || 'Your name'}</Text>
                <Text style={styles.email}>{user?.email ?? ''}</Text>
              </View>
            </View>

            {isEditing ? (
              <>
                <Input
                  label="Full Name"
                  value={form.name}
                  onChangeText={(text) => onChange('name', text)}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  returnKeyType="next"
                />

                <Input
                  label="Place"
                  value={form.place}
                  onChangeText={(text) => onChange('place', text)}
                  placeholder="City or place"
                  autoCapitalize="words"
                  returnKeyType="next"
                />

                <Input
                  label="Phone Number"
                  value={form.phoneNumber}
                  onChangeText={(text) => onChange('phoneNumber', text)}
                  placeholder="Your phone number"
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <Input
                  label="Address"
                  value={form.address}
                  onChangeText={(text) => onChange('address', text)}
                  placeholder="Home address"
                  autoCapitalize="sentences"
                  multiline
                  numberOfLines={3}
                />

                <Input
                  label="Emergency Family Contact Number"
                  value={form.emergencyContactNumber}
                  onChangeText={(text) => onChange('emergencyContactNumber', text)}
                  placeholder="Emergency contact number"
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />

                <Button
                  label="Save Details"
                  onPress={onSave}
                  isLoading={isSaving}
                  fullWidth
                  style={styles.primaryAction}
                />

                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={onCancelEdit}
                  fullWidth
                  style={styles.cancelAction}
                />
              </>
            ) : (
              <>
                <ProfileRow label="Full Name" value={user?.name} />
                <ProfileRow label="Place" value={user?.place} />
                <ProfileRow label="Phone Number" value={user?.phoneNumber} />
                <ProfileRow label="Address" value={user?.address} />
                <ProfileRow
                  label="Emergency Family Contact Number"
                  value={user?.emergencyContactNumber}
                />
                <Button
                  label="Edit Profile"
                  onPress={onStartEdit}
                  fullWidth
                  style={styles.primaryAction}
                />
              </>
            )}

            <Button
              label="Logout"
              variant="danger"
              onPress={onLogout}
              isLoading={isLoggingOut}
              fullWidth
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.rowBlock}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value?.trim() ? value : 'Not added'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  backBtn: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  profileCard: {
    padding: theme.spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  identityBlock: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  name: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  email: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  primaryAction: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  cancelAction: {
    marginBottom: theme.spacing.sm,
  },
  rowBlock: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  rowLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
});
