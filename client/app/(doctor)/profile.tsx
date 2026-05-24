import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Phone,
  User as UserIcon,
  Building2,
  Clock,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { updateProfile as updateRemoteProfile } from '../../src/services/dataService';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';

type DoctorProfileForm = {
  name: string;
  phoneNumber: string;
  hospitalAddress: string;
  experience: string;
  avatarUrl: string;
};

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const { horizontalPadding } = useResponsiveLayout();

  const [form, setForm] = useState<DoctorProfileForm>({
    name: user?.name ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    hospitalAddress: user?.hospitalAddress ?? '',
    experience: (user as any)?.experience ?? '8 Years',
    avatarUrl: user?.avatarUrl ?? '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const onChange = <K extends keyof DoctorProfileForm>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (!user?.uid) return;
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    setIsSaving(true);
    try {
      await updateRemoteProfile({
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        hospitalAddress: form.hospitalAddress.trim(),
        experience: form.experience.trim(),
        avatarUrl: form.avatarUrl.trim(),
      });
      updateProfile(form);
      setIsEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (error) {
      console.error('[DoctorProfile] save error:', error);
      Alert.alert('Error', 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Logout failed');
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
              <Avatar name={form.name} uri={form.avatarUrl} size={90} />
              <View style={styles.identityBlock}>
                <Text style={styles.name} numberOfLines={1}>{form.name || 'Your name'}</Text>
                <Text style={styles.email} numberOfLines={1}>{user?.email ?? ''}</Text>
                <Text style={styles.roleBadge}>Doctor Account</Text>
              </View>
            </View>

            {isEditing ? (
              <View style={styles.formContainer}>
                <Input
                  label="Display Name"
                  value={form.name}
                  onChangeText={(t) => onChange('name', t)}
                  placeholder="Dr. Jane Smith"
                />
                <Input
                  label="Phone Number"
                  value={form.phoneNumber}
                  onChangeText={(t) => onChange('phoneNumber', t)}
                  keyboardType="phone-pad"
                  placeholder="Your phone number"
                />
                <Input
                  label="Hospital Address"
                  value={form.hospitalAddress}
                  onChangeText={(t) => onChange('hospitalAddress', t)}
                  multiline
                  numberOfLines={2}
                  placeholder="Main Hospital, Street 123"
                />
                <Input
                  label="Experience (e.g., 8 Years)"
                  value={form.experience}
                  onChangeText={(t) => onChange('experience', t)}
                  placeholder="8 Years"
                />
                <Input
                  label="Profile Photo URL"
                  value={form.avatarUrl}
                  onChangeText={(t) => onChange('avatarUrl', t)}
                  placeholder="https://example.com/photo.jpg"
                />
                <Button
                  label="Save Changes"
                  onPress={onSave}
                  isLoading={isSaving}
                  style={styles.primaryAction}
                />
              </View>
            ) : (
              <View style={styles.fieldsContainer}>
                <DetailRow icon={UserIcon} label="Name" value={user?.name} tone="mint" />
                <DetailRow icon={Phone} label="Phone" value={user?.phoneNumber} tone="sky" />
                <DetailRow icon={Building2} label="Hospital" value={user?.hospitalAddress} tone="lilac" />
                <DetailRow icon={Clock} label="Experience" value={(user as any)?.experience || '8 Years'} tone="sky" />
                
                <Button
                  label="Edit Profile"
                  onPress={() => setIsEditing(true)}
                  style={styles.primaryAction}
                />
                
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={onLogout}
                  disabled={isLoggingOut}
                >
                  <Text style={styles.logoutText}>
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({ icon: Icon, label, value, tone }: any) {
  const displayValue = value?.trim() ? value : 'Not added';

  return (
    <View
      style={[styles.rowBlock, styles[`${tone}Row` as keyof typeof styles] as ViewStyle]}
    >
      <View
        style={[styles.rowIconWrap, styles[`${tone}IconWrap` as keyof typeof styles] as ViewStyle]}
      >
        <Icon size={18} color={theme.colors.textPrimary} strokeWidth={2.25} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTopLine}>
          <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
        </View>
        <View style={styles.rowValueContainer}>
          <Text style={styles.rowValue} numberOfLines={2}>
            {displayValue}
          </Text>
        </View>
      </View>
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
    backgroundColor: '#e6f9ed',
    borderColor: '#000000',
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
  roleBadge: {
    ...theme.typography.caption,
    color: '#0d9488',
    fontWeight: '700',
    marginTop: 4,
    backgroundColor: '#ccfbf1',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryAction: {
    marginTop: 32,
    marginBottom: 2,
    width: '60%',
    alignSelf: 'center',
  },
  cancelAction: {
    marginBottom: 8,
    width: '60%',
    alignSelf: 'center',
  },
  fieldsContainer: {
    marginTop: theme.spacing.md,
  },
  formContainer: {
    gap: theme.spacing.xs,
  },
  rowBlock: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  rowContent: {
    flex: 1,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  rowLabel: {
    ...theme.typography.caption,
    color: '#333333',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
  },
  rowValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowValue: {
    ...theme.typography.body,
    color: '#000000',
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  mintRow: { backgroundColor: '#ffffff' },
  skyRow: { backgroundColor: '#ffffff' },
  lilacRow: { backgroundColor: '#ffffff' },
  mintIconWrap: { backgroundColor: '#d7f2e3' },
  skyIconWrap: { backgroundColor: '#d6e8fa' },
  lilacIconWrap: { backgroundColor: '#ead9fa' },
  logoutBtn: {
    backgroundColor: '#edf5fd', // Light blue background
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
    alignSelf: 'center',
    marginTop: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  logoutText: {
    ...theme.typography.body,
    color: '#1e3a8a', // Darker blue for contrast
    fontWeight: '800',
  },
});