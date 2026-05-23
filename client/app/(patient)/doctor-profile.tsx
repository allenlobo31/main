import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  Phone,
  MapPin,
  Clock,
  Building2,
  X,
  ShieldAlert,
  UserPlus,
} from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/constants/theme';
import { User } from '../../src/types';

// Modals
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

export default function DoctorProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const doctorId = params.doctorId as string;

  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [doctor, setDoctor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Connection status derivation
  const isLinked = useMemo(() => {
    if (!doctor || !user) return false;
    return (user.linkedDoctorIds || []).includes(doctor.uid);
  }, [doctor, user]);

  const isPending = useMemo(() => {
    if (!doctor || !user) return false;
    return (user.pendingDoctorIds || []).includes(doctor.uid);
  }, [doctor, user]);

  // Appointment states
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);

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
    if (dateStr !== todayStr) return false;
    
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
      const isCurrentMonth = prev.getFullYear() === today.getFullYear() && prev.getMonth() === today.getMonth();
      let targetDate: Date;
      if (isCurrentMonth) {
        targetDate = getInitialDisplayedDate();
      } else {
        targetDate = prev;
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
    const isCurrentMonth = next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth();
    let targetDate: Date;
    if (isCurrentMonth) {
      targetDate = getInitialDisplayedDate();
    } else {
      targetDate = next;
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

  const scrollToSelectedDate = useCallback((dateStr: string) => {
    const dayIndex = bookingDays.findIndex(d => d.dateString === dateStr);
    if (dayIndex === -1) return;
    const offset = dayIndex * 70;
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: offset, animated: true });
    }, 300);
  }, [bookingDays]);

  useEffect(() => {
    if (selectedDate) {
      scrollToSelectedDate(selectedDate);
    }
  }, [displayedDate, selectedDate, scrollToSelectedDate]);

  // API Callbacks
  const fetchDoctorDetails = useCallback(async () => {
    if (!doctorId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get('/users/doctors');
      const found = res.data.find(
        (d: any) => (d.uid || d.id || d._id) === doctorId
      );
      if (found) {
        setDoctor({
          ...found,
          uid: found.uid || found.id || found._id,
        });
      } else {
        Alert.alert('Not Found', 'Could not locate this doctor profile.');
        router.back();
      }
    } catch (error) {
      console.error('[DoctorProfileScreen] fetchDoctorDetails error:', error);
      Alert.alert('Error', 'Failed to load doctor profile.');
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, router]);

  useEffect(() => {
    fetchDoctorDetails();
  }, [fetchDoctorDetails]);

  // Connect request
  const handleConnect = useCallback(async () => {
    if (!doctor) return;
    Alert.alert(
      'Send Connection Request? 🤝',
      `Would you like to connect with Dr. ${doctor.name}? This will allow them to view your hernia symptoms and daily recovery logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await apiClient.post('/users/apply/' + doctor.uid);
              Alert.alert(
                'Request Sent! ✉️',
                `Your request to connect with Dr. ${doctor.name} has been sent successfully.`
              );
              const meRes = await apiClient.get('/users/me');
              updateProfile(meRes.data);
            } catch (error) {
              Alert.alert('Error', 'Failed to send request. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [doctor, updateProfile]);

  // Cancel pending request
  const handleCancelRequest = useCallback(async () => {
    if (!doctor) return;
    setCancelTargetDoc(doctor);
    setRemoveModalVisible(true);
  }, [doctor]);

  const [cancelTargetDoc, setCancelTargetDoc] = useState<User | null>(null);

  const handleConfirmRemove = async () => {
    setRemoveModalVisible(false);
    if (!doctor) return;
    setIsProcessing(true);
    try {
      await apiClient.post('/users/remove-doctor/' + doctor.uid);
      Alert.alert(
        isPending ? 'Request Cancelled 🛑' : 'Connection Removed 🛑',
        isPending
          ? `Your pending connection request to Dr. ${doctor.name} has been cancelled.`
          : `Dr. ${doctor.name} has been successfully removed from your active specialists.`
      );
      const meRes = await apiClient.get('/users/me');
      updateProfile(meRes.data);
      router.replace('/(patient)/experts');
    } catch (error) {
      Alert.alert('Error', 'Failed to update connection. Please try again.');
    } finally {
      setIsProcessing(false);
      setCancelTargetDoc(null);
    }
  };

  // Book appointment
  const handleBookAppointment = () => {
    setBookModalVisible(true);
  };

  const handleConfirmBookAppointment = async () => {
    setBookModalVisible(false);
    if (!doctor) return;
    try {
      await apiClient.post('/users/appointments', {
        doctorId: doctor.uid,
        doctorName: doctor.name,
        date: selectedDate,
        time: selectedTime,
      });
      Alert.alert(
        'Appointment Confirmed! 🎉',
        `Your appointment with Dr. ${doctor.name} has been successfully booked for ${getFormattedSelectedDate()} at ${selectedTime}.`
      );
    } catch (error) {
      Alert.alert('Error', 'Could not book appointment. Please try again.');
    }
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingSafe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d5c75" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ChevronLeft size={24} color="#000000" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.plusCircleBtn}
          onPress={() => {
            if (!isLinked && !isPending) {
              handleConnect();
            } else {
              router.push('/(patient)/connect-doctor');
            }
          }}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#000000" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Centered Doctor Avatar */}
        <View style={styles.avatarMainCol}>
          <View style={styles.doctorProfileImageContainer}>
            <View style={styles.avatarPlaceholderCircle}>
              {doctor.avatarUrl ? (
                <Image source={{ uri: doctor.avatarUrl }} style={styles.avatarImageInside} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarInitialsText}>
                  {getInitials(doctor.name)}
                </Text>
              )}
            </View>
          </View>

          {/* Centered Name and Specialty */}
          <View style={styles.bannerCenteredInfo}>
            <Text style={styles.bannerDocName}>Dr. {doctor.name}</Text>
            <Text style={styles.bannerDocSpecialty}>Hernia Expert</Text>
          </View>

          {/* Mini actions container with Call and Location address icon placed on the right */}
          <View style={styles.miniActionsRightWrapper}>
            <View style={[styles.miniActionsContainer, (!isLinked) && styles.miniActionsMuted]}>
              <TouchableOpacity
                style={styles.miniActionBtn}
                onPress={() => {
                  if (!isLinked) {
                    Alert.alert('Connection Required 🚫', 'You must connect with the doctor to make calls.');
                    return;
                  }
                  if (doctor.isActive) {
                    Linking.openURL(`tel:${doctor.phoneNumber || '911'}`);
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
                onPress={() => {
                  if (!isLinked) {
                    Alert.alert('Connection Required 🚫', 'You must connect with the doctor to view hospital location details.');
                    return;
                  }
                  setShowAddressPopup(true);
                }}
                activeOpacity={0.7}
              >
                <MapPin size={18} color="#0d5c75" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Green Stats Card Row */}
        <View style={styles.statsCardRow}>
          {/* Stat 1: Experience */}
          <View style={styles.statCol}>
            <View style={styles.statIconWrap}>
              <Clock size={18} color="#0d5c75" strokeWidth={2.2} />
            </View>
            <Text style={styles.statValue}>{doctor.experience || '8 Years'}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Stat 2: Call Status */}
          <View style={styles.statCol}>
            <View style={[styles.statIconWrap, doctor.isActive ? styles.statIconActive : styles.statIconMuted]}>
              <Phone size={18} color={doctor.isActive ? '#059669' : '#64748b'} strokeWidth={2.2} />
            </View>
            <Text style={[styles.statValue, { color: doctor.isActive ? '#059669' : '#0f172a' }]}>
              {doctor.isActive ? 'Active' : 'Offline'}
            </Text>
            <Text style={styles.statLabel}>Call Status</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Stat 3: Visit Status */}
          <View style={styles.statCol}>
            <View style={[styles.statIconWrap, doctor.availableAtHospital ? styles.statIconActive : styles.statIconMuted]}>
              <Building2 size={18} color={doctor.availableAtHospital ? '#059669' : '#64748b'} strokeWidth={2.2} />
            </View>
            <Text style={[styles.statValue, { color: doctor.availableAtHospital ? '#059669' : '#0f172a' }]}>
              {doctor.availableAtHospital ? 'Open' : 'Closed'}
            </Text>
            <Text style={styles.statLabel}>Hospital Visit</Text>
          </View>
        </View>

        {/* Dynamic Booking Scheduler / Connection State Action Panels */}
        {isLinked ? (
          <>
            {/* Stretched Scheduler Card */}
            <View style={styles.schedulerCard}>
            {/* Select Date Section */}
            <View style={styles.schedulerSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.schedulerSectionTitle}>Appointment</Text>
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

              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.daysScroll, { paddingHorizontal: sidePadding }]}
                contentOffset={{ x: getInitialScrollOffset(), y: 0 }}
              >
                {bookingDays.map((d, index) => {
                  const isSelected = selectedDate === d.dateString;
                  const expired = isDateExpired(d.rawDate);
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  const isToday = d.dateString === todayStr;
                  const isLast = index === bookingDays.length - 1;
                  return (
                    <TouchableOpacity
                      key={d.dateString}
                      style={[
                        styles.dayCard,
                        isSelected && styles.dayCardSelected,
                        isToday && styles.dayCardToday,
                        expired && styles.dayCardExpired,
                        isLast && { marginRight: 0 }
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
                        isToday && styles.dayTextToday,
                        expired && styles.dayTextExpired
                      ]}>{d.dayNumber}</Text>
                      <Text style={[
                        styles.dayName,
                        isSelected && styles.dayTextSelected,
                        isToday && styles.dayTextToday,
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
                  const expired = isTimeSlotExpired(selectedDate, time);
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlotBtn,
                        isSelected && styles.timeSlotBtnSelected,
                        expired && styles.timeSlotBtnExpired
                      ]}
                      onPress={() => {
                        if (expired) {
                          Alert.alert('Time Slot Expired 🚫', 'This time slot has already passed for today.');
                          return;
                        }
                        setSelectedTime(time);
                      }}
                      disabled={expired}
                      activeOpacity={expired ? 1 : 0.8}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
                        expired && styles.timeSlotTextExpired
                      ]}>{time}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Book Appointment Action */}
            <TouchableOpacity
              style={styles.bookAppointmentBtn}
              onPress={handleBookAppointment}
              activeOpacity={0.9}
            >
              <Text style={styles.bookAppointmentBtnText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>

          {/* Remove Connection button placed below card */}
          <TouchableOpacity
            style={styles.removeConnectionBtn}
            onPress={() => setRemoveModalVisible(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.removeConnectionBtnText}>Remove Connection</Text>
          </TouchableOpacity>
        </>
        ) : isPending ? (
          /* Stretched Pending Card */
          <View style={styles.schedulerCard}>
            <View style={styles.centeredActionWrapper}>
              <ShieldAlert size={40} color="#d97706" strokeWidth={2.5} style={{ marginBottom: 12 }} />
              <Text style={styles.schedulerSectionTitle}>Connection Pending</Text>
              <Text style={styles.stateExplainText}>
                Your connection request has been sent to Dr. {doctor.name}. Once accepted, you will be able to view their clinics and schedule appointments here.
              </Text>
              <TouchableOpacity
                style={styles.cancelRequestBtn}
                onPress={handleCancelRequest}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Text style={styles.cancelRequestBtnText}>Cancel Connection Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Stretched Unconnected Card */
          <View style={styles.schedulerCard}>
            <View style={styles.centeredActionWrapper}>
              <UserPlus size={40} color="#0d5c75" strokeWidth={2.5} style={{ marginBottom: 12 }} />
              <Text style={styles.schedulerSectionTitle}>Specialist Connection</Text>
              <Text style={styles.stateExplainText}>
                Connect with Dr. {doctor.name} to share your daily hernia symptom logs, daily diary updates, and surgical wound healing photos for active clinical monitoring.
              </Text>
              <TouchableOpacity
                style={styles.bookAppointmentBtn}
                onPress={handleConnect}
                disabled={isProcessing}
                activeOpacity={0.9}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.bookAppointmentBtnText}>Connect with Doctor</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modals */}
      <LocationModal
        visible={showAddressPopup}
        onClose={() => setShowAddressPopup(false)}
        address={doctor.hospitalAddress || doctor.address || 'HerniaCare General Clinic, Campus A'}
        hospitalName={doctor.place || 'HerniaCare Specialty Hospital'}
      />

      <RemoveConnectionModal
        visible={removeModalVisible}
        onClose={() => setRemoveModalVisible(false)}
        onConfirm={handleConfirmRemove}
        doctorName={doctor.name}
        isPending={isPending}
      />

      <BookAppointmentModal
        visible={bookModalVisible}
        onClose={() => setBookModalVisible(false)}
        onConfirm={handleConfirmBookAppointment}
        doctorName={doctor.name}
        dateStr={getFormattedSelectedDate()}
        timeStr={selectedTime}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingSafe: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0d5c75',
    marginTop: 12,
  },
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  plusCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 50,
  },

  // Avatar / Profile Header block
  avatarMainCol: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
  },
  doctorProfileImageContainer: {
    marginBottom: 16,
  },
  avatarPlaceholderCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#0d5c75',
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImageInside: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
  },
  bannerCenteredInfo: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
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

  // Call & Location mini action pill
  miniActionsRightWrapper: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  miniActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
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
  miniActionsMuted: {
    opacity: 0.5,
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

  // Stats Card Row
  statsCardRow: {
    flexDirection: 'row',
    backgroundColor: '#d1fae5',
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
    marginHorizontal: 20,
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

  // Scheduler Card
  schedulerCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  schedulerSection: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  schedulerSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },

  // Days Horizontal Scroll
  daysScroll: {
    paddingVertical: 4,
  },
  dayCard: {
    width: 60,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dayCardSelected: {
    backgroundColor: '#fef08a',
    borderWidth: 2.5,
  },
  dayCardToday: {
    borderColor: '#0d5c75',
  },
  dayCardExpired: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    opacity: 0.4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  dayTextSelected: {
    color: '#000000',
  },
  dayTextToday: {
    color: '#0d5c75',
  },
  dayTextExpired: {
    color: '#94a3b8',
  },

  // Time Slots Horizontal Scroll
  timeScroll: {
    paddingVertical: 4,
    gap: 10,
  },
  timeSlotBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotBtnSelected: {
    backgroundColor: '#000000',
  },
  timeSlotBtnExpired: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.35,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  timeSlotTextSelected: {
    color: '#ffffff',
  },
  timeSlotTextExpired: {
    color: '#94a3b8',
  },

  // Book Appointment Button
  bookAppointmentBtn: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  bookAppointmentBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Remove Connection Button
  removeConnectionBtn: {
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 24,
  },
  removeConnectionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },

  // State-based Unconnected/Pending cards contents
  centeredActionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  stateExplainText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelRequestBtn: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelRequestBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
});

// Modals styling (Consistent Neo-Brutalist)
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#000000',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
    marginBottom: 20,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    lineHeight: 18,
  },
  bodyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 20,
  },
  detailsContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    gap: 4,
  },
  detailsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  detailsVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  okBtn: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
