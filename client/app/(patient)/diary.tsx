import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
import { useLanguageStore } from '../../src/store/languageStore';

export default function DiaryScreen() {
  const { entries, isLoading, hasMore, isSubmitting, fetchEntries, addEntry } = useDiary();
  const { t } = useLanguageStore();

  const [text, setText] = useState('');
  const [mood, setMood] = useState<MoodType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  useFocusEffect(
    React.useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  // Split entries into today's and older entries
  const todaysEntries = useMemo(() => {
    const todayStr = new Date().toDateString();
    return entries.filter((e) => new Date(e.date).toDateString() === todayStr);
  }, [entries]);

  const otherEntries = useMemo(() => {
    const todayStr = new Date().toDateString();
    return entries.filter((e) => new Date(e.date).toDateString() !== todayStr);
  }, [entries]);

  const handleSubmit = async () => {
    if (!mood) {
      Alert.alert(t('diary.selectMoodAlertTitle'), t('diary.selectMoodAlertDesc'));
      return;
    }
    if (text.trim().length < 10) {
      Alert.alert(t('diary.tooShortAlertTitle'), t('diary.tooShortAlertDesc'));
      return;
    }

    const success = await addEntry(text.trim(), mood);
    if (success) {
      setText('');
      setMood(null);
      setShowForm(false);
      Alert.alert(t('diary.entryAddedAlertTitle'), t('diary.entryAddedAlertDesc'));
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
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: theme.spacing.xxxl,
              marginTop: theme.spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Today's Section Header */}
          <Text style={styles.dateSectionHeader}>
            Today — {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>

          {/* Today's Entries with 1.5-row height limitation */}
          {todaysEntries.length > 0 ? (
            <ScrollView
              style={styles.entriesScroll}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {todaysEntries.map((item, index) => (
                <DiaryEntry key={`${item.id}-${index}`} entry={item} />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyTodayText}>No entries written today.</Text>
          )}

          {/* Older Entries with 1.5-row height limitation */}
          {otherEntries.length > 0 && (
            <View style={{ marginTop: theme.spacing.lg }}>
              <Text style={styles.dateSectionHeader}>Older Entries</Text>
              <ScrollView
                style={styles.entriesScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {otherEntries.map((item, index) => (
                  <DiaryEntry key={`${item.id}-${index}`} entry={item} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Empty State Fallback (If no entries exist at all) */}
          {entries.length === 0 && !isLoading && (
            <Text style={styles.empty}>
              {t('diary.empty')}
            </Text>
          )}

          {/* Load More Button */}
          {hasMore && (
            <Button
              label={t('diary.loadMore')}
              onPress={() => fetchEntries()}
              variant="ghost"
              isLoading={isLoading}
              fullWidth
              style={{ marginTop: theme.spacing.sm }}
            />
          )}
        </ScrollView>

        {/* Add Entry Button / Form */}
        <View style={[styles.inputArea, { paddingHorizontal: horizontalPadding }]}>
          {showForm ? (
            <View style={styles.form}>
              <MoodPicker selected={mood} onSelect={setMood} />
              <TextInput
                style={styles.textArea}
                value={text}
                onChangeText={setText}
                placeholder={t('diary.placeholder')}
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={2000}
              />
              <View style={[styles.formBtns, isCompact && styles.formBtnsCompact]}>
                <Button
                  label={t('common.cancel')}
                  onPress={() => { setShowForm(false); setText(''); setMood(null); }}
                  variant="ghost"
                  style={isCompact ? undefined : { flex: 1 }}
                />
                <Button
                  label={t('diary.saveXp')}
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  style={isCompact ? undefined : { flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <Button
              label={t('diary.addTodayEntry')}
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
  dateSectionHeader: {
    ...theme.typography.caption,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    paddingLeft: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
    marginTop: theme.spacing.sm,
  },
  emptyTodayText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.sm,
    paddingLeft: 4,
    marginBottom: theme.spacing.sm,
  },
  entriesScroll: {
    maxHeight: 400,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
