import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Phone, Building2, UserPlus, Check, Trash2 } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/services/apiClient';
import { ExpertCard } from '../../src/components/call/ExpertCard';
import { CallModal } from '../../src/components/call/CallModal';
import { useCall } from '../../src/hooks/useCall';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { useAuthStore } from '../../src/store/authStore';
import { DoctorContact, Expert, User } from '../../src/types';
import { Avatar } from '../../src/components/ui/Avatar';

export default function ExpertsScreen() {
  const user = useAuthStore(state => state.user);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const [appDoctors, setAppDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const { horizontalPadding } = useResponsiveLayout();

  const { callState, startCall, endCall } = useCall();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Refresh my own profile to get latest linkedDoctorIds/pendingDoctorIds
      const meRes = await apiClient.get('/users/me');
      updateProfile(meRes.data);

      // 2. Fetch all doctors
      const docsRes = await apiClient.get('/users/doctors');
      const normalized = docsRes.data.map((d: any) => ({
        ...d,
        uid: d.uid || d.id || d._id
      }));
      setAppDoctors(normalized);
    } catch (error) {
      console.error('[ExpertsScreen] fetchData error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateProfile]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(); // Automatically refresh every 30 seconds
    }, 30000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [fetchData]);

  const onApplyToDoctor = useCallback(async (doctorId: string) => {
    if (!user?.uid) return;
    setIsApplying(doctorId);
    try {
      await apiClient.post(`/users/apply/${doctorId}`);
      Alert.alert('Request Sent 📩', 'The doctor will review your profile shortly.');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Could not send request. Please try again.');
    } finally {
      setIsApplying(null);
    }
  }, [user?.uid, fetchData]);

  const onRemoveDoctor = async (doctorId: string) => {
    Alert.alert('Remove Connection', 'Stop sharing your data with this doctor?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Stop Sharing',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.post(`/users/remove-doctor/${doctorId}`);
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Could not remove doctor');
          }
        }
      }
    ]);
  };

  const linkedDoctors = appDoctors.filter(d => user?.linkedDoctorIds?.includes(d.uid));
  const pendingDoctorIds = (user as any)?.pendingDoctorIds || [];
  const otherDoctors = appDoctors.filter(d =>
    !user?.linkedDoctorIds?.includes(d.uid) &&
    !pendingDoctorIds.includes(d.uid)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchData} color={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Expert Connect</Text>
          <Text style={styles.subtitle}>Get professional help for your recovery</Text>
        </View>

        {isLoading && appDoctors.length === 0 ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <>
            {/* My Doctors Section */}
            {linkedDoctors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Care Team</Text>
                {linkedDoctors.map(doc => (
                  <View key={doc.uid} style={styles.doctorCard}>
                    <Avatar name={doc.name} size={54} />
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>Dr. {doc.name}</Text>
                      <Text style={styles.docHospital}>{doc.hospitalAddress || 'Hernia Specialist'}</Text>
                      <View style={styles.docBadges}>
                        <View style={styles.statusBadge}>
                          <View style={[styles.statusDot, { backgroundColor: doc.isActive ? '#22c55e' : '#94a3b8' }]} />
                          <Text style={styles.statusText}>{doc.isActive ? 'Active Now' : 'Currently Offline'}</Text>
                        </View>
                        {doc.availableAtHospital && (
                          <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, { backgroundColor: '#3b82f6' }]} />
                            <Text style={styles.statusText}>Open to Visit</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.docActions}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => Linking.openURL(`tel:${doc.phoneNumber || '911'}`)}
                      >
                        <Phone size={20} color={theme.colors.primary} strokeWidth={2.2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconBtn, styles.removeBtn]}
                        onPress={() => onRemoveDoctor(doc.uid)}
                      >
                        <Trash2 size={20} color={theme.colors.danger} strokeWidth={2.2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Available Doctors Section */}
            {otherDoctors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Doctors</Text>
                <Text style={styles.sectionSubtitle}>Connect with a surgeon to share your recovery logs</Text>
                {otherDoctors.map(doc => (
                  <View key={doc.uid} style={styles.doctorCard}>
                    <Avatar name={doc.name} size={45} />
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>Dr. {doc.name}</Text>
                      <Text style={styles.docHospital}>{doc.hospitalAddress || 'Hernia Specialist'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => onApplyToDoctor(doc.uid)}
                      disabled={isApplying === doc.uid}
                    >
                      {isApplying === doc.uid ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <UserPlus size={16} color="#fff" strokeWidth={2} />
                          <Text style={styles.applyBtnText}>Connect</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Pending Requests */}
            {pendingDoctorIds.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sent Requests</Text>
                {appDoctors.filter(d => pendingDoctorIds.includes(d.uid)).map(doc => (
                  <View key={doc.uid} style={[styles.doctorCard, styles.pendingCard]}>
                    <Avatar name={doc.name} size={45} />
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>Dr. {doc.name}</Text>
                      <Text style={styles.docPending}>Waiting for approval...</Text>
                    </View>
                    <Check size={20} color={theme.colors.textMuted} strokeWidth={2} />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <CallModal
        visible={callState !== 'idle'}
        state={callState}
        remoteName="Expert"
        onEndCall={endCall}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingVertical: theme.spacing.xl },
  header: { marginBottom: theme.spacing.xl },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: 4 },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
  loadingArea: { paddingVertical: 100, alignItems: 'center' },

  section: { marginBottom: theme.spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  sectionSubtitle: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: theme.spacing.md },

  aiBadge: { backgroundColor: `${theme.colors.primary}1f`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: `${theme.colors.primary}44` },
  aiBadgeText: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700', fontSize: 10 },

  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  pendingCard: { opacity: 0.7, backgroundColor: theme.colors.background },
  docInfo: { flex: 1 },
  docName: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '700' },
  docHospital: { ...theme.typography.caption, color: theme.colors.textMuted },
  docPending: { ...theme.typography.caption, color: theme.colors.primary, fontStyle: 'italic' },

  docBadges: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...theme.typography.caption, fontSize: 9, color: '#404040', fontWeight: '700' },

  docActions: { flexDirection: 'row', gap: theme.spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${theme.colors.primary}33`,
  },
  removeBtn: { backgroundColor: `${theme.colors.danger}15`, borderColor: `${theme.colors.danger}33` },

  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  applyBtnText: { ...theme.typography.caption, color: '#fff', fontWeight: '700' },
});
