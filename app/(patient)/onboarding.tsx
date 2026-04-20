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
  HeartPulse,
  Users,
  Wrench,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { userDoc, updateDoc } from '../../src/services/firebase/firestore';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import {
  HerniaType,
  Gender,
  OperationStage,
  SurgeryStatus,
  SurgeryType,
} from '../../src/types';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { parseISODateOnly } from '../../src/utils/dateHelpers';

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

export default function PatientOnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const { horizontalPadding } = useResponsiveLayout();

  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [herniaType, setHerniaType] = useState<HerniaType | null>(user?.herniaType ?? null);
  const [surgeryStatus, setSurgeryStatus] = useState<SurgeryStatus | null>(
    user?.surgeryStatus ?? null,
  );
  const [surgeryType, setSurgeryType] = useState<SurgeryType | null>(user?.surgeryType ?? null);
  const [scheduledSurgeryDate, setScheduledSurgeryDate] = useState(user?.scheduledSurgeryDate ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const operationStage = deriveOperationStage(surgeryStatus);
  const isScheduled = surgeryStatus === 'scheduled';
  const isScheduledDateValid = !isScheduled || !!parseISODateOnly(scheduledSurgeryDate.trim());

  const canSubmit = useMemo(
    () =>
      !!name.trim()
      && !!gender
      && !!herniaType
      && !!surgeryStatus
      && !!surgeryType
      && !!operationStage
      && (!isScheduled || !!scheduledSurgeryDate.trim())
      && isScheduledDateValid,
    [
      name,
      gender,
      herniaType,
      surgeryStatus,
      surgeryType,
      operationStage,
      isScheduled,
      scheduledSurgeryDate,
      isScheduledDateValid,
    ],
  );

  const onSave = async () => {
    if (!user?.uid) return;

    if (!canSubmit) {
      Alert.alert('Incomplete details', 'Please complete all fields to continue.');
      return;
    }

    if (isScheduled && !isScheduledDateValid) {
      Alert.alert('Invalid date', 'Please enter surgery date in YYYY-MM-DD format.');
      return;
    }

    const updates = {
      name: name.trim(),
      gender,
      herniaType,
      operationStage,
      surgeryStatus,
      surgeryType,
      scheduledSurgeryDate: isScheduled ? scheduledSurgeryDate.trim() : null,
      profileSetupCompleted: true,
    };

    setIsSaving(true);
    try {
      await updateDoc(userDoc(user.uid), updates);
      updateProfile(updates);
      router.replace('/(patient)/dashboard');
    } catch (error) {
      console.error('[Onboarding] save error:', error);
      Alert.alert('Save failed', 'Could not save your details. Please try again.');
    } finally {
      setIsSaving(false);
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Enter your details once to personalize your care journey.
            </Text>

            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholder="Enter your full name"
            />

            <SelectionGroup
              label="Gender"
              options={genderOptions}
              selected={gender}
              onSelect={(value) => setGender(value)}
              Icon={Users}
              tone="sky"
            />

            <SelectionGroup
              label="Hernia Type"
              options={herniaTypeOptions}
              selected={herniaType}
              onSelect={(value) => setHerniaType(value)}
              Icon={HeartPulse}
              tone="peach"
            />

            <SelectionGroup
              label="Surgery Status"
              options={surgeryStatusOptions}
              selected={surgeryStatus}
              onSelect={(value) => setSurgeryStatus(value)}
              Icon={CalendarClock}
              tone="mint"
            />

            <SelectionGroup
              label="Surgery Type"
              options={surgeryTypeOptions}
              selected={surgeryType}
              onSelect={(value) => setSurgeryType(value)}
              Icon={Wrench}
              tone="lilac"
            />

            {isScheduled ? (
              <Input
                label="Scheduled Surgery Date"
                value={scheduledSurgeryDate}
                onChangeText={setScheduledSurgeryDate}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                error={
                  scheduledSurgeryDate.trim() && !isScheduledDateValid
                    ? 'Use date format YYYY-MM-DD'
                    : undefined
                }
              />
            ) : null}

            <Button
              label="Save & Continue"
              onPress={onSave}
              isLoading={isSaving}
              disabled={!canSubmit}
              fullWidth
              style={styles.saveButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  Icon,
  tone,
}: {
  label: string;
  options: Array<Option<T>>;
  selected: T | null;
  onSelect: (value: T) => void;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tone: 'mint' | 'sky' | 'peach' | 'lilac';
}) {
  return (
    <View style={[styles.groupWrap, styles[`${tone}GroupWrap`]]}>
      <View style={styles.groupHeaderRow}>
        <View style={[styles.groupIconWrap, styles[`${tone}GroupIconWrap`]]}>
          <Icon size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
        </View>
        <Text style={styles.groupLabel}>{label}</Text>
      </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  card: {
    padding: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  groupWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  mintGroupWrap: {
    backgroundColor: '#f4faf7',
  },
  skyGroupWrap: {
    backgroundColor: '#f3f8fc',
  },
  peachGroupWrap: {
    backgroundColor: '#fdf6f1',
  },
  lilacGroupWrap: {
    backgroundColor: '#f8f4fc',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  groupIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mintGroupIconWrap: {
    backgroundColor: '#d9f1e6',
  },
  skyGroupIconWrap: {
    backgroundColor: '#dbe9f7',
  },
  peachGroupIconWrap: {
    backgroundColor: '#f7e4d7',
  },
  lilacGroupIconWrap: {
    backgroundColor: '#ebdef8',
  },
  groupLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
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
  saveButton: {
    marginTop: theme.spacing.sm,
  },
});
