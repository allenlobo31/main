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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CalendarClock,
  ClipboardList,
  House,
  MapPin,
  Phone,
  ShieldAlert,
  Users,
  HeartPulse,
  Wrench,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { userDoc, updateDoc } from '../../src/services/firebase/firestore';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import {
  Gender,
  HerniaType,
  OperationStage,
  SurgeryStatus,
  SurgeryType,
} from '../../src/types';
import { parseISODateOnly, surgeryCountdownLabel } from '../../src/utils/dateHelpers';

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const herniaTypeOptions: Array<{ label: string; value: HerniaType }> = [
  { label: 'Inguinal', value: 'inguinal' },
  { label: 'Femoral', value: 'femoral' },
  { label: 'Umbilical', value: 'umbilical' },
  { label: 'Incisional', value: 'incisional' },
];

const surgeryStatusOptions: Array<{ label: string; value: SurgeryStatus }> = [
  { label: 'Not Done', value: 'not-done' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
];

const surgeryTypeOptions: Array<{ label: string; value: SurgeryType }> = [
  { label: 'Open', value: 'open' },
  { label: 'Laparoscopic', value: 'laparoscopic' },
];

function deriveOperationStage(status: SurgeryStatus | null): OperationStage | null {
  if (!status) return null;
  return status === 'completed' ? 'post-operation' : 'pre-operation';
}

function formatHerniaType(value?: HerniaType | null) {
  if (!value) return undefined;
  const map: Record<HerniaType, string> = {
    inguinal: 'Inguinal',
    femoral: 'Femoral',
    umbilical: 'Umbilical',
    incisional: 'Incisional',
  };
  return map[value];
}

function formatGender(value?: Gender | null) {
  if (!value) return undefined;
  const map: Record<Gender, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
  };
  return map[value];
}

function formatOperationStage(value?: OperationStage | null) {
  if (!value) return undefined;
  const map: Record<OperationStage, string> = {
    'pre-operation': 'Pre Operation',
    'post-operation': 'Post Operation',
  };
  return map[value];
}

function formatSurgeryStatus(value?: SurgeryStatus | null) {
  if (!value) return undefined;
  const map: Record<SurgeryStatus, string> = {
    'not-done': 'Not Done',
    scheduled: 'Scheduled',
    completed: 'Completed',
  };
  return map[value];
}

function formatSurgeryType(value?: SurgeryType | null) {
  if (!value) return undefined;
  const map: Record<SurgeryType, string> = {
    open: 'Open',
    laparoscopic: 'Laparoscopic',
  };
  return map[value];
}

type ProfileFormState = {
  name: string;
  gender: Gender | null;
  herniaType: HerniaType | null;
  surgeryStatus: SurgeryStatus | null;
  surgeryType: SurgeryType | null;
  scheduledSurgeryDate: string;
  place: string;
  phoneNumber: string;
  address: string;
  emergencyContactNumber: string;
};

type FieldTone = 'mint' | 'sky' | 'peach' | 'lilac';

type DetailField = {
  label: string;
  value?: string;
  tone: FieldTone;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  action?: string;
};

export default function PatientProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const { horizontalPadding } = useResponsiveLayout();

  const initialValues = useMemo<ProfileFormState>(
    () => ({
      name: user?.name ?? '',
      gender: user?.gender ?? null,
      herniaType: user?.herniaType ?? null,
      surgeryStatus: user?.surgeryStatus ?? null,
      surgeryType: user?.surgeryType ?? null,
      scheduledSurgeryDate: user?.scheduledSurgeryDate ?? '',
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

  const derivedStage = deriveOperationStage(form.surgeryStatus);
  const isScheduled = form.surgeryStatus === 'scheduled';
  const isScheduledDateValid = !isScheduled || !!parseISODateOnly(form.scheduledSurgeryDate.trim());
  const reminderText = useMemo(
    () =>
      user?.surgeryStatus === 'scheduled'
        ? surgeryCountdownLabel(user?.scheduledSurgeryDate)
        : null,
    [user?.surgeryStatus, user?.scheduledSurgeryDate],
  );

  const detailFields = useMemo<DetailField[]>(
    () => [
      {
        label: 'Place',
        value: user?.place,
        tone: 'mint',
        icon: MapPin,
      },
      {
        label: 'Gender',
        value: formatGender(user?.gender),
        tone: 'sky',
        icon: Users,
      },
      {
        label: 'Phone Number',
        value: user?.phoneNumber,
        tone: 'mint',
        icon: Phone,
      },
      {
        label: 'Address',
        value: user?.address,
        tone: 'sky',
        icon: House,
      },
      {
        label: 'Hernia Type',
        value: formatHerniaType(user?.herniaType),
        tone: 'peach',
        icon: HeartPulse,
      },
      {
        label: 'Surgery Status',
        value: formatSurgeryStatus(user?.surgeryStatus),
        tone: 'lilac',
        icon: CalendarClock,
      },
      {
        label: 'Surgery Type',
        value: formatSurgeryType(user?.surgeryType),
        tone: 'mint',
        icon: Wrench,
      },
      {
        label: 'Surgery Type', // Added second surgery type as per image
        value: formatSurgeryType(user?.surgeryType),
        tone: 'mint',
        icon: Wrench,
      },
      {
        label: 'Surgery Reminder',
        value: reminderText ?? undefined,
        tone: 'sky',
        icon: CalendarClock,
      },
      {
        label: 'Operation Stage',
        value: formatOperationStage(user?.operationStage ?? deriveOperationStage(user?.surgeryStatus ?? null)),
        tone: 'lilac',
        icon: ClipboardList,
      },
      {
        label: 'Emergency Family Contact Number',
        value: user?.emergencyContactNumber,
        tone: 'peach',
        icon: ShieldAlert,
      },
    ],
    [
      user?.place,
      user?.gender,
      user?.phoneNumber,
      user?.address,
      user?.herniaType,
      user?.surgeryStatus,
      user?.surgeryType,
      reminderText,
      user?.operationStage,
      user?.emergencyContactNumber,
    ],
  );

  const onChange = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (!user?.uid) return;
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    if (isScheduled && !isScheduledDateValid) {
      Alert.alert('Invalid date', 'Please enter surgery date in YYYY-MM-DD format.');
      return;
    }

    const operationStage = deriveOperationStage(form.surgeryStatus);

    const updates = {
      name: form.name.trim(),
      gender: form.gender,
      herniaType: form.herniaType,
      surgeryStatus: form.surgeryStatus,
      surgeryType: form.surgeryType,
      scheduledSurgeryDate: isScheduled ? form.scheduledSurgeryDate.trim() : null,
      operationStage,
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
      gender: user?.gender ?? null,
      herniaType: user?.herniaType ?? null,
      surgeryStatus: user?.surgeryStatus ?? null,
      surgeryType: user?.surgeryType ?? null,
      scheduledSurgeryDate: user?.scheduledSurgeryDate ?? '',
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
      gender: user?.gender ?? null,
      herniaType: user?.herniaType ?? null,
      surgeryStatus: user?.surgeryStatus ?? null,
      surgeryType: user?.surgeryType ?? null,
      scheduledSurgeryDate: user?.scheduledSurgeryDate ?? '',
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
              <Avatar name={form.name} size={90} />
              <View style={styles.identityBlock}>
                <Text style={styles.name} numberOfLines={1}>{form.name || 'Your name'}</Text>
                <Text style={styles.email} numberOfLines={1}>{user?.email ?? ''}</Text>
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

                <SelectionGroup
                  label="Gender"
                  options={genderOptions}
                  selected={form.gender}
                  onSelect={(value) => onChange('gender', value)}
                />

                <SelectionGroup
                  label="Hernia Type"
                  options={herniaTypeOptions}
                  selected={form.herniaType}
                  onSelect={(value) => onChange('herniaType', value)}
                />

                <SelectionGroup
                  label="Surgery Status"
                  options={surgeryStatusOptions}
                  selected={form.surgeryStatus}
                  onSelect={(value) => onChange('surgeryStatus', value)}
                />

                <SelectionGroup
                  label="Surgery Type"
                  options={surgeryTypeOptions}
                  selected={form.surgeryType}
                  onSelect={(value) => onChange('surgeryType', value)}
                />

                {isScheduled ? (
                  <Input
                    label="Scheduled Surgery Date"
                    value={form.scheduledSurgeryDate}
                    onChangeText={(text) => onChange('scheduledSurgeryDate', text)}
                    placeholder="YYYY-MM-DD"
                    autoCapitalize="none"
                    error={
                      form.scheduledSurgeryDate.trim() && !isScheduledDateValid
                        ? 'Use date format YYYY-MM-DD'
                        : undefined
                    }
                  />
                ) : null}

                <View style={styles.derivedStageCard}>
                  <Text style={styles.derivedStageLabel}>Operation Stage (Auto)</Text>
                  <Text style={styles.derivedStageValue}>
                    {derivedStage === 'post-operation' ? 'Post Operation' : 'Pre Operation'}
                  </Text>
                </View>

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
                <View style={styles.fieldsContainer}>
                  {detailFields.slice(0, 4).map((field, idx) => (
                    <ProfileRow
                      key={`${field.label}-${idx}`}
                      label={field.label}
                      value={field.value}
                      tone={field.tone}
                      Icon={field.icon}
                    />
                  ))}
                  
                  <Text style={styles.sectionTitle}>Surgical Plan</Text>
                  
                  <View style={styles.gridContainer}>
                    {detailFields.slice(4, 8).map((field, idx) => (
                      <ProfileRow
                        key={`${field.label}-${idx}`}
                        label={field.label}
                        value={field.value}
                        tone={field.tone}
                        Icon={field.icon}
                        isHalf
                      />
                    ))}
                  </View>

                  {detailFields.slice(8, 10).map((field, idx) => (
                    <ProfileRow
                      key={`${field.label}-${idx}`}
                      label={field.label}
                      value={field.value}
                      tone={field.tone}
                      Icon={field.icon}
                    />
                  ))}

                  {detailFields.slice(10).map((field, idx) => (
                    <ProfileRow
                      key={`${field.label}-${idx}`}
                      label={field.label}
                      value={field.value}
                      tone={field.tone}
                      Icon={field.icon}
                    />
                  ))}
                </View>
                <Button
                  label="Edit Profile"
                  onPress={onStartEdit}
                  fullWidth
                  style={styles.primaryAction}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={onLogout}
              disabled={isLoggingOut}
            >
              <Text style={styles.logoutText}>{isLoggingOut ? 'Logging out...' : 'Logout'}</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileRow({
  label,
  value,
  tone,
  Icon,
  isHalf,
}: {
  label: string;
  value?: string;
  tone: FieldTone;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  isHalf?: boolean;
}) {
  const displayValue = value?.trim() ? value : 'Not added';
  const isSurgeryReminder = label === 'Surgery Reminder';

  return (
    <View style={[styles.rowBlock, styles[`${tone}Row`], isHalf && styles.halfWidth]}>
      <View style={[styles.rowIconWrap, styles[`${tone}IconWrap`]]}>
        <Icon size={18} color={theme.colors.textPrimary} strokeWidth={2.25} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTopLine}>
          <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
        </View>
        <View style={styles.rowValueContainer}>
          <Text 
            style={[styles.rowValue, isSurgeryReminder && styles.reminderValue]}
            numberOfLines={isHalf ? 1 : 2}
          >
            {displayValue}
          </Text>
          {isSurgeryReminder && (
            <View style={styles.progressCircleStub} />
          )}
        </View>
      </View>
    </View>
  );
}

type Option<T extends string> = {
  label: string;
  value: T;
};

function SelectionGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: Array<Option<T>>;
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.selectWrap}>
      <Text style={styles.selectLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, active && styles.optionActive]}
              activeOpacity={0.8}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    borderColor: 'transparent',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
  rowLabel: {
    ...theme.typography.caption,
    color: '#333333',
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10, // Slightly smaller for better fit
  },
  rowValue: {
    ...theme.typography.body,
    color: '#000000',
    fontSize: 15, // Adjusted for better space management
    fontWeight: '500',
    flexShrink: 1, // Allow text to shrink if needed
  },
  mintRow: {
    backgroundColor: '#eff9f3',
  },
  skyRow: {
    backgroundColor: '#edf5fd',
  },
  peachRow: {
    backgroundColor: '#fff1f1',
    borderColor: '#ff4d4d', // Red border for emergency section
    borderWidth: 1.5,
  },
  lilacRow: {
    backgroundColor: '#f6f1fd',
  },
  mintIconWrap: {
    backgroundColor: '#d7f2e3',
  },
  skyIconWrap: {
    backgroundColor: '#d6e8fa',
  },
  peachIconWrap: {
    backgroundColor: '#ffdbdb',
  },
  lilacIconWrap: {
    backgroundColor: '#ead9fa',
  },
  selectWrap: {
    marginBottom: theme.spacing.md,
  },
  selectLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  optionActive: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  derivedStageCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  derivedStageLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  derivedStageValue: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  memberSince: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  fieldsContainer: {
    marginTop: theme.spacing.md,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    ...theme.typography.caption,
    color: '#000000',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Matching the screenshot's serif font
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  rowValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderValue: {
    fontWeight: '700',
    color: '#1e3a8a', // Darker blue for emphasis
  },
  progressCircleStub: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    borderRightColor: '#0d9488', // Teal progress color
    transform: [{ rotate: '-45deg' }],
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  logoutText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});
