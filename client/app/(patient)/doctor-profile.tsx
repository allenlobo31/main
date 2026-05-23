import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  Building,
  UserPlus,
  Check,
  X,
  ShieldAlert,
  UserCheck,
  Award,
} from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/constants/theme';
import { User } from '../../src/types';

export default function DoctorProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const doctorId = params.doctorId as string;

  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [doctor, setDoctor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Determine current connection state
  const isLinked = useMemo(() => {
    if (!doctor || !user) return false;
    return (user.linkedDoctorIds || []).includes(doctor.uid);
  }, [doctor, user]);

  const isPending = useMemo(() => {
    if (!doctor || !user) return false;
    return (user.pendingDoctorIds || []).includes(doctor.uid);
  }, [doctor, user]);

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
              // Refresh user profile
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
    Alert.alert(
      'Cancel Connection Request? ⚠️',
      `Are you sure you want to cancel your pending connection request to Dr. ${doctor.name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await apiClient.post('/users/remove-doctor/' + doctor.uid);
              Alert.alert(
                'Cancelled 🛑',
                `Connection request to Dr. ${doctor.name} has been cancelled.`
              );
              // Refresh user profile
              const meRes = await apiClient.get('/users/me');
              updateProfile(meRes.data);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel request. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [doctor, updateProfile]);

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ChevronLeft size={22} color="#0f172a" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {doctor.avatarUrl ? (
                <Image source={{ uri: doctor.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(doctor.name)}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, doctor.isActive ? styles.statusActive : styles.statusOffline]}>
              <Text style={styles.statusBadgeText}>
                {doctor.isActive ? 'Active' : 'Offline'}
              </Text>
            </View>
          </View>

          <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.specialtyBadge}>
              <Award size={12} color="#0f172a" strokeWidth={2.5} style={{ marginRight: 4 }} />
              <Text style={styles.specialtyText}>Hernia Specialist</Text>
            </View>
            {doctor.experience && (
              <View style={styles.experienceBadge}>
                <Clock size={12} color="#0f172a" strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.experienceText}>{doctor.experience} Exp</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Award size={20} color="#0d5c75" strokeWidth={2.2} />
            <Text style={styles.statVal}>{doctor.experience || '8 Years'}</Text>
            <Text style={styles.statLbl}>Experience</Text>
          </View>

          <View style={styles.statCard}>
            <Phone size={20} color={doctor.isActive ? '#059669' : '#d97706'} strokeWidth={2.2} />
            <Text style={[styles.statVal, { color: doctor.isActive ? '#059669' : '#d97706' }]}>
              {doctor.isActive ? 'Available' : 'Muted'}
            </Text>
            <Text style={styles.statLbl}>Call Status</Text>
          </View>

          <View style={styles.statCard}>
            <Building size={20} color={doctor.availableAtHospital ? '#059669' : '#64748b'} strokeWidth={2.2} />
            <Text style={[styles.statVal, { color: doctor.availableAtHospital ? '#059669' : '#64748b' }]}>
              {doctor.availableAtHospital ? 'Open' : 'Closed'}
            </Text>
            <Text style={styles.statLbl}>Hospital Visit</Text>
          </View>
        </View>

        {/* Professional Details Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Clinic & Professional Info</Text>

          <View style={styles.detailRow}>
            <MapPin size={18} color="#475569" strokeWidth={2} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Hospital Address</Text>
              <Text style={styles.detailValue}>
                {doctor.hospitalAddress || doctor.address || 'HerniaCare General Clinic, Main Health Avenue'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Building size={18} color="#475569" strokeWidth={2} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Clinic / Place</Text>
              <Text style={styles.detailValue}>{doctor.place || 'Hernia Specialty Block A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Mail size={18} color="#475569" strokeWidth={2} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text
                style={[styles.detailValue, { textDecorationLine: 'underline' }]}
                onPress={() => Linking.openURL(`mailto:${doctor.email}`)}
              >
                {doctor.email || 'info@herniacare.com'}
              </Text>
            </View>
          </View>

          {doctor.phoneNumber && (
            <View style={styles.detailRow}>
              <Phone size={18} color="#475569" strokeWidth={2} />
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text
                  style={[styles.detailValue, isLinked && { textDecorationLine: 'underline', color: '#0d5c75', fontWeight: '800' }]}
                  onPress={() => {
                    if (isLinked) {
                      Linking.openURL(`tel:${doctor.phoneNumber}`);
                    } else {
                      Alert.alert('Connection Required', 'Connect with the doctor to call them directly.');
                    }
                  }}
                >
                  {isLinked ? doctor.phoneNumber : '•••••••••• (Connect to view)'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Panel */}
        <View style={styles.actionPanel}>
          {isLinked ? (
            <View style={styles.connectedCard}>
              <View style={styles.connectedHeader}>
                <UserCheck size={22} color="#059669" strokeWidth={2.5} />
                <Text style={styles.connectedTitle}>Connected Specialist</Text>
              </View>
              <Text style={styles.connectedSubtitle}>
                Dr. {doctor.name} is monitoring your patient records. You can make calls and schedule appointments through your Experts dashboard.
              </Text>
              <View style={styles.connectedActions}>
                <TouchableOpacity
                  style={styles.callActionButton}
                  onPress={() => {
                    if (doctor.phoneNumber) {
                      Linking.openURL(`tel:${doctor.phoneNumber}`);
                    } else {
                      Alert.alert('Error', 'Doctor phone number not available.');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Phone size={16} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={styles.callActionButtonText}>Call Doctor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToDashboardButton}
                  onPress={() => router.push('/(patient)/experts')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backToDashboardText}>Go to Experts</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isPending ? (
            <View style={styles.pendingCard}>
              <View style={styles.pendingHeader}>
                <ShieldAlert size={22} color="#d97706" strokeWidth={2.5} />
                <Text style={styles.pendingTitle}>Connection Pending</Text>
              </View>
              <Text style={styles.pendingSubtitle}>
                Your connection request has been sent. Once accepted, Dr. {doctor.name} will be added to your active specialists.
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
                  <>
                    <X size={16} color="#dc2626" strokeWidth={2.5} style={{ marginRight: 6 }} />
                    <Text style={styles.cancelRequestBtnText}>Cancel Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.connectMainBtn}
              onPress={handleConnect}
              disabled={isProcessing}
              activeOpacity={0.9}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <UserPlus size={20} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 8 }} />
                  <Text style={styles.connectMainBtnText}>Connect with Doctor</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingSafe: {
    flex: 1,
    backgroundColor: '#fef9c3',
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
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },

  // Profile Header Card
  profileCard: {
    backgroundColor: '#fef9c3',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0d5c75',
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  statusActive: {
    backgroundColor: '#86efac',
  },
  statusOffline: {
    backgroundColor: '#cbd5e1',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
    textTransform: 'uppercase',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  specialtyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  experienceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },

  // Stats Grid Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fefcd0',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    textAlign: 'center',
  },
  statLbl: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },

  // Professional Details Card
  detailsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
    lineHeight: 20,
  },

  // Action Panel
  actionPanel: {
    marginBottom: 10,
  },
  connectMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  connectMainBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Pending State Card
  pendingCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#d97706',
  },
  pendingSubtitle: {
    fontSize: 13,
    color: '#78350f',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 14,
  },
  cancelRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 10,
  },
  cancelRequestBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },

  // Connected State Card
  connectedCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  connectedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  connectedSubtitle: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 14,
  },
  connectedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
  },
  callActionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  backToDashboardButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
  },
  backToDashboardText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
});
