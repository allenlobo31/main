import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAIMonitor } from '../../src/hooks/useAIMonitor';
import { useGamification } from '../../src/hooks/useGamification';
import { AIInsightCard } from '../../src/components/ai/AIInsightCard';
import { SymptomFlagAlert } from '../../src/components/ai/SymptomFlagAlert';
import { PainChart } from '../../src/components/ai/PainChart';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { SwellingLevel } from '../../src/types';

export default function AIMonitorScreen() {
  const { entries, aiInsight, isLoading, hasFlaggedEntries, latestFlag, logSymptom, refreshInsight } = useAIMonitor();
  const gamification = useGamification();

  const [painLevel, setPainLevel] = useState(5);
  const [swelling, setSwelling] = useState<SwellingLevel>('none');
  const [fever, setFever] = useState(false);
  const [nausea, setNausea] = useState(false);
  const [woundCondition, setWoundCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  useEffect(() => {
    refreshInsight();
  }, []);

  const handleSubmit = async () => {
    if (!woundCondition.trim()) {
      Alert.alert('Required', 'Please describe the wound condition.');
      return;
    }
    setIsSubmitting(true);
    try {
      await logSymptom({
        painLevel,
        swelling,
        fever,
        nausea,
        woundCondition: woundCondition.trim(),
        additionalNotes: notes.trim(),
      });

      // Auto-complete the symptoms_logging task
      const taskId = 'symptoms_logging';
      if (!gamification.tasksCompletedToday.includes(taskId)) {
        await gamification.completeTask(taskId, 20);
      }

      await gamification.awardXP('SYMPTOM_LOG');
      await gamification.checkDailyStreak();
      setWoundCondition('');
      setNotes('');
      setPainLevel(5);
      Alert.alert('Logged ✅', 'Your symptoms have been recorded. +20 XP earned! Task completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SWELLING_OPTIONS: SwellingLevel[] = ['none', 'mild', 'moderate', 'severe'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>AI Health Monitor</Text>

        {/* Flag Alert */}
        {hasFlaggedEntries && latestFlag && (
          <SymptomFlagAlert entry={latestFlag} />
        )}

        {/* AI Insight */}
        {aiInsight && <AIInsightCard insight={aiInsight} />}

        {/* Chart */}
        <PainChart entries={entries} />

        {/* Symptom Log Form */}
        <Card style={styles.formCard} bordered>
          <Text style={styles.formTitle}>Log Symptoms</Text>

          {/* Pain Level */}
          <Text style={styles.fieldLabel}>Pain Level: {painLevel}/10</Text>
          <View style={styles.painSlider}>
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.painBtn, painLevel === n && styles.painBtnActive]}
                onPress={() => setPainLevel(n)}
              >
                <Text style={[styles.painBtnText, painLevel === n && styles.painBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Swelling */}
          <Text style={styles.fieldLabel}>Swelling</Text>
          <View style={[styles.optionRow, isCompact && styles.optionRowCompact]}>
            {SWELLING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optBtn,
                  isCompact && styles.optBtnCompact,
                  swelling === opt && styles.optBtnActive,
                ]}
                onPress={() => setSwelling(opt)}
              >
                <Text style={[styles.optText, swelling === opt && styles.optTextActive]}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Toggles */}
          <View style={styles.toggleRow}>
            <Text style={styles.fieldLabel}>Fever</Text>
            <Switch
              value={fever}
              onValueChange={setFever}
              trackColor={{ true: theme.colors.danger, false: theme.colors.border }}
              thumbColor={fever ? theme.colors.dangerLight : theme.colors.textMuted}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.fieldLabel}>Nausea</Text>
            <Switch
              value={nausea}
              onValueChange={setNausea}
              trackColor={{ true: theme.colors.warning, false: theme.colors.border }}
              thumbColor={nausea ? theme.colors.warning : theme.colors.textMuted}
            />
          </View>

          {/* Wound Condition */}
          <Text style={styles.fieldLabel}>Wound Condition *</Text>
          <TextInput
            style={styles.textArea}
            value={woundCondition}
            onChangeText={setWoundCondition}
            placeholder="Describe the wound appearance..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={3}
          />

          {/* Notes */}
          <Text style={styles.fieldLabel}>Additional Notes</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any other symptoms or concerns..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={2}
          />

          <Button
            label="Submit Symptoms +20 XP"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            fullWidth
            style={{ marginTop: theme.spacing.sm }}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  formCard: { marginTop: theme.spacing.md },
  formTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
  fieldLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: theme.spacing.xs, marginTop: theme.spacing.sm },
  painSlider: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: theme.spacing.sm },
  painBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  painBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  painBtnText: { ...theme.typography.caption, color: theme.colors.textMuted, fontWeight: '700' },
  painBtnTextActive: { color: '#fff' },
  optionRow: { flexDirection: 'row', gap: theme.spacing.xs, marginBottom: theme.spacing.sm, flexWrap: 'wrap' },
  optionRowCompact: { rowGap: theme.spacing.xs },
  optBtn: { flex: 1, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', backgroundColor: theme.colors.surfaceAlt, minWidth: 88 },
  optBtnCompact: { flexBasis: '48%' },
  optBtnActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}22` },
  optText: { ...theme.typography.caption, color: theme.colors.textMuted },
  optTextActive: { color: theme.colors.primaryLight, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.xs },
  textArea: { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, color: theme.colors.textPrimary, ...theme.typography.body, textAlignVertical: 'top', minHeight: 80, marginBottom: theme.spacing.xs },
});
