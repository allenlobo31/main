import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User as UserIcon, Clock, Phone, FileText } from 'lucide-react-native';
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
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Format today's date as YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayStr());

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/users/me');
      updateProfile(response.data);
      const apps = response.data.appointments || [];
      setAppointments(apps);
    } catch (error) {
      console.error('[DoctorAppointments] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateProfile]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Helper to change month
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Days in current month
    const prevTotalDays = new Date(year, month, 0).getDate(); // Days in prev month
    
    const cells = [];

    // Leading padding days (prev month)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevTotalDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      cells.push({
        day: d,
        month: prevM,
        year: prevY,
        isCurrentMonth: false,
        dateStr: `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      cells.push({
        day: d,
        month: month,
        year: year,
        isCurrentMonth: true,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Trailing padding days (next month) to pad to multiple of 7
    const remaining = 42 - cells.length; // Ensure 6 rows (42 days total)
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      cells.push({
        day: d,
        month: nextM,
        year: nextY,
        isCurrentMonth: false,
        dateStr: `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    return cells;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter appointments for the selected date
  const selectedDayAppointments = appointments.filter(app => app.date === selectedDateStr);
  const isSelectedDatePast = selectedDateStr < getTodayStr();

  const formatDateLabel = (dateStr: string) => {
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
      {/* Scrollable Layout to fit calendar & selected day slots elegantly */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerRow, { paddingHorizontal: horizontalPadding }]}>
          <Text style={styles.pageTitle}>Schedule Calendar</Text>
          {isLoading && <ActivityIndicator color={theme.colors.primary} size="small" />}
        </View>

        {/* Custom Calendar Card */}
        <View style={[styles.calendarContainer, { marginHorizontal: horizontalPadding }]}>
          {/* Month Controller */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>
            
            <Text style={styles.monthLabel}>
              {monthNames[month]} {year}
            </Text>
            
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
              <ChevronRight size={20} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Week Days Headers */}
          <View style={styles.weekHeadersRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, index) => (
              <Text key={index} style={styles.weekHeaderCell}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((cell, index) => {
              const dayApps = appointments.filter(app => app.date === cell.dateStr);
              const hasApp = dayApps.length > 0;
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === getTodayStr();
              const isPast = cell.dateStr < getTodayStr();

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !cell.isCurrentMonth && styles.dayCellOutOfMonth,
                    isSelected && styles.dayCellSelected,
                    hasApp && !isSelected && (isPast ? styles.dayCellPastApp : styles.dayCellHasApp),
                  ]}
                  onPress={() => setSelectedDateStr(cell.dateStr)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !cell.isCurrentMonth && styles.dayTextOutOfMonth,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                      hasApp && !isSelected && (isPast ? styles.dayTextPastApp : styles.dayTextHasApp),
                    ]}
                  >
                    {cell.day}
                  </Text>
                  
                  {/* Small Dot under date if it has appointments */}
                  {hasApp && (
                    <View 
                      style={[
                        styles.appDot,
                        isSelected ? styles.appDotSelected : (isPast ? styles.appDotPastApp : styles.appDotHasApp)
                      ]} 
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Header */}
        <View style={[styles.sectionTitleRow, { paddingHorizontal: horizontalPadding }]}>
          <Text style={styles.sectionTitle}>
            Appointments ({selectedDayAppointments.length})
          </Text>
          <Text style={styles.selectedDateLabel}>
            {formatDateLabel(selectedDateStr)}
          </Text>
        </View>

        {/* Selected Date Appointments List */}
        <View style={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
          {selectedDayAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <CalendarIcon size={24} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No bookings for this date</Text>
              <Text style={styles.emptySubtitle}>
                Select a highlighted date with dots on the calendar grid to review booked hours.
              </Text>
            </View>
          ) : (
            selectedDayAppointments.map((item, index) => (
              <View key={`${item.patientId}-${index}`} style={[styles.appointmentCard, isSelectedDatePast && styles.appointmentCardPast]}>
                <View style={styles.patientRow}>
                  <View style={[styles.avatarMiniFallback, isSelectedDatePast && styles.avatarMiniFallbackPast]}>
                    <UserIcon size={16} color={isSelectedDatePast ? '#64748b' : '#34d399'} />
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={[styles.patientName, isSelectedDatePast && styles.patientNamePast]}>{item.patientName}</Text>
                    <Text style={styles.patientMeta}>Hernia Recovery Consultation</Text>
                  </View>
                  <View style={[styles.timeTag, isSelectedDatePast && styles.timeTagPast]}>
                    <Clock size={12} color={isSelectedDatePast ? '#64748b' : '#34d399'} style={{ marginRight: 4 }} />
                    <Text style={[styles.timeTagText, isSelectedDatePast && styles.timeTagTextPast]}>{item.time}</Text>
                  </View>
                </View>
                
                <View style={styles.cardDivider} />

                {/* Direct quick action buttons to support doctor efficiency */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.actionBtnSecondary]}
                    onPress={() => router.push({ pathname: '/(doctor)/patient-detail', params: { uid: item.patientId } })}
                    activeOpacity={0.8}
                  >
                    <FileText size={14} color="#334155" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnSecondaryText}>View Records</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.actionBtnPrimary, isSelectedDatePast && styles.actionBtnPrimaryPast]}
                    onPress={() => {
                      if (isSelectedDatePast) {
                        Alert.alert('Appointment Done', 'This appointment date is already passed/done.');
                      } else {
                        Alert.alert('Consultation Call', `Initiating consult call with ${item.patientName}...`);
                      }
                    }}
                    activeOpacity={0.8}
                    disabled={isSelectedDatePast}
                  >
                    <Phone size={14} color={isSelectedDatePast ? '#94a3b8' : '#ffffff'} style={{ marginRight: 6 }} />
                    <Text style={[styles.actionBtnPrimaryText, isSelectedDatePast && styles.actionBtnPrimaryTextPast]}>
                      {isSelectedDatePast ? 'Done' : 'Start Call'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  weekHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  dayCell: {
    width: '13.5%', // 7 cells per row with spacing
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellOutOfMonth: {
    opacity: 0.35,
  },
  dayCellSelected: {
    backgroundColor: '#0f172a',
  },
  dayCellHasApp: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  dayTextOutOfMonth: {
    color: '#94a3b8',
  },
  dayTextSelected: {
    color: '#ffffff',
  },
  dayTextToday: {
    color: '#34d399',
    fontWeight: '900',
    fontSize: 15,
  },
  dayTextHasApp: {
    color: '#34d399',
  },
  appDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 5,
  },
  appDotSelected: {
    backgroundColor: '#ffffff',
  },
  appDotHasApp: {
    backgroundColor: '#34d399',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  selectedDateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 240,
  },
  appointmentCard: {
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
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMiniFallback: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#34d399',
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
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34d399',
  },
  cardDivider: {
    height: 1.5,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  actionBtnPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: '#000000',
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    backgroundColor: '#ffffff',
    borderColor: '#475569',
  },
  actionBtnSecondaryText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  dayCellPastApp: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1.5,
  },
  dayTextPastApp: {
    color: '#64748b',
  },
  appDotPastApp: {
    backgroundColor: '#64748b',
  },
  appointmentCardPast: {
    backgroundColor: '#f8fafc',
    borderColor: '#94a3b8',
    opacity: 0.85,
  },
  avatarMiniFallbackPast: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  patientNamePast: {
    color: '#64748b',
  },
  timeTagPast: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  timeTagTextPast: {
    color: '#64748b',
  },
  actionBtnPrimaryPast: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
  },
  actionBtnPrimaryTextPast: {
    color: '#94a3b8',
  },
});
