import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { useAuthStore } from '../../src/store/authStore';
import { addDoc, diaryCol, serverTimestamp } from '../../src/services/firebase/firestore';
import { MoodType } from '../../src/types';
import {
  Droplets,
  Flame,
  Frown,
  Meh,
  Siren,
  Smile,
  Thermometer,
  TriangleAlert,
} from 'lucide-react-native';

type AlertLevel = 'safe' | 'warning' | 'danger';

const PAIN_OPTIONS = [
  { value: 2, label: 'Low', emoji: '🙂', Icon: Smile },
  { value: 4, label: 'Mild', emoji: '😐', Icon: Meh },
  { value: 7, label: 'Medium', emoji: '😣', Icon: Meh },
  { value: 9, label: 'High', emoji: '😭', Icon: Frown },
] as const;

export default function AIMonitorScreen() {
  const { entries, aiInsight, isLoading, hasFlaggedEntries, latestFlag, logSymptom, refreshInsight } = useAIMonitor();
  const gamification = useGamification();
  const { user } = useAuthStore();

  const [painLevel, setPainLevel] = useState<number>(PAIN_OPTIONS[1].value);
  const [fever, setFever] = useState(false);
  const [swelling, setSwelling] = useState(false);
  const [vomiting, setVomiting] = useState(false);
  const [redness, setRedness] = useState(false);
  const [bleeding, setBleeding] = useState(false);
  const [difficultUrination, setDifficultUrination] = useState(false);
  const [painDescription, setPainDescription] = useState('');
  const [submittedAlertLevel, setSubmittedAlertLevel] = useState<AlertLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  useEffect(() => {
    refreshInsight();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        setSubmittedAlertLevel(null);
      }
    });

    return () => sub.remove();
  }, []);

  const alertLevel: AlertLevel = useMemo(() => {
    if (redness || bleeding) return 'danger';
    if (swelling || vomiting) return 'warning';
    return 'safe';
  }, [redness, bleeding, swelling, vomiting]);

  const symptomSummary = useMemo(() => {
    const selected: string[] = [];
    if (fever) selected.push('Fever');
    if (swelling) selected.push('Swelling');
    if (vomiting) selected.push('Vomiting');
    if (redness) selected.push('Redness');
    if (bleeding) selected.push('Bleeding');
    if (difficultUrination) selected.push('Difficult urination');
    return selected.length > 0 ? selected.join(', ') : 'No critical symptom selected';
  }, [fever, swelling, vomiting, redness, bleeding, difficultUrination]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const selectedPain = PAIN_OPTIONS.find((option) => option.value === painLevel) ?? PAIN_OPTIONS[1];
      const loggedAt = new Date();

      await logSymptom({
        painLevel,
        swelling: swelling ? 'mild' : 'none',
        fever,
        nausea: vomiting,
        woundCondition: symptomSummary,
        additionalNotes: '',
      });

      if (user?.uid) {
        const diaryMood: MoodType =
          alertLevel === 'danger'
            ? 'terrible'
            : alertLevel === 'warning'
              ? 'bad'
              : painLevel >= 7
                ? 'bad'
                : painLevel >= 4
                  ? 'okay'
                  : 'good';

        const miniReport = [
          'Health Monitor Report',
          `Logged at: ${loggedAt.toLocaleDateString()} ${loggedAt.toLocaleTimeString()}`,
          `Pain: ${selectedPain.label} ${selectedPain.emoji} (${painLevel}/10)`,
          `Fever: ${fever ? 'Yes' : 'No'}`,
          `Swelling: ${swelling ? 'Yes' : 'No'}`,
          `Vomiting: ${vomiting ? 'Yes' : 'No'}`,
          `Redness: ${redness ? 'Yes' : 'No'}`,
          `Bleeding: ${bleeding ? 'Yes' : 'No'}`,
          `Difficult urination: ${difficultUrination ? 'Yes' : 'No'}`,
          `Symptoms selected: ${symptomSummary}`,
          `Pain note: ${painDescription.trim() || 'None'}`,
        ].join('\n');

        await addDoc(diaryCol(user.uid) as never, {
          text: miniReport,
          mood: diaryMood,
          date: serverTimestamp(),
          aiSummary: null,
        });
      }

      // Auto-complete the symptoms_logging task
      const taskId = 'symptoms_logging';
      if (!gamification.tasksCompletedToday.includes(taskId)) {
        await gamification.completeTask(taskId, 20);
      }

      await gamification.awardXP('SYMPTOM_LOG');
      await gamification.checkDailyStreak();
      setSubmittedAlertLevel(alertLevel);
      setPainLevel(PAIN_OPTIONS[1].value);
      setFever(false);
      setSwelling(false);
      setVomiting(false);
      setRedness(false);
      setBleeding(false);
      setDifficultUrination(false);
      setPainDescription('');
      Alert.alert('Logged ✅', 'Your symptoms have been recorded. +20 XP earned! Task completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submittedStatusStyle =
    submittedAlertLevel === 'danger'
      ? styles.statusDanger
      : submittedAlertLevel === 'warning'
        ? styles.statusWarning
        : styles.statusSafe;

  const submittedStatusText =
    submittedAlertLevel === 'danger'
      ? 'Please visit your doctor promptly for in-person evaluation.'
      : submittedAlertLevel === 'warning'
        ? 'Please contact your doctor for medical advice.'
        : 'Your current symptoms appear stable. Continue routine monitoring.';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Health Monitor</Text>

        {/* Flag Alert */}
        {hasFlaggedEntries && latestFlag && (
          <SymptomFlagAlert entry={latestFlag} />
        )}

        {/* AI Insight */}
        {aiInsight && <AIInsightCard insight={aiInsight} />}

        {/* Chart */}
        <PainChart entries={entries} />

        {submittedAlertLevel && (
          <View style={[styles.submittedStatusCard, submittedStatusStyle]}>
            <Text style={styles.submittedStatusText}>{submittedStatusText}</Text>
          </View>
        )}

        {/* Symptom Log Form */}
        <Card style={styles.formCard} bordered>
          <Text style={styles.formTitle}>Log Symptoms</Text>

          <Text style={styles.fieldLabel}>Pain</Text>
          <View style={styles.painRow}>
            {PAIN_OPTIONS.map((item) => {
              const Icon = item.Icon;
              const isActive = painLevel === item.value;
              return (
              <TouchableOpacity
                key={item.value}
                style={[styles.painChip, isActive && styles.painChipActive]}
                onPress={() => setPainLevel(item.value)}
              >
                <Icon
                  size={14}
                  color={isActive ? theme.colors.primary : theme.colors.textMuted}
                  strokeWidth={2}
                />
                <Text style={styles.painEmoji}>{item.emoji}</Text>
                <Text style={[styles.painChipText, isActive && styles.painChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Symptoms</Text>
          <View style={[styles.optionRow, isCompact && styles.optionRowCompact]}>
            {[
              { key: 'fever', label: 'Fever', value: fever, onToggle: setFever, Icon: Thermometer },
              { key: 'swelling', label: 'Swelling', value: swelling, onToggle: setSwelling, Icon: Droplets },
              { key: 'vomiting', label: 'Vomiting', value: vomiting, onToggle: setVomiting, Icon: Flame },
              { key: 'redness', label: 'Redness', value: redness, onToggle: setRedness, Icon: TriangleAlert },
              { key: 'bleeding', label: 'Bleeding', value: bleeding, onToggle: setBleeding, Icon: Siren },
              {
                key: 'urination',
                label: 'Difficult urination',
                value: difficultUrination,
                onToggle: setDifficultUrination,
                Icon: Droplets,
              },
            ].map((item) => {
              const Icon = item.Icon;
              return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.optBtn,
                  isCompact && styles.optBtnCompact,
                  item.value && styles.optBtnActive,
                ]}
                onPress={() => item.onToggle(!item.value)}
              >
                <Icon size={14} color={item.value ? theme.colors.primary : theme.colors.textMuted} strokeWidth={2} />
                <Text style={[styles.optText, item.value && styles.optTextActive]}>{item.label}</Text>
              </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Pain Description (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={painDescription}
            onChangeText={setPainDescription}
            placeholder="Briefly describe your pain..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={400}
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
  formCard: {
    marginTop: theme.spacing.md,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  submittedStatusCard: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  statusSafe: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  statusWarning: {
    backgroundColor: '#fefce8',
    borderColor: '#fde68a',
  },
  statusDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  submittedStatusText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  formTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
  fieldLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: theme.spacing.xs, marginTop: theme.spacing.sm },
  painRow: { flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap', marginBottom: theme.spacing.sm },
  painChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  painChipActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}22` },
  painEmoji: { fontSize: 14 },
  painChipText: { ...theme.typography.caption, color: theme.colors.textMuted, fontWeight: '600' },
  painChipTextActive: { color: theme.colors.primaryLight, fontWeight: '700' },
  optionRow: { flexDirection: 'row', gap: theme.spacing.xs, marginBottom: theme.spacing.sm, flexWrap: 'wrap' },
  optionRowCompact: { rowGap: theme.spacing.xs },
  optBtn: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    minWidth: 110,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.xs,
  },
  optBtnCompact: { flexBasis: '48%' },
  optBtnActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}22` },
  optText: { ...theme.typography.caption, color: theme.colors.textMuted, fontWeight: '600' },
  optTextActive: { color: theme.colors.primaryLight, fontWeight: '700' },
  textArea: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    ...theme.typography.body,
    textAlignVertical: 'top',
    minHeight: 86,
    marginBottom: theme.spacing.xs,
  },
});
