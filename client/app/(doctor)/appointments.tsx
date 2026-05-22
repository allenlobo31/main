import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar as CalendarIcon, User as UserIcon, Clock } from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';

interface Appointment {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  createdAt: string;
}

export default function DoctorAppointmentsScreen() {
  const router = useRouter();
  const { updateProfile } = useAuthStore();
  const { horizontalPadding } = useResponsiveLayout();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/users/me');
      // Sync authStore profile
      updateProfile(response.data);
      
      const apps = response.data.appointments || [];
      // Sort appointments by date and time (most recent booking first or upcoming date first)
      // Let's sort by creation/date
      const sorted = [...apps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAppointments(sorted);
    } catch (error) {
      console.error('[DoctorAppointments] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateProfile]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.headerRow, { paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backCircleBtn}
          activeOpacity={0.8}
        >
          <ChevronLeft size={22} color="#0f172a" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && appointments.length === 0 ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item, index) => `${item.patientId}-${item.date}-${item.time}-${index}`}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchAppointments}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <CalendarIcon size={32} color="#64748b" />
              </View>
              <Text style={styles.emptyTitle}>No appointments booked</Text>
              <Text style={styles.emptySubtitle}>
                Appointments booked by your active patients will appear here in real time.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.appointmentCard}>
              {/* Top Row: Patient Info */}
              <View style={styles.patientRow}>
                <View style={styles.avatarMiniFallback}>
                  <UserIcon size={18} color="#0d5c75" />
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{item.patientName}</Text>
                  <Text style={styles.patientMeta}>Hernia Recovery Patient</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Bottom Row: Date & Time details */}
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleDetailItem}>
                  <CalendarIcon size={16} color="#0d5c75" style={{ marginRight: 6 }} />
                  <Text style={styles.scheduleDetailText}>{formatDate(item.date)}</Text>
                </View>
                <View style={styles.scheduleDetailItem}>
                  <Clock size={16} color="#0d5c75" style={{ marginRight: 6 }} />
                  <Text style={styles.scheduleDetailText}>{item.time}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#d1fae5', // Continuous pastel green matching app aesthetics
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    backgroundColor: '#d1fae5',
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMiniFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d6eef6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  patientMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  cardDivider: {
    height: 1.5,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDetailText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
