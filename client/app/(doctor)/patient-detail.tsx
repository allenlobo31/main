import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getPatientDetail } from '../../src/services/dataService';
import { AIInsightCard } from '../../src/components/ai/AIInsightCard';
import { PainChart } from '../../src/components/ai/PainChart';
import { ReportCard } from '../../src/components/reports/ReportCard';
import { ReportModal } from '../../src/components/reports/ReportModal';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { User, SymptomEntry, Report, GamificationProfile, AIInsight } from '../../src/types';
import { todayDateString, formatDate } from '../../src/utils/dateHelpers';
import { useAuthStore } from '../../src/store/authStore';
import { Zap } from 'lucide-react-native';

export default function PatientDetailScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const [patient, setPatient] = useState<User | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const token = useAuthStore((state) => state.token);

  const activeDaySymptoms = useMemo(() => {
    const activeStr = activeDate.toDateString();
    return symptoms.filter((s) => new Date(s.date).toDateString() === activeStr);
  }, [symptoms, activeDate]);

  const activeDayReports = useMemo(() => {
    const activeStr = activeDate.toDateString();
    return reports.filter((r) => new Date(r.uploadedAt).toDateString() === activeStr);
  }, [reports, activeDate]);

  const activePhotos = useMemo(() => {
    return activeDayReports.filter((r) => r.type === 'wound_photo');
  }, [activeDayReports]);

  const activeOtherReports = useMemo(() => {
    return activeDayReports.filter((r) => r.type !== 'wound_photo');
  }, [activeDayReports]);

  const showAIInsight = useMemo(() => {
    if (!aiInsight) return false;
    const insightDate = new Date(aiInsight.generatedAt || new Date());
    return insightDate.toDateString() === activeDate.toDateString();
  }, [aiInsight, activeDate]);

  useEffect(() => {
    if (uid) loadData(uid);
  }, [uid]);

  const loadData = async (patientId: string) => {
    setIsLoading(true);
    try {
      const data = await getPatientDetail(patientId);
      setPatient(data.patient);
      setSymptoms(data.symptoms);
      setGamification(data.gamification);
      // Reports and AI insights are handled if they exist in the response
      if (data.reports) setReports(data.reports);
      if (data.aiInsight) setAiInsight(data.aiInsight);
    } catch (error) {
      console.error('[PatientDetail] loadData error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Patient not found.</Text>
      </View>
    );
  }

  const flaggedCount = symptoms.filter((s) => s.aiFlag).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Header */}
        <Card style={styles.profileCard}>
          <View style={[styles.profileRow, isCompact && styles.profileRowCompact]}>
            <Avatar uri={patient.avatarUrl} name={patient.name} size={56} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{patient.name}</Text>
              <Text style={styles.email}>{patient.email}</Text>
              {gamification && (
                <View style={[styles.gamRow, isCompact && styles.gamRowCompact]}>
                  <Badge label={`Lv ${gamification.level}`} variant="primary" />
                  <Badge label={`${gamification.xp} XP`} variant="muted" />
                  <Badge label={gamification.phase} variant="success" />
                </View>
              )}
            </View>
          </View>
          {flaggedCount > 0 && (
            <View style={styles.flagWarning}>
              <Text style={styles.flagWarningText}>
                ⚠️ {flaggedCount} AI-flagged symptom{flaggedCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </Card>

        {/* AI Insight */}
        {showAIInsight && aiInsight && (
          <>
            <Text style={styles.sectionTitle}>Today's AI Insight</Text>
            <AIInsightCard insight={aiInsight} />
          </>
        )}

        {/* Pain Chart */}
        <Text style={styles.sectionTitle}>Pain Trend</Text>
        <PainChart 
          entries={symptoms} 
          selectedDate={activeDate}
          onDateChange={setActiveDate}
        />

        {/* Symptom Log */}
        <Text style={styles.sectionTitle}>Logged Symptoms</Text>
        {activeDaySymptoms.map((s) => (
          <Card key={s.id} style={styles.symptomCard} bordered={s.aiFlag}>
            <View style={styles.symptomRow}>
              <Text style={styles.symptomDate}>{formatDate(s.date)}</Text>
              {s.aiFlag && <Text style={styles.flagChip}>⚠️ Flagged</Text>}
            </View>
            <Text style={styles.symptomDetail}>
              Pain: {s.painLevel}/10 · Swelling: {s.swelling}
              {s.fever ? ' · Fever' : ''}{s.nausea ? ' · Nausea' : ''}
            </Text>
            <Text style={styles.symptomNotes} numberOfLines={2}>
              {s.woundCondition}
            </Text>
          </Card>
        ))}
        {activeDaySymptoms.length === 0 && (
          <Text style={styles.empty}>No symptoms logged for this date.</Text>
        )}

        {/* Photos Grid (3 per row) */}
        {activePhotos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Wound Photos</Text>
            <View style={styles.photosGrid}>
              {activePhotos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoGridItem}
                  onPress={() => setSelectedReport(photo)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri: photo.fileUrl,
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    }}
                    style={styles.photoGridImage}
                  />
                  {photo.aiWoundAnalysis && (
                    <View style={styles.photoGridAiBadge}>
                      <Zap size={10} color="#000000" fill="#000000" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Reports */}
        <Text style={styles.sectionTitle}>Medical Reports</Text>
        {activeOtherReports.map((r) => (
          <ReportCard key={r.id} report={r} onView={() => setSelectedReport(r)} />
        ))}
        {activeOtherReports.length === 0 && (
          <Text style={styles.empty}>No other reports for this date.</Text>
        )}
      </ScrollView>

      <ReportModal
        visible={selectedReport !== null}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  loading: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...theme.typography.body, color: theme.colors.textMuted },
  profileCard: { marginBottom: theme.spacing.lg },
  profileRow: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', flexWrap: 'wrap' },
  profileRowCompact: { alignItems: 'flex-start' },
  profileInfo: { flex: 1, gap: 4 },
  name: { ...theme.typography.h2, color: theme.colors.textPrimary },
  email: { ...theme.typography.caption, color: theme.colors.textMuted },
  gamRow: { flexDirection: 'row', gap: theme.spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  gamRowCompact: { rowGap: theme.spacing.xs },
  flagWarning: { backgroundColor: `${theme.colors.danger}22`, borderRadius: theme.borderRadius.sm, padding: theme.spacing.sm, marginTop: theme.spacing.md },
  flagWarningText: { ...theme.typography.body, color: theme.colors.dangerLight, fontWeight: '700' },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  symptomCard: { marginBottom: theme.spacing.sm, padding: theme.spacing.sm },
  symptomRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  symptomDate: { ...theme.typography.caption, color: theme.colors.textMuted, fontWeight: '600' },
  flagChip: { ...theme.typography.caption, color: theme.colors.dangerLight, fontWeight: '700' },
  symptomDetail: { ...theme.typography.body, color: theme.colors.textSecondary },
  symptomNotes: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 2 },
  empty: { ...theme.typography.body, color: theme.colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: theme.spacing.md },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: theme.spacing.xs,
  },
  photoGridItem: {
    width: '31.5%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoGridAiBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fbbf24',
    borderRadius: 999,
    padding: 2,
    borderWidth: 1,
    borderColor: '#000000',
  },
});
