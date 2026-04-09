import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiary } from '../../src/hooks/useDiary';
import { DiaryEntry } from '../../src/components/diary/DiaryEntry';
import { MoodPicker } from '../../src/components/diary/MoodPicker';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { MoodType } from '../../src/types';

export default function DiaryScreen() {
  const { entries, isLoading, hasMore, isSubmitting, fetchEntries, addEntry } = useDiary();

  const [text, setText] = useState('');
  const [mood, setMood] = useState<MoodType | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEntries(true);
  }, []);

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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.pageTitle}>Recovery Diary</Text>
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
                onPress={() => fetchEntries(false)}
                variant="ghost"
                isLoading={isLoading}
                fullWidth
              />
            ) : null
          }
          renderItem={({ item }) => <DiaryEntry entry={item} />}
          onEndReached={() => {
            if (hasMore && !isLoading) fetchEntries(false);
          }}
          onEndReachedThreshold={0.3}
        />

        {/* Add Entry Button / Form */}
        <View style={styles.inputArea}>
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
              <View style={styles.formBtns}>
                <Button
                  label="Cancel"
                  onPress={() => { setShowForm(false); setText(''); setMood(null); }}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Save +15 XP"
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  style={{ flex: 1 }}
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
  container: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  empty: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.xxxl, fontStyle: 'italic' },
  inputArea: { padding: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  form: { gap: theme.spacing.sm },
  textArea: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, color: theme.colors.textPrimary, ...theme.typography.body, textAlignVertical: 'top', minHeight: 100 },
  formBtns: { flexDirection: 'row', gap: theme.spacing.sm },
});
