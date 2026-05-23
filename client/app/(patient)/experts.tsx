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
  FlatList,
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
  ShieldAlert,
  Eye,
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

interface RemoveConnectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  doctorName: string;
  isPending: boolean;
}

function RemoveConnectionModal({ visible, onClose, onConfirm, doctorName, isPending }: RemoveConnectionModalProps) {
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
              <ShieldAlert size={24} color="#ef4444" strokeWidth={2.5} />
              <Text style={modalStyles.titleText}>
                {isPending ? 'Cancel Request?' : 'Remove Connection?'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748b" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          
          <View style={modalStyles.contentArea}>
            <Text style={modalStyles.bodyText}>
              {isPending
                ? `Are you sure you want to cancel your pending connection request to Dr. ${doctorName}?`
                : `This will stop sharing your recovery logs, daily wound photos, and diaries with Dr. ${doctorName}.`}
            </Text>
          </View>

          <View style={modalStyles.actionsRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={modalStyles.cancelBtnText}>Keep</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={modalStyles.confirmDeleteBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={modalStyles.confirmDeleteBtnText}>
                {isPending ? 'Cancel Request' : 'Remove'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface BookAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  doctorName: string;
  dateStr: string;
  timeStr: string;
}

function BookAppointmentModal({ visible, onClose, onConfirm, doctorName, dateStr, timeStr }: BookAppointmentModalProps) {
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
              <Clock size={24} color="#0d5c75" strokeWidth={2.5} />
              <Text style={modalStyles.titleText}>Confirm Booking</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748b" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          
          <View style={modalStyles.contentArea}>
            <Text style={modalStyles.bodyText}>
              Are you sure you want to book an appointment with Dr. {doctorName}?
            </Text>
            <View style={modalStyles.detailsContainer}>
              <Text style={modalStyles.detailsLabel}>Date:</Text>
              <Text style={modalStyles.detailsVal}>{dateStr}</Text>
              <Text style={modalStyles.detailsLabel}>Time:</Text>
              <Text style={modalStyles.detailsVal}>{timeStr}</Text>
            </View>
          </View>

          <View style={modalStyles.actionsRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={modalStyles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={modalStyles.confirmBtnText}>Confirm Booking</Text>
            </TouchableOpacity>
          </View>
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
  const { horizontalPadding } = useResponsiveLayout();

  // Custom Confirmation Modals States
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [showDoctorListModal, setShowDoctorListModal] = useState(false);
  const [cancelTargetDoc, setCancelTargetDoc] = useState<User | null>(null);

  const { callState, endCall } = useCall();

  const sidePadding = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return (screenWidth / 2) - 30;
  }, []);

  const getInitialDisplayedDate = () => {
    const today = new Date();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    if (currentHour > 16 || (currentHour === 16 && currentMinute > 0)) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow;
    }
    return today;
  };

  // Dynamic Booking Schedule States with month-based navigation
  const scrollViewRef = useRef<ScrollView>(null);
  const [displayedDate, setDisplayedDate] = useState(getInitialDisplayedDate());

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

  const getInitialScrollOffset = useCallback(() => {
    const initDate = getInitialSelectedDate();
    const dayNumber = parseInt(initDate.split('-')[2]);
    if (isNaN(dayNumber)) return 0;
    const dayIndex = dayNumber - 1;
    return Math.max(0, dayIndex * 70);
  }, []);

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
      
      // Auto-select date in the new month
      const isCurrentMonth = prev.getFullYear() === today.getFullYear() && prev.getMonth() === today.getMonth();
      let targetDate: Date;
      if (isCurrentMonth) {
        targetDate = getInitialDisplayedDate();
      } else {
        targetDate = prev; // 1st of the month
      }
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      setSelectedDate(dateStr);
    } else {
      Alert.alert('Cannot Go Back', 'You cannot select a past month.');
    }
  };

  const handleNextMonth = () => {
    const today = new Date();
    const next = new Date(displayedDate.getFullYear(), displayedDate.getMonth() + 1, 1);
    setDisplayedDate(next);
    
    // Auto-select date in the new month
    const isCurrentMonth = next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth();
    let targetDate: Date;
    if (isCurrentMonth) {
      targetDate = getInitialDisplayedDate();
    } else {
      targetDate = next; // 1st of the month
    }
    const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
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
    const dayIndex = bookingDays.findIndex(d => d.dateString === dateStr);
    if (dayIndex === -1) return;
    
    const offset = dayIndex * 70; // 70 is cardWidth (60) + margin (10)
    
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: offset, animated: true });
    }, 300);
  }, [bookingDays]);

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
      Alert.alert('Request Sent 📩', 'Your connection request has been sent successfully. The doctor will review your profile shortly.');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Could not send request. Please try again.');
    } finally {
      setIsApplying(null);
    }
  }, [user?.uid, fetchData]);

  const onRemoveDoctor = async (doctorId: string) => {
    setRemoveModalVisible(true);
  };

  const handleConfirmRemove = async () => {
    setRemoveModalVisible(false);
    try {
      await apiClient.post(`/users/remove-doctor/${doc.uid}`);
      fetchData();
      Alert.alert('Success 🎉', isPending ? 'Connection request deleted successfully.' : 'Connection removed successfully.');
    } catch (error) {
      Alert.alert('Error', 'Could not update connection. Please try again.');
    }
  };

  const handleConfirmBooking = async () => {
    setBookModalVisible(false);
    try {
      await apiClient.post('/users/appointments', {
        doctorId: doc.uid,
        date: selectedDate,
        time: selectedTime,
      });
      Alert.alert(
        'Appointment Confirmed! 🎉',
        `Your appointment with Dr. ${doc.name} has been successfully booked for ${getFormattedSelectedDate()} at ${selectedTime}.`
      );
    } catch (error) {
      Alert.alert('Error', 'Could not book appointment. Please try again.');
    }
  };

  const handleConfirmCancelPending = async () => {
    setRemoveModalVisible(false);
    if (!cancelTargetDoc) return;
    try {
      await apiClient.post(`/users/remove-doctor/${cancelTargetDoc.uid}`);
      fetchData();
      Alert.alert('Success 🎉', `Connection request to Dr. ${cancelTargetDoc.name} has been cancelled.`);
    } catch (error) {
      Alert.alert('Error', 'Could not cancel request. Please try again.');
    } finally {
      setCancelTargetDoc(null);
    }
  };

  // Derive linked, pending, and other doctor lists from user profile and fetched doctors
  const linkedDoctors = useMemo(() => {
    const ids = user?.linkedDoctorIds || [];
    return appDoctors.filter(d => ids.includes(d.uid));
  }, [user?.linkedDoctorIds, appDoctors]);

  const pendingDoctors = useMemo(() => {
    const ids = user?.pendingDoctorIds || [];
    return appDoctors.filter(d => ids.includes(d.uid));
  }, [user?.pendingDoctorIds, appDoctors]);

  const otherDoctors = useMemo(() => {
    const linkedIds = user?.linkedDoctorIds || [];
    const pendingIds = user?.pendingDoctorIds || [];
    return appDoctors.filter(d => !linkedIds.includes(d.uid) && !pendingIds.includes(d.uid));
  }, [user?.linkedDoctorIds, user?.pendingDoctorIds, appDoctors]);

  const isLinked = linkedDoctors.length > 0;
  const isPending = !isLinked && pendingDoctors.length > 0;

  const doc = isLinked 
    ? linkedDoctors[0] 
    : isPending 
      ? pendingDoctors[0] 
      : otherDoctors[0];

  // Automatically redirect to doctor profile when active/connected
  useEffect(() => {
    if (isLinked && doc) {
      router.replace({
        pathname: '/(patient)/doctor-profile',
        params: { doctorId: doc.uid }
      });
    }
  }, [isLinked, doc]);

  // If not connected and not pending, display the clean Connect Placeholder screen only
  if (!isLinked && !isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.placeholderWrapper}>
          <View style={styles.placeholderCard}>
            <View style={styles.placeholderIconContainer}>
              <UserPlus size={40} color="#0d5c75" strokeWidth={2.5} />
            </View>
            <Text style={styles.placeholderTitle}>Connect with a Specialist</Text>
            <Text style={styles.placeholderSubtitle}>
              Connect with a hernia care specialist to share your symptom logs, daily diaries, and wound health photos for active medical monitoring.
            </Text>
            
            <TouchableOpacity
              style={styles.placeholderBtn}
              onPress={() => router.push('/(patient)/connect-doctor')}
              activeOpacity={0.9}
            >
              <Text style={styles.placeholderBtnText}>Connect with Doctor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // If pending (sent requests but not yet accepted), show pending requests screen
  if (isPending && !isLinked) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchData}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Pending Header Card */}
          <View style={[styles.placeholderWrapper, { flex: 0, justifyContent: 'flex-start', paddingTop: 30 }]}>
            <View style={[styles.placeholderCard, { borderColor: '#000000' }]}>
              <View style={[styles.placeholderIconContainer, { backgroundColor: '#fef9c3', borderColor: '#000000' }]}>
                <Clock size={36} color="#d97706" strokeWidth={2.5} />
              </View>
              <Text style={styles.placeholderTitle}>Requests Pending</Text>
              <Text style={styles.placeholderSubtitle}>
                Your connection requests have been sent. Once a doctor accepts, you'll be able to schedule appointments and share recovery details.
              </Text>
            </View>
          </View>

          {/* List of Pending Requests */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>
              Pending Requests ({pendingDoctors.length})
            </Text>
            {pendingDoctors.map((pendDoc) => (
              <View key={pendDoc.uid} style={doctorListStyles.doctorCard}>
                <View style={doctorListStyles.doctorInfo}>
                  <View style={doctorListStyles.avatarCircle}>
                    {pendDoc.avatarUrl ? (
                      <Image source={{ uri: pendDoc.avatarUrl }} style={doctorListStyles.avatarImage} />
                    ) : (
                      <Text style={doctorListStyles.avatarInitials}>
                        {(pendDoc.name ?? '?').trim().charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={doctorListStyles.nameCol}>
                    <Text style={doctorListStyles.doctorName}>Dr. {pendDoc.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Clock size={11} color="#d97706" strokeWidth={2.5} />
                      <Text style={{ fontSize: 11, color: '#d97706', fontWeight: '700', marginLeft: 4 }}>Pending</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={[doctorListStyles.connectBtn, { backgroundColor: '#ffffff' }]}
                    onPress={() => router.push({ pathname: '/(patient)/doctor-profile', params: { doctorId: pendDoc.uid } })}
                    activeOpacity={0.9}
                  >
                    <Text style={[doctorListStyles.connectBtnText, { color: '#0f172a' }]}>Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[doctorListStyles.connectBtn, { backgroundColor: '#fef08a' }]}
                    onPress={() => {
                      setRemoveModalVisible(true);
                      setCancelTargetDoc(pendDoc);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[doctorListStyles.connectBtnText, { color: '#92400e' }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Connect with more doctors button */}
            <TouchableOpacity
              style={[styles.placeholderBtn, { marginTop: 16 }]}
              onPress={() => router.push('/(patient)/connect-doctor')}
              activeOpacity={0.9}
            >
              <Text style={styles.placeholderBtnText}>Connect with More Doctors</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <RemoveConnectionModal
          visible={removeModalVisible}
          onClose={() => setRemoveModalVisible(false)}
          onConfirm={handleConfirmCancelPending}
          doctorName={cancelTargetDoc?.name || ''}
          isPending={true}
        />
      </SafeAreaView>
    );
  }

  // Redesigned Glassmorphic Doctor Profile Page (for linked doctor)
  if (isLinked && doc) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <ActivityIndicator size="large" color="#0d5c75" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0d5c75', marginTop: 12 }}>
            Loading Specialist Profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading / Redirect Placeholder state
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.loadingArea}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { paddingVertical: theme.spacing.xl },

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
    backgroundColor: '#fef9c3',
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

  otherDocsSection: {
    marginTop: 24,
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  otherDocsSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  otherDocProfileCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  otherDocProfileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  otherDocProfileCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  otherDocProfileCardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  otherDocProfileCardBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  otherDocProfileCardBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },

  // Redesigned modern styles
  mainScroll: {
    flex: 1,
    backgroundColor: '#ffffff', // Continuous white background
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  topBannerContainer: {
    backgroundColor: '#ffffff', // Continuous white background
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
  bannerProfileBtn: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  bannerProfileBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  miniActionsRightWrapper: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  miniActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
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
    backgroundColor: '#ffffff',
  },
  statsCardRow: {
    flexDirection: 'row',
    backgroundColor: '#fef9c3',
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
    backgroundColor: '#fef9c3',
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
    backgroundColor: '#fef9c3',
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
    flexDirection: 'row',
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
    marginRight: 10,
  },
  dayCardSelected: {
    backgroundColor: '#000000',
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
    color: '#ffffff',
    fontWeight: '800',
  },
  dayCardExpired: {
    backgroundColor: '#f1f5f9',
    borderColor: '#000000',
  },
  dayTextExpired: {
    color: '#000000',
    textDecorationLine: 'line-through',
  },
  dayCardToday: {
    backgroundColor: '#facc15',
    borderColor: '#000000',
  },
  dayTextToday: {
    color: '#000000',
    fontWeight: '900',
  },
  timeSlotBtnExpired: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.45,
  },
  timeSlotTextExpired: {
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
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  timeSlotTextSelected: {
    color: '#ffffff',
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
    backgroundColor: '#000000',
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
    backgroundColor: '#ef4444',
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
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
  },
  disconnectLinkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  connectCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  connectCardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  connectBtn: {
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
    width: '100%',
  },
  connectBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  placeholderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  placeholderCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  placeholderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#edf5fd',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  placeholderBtn: {
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  placeholderBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  bodyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  cancelBtnText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '800',
  },
  confirmBtn: {
    flex: 1,
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
  confirmBtnText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '800',
  },
  confirmDeleteBtn: {
    flex: 1.2,
    backgroundColor: '#ef4444',
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
  confirmDeleteBtnText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '800',
  },
  detailsContainer: {
    backgroundColor: '#edf5fd',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  detailsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailsVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
});

const doctorListStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderColor: '#000000',
    maxHeight: '75%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef9c3',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  nameCol: {
    marginLeft: 12,
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  doctorSpec: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  connectBtn: {
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
    marginLeft: 10,
  },
  connectBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
