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
import { getMyPatients, acceptPatient, updateProfile as updateRemoteProfile } from '../../src/services/dataService';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { User, SymptomEntry } from '../../src/types';
import { Building2, Check } from 'lucide-react-native';

interface PatientSummary {
  user: User;
  latestSymptom: SymptomEntry | null;
  hasFlag: boolean;
  isPending: boolean;
}

export default function PatientListScreen() {
  const { user, updateProfile } = useAuthStore();
  const router = useRouter();
  const { isCompact, horizontalPadding } = useResponsiveLayout();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    loadPatients();
  }, [user?.uid]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadPatients(); // Automatically refresh every 30 seconds
    }, 30000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const data = await getMyPatients();
      setPatients(data);
    } catch (err) {
      console.error('[PatientList] load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onAcceptPatient = async (patientId: string) => {
    if (!user?.uid) return;
    setIsProcessing(patientId);
    try {
      await acceptPatient(patientId);
      Alert.alert('Success', 'Patient application accepted.');
      loadPatients();
    } catch (error: any) {
      console.error('[Accept] Error details:', error);
      Alert.alert('Error', `Could not accept patient: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const onToggleActive = async () => {
    if (!user?.uid) return;
    const newState = !user.isActive;
    try {
      await updateRemoteProfile({ isActive: newState });
      updateProfile({ isActive: newState });
    } catch (error) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  const onToggleHospital = async () => {
    if (!user?.uid) return;
    const newState = !user.availableAtHospital;
    try {
      await updateRemoteProfile({ availableAtHospital: newState });
      updateProfile({ availableAtHospital: newState });
    } catch (error) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.user.uid}
          contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
          ListHeaderComponent={
            <View>
              <View style={[styles.header, isCompact && styles.headerCompact]}>
                <View>
                  <Text style={styles.welcome}>Welcome, Dr. {user?.name?.split(' ')?.pop() || 'Doctor'}</Text>
                  <Text style={styles.pageTitle}>Dashboard</Text>
                </View>
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    onPress={() => router.push('/(doctor)/profile')}
                    style={styles.profileCircle}
                  >
                    <Avatar name={user?.name} size={40} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statusCardsRow}>
                <TouchableOpacity 
                  style={[styles.statusCard, user?.isActive && styles.statusCardActive]}
                  onPress={onToggleActive}
                >
                  <View style={[styles.statusIconWrap, user?.isActive && styles.statusIconWrapActive]}>
                    <View style={[styles.dot, user?.isActive && styles.dotActive]} />
                  </View>
                  <Text style={styles.statusLabel}>Active For Calls</Text>
                  <Text style={styles.statusValue}>{user?.isActive ? 'Online' : 'Offline'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.statusCard, user?.availableAtHospital && styles.statusCardActive]}
                  onPress={onToggleHospital}
                >
                  <View style={[styles.statusIconWrap, user?.availableAtHospital && styles.statusIconWrapActive]}>
                    <Building2 size={20} color={user?.availableAtHospital ? '#059669' : '#64748b'} />
                  </View>
                  <Text style={styles.statusLabel}>Hospital Visitable</Text>
                  <Text style={styles.statusValue}>{user?.availableAtHospital ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Inquiries & Appointments</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No pending applications</Text>
              <Text style={styles.empty}>
                Patients will appear here once they request a consultation or link their profile.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.hasFlag && styles.cardFlagged]}
              onPress={() =>
                router.push({ pathname: '/(doctor)/patient-detail', params: { uid: item.user.uid } })
              }
              activeOpacity={0.7}
            >
              <Avatar uri={item.user.avatarUrl} name={item.user.name} size={50} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.user.name}</Text>
                <Text style={styles.email}>{item.user.email}</Text>
                <View style={styles.statusRow}>
                  {item.latestSymptom ? (
                    <Text style={styles.meta}>
                      Pain: {item.latestSymptom.painLevel}/10 ·{' '}
                      {item.hasFlag ? <Text>⚠️ Urgent Review</Text> : <Text>Stable</Text>}
                    </Text>
                  ) : (
                    <Text style={styles.meta}>Requested Connection</Text>
                  )}
                </View>
              </View>
              <View style={styles.cardActions}>
                {item.isPending ? (
                  <TouchableOpacity 
                    style={styles.acceptBtn} 
                    onPress={() => onAcceptPatient(item.user.uid)}
                    disabled={isProcessing === item.user.uid}
                  >
                    {isProcessing === item.user.uid ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.acceptText}>Accept</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.linkedBadge}>
                    <Check size={16} color="#059669" />
                  </View>
                )}
              </View>
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
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: theme.spacing.lg,
  },
  headerCompact: { flexDirection: 'row', alignItems: 'center' },
  welcome: { ...theme.typography.caption, color: theme.colors.textMuted, fontWeight: '600' },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: theme.spacing.md },
  profileCircle: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  statusCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusIconWrapActive: {
    backgroundColor: '#d1fae5',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#94a3b8',
  },
  dotActive: {
    backgroundColor: '#10b981',
  },
  statusLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusValue: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: 12,
    color: theme.colors.textPrimary,
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.colors.surfaceAlt, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    gap: 16,
  },
  cardFlagged: { borderColor: '#fee2e2', backgroundColor: '#fffbfb' },
  info: { flex: 1, minWidth: 0 },
  name: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '700', fontSize: 16 },
  email: { ...theme.typography.caption, color: theme.colors.textMuted },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  meta: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '500' },
  cardActions: {
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  acceptText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  linkedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: 8 },
  empty: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
});