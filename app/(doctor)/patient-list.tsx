import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { db, userDoc, getDocs, symptomsCol, query, orderBy, limit } from '../../src/services/firebase/firestore';
import { collection, where } from 'firebase/firestore';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { DoctorProfile, User, SymptomEntry } from '../../src/types';
import { getDoc } from 'firebase/firestore';

interface PatientSummary {
  user: User;
  latestSymptom: SymptomEntry | null;
  hasFlag: boolean;
}

export default function PatientListScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { isCompact, horizontalPadding } = useResponsiveLayout();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const doctorSnap = await getDoc(userDoc(user.uid));
      if (!doctorSnap.exists()) return;
      const doctorData = doctorSnap.data() as DoctorProfile;
      const patientIds = doctorData.linkedPatientIds ?? [];

      const summaries = await Promise.allSettled(
        patientIds.map(async (patientId) => {
          const snap = await getDoc(userDoc(patientId));
          if (!snap.exists()) return null;
          const patientUser = snap.data() as User;

          // Get latest symptom
          const symQ = query(
            symptomsCol(patientId) as never,
            orderBy('date', 'desc'),
            limit(1),
          );
          const symSnap = await getDocs(symQ);
          const latestSymptom = symSnap.docs[0]
            ? ({ id: symSnap.docs[0].id, ...(symSnap.docs[0].data() as Omit<SymptomEntry, 'id'>) } as SymptomEntry)
            : null;

          return {
            user: patientUser,
            latestSymptom,
            hasFlag: latestSymptom?.aiFlag ?? false,
          } as PatientSummary;
        }),
      );

      const accessiblePatients = summaries
        .filter((result): result is PromiseFulfilledResult<PatientSummary | null> => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter(Boolean) as PatientSummary[];

      setPatients(accessiblePatients);
    } catch (error) {
      console.error('[PatientList] loadPatients error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.user.uid}
          contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
          ListHeaderComponent={
            <View style={[styles.header, isCompact && styles.headerCompact]}>
              <Text style={styles.pageTitle}>My Patients</Text>
              <Button label="Logout" onPress={() => logout()} variant="ghost" />
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No linked patients yet. Patients can link to you from their profile.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.hasFlag && styles.cardFlagged]}
              onPress={() =>
                router.push({ pathname: '/(doctor)/patient-detail', params: { uid: item.user.uid } })
              }
              activeOpacity={0.7}
            >
              <Avatar uri={item.user.avatarUrl} name={item.user.name} size={44} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.user.name}</Text>
                <Text style={styles.email}>{item.user.email}</Text>
                {item.latestSymptom ? (
                  <Text style={styles.meta}>
                    Last log: Pain {item.latestSymptom.painLevel}/10 ·{' '}
                    {item.latestSymptom.swelling} swelling
                    {item.hasFlag ? ' ⚠️' : ''}
                  </Text>
                ) : (
                  <Text style={styles.meta}>No symptoms logged yet</Text>
                )}
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  headerCompact: { flexDirection: 'column', alignItems: 'flex-start', gap: theme.spacing.sm },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.md, flexWrap: 'wrap' },
  cardFlagged: { borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}11` },
  info: { flex: 1, minWidth: 0 },
  name: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '700' },
  email: { ...theme.typography.caption, color: theme.colors.textMuted },
  meta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 22, color: theme.colors.textMuted, marginLeft: 'auto' },
  empty: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.xxxl, fontStyle: 'italic' },
});
