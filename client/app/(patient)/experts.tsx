import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import {
  Phone,
  Building2,
  UserPlus,
  Check,
  Trash2,
  ChevronLeft,
  Star,
  Clock,
  Video,
  MessageSquare,
  Info,
  MapPin,
  X,
} from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import apiClient from '../../src/services/apiClient';
import { CallModal } from '../../src/components/call/CallModal';
import { useCall } from '../../src/hooks/useCall';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { useAuthStore } from '../../src/store/authStore';
import { User } from '../../src/types';
import { Avatar } from '../../src/components/ui/Avatar';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  address: string;
  hospitalName: string;
}

function LocationModal({ visible, onClose, address, hospitalName }: LocationModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalCard}>
          <View style={modalStyles.headerRow}>
            <View style={modalStyles.titleContainer}>
              <MapPin size={20} color="#0d5c75" strokeWidth={2.5} />
              <Text style={modalStyles.titleText}>Hospital Location</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748b" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          
          <View style={modalStyles.contentArea}>
            <Text style={modalStyles.hospitalName}>{hospitalName}</Text>
            <Text style={modalStyles.addressText}>{address}</Text>
          </View>

          <TouchableOpacity style={modalStyles.okBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={modalStyles.okBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ExpertsScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const [appDoctors, setAppDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [showAddDoctors, setShowAddDoctors] = useState(false);
  const { horizontalPadding } = useResponsiveLayout();

  const { callState, endCall } = useCall();

  // Dynamic Booking Schedule States with month-based navigation
  const scrollViewRef = useRef<ScrollView>(null);
  const [displayedDate, setDisplayedDate] = useState(new Date());

  const getHourFromSlot = (slot: string) => {
    const parts = slot.split(' ');
    const timeParts = parts[0].split(':');
    let hr = parseInt(timeParts[0]);
    const ampm = parts[1];
    if (ampm === 'PM' && hr !== 12) {
      hr += 12;
    }
    if (ampm === 'AM' && hr === 12) {
      hr = 0;
    }
    return hr;
  };

  const isTimeSlotExpired = useCallback((dateStr: string, slot: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateStr !== todayStr) return false; // Future dates have no expired slots
    
    const slotHour = getHourFromSlot(slot);
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    
    if (currentHour > slotHour) return true;
    if (currentHour === slotHour && currentMinute > 0) return true;
    return false;
  }, []);

  const isDateExpired = useCallback((d: Date) => {
    const today = new Date();
    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);
    const todayZero = new Date(today);
    todayZero.setHours(0, 0, 0, 0);
    
    if (checkDate < todayZero) return true;
    
    const isToday = checkDate.getTime() === todayZero.getTime();
    if (isToday) {
      // All slots are expired if current time is past the last slot (4:00 PM = 16:00)
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      if (currentHour > 16 || (currentHour === 16 && currentMinute > 0)) {
        return true;
      }
    }
    return false;
  }, []);

  const getInitialSelectedDate = () => {
    const today = new Date();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    
    // If past 4:00 PM today, auto-select tomorrow
    if (currentHour > 16 || (currentHour === 16 && currentMinute > 0)) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    }
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const getFirstAvailableTimeSlot = useCallback((dateStr: string) => {
    const slots = [
      '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
    ];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateStr !== todayStr) return '9:00 AM';
    
    for (const slot of slots) {
      if (!isTimeSlotExpired(dateStr, slot)) {
        return slot;
      }
    }
    return '9:00 AM';
  }, [isTimeSlotExpired]);

  const [selectedDate, setSelectedDate] = useState(getInitialSelectedDate());
  const [selectedTime, setSelectedTime] = useState('9:00 AM');
  const [showAddressPopup, setShowAddressPopup] = useState(false);

  // Auto-select first non-expired slot when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setSelectedTime(getFirstAvailableTimeSlot(selectedDate));
    }
  }, [selectedDate, getFirstAvailableTimeSlot]);

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  const monthNames = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const getDaysOfDisplayedMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        dayNumber: i.toString(),
        weekday: weekdays[d.getDay()],
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        rawDate: d,
      });
    }
    return days;
  }, []);

  const handlePrevMonth = () => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const prev = new Date(displayedDate.getFullYear(), displayedDate.getMonth() - 1, 1);
    if (prev >= currentMonthStart) {
      setDisplayedDate(prev);
    } else {
      Alert.alert('Cannot Go Back', 'You cannot select a past month.');
    }
  };

  const handleNextMonth = () => {
    const next = new Date(displayedDate.getFullYear(), displayedDate.getMonth() + 1, 1);
    setDisplayedDate(next);
  };

  const bookingDays = useMemo(() => getDaysOfDisplayedMonth(displayedDate), [displayedDate, getDaysOfDisplayedMonth]);

  const getFormattedSelectedDate = useCallback(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    const yr = parseInt(parts[0]);
    const mo = parseInt(parts[1]) - 1;
    const dy = parseInt(parts[2]);
    const d = new Date(yr, mo, dy);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${weekdays[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }, [selectedDate, monthNames]);

  // Centering auto-scroll logic
  const scrollToSelectedDate = useCallback((dateStr: string) => {
    const dayNumber = parseInt(dateStr.split('-')[2]);
    if (isNaN(dayNumber)) return;
    const dayIndex = dayNumber - 1;
    
    const screenWidth = Dimensions.get('window').width;
    const cardWidth = 60;
    const gap = 10;
    const offset = (dayIndex * (cardWidth + gap)) - (screenWidth / 2) + (cardWidth / 2);
    const finalOffset = Math.max(0, offset);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: finalOffset, animated: true });
    }, 300);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      scrollToSelectedDate(selectedDate);
    }
  }, [displayedDate, selectedDate, scrollToSelectedDate]);

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

  // Redesigned Glassmorphic Doctor Profile Page when connection is active
  if (linkedDoctors.length > 0 && !showAddDoctors) {
    const doc = linkedDoctors[0]; // Active linked doctor
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchData}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Top Blue Banner Container */}
          <View style={styles.topBannerContainer}>
            {/* Top Navigation Row */}
            <View style={styles.topNavRow}>
              <TouchableOpacity
                style={styles.navCircleBtn}
                onPress={() => router.push('/(patient)/dashboard')}
                activeOpacity={0.8}
              >
                <ChevronLeft size={22} color="#0f172a" strokeWidth={2.5} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.navAddBtn}
                onPress={() => setShowAddDoctors(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.navAddBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Doctor Avatar / Details Column */}
            <View style={styles.bannerMainCol}>
              <View style={styles.doctorProfileImageContainer}>
                <View style={styles.avatarPlaceholderCircle}>
                  {doc.avatarUrl ? (
                    <Image source={{ uri: doc.avatarUrl }} style={styles.avatarImageInside} />
                  ) : (
                    <Text style={styles.avatarInitialsText}>
                      {(doc.name ?? '?').trim().charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.bannerCenteredInfo}>
                <Text style={styles.bannerDocName}>Dr. {doc.name}</Text>
                <Text style={styles.bannerDocSpecialty}>Hernia Expert</Text>
              </View>

              {/* Mini details container with Call and Location address icon placed on the right */}
              <View style={styles.miniActionsRightWrapper}>
                <View style={styles.miniActionsContainer}>
                  <TouchableOpacity
                    style={styles.miniActionBtn}
                    onPress={() => {
                      if (doc.isActive) {
                        Linking.openURL(`tel:${doc.phoneNumber || '911'}`);
                      } else {
                        Alert.alert('Doctor Offline 📴', 'This doctor is currently offline for calls.');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Phone size={18} color="#0d5c75" strokeWidth={2.5} />
                  </TouchableOpacity>

                  <View style={styles.miniActionDivider} />

                  <TouchableOpacity
                    style={styles.miniActionBtn}
                    onPress={() => setShowAddressPopup(true)}
                    activeOpacity={0.7}
                  >
                    <MapPin size={18} color="#0d5c75" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* White Bottom Body Area */}
          <View style={styles.bodyContainer}>
            {/* Stat Cards Row */}
            <View style={styles.statsCardRow}>
              {/* Stat 1: Experience */}
              <View style={styles.statCol}>
                <View style={styles.statIconWrap}>
                  <Clock size={18} color="#0d5c75" strokeWidth={2.2} />
                </View>
                <Text style={styles.statValue}>8 Years</Text>
                <Text style={styles.statLabel}>Experience</Text>
              </View>

              <View style={styles.statDivider} />

              {/* Stat 2: Call Status */}
              <View style={styles.statCol}>
                <View style={[styles.statIconWrap, doc.isActive ? styles.statIconActive : styles.statIconMuted]}>
                  <Phone size={18} color={doc.isActive ? '#059669' : '#64748b'} strokeWidth={2.2} />
                </View>
                <Text style={[styles.statValue, { color: doc.isActive ? '#059669' : '#0f172a' }]}>
                  {doc.isActive ? 'Active' : 'Offline'}
                </Text>
                <Text style={styles.statLabel}>Call Status</Text>
              </View>

              <View style={styles.statDivider} />

              {/* Stat 3: Visit Status */}
              <View style={styles.statCol}>
                <View style={[styles.statIconWrap, doc.availableAtHospital ? styles.statIconActive : styles.statIconMuted]}>
                  <Building2 size={18} color={doc.availableAtHospital ? '#059669' : '#64748b'} strokeWidth={2.2} />
                </View>
                <Text style={[styles.statValue, { color: doc.availableAtHospital ? '#059669' : '#0f172a' }]}>
                  {doc.availableAtHospital ? 'Open' : 'Closed'}
                </Text>
                <Text style={styles.statLabel}>Hospital Visit</Text>
              </View>
            </View>

            {/* Booking Scheduler Card */}
            <View style={styles.schedulerCard}>
              {/* Select Date Section */}
              <View style={styles.schedulerSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.schedulerSectionTitle}>Select Date</Text>
                  <View style={styles.monthSelector}>
                    <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7} style={styles.monthNavBtn}>
                      <ChevronLeft size={16} color="#64748b" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.monthText}>{monthNames[displayedDate.getMonth()]} {displayedDate.getFullYear()}</Text>
                    <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7} style={styles.monthNavBtn}>
                      <ChevronLeft size={16} color="#64748b" strokeWidth={2.5} style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
                  {bookingDays.map(d => {
                    const isSelected = selectedDate === d.dateString;
                    const expired = isDateExpired(d.rawDate);
                    return (
                      <TouchableOpacity
                        key={d.dateString}
                        style={[
                          styles.dayCard,
                          isSelected && styles.dayCardSelected,
                          expired && styles.dayCardExpired
                        ]}
                        onPress={() => {
                          if (expired) {
                            Alert.alert('Date Expired 🚫', 'You cannot select a date in the past.');
                            return;
                          }
                          setSelectedDate(d.dateString);
                        }}
                        activeOpacity={expired ? 1 : 0.8}
                      >
                        <Text style={[
                          styles.dayNumber,
                          isSelected && styles.dayTextSelected,
                          expired && styles.dayTextExpired
                        ]}>{d.dayNumber}</Text>
                        <Text style={[
                          styles.dayName,
                          isSelected && styles.dayTextSelected,
                          expired && styles.dayTextExpired
                        ]}>{d.weekday.substring(0, 3)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Select Time Section */}
              <View style={styles.schedulerSection}>
                <Text style={styles.schedulerSectionTitle}>Select Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
                  {timeSlots.map(time => {
                    const isSelected = selectedTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[styles.timeSlotBtn, isSelected && styles.timeSlotBtnSelected]}
                        onPress={() => setSelectedTime(time)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>{time}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Stylized Visual timeline bar matching the image */}
                <View style={styles.timelineContainer}>
                  <View style={styles.timelineBar} />
                  <View style={styles.timelineIndicator} />
                </View>
              </View>

              {/* Book Button */}
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => {
                  Alert.alert(
                    'Appointment Confirmed! 🎉',
                    `Your appointment with Dr. ${doc.name} has been successfully booked for ${getFormattedSelectedDate()} at ${selectedTime}.`
                  );
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.bookBtnText}>Book Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <CallModal
          visible={callState !== 'idle'}
          callState={callState}
          onEndCall={endCall}
        />

        <LocationModal
          visible={showAddressPopup}
          onClose={() => setShowAddressPopup(false)}
          address={doc.hospitalAddress || 'St. Mary\'s Hernia Care Clinic, 456 Healthcare Ave, Suite 200'}
          hospitalName={doc.place || 'General Hospital'}
        />
      </SafeAreaView>
    );
  }

  // Available Doctors search list when showAddDoctors is true or no doctor is linked
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 20, paddingTop: 15 }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchData} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
        }
      >
        {/* Custom modern header navigation row */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.navCircleBtn}
            onPress={() => {
              if (linkedDoctors.length > 0) {
                setShowAddDoctors(false);
              } else {
                router.push('/(patient)/dashboard');
              }
            }}
            activeOpacity={0.8}
          >
            <ChevronLeft size={22} color="#0f172a" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.addDoctorsHeaderTitle}>Add Expert</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading && appDoctors.length === 0 ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <>
            {/* Available Doctors Section */}
            {otherDoctors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Doctors</Text>
                <Text style={styles.sectionSubtitle}>Connect with a surgeon to share your recovery logs</Text>
                {otherDoctors.map(doc => (
                  <View key={doc.uid} style={styles.doctorCard}>
                    <View style={styles.avatarPlaceholderCircleSmall}>
                      {doc.avatarUrl ? (
                        <Image source={{ uri: doc.avatarUrl }} style={styles.avatarImageInside} />
                      ) : (
                        <Text style={styles.avatarInitialsTextSmall}>
                          {(doc.name ?? '?').trim().charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>Dr. {doc.name}</Text>
                      <Text style={styles.docHospital}>Hernia Expert</Text>
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
                    <View style={styles.avatarPlaceholderCircleSmall}>
                      {doc.avatarUrl ? (
                        <Image source={{ uri: doc.avatarUrl }} style={styles.avatarImageInside} />
                      ) : (
                        <Text style={styles.avatarInitialsTextSmall}>
                          {(doc.name ?? '?').trim().charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>Dr. {doc.name}</Text>
                      <Text style={styles.docPending}>Waiting for approval...</Text>
                    </View>
                    <Check size={20} color="#64748b" strokeWidth={2.5} />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <CallModal
        visible={callState !== 'idle'}
        callState={callState}
        onEndCall={endCall}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#bfe2f2' },
  container: { paddingVertical: theme.spacing.xl },
  header: { marginBottom: theme.spacing.xl },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: 4 },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
  loadingArea: { paddingVertical: 100, alignItems: 'center' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  sectionSubtitle: { fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 12 },

  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#000000',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  pendingCard: {
    opacity: 0.7,
    backgroundColor: '#f1f5f9',
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  docHospital: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 2 },
  docPending: { fontSize: 12, fontWeight: '600', color: '#0d5c75', fontStyle: 'italic', marginTop: 2 },

  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d5c75',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  applyBtnText: { fontSize: 12, color: '#ffffff', fontWeight: '800' },

  backToCareBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: theme.spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  backToCareText: {
    ...theme.typography.caption,
    fontWeight: '800',
    color: '#000000',
  },

  // Redesigned modern styles
  mainScroll: {
    flex: 1,
    backgroundColor: '#bfe2f2', // Continuous light blue background
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  topBannerContainer: {
    backgroundColor: '#bfe2f2', // Continuous light blue background
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 24,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  navAddBtnText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    marginTop: -2,
  },
  addDoctorsHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  bannerMainCol: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  doctorProfileImageContainer: {
    position: 'relative',
    borderRadius: 55,
    overflow: 'visible',
  },
  avatarPlaceholderCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholderCircleSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImageInside: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarInitialsText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#000000',
  },
  avatarInitialsTextSmall: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -6,
    left: '12%',
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerCenteredInfo: {
    alignItems: 'center',
    marginTop: 14,
    width: '100%',
  },
  bannerDocName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  bannerDocSpecialty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
    textAlign: 'center',
  },
  miniActionsRightWrapper: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  miniActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    alignSelf: 'flex-end',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  miniActionBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniActionDivider: {
    width: 1.5,
    height: 18,
    backgroundColor: '#e2e8f0',
  },
  glassActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  detailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d6eef6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  detailsPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0d5c75',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionCallActive: {
    backgroundColor: '#d6e8fa',
  },
  actionInactive: {
    backgroundColor: '#ffffff',
    opacity: 0.9,
  },
  bodyContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#bfe2f2',
  },
  statsCardRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 20,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1.5,
    height: '60%',
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#edf5fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statIconActive: {
    backgroundColor: '#d1fae5',
  },
  statIconMuted: {
    backgroundColor: '#f1f5f9',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  schedulerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 24,
  },
  schedulerSection: {
    marginBottom: 22,
  },
  schedulerSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  daysScroll: {
    gap: 10,
  },
  dayCard: {
    width: 60,
    height: 70,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  dayCardSelected: {
    backgroundColor: '#bfe2f2',
    borderColor: '#000000',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  dayTextSelected: {
    color: '#0d5c75',
    fontWeight: '800',
  },
  dayCardExpired: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.45,
  },
  dayTextExpired: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  monthNavBtn: {
    padding: 6,
  },
  timeScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  timeSlotBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  timeSlotBtnSelected: {
    backgroundColor: '#bfe2f2',
    borderColor: '#000000',
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  timeSlotTextSelected: {
    color: '#0d5c75',
    fontWeight: '800',
  },
  timelineContainer: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    marginTop: 12,
  },
  timelineBar: {
    height: 2,
    backgroundColor: '#e2e8f0',
    width: '100%',
  },
  timelineIndicator: {
    position: 'absolute',
    left: '42%',
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0d5c75',
  },
  bookBtn: {
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginTop: 8,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disconnectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 10,
    gap: 6,
    marginBottom: 10,
  },
  disconnectLinkText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  contentArea: {
    marginBottom: 20,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 18,
  },
  okBtn: {
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  okBtnText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '800',
  },
});
