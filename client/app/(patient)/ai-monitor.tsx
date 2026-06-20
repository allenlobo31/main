import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { useLanguageStore } from '../../src/store/languageStore';
import { useGamification } from '../../src/hooks/useGamification';
import { AIInsightCard } from '../../src/components/ai/AIInsightCard';
import { SymptomFlagAlert } from '../../src/components/ai/SymptomFlagAlert';
import { PainChart } from '../../src/components/ai/PainChart';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { useAuthStore } from '../../src/store/authStore';
import { submitDiary } from '../../src/services/dataService';
import { MoodType } from '../../src/types';
import {
  Droplets,
  Flame,
  Siren,
  Thermometer,
  TriangleAlert,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';

type AlertLevel = 'safe' | 'warning' | 'danger';



function AIMonitorScreen() {
  const { entries, aiInsight, hasFlaggedEntries, latestFlag, logSymptom, refreshInsight } = useAIMonitor();
  const gamification = useGamification();
  const { user } = useAuthStore();
  const { t, language } = useLanguageStore();

  const [fever, setFever] = useState(false);
  const [swelling, setSwelling] = useState(false);
  const [vomiting, setVomiting] = useState(false);
  const [redness, setRedness] = useState(false);
  const [bleeding, setBleeding] = useState(false);
  const [difficultUrination, setDifficultUrination] = useState(false);
  const [painDescription, setPainDescription] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    painLevel: number;
    symptoms: string;
    painDescription: string;
    alertLevel: AlertLevel;
    timestamp: Date;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  useEffect(() => {
    refreshInsight();
  }, []);

  const alertLevel: AlertLevel = useMemo(() => {
    if (redness || bleeding) return 'danger';
    if (vomiting || difficultUrination) return 'warning';
    return 'safe';
  }, [redness, bleeding, vomiting, difficultUrination, language]);

  const symptomSummary = useMemo(() => {
    const selected: string[] = [];
    if (fever) selected.push(t('monitor.symptomNames.fever'));
    if (swelling) selected.push(t('monitor.symptomNames.swelling'));
    if (vomiting) selected.push(t('monitor.symptomNames.vomiting'));
    if (redness) selected.push(t('monitor.symptomNames.redness'));
    if (bleeding) selected.push(t('monitor.symptomNames.bleeding'));
    if (difficultUrination) selected.push(t('monitor.symptomNames.urination'));
    return selected.length > 0 ? selected.join(', ') : t('monitor.noSymptomSelected');
  }, [fever, swelling, vomiting, redness, bleeding, difficultUrination, language]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Calculate dynamic pain level based on active symptoms
      let calculatedPainLevel = 1;
      if (redness || bleeding) {
        calculatedPainLevel = 9;
      } else if (vomiting || difficultUrination) {
        calculatedPainLevel = 5;
      } else if (fever || swelling) {
        calculatedPainLevel = 1;
      }

      const loggedAt = new Date();

      await logSymptom({
        painLevel: calculatedPainLevel,
        swelling: swelling ? 'mild' : 'none',
        fever,
        nausea: vomiting,
        woundCondition: symptomSummary,
        additionalNotes: painDescription,
      });

      if (user?.uid) {
        const diaryMood: MoodType =
          alertLevel === 'danger'
            ? 'terrible'
            : alertLevel === 'warning'
              ? 'bad'
              : calculatedPainLevel >= 7
                ? 'bad'
                : calculatedPainLevel >= 4
                  ? 'okay'
                  : 'good';

        const painLabel = calculatedPainLevel === 9 ? 'High 😭' : (calculatedPainLevel === 5 ? 'Medium 😣' : 'Mild 🙂');

        const miniReport = [
          'Health Monitor Report',
          `Logged at: ${loggedAt.toLocaleDateString()} ${loggedAt.toLocaleTimeString()}`,
          `Pain (Dynamic): ${painLabel} (${calculatedPainLevel}/10)`,
          `Fever: ${fever ? 'Yes' : 'No'}`,
          `Swelling: ${swelling ? 'Yes' : 'No'}`,
          `Vomiting: ${vomiting ? 'Yes' : 'No'}`,
          `Redness: ${redness ? 'Yes' : 'No'}`,
          `Bleeding: ${bleeding ? 'Yes' : 'No'}`,
          `Difficult urination: ${difficultUrination ? 'Yes' : 'No'}`,
          `Symptoms selected: ${symptomSummary}`,
          `Pain note: ${painDescription.trim() || 'None'}`,
        ].join('\n');

        await submitDiary({
          text: miniReport,
          mood: diaryMood,
          date: new Date().toISOString(),
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

      // Save data for the report view and open it
      setSubmittedData({
        painLevel: calculatedPainLevel,
        symptoms: symptomSummary,
        painDescription: painDescription,
        alertLevel: alertLevel,
        timestamp: loggedAt,
      });
      setShowReport(true);

      setFever(false);
      setSwelling(false);
      setVomiting(false);
      setRedness(false);
      setBleeding(false);
      setDifficultUrination(false);
      setPainDescription('');
    } catch (error) {
      console.error('[AIMonitor] handleSubmit error:', error);
      Alert.alert(t('experts.errorTitle'), t('monitor.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showReport && submittedData) {
    const alertLevelInfo = {
      danger: {
        bg: '#fee2e2',
        border: '#ef4444',
        text: '#991b1b',
        title: t('monitor.alertTitleHigh'),
        icon: Siren,
        msg: t('monitor.alertMsgHigh'),
      },
      warning: {
        bg: '#fef9c3',
        border: '#eab308',
        text: '#854d0e',
        title: t('monitor.alertTitleMedium'),
        icon: TriangleAlert,
        msg: t('monitor.alertMsgMedium'),
      },
      safe: {
        bg: '#dcfce7',
        border: '#34d399',
        text: '#166534',
        title: t('monitor.alertTitleStable'),
        icon: CheckCircle2,
        msg: t('monitor.alertMsgStable'),
      },
    }[submittedData.alertLevel];

    const Icon = alertLevelInfo.icon;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingHorizontal: horizontalPadding, flexGrow: 1, justifyContent: 'center' }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>{t('monitor.pageTitle')}</Text>

          {/* Alert Section */}
          <View style={[styles.reportAlertCard, { backgroundColor: alertLevelInfo.bg }]}>
            <View style={styles.reportAlertHeader}>
              <Icon size={28} color={alertLevelInfo.text} strokeWidth={2.5} />
              <Text style={[styles.reportAlertTitle, { color: alertLevelInfo.text }]}>{alertLevelInfo.title}</Text>
            </View>
            <Text style={[styles.reportAlertMsg, { color: alertLevelInfo.text }]}>{alertLevelInfo.msg}</Text>
          </View>

          {/* Mini Report Card */}
          <Card style={styles.reportDetailCard} bordered>
            <Text style={styles.reportCardTitle}>{t('monitor.loggedDetails')}</Text>

            {/* Timestamp */}
            <View style={styles.reportDetailRow}>
              <Clock size={16} color={theme.colors.textSecondary} />
              <Text style={styles.reportDetailValue}>
                {submittedData.timestamp.toLocaleDateString()} at {submittedData.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            {/* Pain Severity Badge */}
            <View style={styles.reportDetailRow}>
              <Text style={styles.reportDetailLabel}>{t('monitor.severityRating')}</Text>
              <View style={[
                styles.reportPainBadge,
                submittedData.painLevel === 9 ? styles.painHigh : (submittedData.painLevel === 5 ? styles.painMedium : styles.painMild)
              ]}>
                <Text style={styles.reportPainBadgeText}>
                  {submittedData.painLevel === 9 ? t('monitor.highSeverity') : (submittedData.painLevel === 5 ? t('monitor.mediumSeverity') : t('monitor.mildSeverity'))}
                </Text>
              </View>
            </View>

            {/* Logged Symptoms */}
            <View style={styles.reportDetailBlock}>
              <Text style={styles.reportDetailLabel}>{t('monitor.loggedSymptoms')}</Text>
              <Text style={styles.reportDetailText}>{submittedData.symptoms}</Text>
            </View>

            {/* Pain Description */}
            {submittedData.painDescription.trim().length > 0 && (
              <View style={styles.reportDetailBlock}>
                <Text style={styles.reportDetailLabel}>{t('monitor.notes')}</Text>
                <View style={styles.reportNotesBubble}>
                  <Text style={styles.reportNotesText}>"{submittedData.painDescription.trim()}"</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Action Button */}
          <Button
            label={t('monitor.done')}
            onPress={() => {
              setShowReport(false);
              setSubmittedData(null);
            }}
            fullWidth
            style={{ marginTop: theme.spacing.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
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
          <Text style={styles.formTitle}>{t('monitor.logTitle')}</Text>



          <Text style={styles.fieldLabel}>{t('monitor.symptomsHeader')}</Text>
          <View style={[styles.optionRow, isCompact && styles.optionRowCompact]}>
            {[
              { key: 'fever', label: t('monitor.symptomNames.fever'), value: fever, onToggle: setFever, Icon: Thermometer },
              { key: 'swelling', label: t('monitor.symptomNames.swelling'), value: swelling, onToggle: setSwelling, Icon: Droplets },
              { key: 'vomiting', label: t('monitor.symptomNames.vomiting'), value: vomiting, onToggle: setVomiting, Icon: Flame },
              { key: 'redness', label: t('monitor.symptomNames.redness'), value: redness, onToggle: setRedness, Icon: TriangleAlert },
              { key: 'bleeding', label: t('monitor.symptomNames.bleeding'), value: bleeding, onToggle: setBleeding, Icon: Siren },
              {
                key: 'urination',
                label: t('monitor.symptomNames.urination'),
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

          <Text style={styles.fieldLabel}>{t('monitor.painDescriptionHeader')}</Text>
          <TextInput
            style={styles.textArea}
            value={painDescription}
            onChangeText={setPainDescription}
            placeholder={t('monitor.painPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={400}
          />

          <Button
            label={t('monitor.submitBtn')}
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
    borderColor: '#000000',
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  reportAlertCard: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  reportAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  reportAlertTitle: {
    ...theme.typography.h3,
    fontWeight: '800',
  },
  reportAlertMsg: {
    ...theme.typography.body,
    fontWeight: '600',
    lineHeight: 20,
  },
  reportDetailCard: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  reportCardTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontWeight: '800',
  },
  reportDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  reportDetailLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportDetailValue: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  reportDetailBlock: {
    marginBottom: theme.spacing.md,
  },
  reportDetailText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginTop: 4,
  },
  reportPainBadge: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  reportPainBadgeText: {
    ...theme.typography.caption,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  painHigh: { backgroundColor: '#fee2e2' },
  painMedium: { backgroundColor: '#fef9c3' },
  painMild: { backgroundColor: '#dcfce7' },
  reportNotesBubble: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginTop: 6,
  },
  reportNotesText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  formTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
  fieldLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: theme.spacing.xs, marginTop: theme.spacing.sm },

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

export default React.memo(AIMonitorScreen);
