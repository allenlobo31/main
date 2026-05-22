import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDiary } from '../../src/hooks/useDiary';
import { DiaryEntry } from '../../src/components/diary/DiaryEntry';
import { MoodPicker } from '../../src/components/diary/MoodPicker';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { MoodType } from '../../src/types';
import { useSymptomStore } from '../../src/store/symptomStore';
import { useAuthStore } from '../../src/store/authStore';
import {
  Thermometer,
  Flame,
  Droplets,
  TriangleAlert,
  Siren,
  Clock,
} from 'lucide-react-native';

const iconMap = {
  Thermometer: Thermometer,
  Droplets: Droplets,
  Flame: Flame,
  TriangleAlert: TriangleAlert,
  Siren: Siren,
};

export default function DiaryScreen() {
  const { entries, isLoading, hasMore, isSubmitting, fetchEntries, addEntry } = useDiary();
  const { entries: symptomEntries, fetchEntries: fetchSymptomEntries } = useSymptomStore();
  const { user } = useAuthStore();

  const [text, setText] = useState('');
  const [mood, setMood] = useState<MoodType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [symptomViewMode, setSymptomViewMode] = useState<'day' | 'month'>('month');
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  useFocusEffect(
    React.useCallback(() => {
      fetchEntries();
      if (user?.uid) {
        fetchSymptomEntries(user.uid);
      }
    }, [fetchEntries, fetchSymptomEntries, user?.uid]),
  );

  // Get entries for the current month
  const monthEntries = useMemo(() => {
    const now = new Date();
    return symptomEntries.filter((e) => {
      const entryDate = new Date(e.date);
      return (
        entryDate.getMonth() === now.getMonth() &&
        entryDate.getFullYear() === now.getFullYear()
      );
    });
  }, [symptomEntries]);

  // Get entries for today
  const dayEntries = useMemo(() => {
    const now = new Date();
    return symptomEntries.filter((e) => {
      const entryDate = new Date(e.date);
      return entryDate.toDateString() === now.toDateString();
    });
  }, [symptomEntries]);

  // Monthly breakdown calculation
  const monthBreakdown = useMemo(() => {
    const total = monthEntries.length;
    if (total === 0) {
      return [
        { label: 'Fever', count: 0, percent: 0, icon: 'Thermometer' },
        { label: 'Swelling', count: 0, percent: 0, icon: 'Droplets' },
        { label: 'Vomiting', count: 0, percent: 0, icon: 'Flame' },
        { label: 'Redness', count: 0, percent: 0, icon: 'TriangleAlert' },
        { label: 'Bleeding', count: 0, percent: 0, icon: 'Siren' },
        { label: 'Difficult Urination', count: 0, percent: 0, icon: 'Droplets' },
      ];
    }

    const fever = monthEntries.filter(e => e.fever).length;
    const swelling = monthEntries.filter(e => e.swelling && e.swelling !== 'none').length;
    const vomiting = monthEntries.filter(e => e.nausea).length;
    
    const redness = monthEntries.filter(e => 
      e.woundCondition && e.woundCondition.toLowerCase().includes('redness')
    ).length;
    
    const bleeding = monthEntries.filter(e => 
      e.woundCondition && e.woundCondition.toLowerCase().includes('bleeding')
    ).length;
    
    const urination = monthEntries.filter(e => 
      e.woundCondition && e.woundCondition.toLowerCase().includes('urination')
    ).length;

    return [
      { label: 'Fever', count: fever, percent: Math.round((fever / total) * 100), icon: 'Thermometer' },
      { label: 'Swelling', count: swelling, percent: Math.round((swelling / total) * 100), icon: 'Droplets' },
      { label: 'Vomiting', count: vomiting, percent: Math.round((vomiting / total) * 100), icon: 'Flame' },
      { label: 'Redness', count: redness, percent: Math.round((redness / total) * 100), icon: 'TriangleAlert' },
      { label: 'Bleeding', count: bleeding, percent: Math.round((bleeding / total) * 100), icon: 'Siren' },
      { label: 'Difficult Urination', count: urination, percent: Math.round((urination / total) * 100), icon: 'Droplets' },
    ];
  }, [monthEntries]);

  const handleSubmit = async () => {
    if (!mood) {
      Alert.alert('Select Mood', 'Please pick how you are feeling today.');
      return;
    }
    if (text.trim().length < 10) {
      Alert.alert('Too Short', 'Please write at least 10 characters.');
      return;
    }

    const success = await addEntry(text.trim(), mood);
    if (success) {
      setText('');
      setMood(null);
      setShowForm(false);
      Alert.alert('Entry Added ✅', '+15 XP earned!');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={entries}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text style={styles.pageTitle}>Recovery Diary</Text>
              
              {/* Premium Neobrutalist Green Card */}
              <View style={styles.premiumCard}>
                {/* Header with pill toggles */}
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {symptomViewMode === 'month' ? 'Symptom Breakdown' : "Today's Logs"}
                  </Text>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[styles.toggleButton, symptomViewMode === 'month' && styles.toggleButtonActive]}
                      onPress={() => setSymptomViewMode('month')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.toggleText, symptomViewMode === 'month' && styles.toggleTextActive]}>
                        Month
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleButton, symptomViewMode === 'day' && styles.toggleButtonActive]}
                      onPress={() => setSymptomViewMode('day')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.toggleText, symptomViewMode === 'day' && styles.toggleTextActive]}>
                        Day
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Content depending on view mode */}
                {symptomViewMode === 'month' ? (
                  <View style={styles.monthView}>
                    <Text style={styles.subtitle}>
                      Symptom frequency across {monthEntries.length} log{monthEntries.length !== 1 ? 's' : ''} this month
                    </Text>
                    
                    {monthBreakdown.map((item) => {
                      const IconComp = iconMap[item.icon as keyof typeof iconMap];
                      return (
                        <View key={item.label} style={styles.breakdownRow}>
                          <View style={styles.symptomInfo}>
                            <IconComp size={14} color="#000000" style={{ marginRight: 6 }} />
                            <Text style={styles.symptomLabel}>{item.label}</Text>
                          </View>
                          <View style={styles.progressContainer}>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressFill, { width: `${item.percent}%` }]} />
                            </View>
                            <Text style={styles.progressText}>
                              {item.percent}% ({item.count})
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.dayView}>
                    {dayEntries.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                          No symptoms logged today. Keep tracking to see your daily trends.
                        </Text>
                      </View>
                    ) : (
                      dayEntries.map((entry, index) => {
                        // Determine active symptoms for this entry
                        const activeSymptoms: string[] = [];
                        if (entry.fever) activeSymptoms.push('Fever');
                        if (entry.swelling && entry.swelling !== 'none') {
                          activeSymptoms.push(`Swelling: ${entry.swelling}`);
                        }
                        if (entry.nausea) activeSymptoms.push('Vomiting');
                        
                        // Parse woundCondition list
                        if (entry.woundCondition && entry.woundCondition !== 'No critical symptom selected') {
                          entry.woundCondition.split(',').forEach(cond => {
                            const cleanCond = cond.trim();
                            if (
                              cleanCond && 
                              !activeSymptoms.some(s => s.toLowerCase().includes(cleanCond.toLowerCase())) &&
                              cleanCond !== 'No critical symptom selected'
                            ) {
                              activeSymptoms.push(cleanCond);
                            }
                          });
                        }

                        // Calculate Dynamic Symptom Severity
                        const condLower = (entry.woundCondition || '').toLowerCase();
                        const hasRedness = condLower.includes('redness');
                        const hasBleeding = condLower.includes('bleeding');
                        const hasVomiting = entry.nausea;
                        const hasUrination = condLower.includes('urination');
                        const hasFever = entry.fever;
                        const hasSwelling = entry.swelling && entry.swelling !== 'none';

                        let severity: 'Mild' | 'Medium' | 'High' = 'Mild';
                        if (hasRedness || hasBleeding) {
                          severity = 'High';
                        } else if (hasVomiting || hasUrination) {
                          severity = 'Medium';
                        } else if (hasFever || hasSwelling) {
                          severity = 'Mild';
                        }

                        // Format entry time
                        const entryTime = new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                          <View key={entry.id || index} style={[styles.entryCard, index > 0 && { marginTop: theme.spacing.sm }]}>
                            <View style={styles.entryHeader}>
                              <View style={styles.timeWrapper}>
                                <Clock size={12} color="#000000" style={{ marginRight: 4 }} />
                                <Text style={styles.entryTime}>{entryTime}</Text>
                              </View>
                              <View style={[
                                styles.painBadge,
                                severity === 'High' ? styles.painHigh : (severity === 'Medium' ? styles.painMedium : styles.painMild)
                              ]}>
                                <Text style={styles.painBadgeText}>{severity}</Text>
                              </View>
                            </View>

                            {activeSymptoms.length > 0 ? (
                              <View style={styles.badgeContainer}>
                                {activeSymptoms.map((symp, sIdx) => (
                                  <View key={sIdx} style={styles.symptomBadge}>
                                    <Text style={styles.symptomBadgeText}>{symp}</Text>
                                  </View>
                                ))}
                              </View>
                            ) : (
                              <Text style={styles.noSymptomsText}>No active symptoms</Text>
                            )}

                            {entry.additionalNotes ? (
                              <View style={styles.notesWrapper}>
                                <Text style={styles.notesText}>"{entry.additionalNotes}"</Text>
                              </View>
                            ) : null}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.empty}>
                No entries yet. Add your first diary entry below.
              </Text>
            ) : null
          }
          ListFooterComponent={
            hasMore ? (
              <Button
                label="Load more"
                onPress={() => fetchEntries()}
                variant="ghost"
                isLoading={isLoading}
                fullWidth
              />
            ) : null
          }
          renderItem={({ item }) => <DiaryEntry entry={item} />}
          onEndReached={() => {
            if (hasMore && !isLoading) fetchEntries();
          }}
          onEndReachedThreshold={0.3}
        />

        {/* Add Entry Button / Form */}
        <View style={[styles.inputArea, { paddingHorizontal: horizontalPadding }]}>
          {showForm ? (
            <View style={styles.form}>
              <MoodPicker selected={mood} onSelect={setMood} />
              <TextInput
                style={styles.textArea}
                value={text}
                onChangeText={setText}
                placeholder="Write about how you feel today..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={2000}
              />
              <View style={[styles.formBtns, isCompact && styles.formBtnsCompact]}>
                <Button
                  label="Cancel"
                  onPress={() => { setShowForm(false); setText(''); setMood(null); }}
                  variant="ghost"
                  style={isCompact ? undefined : { flex: 1 }}
                />
                <Button
                  label="Save +15 XP"
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  style={isCompact ? undefined : { flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <Button
              label="+ Add today's entry"
              onPress={() => setShowForm(true)}
              variant="primary"
              fullWidth
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  empty: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.xxxl, fontStyle: 'italic' },
  inputArea: { paddingVertical: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  form: { gap: theme.spacing.sm },
  textArea: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, color: theme.colors.textPrimary, ...theme.typography.body, textAlignVertical: 'top', minHeight: 100 },
  formBtns: { flexDirection: 'row', gap: theme.spacing.sm },
  formBtnsCompact: { flexDirection: 'column' },

  // Neobrutalist Premium Green Card Styles
  premiumCard: {
    backgroundColor: '#e6f9ed',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  toggleContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    padding: 2,
  },
  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#000000',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  monthView: {
    flexDirection: 'column',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  symptomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  symptomLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  progressTrack: {
    height: 12,
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    minWidth: 55,
    textAlign: 'right',
  },
  dayView: {
    flexDirection: 'column',
  },
  emptyState: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444444',
    textAlign: 'center',
    lineHeight: 18,
  },
  entryCard: {
    padding: theme.spacing.md,
    backgroundColor: '#e6f9ed',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444444',
  },
  painBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  painHigh: {
    backgroundColor: '#fecaca',
  },
  painMedium: {
    backgroundColor: '#fef08a',
  },
  painMild: {
    backgroundColor: '#bbf7d0',
  },
  painBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  symptomBadge: {
    backgroundColor: '#e6f9ed',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  symptomBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  noSymptomsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    fontStyle: 'italic',
    marginVertical: 2,
  },
  notesWrapper: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.sm,
  },
  notesText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#374151',
  },
});
