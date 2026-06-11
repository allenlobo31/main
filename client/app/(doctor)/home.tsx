import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getMyPatients, updateProfile as updateRemoteProfile } from '../../src/services/dataService';
import apiClient from '../../src/services/apiClient';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { Building2, PhoneCall, Users, Calendar, ArrowRight, Clock } from 'lucide-react-native';

export default function DoctorHomeScreen() {
  const { user, updateProfile } = useAuthStore();
  const router = useRouter();
  const { isCompact, horizontalPadding } = useResponsiveLayout();
  
  const [patientCount, setPatientCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      // Fetch patients to count active vs pending
      const patientData = await getMyPatients();
      if (patientData) {
        setPatientCount(patientData.filter((p: any) => !p.isPending).length);
        setPendingCount(patientData.filter((p: any) => p.isPending).length);
      }

      // Fetch user profile / appointments
      const response = await apiClient.get('/users/me');
      if (response.data) {
        // Sync local authStore profile just in case
        updateProfile(response.data);
        const apps = response.data.appointments || [];
        
        // Count today's appointments
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const todayApps = apps.filter((app: any) => app.date === todayStr);
        setTodayAppointmentsCount(todayApps.length);
      }
    } catch (err) {
      console.error('[DoctorHome] loadDashboardData error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData();
    }
  }, [user?.uid]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
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

  // Get professional last name or full name
  const doctorName = user?.name ? user.name.replace(/^(Dr\.\s*)+/i, '') : 'Doctor';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Doctor Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome, Dr. {doctorName}</Text>
            <Text style={styles.dashboardSubtitle}>HerniaCare Practitioner</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(doctor)/profile')}
            style={styles.profileCircle}
            activeOpacity={0.85}
          >
            <Avatar name={user?.name} uri={user?.avatarUrl} size={48} />
          </TouchableOpacity>
        </View>

        {isLoading && !isRefreshing ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            {/* Status Switches Grid */}
            <View style={styles.statusCardsRow}>
              <TouchableOpacity
                style={[styles.statusCard, user?.isActive && styles.statusCardActive]}
                onPress={onToggleActive}
                activeOpacity={0.9}
              >
                <View style={[styles.statusIconWrap, user?.isActive && styles.statusIconWrapActive]}>
                  <PhoneCall size={20} color={user?.isActive ? '#34d399' : '#64748b'} />
                </View>
                <Text style={styles.statusLabel}>Active For Calls</Text>
                <Text style={styles.statusValue}>{user?.isActive ? 'Online' : 'Offline'}</Text>
                <View style={[styles.badgeIndicator, { backgroundColor: user?.isActive ? '#34d399' : '#94a3b8' }]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusCard, user?.availableAtHospital && styles.statusCardActive]}
                onPress={onToggleHospital}
                activeOpacity={0.9}
              >
                <View style={[styles.statusIconWrap, user?.availableAtHospital && styles.statusIconWrapActive]}>
                  <Building2 size={20} color={user?.availableAtHospital ? '#34d399' : '#64748b'} />
                </View>
                <Text style={styles.statusLabel}>Hospital Visitable</Text>
                <Text style={styles.statusValue}>{user?.availableAtHospital ? 'Yes' : 'No'}</Text>
                <View style={[styles.badgeIndicator, { backgroundColor: user?.availableAtHospital ? '#34d399' : '#94a3b8' }]} />
              </TouchableOpacity>
            </View>

            {/* Quick Summary Section */}
            <Text style={styles.sectionTitle}>Dashboard Summary</Text>
            <View style={styles.statsGrid}>
              {/* Active Patients */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#e0f2fe' }]}>
                  <Users size={22} color="#0284c7" />
                </View>
                <Text style={styles.statNumber}>{patientCount}</Text>
                <Text style={styles.statName}>Active Patients</Text>
              </View>

              {/* Today's Appointments */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#fef3c7' }]}>
                  <Calendar size={22} color="#d97706" />
                </View>
                <Text style={styles.statNumber}>{todayAppointmentsCount}</Text>
                <Text style={styles.statName}>Today's Bookings</Text>
              </View>

              {/* Pending Approvals */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#fee2e2' }]}>
                  <Clock size={22} color="#dc2626" />
                </View>
                <Text style={styles.statNumber}>{pendingCount}</Text>
                <Text style={styles.statName}>New Applications</Text>
              </View>
            </View>

            {/* Quick Actions Card */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity 
              style={styles.actionRowCard}
              onPress={() => router.push('/(doctor)/appointments')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#f0fdf4' }]}>
                <Calendar size={20} color="#34d399" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Manage Schedule</Text>
                <Text style={styles.actionSubtitle}>View interactive calendar and patient slots</Text>
              </View>
              <ArrowRight size={18} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionRowCard}
              onPress={() => router.push('/(doctor)/patient-list')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Users size={20} color="#3b82f6" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Patient Directory</Text>
                <Text style={styles.actionSubtitle}>Review symptoms, reports, and AI insights</Text>
              </View>
              <ArrowRight size={18} color="#64748b" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  dashboardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  profileCircle: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loadingArea: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  statusCardActive: {
    borderColor: '#34d399',
    backgroundColor: '#f0fdf4',
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusIconWrapActive: {
    backgroundColor: '#dcfce7',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  badgeIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    marginTop: 12,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  statName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  actionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
});
