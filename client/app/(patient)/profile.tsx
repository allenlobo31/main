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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CalendarClock,
  House,
  ShieldAlert,
  Users,
  HeartPulse,
  Wrench,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useLanguageStore } from '../../src/store/languageStore';
import { updateProfile as updateRemoteProfile } from '../../src/services/dataService';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import {
  Gender,
  HerniaType,
  SurgeryStatus,
  SurgeryType,
} from '../../src/types';
import { parseISODateOnly, surgeryCountdownLabel } from '../../src/utils/dateHelpers';
import {
  GENDER_OPTIONS,
  HERNIA_TYPE_OPTIONS,
  SURGERY_STATUS_OPTIONS,
  SURGERY_TYPE_OPTIONS,
  deriveOperationStage,
  formatHerniaType,
  formatGender,
} from '../../src/utils/profileConstants';

// Additional format functions specific to profile
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

function PatientProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const { t, language } = useLanguageStore();
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

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  const handleOpenDatePicker = () => {
    let initialDate = new Date();
    if (form.scheduledSurgeryDate.trim()) {
      const parsed = parseISODateOnly(form.scheduledSurgeryDate.trim());
      if (parsed) {
        initialDate = parsed;
      }
    }
    setCurrentCalendarMonth(initialDate);
    setIsDatePickerVisible(true);
  };

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(
      new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(
      new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1)
    );
  };

  const handleSelectDay = (day: number) => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    onChange('scheduledSurgeryDate', dateStr);
    setIsDatePickerVisible(false);
  };

  const getTodayString = () => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  };

  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const cells: Array<{ isEmpty: boolean; day?: number; isExpired?: boolean; dateString?: string }> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ isEmpty: true });
    }

    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(year, month, d);
      const isExpired = cellDate < today;
      const dateString = `${year}-${pad(month + 1)}-${pad(d)}`;
      cells.push({
        isEmpty: false,
        day: d,
        isExpired,
        dateString,
      });
    }

    return cells;
  }, [currentCalendarMonth, form.scheduledSurgeryDate]);

  const isScheduled = form.surgeryStatus === 'scheduled';
  const isScheduledDateValid = !isScheduled || !!parseISODateOnly(form.scheduledSurgeryDate.trim());
  const reminderText = useMemo(
    () =>
      user?.surgeryStatus === 'scheduled'
        ? surgeryCountdownLabel(user?.scheduledSurgeryDate)
        : null,
    [user?.surgeryStatus, user?.scheduledSurgeryDate],
  );

  const generalFields = useMemo<DetailField[]>(
    () => [
      {
        label: t('profile.genderLabel'),
        value: formatGender(user?.gender),
        tone: 'sky',
        icon: Users,
      },
      {
        label: t('profile.addressLabel'),
        value: user?.address,
        tone: 'sky',
        icon: House,
      },
    ],
    [user?.gender, user?.address, language]
  );

  const surgicalFields = useMemo<DetailField[]>(
    () => {
      const fields: DetailField[] = [
        {
          label: t('profile.herniaTypeLabel'),
          value: formatHerniaType(user?.herniaType),
          tone: 'peach',
          icon: HeartPulse,
        },
        {
          label: t('profile.surgeryStatusLabel'),
          value: formatSurgeryStatus(user?.surgeryStatus),
          tone: 'lilac',
          icon: CalendarClock,
        },
        {
          label: t('profile.surgeryTypeLabel'),
          value: formatSurgeryType(user?.surgeryType),
          tone: 'mint',
          icon: Wrench,
        },
      ];

      if (user?.surgeryStatus !== 'completed') {
        fields.push({
          label: 'Surgery Reminder',
          value: reminderText ?? undefined,
          tone: 'sky',
          icon: CalendarClock,
        });
      }

      return fields;
    },
    [user?.herniaType, user?.surgeryStatus, user?.surgeryType, reminderText, language]
  );

  const emergencyFields = useMemo<DetailField[]>(
    () => [
      {
        label: t('profile.emergencyLabel'),
        value: user?.emergencyContactNumber,
        tone: 'peach',
        icon: ShieldAlert,
      },
    ],
    [user?.emergencyContactNumber, language]
  );

  const onChange = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (!user?.uid) return;
    if (!form.name.trim()) {
      Alert.alert(t('profile.nameRequired'), t('profile.nameRequiredDesc'));
      return;
    }

    if (isScheduled && !isScheduledDateValid) {
      Alert.alert(t('profile.invalidDate'), t('profile.invalidDateDesc'));
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
      await updateRemoteProfile(updates);
      updateProfile(updates);
      setIsEditing(false);
      Alert.alert(t('profile.saved'), t('profile.savedDesc'));
    } catch (error) {
      console.error('[Profile] save error:', error);
      Alert.alert(t('profile.saveFailed'), t('profile.saveFailedDesc'));
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
            <Text style={styles.title}>{t('profile.pageTitle')}</Text>
            <Button
              label={t('common.close')}
              variant="ghost"
              onPress={() => router.back()}
              style={styles.backBtn}
            />
          </View>

          <Card style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <Avatar name={form.name} size={90} />
              <View style={styles.identityBlock}>
                <Text style={styles.name} numberOfLines={1}>{form.name || t('profile.defaultName')}</Text>
                <Text style={styles.email} numberOfLines={1}>{user?.email ?? ''}</Text>
                {user?.phoneNumber ? (
                  <Text style={styles.phoneText} numberOfLines={1}>{user.phoneNumber}</Text>
                ) : null}
              </View>
            </View>

            {isEditing ? (
              <>
                <Input
                  label={t('profile.fullNameLabel')}
                  value={form.name}
                  onChangeText={(text) => onChange('name', text)}
                  placeholder={t('profile.fullNamePlaceholder')}
                  autoCapitalize="words"
                  returnKeyType="next"
                />

                <SelectionGroup
                  label={t('profile.genderLabel')}
                  options={GENDER_OPTIONS}
                  selected={form.gender}
                  onSelect={(value) => onChange('gender', value)}
                />

                <SelectionGroup
                  label={t('profile.herniaTypeLabel')}
                  options={HERNIA_TYPE_OPTIONS}
                  selected={form.herniaType}
                  onSelect={(value) => onChange('herniaType', value)}
                />

                <SelectionGroup
                  label={t('profile.surgeryStatusLabel')}
                  options={SURGERY_STATUS_OPTIONS}
                  selected={form.surgeryStatus}
                  onSelect={(value) => onChange('surgeryStatus', value)}
                />

                <SelectionGroup
                  label={t('profile.surgeryTypeLabel')}
                  options={SURGERY_TYPE_OPTIONS}
                  selected={form.surgeryType}
                  onSelect={(value) => onChange('surgeryType', value)}
                />

                {isScheduled ? (
                  <TouchableOpacity onPress={handleOpenDatePicker} activeOpacity={0.9}>
                    <View pointerEvents="none">
                      <Input
                        label={t('profile.surgeryDateLabel')}
                        value={form.scheduledSurgeryDate}
                        placeholder={t('profile.surgeryDatePlaceholder')}
                        editable={false}
                      />
                    </View>
                  </TouchableOpacity>
                ) : null}

                <Input
                  label={t('profile.phoneLabel')}
                  value={form.phoneNumber}
                  onChangeText={(text) => onChange('phoneNumber', text)}
                  placeholder={t('profile.phonePlaceholder')}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <Input
                  label={t('profile.addressLabel')}
                  value={form.address}
                  onChangeText={(text) => onChange('address', text)}
                  placeholder={t('profile.addressPlaceholder')}
                  autoCapitalize="sentences"
                  multiline
                  numberOfLines={3}
                />

                <Input
                  label={t('profile.emergencyLabel')}
                  value={form.emergencyContactNumber}
                  onChangeText={(text) => onChange('emergencyContactNumber', text)}
                  placeholder={t('profile.emergencyPlaceholder')}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />

                <Button
                  label={t('profile.saveDetails')}
                  onPress={onSave}
                  isLoading={isSaving}
                  style={styles.primaryAction}
                />
              </>
            ) : (
              <>
                <View style={styles.fieldsContainer}>
                  {/* General Info */}
                  {generalFields.map((field, idx) => (
                    <ProfileRow
                      key={`${field.label}-${idx}`}
                      label={field.label}
                      value={field.value}
                      tone={field.tone}
                      Icon={field.icon}
                    />
                  ))}
                  
                  <Text style={styles.sectionTitle}>{t('profile.surgicalPlan')}</Text>
                  
                  {/* Surgical Plan Grid */}
                  {surgicalFields.length === 3 ? (
                    <View>
                      <View style={styles.gridContainer}>
                        <ProfileRow
                          label={surgicalFields[0].label}
                          value={surgicalFields[0].value}
                          tone={surgicalFields[0].tone}
                          Icon={surgicalFields[0].icon}
                          isHalf
                        />
                        <ProfileRow
                          label={surgicalFields[1].label}
                          value={surgicalFields[1].value}
                          tone={surgicalFields[1].tone}
                          Icon={surgicalFields[1].icon}
                          isHalf
                        />
                      </View>
                      <View style={styles.centeredGridRow}>
                        <ProfileRow
                          label={surgicalFields[2].label}
                          value={surgicalFields[2].value}
                          tone={surgicalFields[2].tone}
                          Icon={surgicalFields[2].icon}
                          isHalf
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.gridContainer}>
                      {surgicalFields.map((field, idx) => (
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
                  )}

                  {/* Emergency Section */}
                  {emergencyFields.map((field, idx) => (
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
                  label={t('profile.editProfile')}
                  onPress={onStartEdit}
                  style={styles.primaryAction}
                />
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={onLogout}
                  disabled={isLoggingOut}
                >
                  <Text style={styles.logoutText}>{isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}</Text>
                </TouchableOpacity>
              </>
            )}
          </Card>
        </ScrollView>

        <Modal
          visible={isDatePickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDatePickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsDatePickerVisible(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                  <Text style={styles.monthNavText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {currentCalendarMonth.toLocaleString('default', { month: 'long' })}{' '}
                  {currentCalendarMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                  <Text style={styles.monthNavText}>▶</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekdaysRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <Text key={day} style={styles.weekdayText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {calendarDays.map((item, idx) => {
                  if (item.isEmpty) {
                    return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
                  }

                  const isSelected = item.dateString === form.scheduledSurgeryDate;
                  const isToday = item.dateString === getTodayString();

                  return (
                    <TouchableOpacity
                      key={`day-${item.day}`}
                      disabled={item.isExpired}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        item.isExpired && styles.dayCellExpired,
                      ]}
                      onPress={() => handleSelectDay(item.day!)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          isToday && styles.dayTextToday,
                          item.isExpired && styles.dayTextExpired,
                        ]}
                      >
                        {item.day}
                      </Text>
                      {isToday && !isSelected && <View style={styles.todayDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.closePickerBtn}
                onPress={() => setIsDatePickerVisible(false)}
              >
                <Text style={styles.closePickerText}>{t('profile.closePicker')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
  phoneText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
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
    backgroundColor: '#ffffff',
  },
  skyRow: {
    backgroundColor: '#ffffff',
  },
  peachRow: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
  },
  lilacRow: {
    backgroundColor: '#ffffff',
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
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  optionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: '#000000',
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
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#ffffff',
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
  centeredGridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: 320,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  monthNavBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
  },
  monthNavText: {
    fontWeight: '800',
    fontSize: 14,
    color: '#000000',
  },
  monthTitle: {
    ...theme.typography.h3,
    color: '#000000',
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    ...theme.typography.caption,
    fontWeight: '700',
    color: '#666666',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellEmpty: {
    width: 36,
    height: 36,
  },
  dayCellSelected: {
    backgroundColor: '#e6f9ed',
    borderColor: '#000000',
    borderWidth: 2,
  },
  dayCellExpired: {
    backgroundColor: '#f5f5f5',
    opacity: 0.4,
  },
  dayText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: '#000000',
  },
  dayTextSelected: {
    fontWeight: '800',
  },
  dayTextToday: {
    color: '#0d9488',
    fontWeight: '800',
  },
  dayTextExpired: {
    color: '#a3a3a3',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0d9488',
    position: 'absolute',
    bottom: 2,
  },
  closePickerBtn: {
    marginTop: theme.spacing.md,
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  closePickerText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: '#000000',
  },
});

export default React.memo(PatientProfileScreen);
