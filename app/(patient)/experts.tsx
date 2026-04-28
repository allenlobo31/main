import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Phone, Building2, UserPlus, Check } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  doctorContactsCol, 
  expertsCol, 
  getDocs, 
  query, 
  orderBy, 
  usersCol, 
  where,
  updateDoc,
  userDoc,
  arrayUnion,
  arrayRemove
} from '../../src/services/firebase/firestore';
import { ExpertCard } from '../../src/components/call/ExpertCard';
import { CallModal } from '../../src/components/call/CallModal';
import { useCall } from '../../src/hooks/useCall';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { useAuthStore } from '../../src/store/authStore';
import { DoctorContact, Expert, User } from '../../src/types';
import { Avatar } from '../../src/components/ui/Avatar';

export default function ExpertsScreen() {
  const { user } = useAuthStore();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [doctorContacts, setDoctorContacts] = useState<DoctorContact[]>([]);
  const [appDoctors, setAppDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [callingExpertId, setCallingExpertId] = useState<string | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const { horizontalPadding } = useResponsiveLayout();

  const { callState, startCall, endCall, agoraChannelName } = useCall();

  useEffect(() => {
    fetchData();
  }, [user?.pendingDoctorIds, user?.linkedDoctorIds]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch AI Experts (Call placeholders)
      const expertsQuery = query(expertsCol() as never, orderBy('isOnline', 'desc'));
      const expertsSnap = await getDocs(expertsQuery);
      const expertData = expertsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expert, 'id'>) } as Expert));
      setExperts(expertData);

      // 2. Fetch Fixed Contacts (Legacy)
      try {
        const contactsSnap = await getDocs(doctorContactsCol() as never);
        const contactData = contactsSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<DoctorContact, 'id'>) } as DoctorContact))
          .filter((contact) => contact.isActive !== false && !!contact.phoneNumber && !!contact.name);
        setDoctorContacts(contactData);
      } catch (contactError) {
        setDoctorContacts([]);
      }

      // 3. Fetch Registered App Doctors
      const doctorsQuery = query(usersCol() as never, where('role', '==', 'doctor'));
      const doctorsSnap = await getDocs(doctorsQuery);
      const doctorsData = doctorsSnap.docs.map(d => d.data() as User);
      setAppDoctors(doctorsData);

    } catch (error) {
      console.error('[ExpertsScreen] fetchData error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onApplyToDoctor = async (doctorId: string) => {
    if (!user?.uid) return;
    setIsApplying(doctorId);
    try {
      // Add doctor to patient's pending list
      await updateDoc(userDoc(user.uid), {
        pendingDoctorIds: arrayUnion(doctorId)
      });
      // Add patient to doctor's pending list (applicant)
      await updateDoc(userDoc(doctorId), {
        pendingPatientIds: arrayUnion(user.uid)
      });
      Alert.alert('Success', 'Application sent to the doctor.');
      // Update local store/state if needed, though useAuthStore might need a refresh logic
    } catch (error) {
      Alert.alert('Error', 'Could not send application');
    } finally {
      setIsApplying(null);
    }
  };

  const handleCall = async (expertId: string) => {
    setCallingExpertId(expertId);
    await startCall(expertId);
    setRemoteUid(experts.find((e) => e.id === expertId)?.agoraUid ?? null);
  };

  const handleDoctorPhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEndCall = async () => {
    await endCall();
    setCallingExpertId(null);
    setRemoteUid(null);
  };

  const onRemoveDoctor = async (doctorId: string) => {
    if (!user?.uid) return;
    Alert.alert(
      'Remove Doctor',
      'Are you sure you want to decouple from this doctor?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(userDoc(user.uid), {
                linkedDoctorIds: arrayRemove(doctorId)
              });
              await updateDoc(userDoc(doctorId), {
                linkedPatientIds: arrayRemove(user.uid)
              });
              Alert.alert('Success', 'Doctor removed.');
            } catch (error) {
              Alert.alert('Error', 'Could not remove doctor');
            }
          }
        }
      ]
    );
  };

  const linkedDoctors = appDoctors.filter(d => user?.linkedDoctorIds?.includes(d.uid));
  const otherDoctors = appDoctors.filter(d => !user?.linkedDoctorIds?.includes(d.uid));
  const onlineExperts = experts.filter((e) => e.isOnline);
  const offlineExperts = experts.filter((e) => !e.isOnline);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Expert Connect</Text>
        <Text style={styles.subtitle}>
          {linkedDoctors.length > 0 ? 'Your care team and available specialists' : 'Find specialists and manage your applications'}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {linkedDoctors.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Your Assigned Doctors</Text>
                {linkedDoctors.map((doc) => (
                  <View key={doc.uid} style={[styles.doctorCard, styles.linkedDoctorCard]}>
                    <Avatar name={doc.name} size={60} />
                    <View style={styles.doctorInfo}>
                      <Text style={[styles.doctorName, { fontSize: 18 }]}>Dr. {doc.name}</Text>
                      <View style={styles.doctorStatusRow}>
                        <View style={[styles.statusIndicator, { backgroundColor: doc.isActive ? '#10b981' : '#94a3b8' }]} />
                        <Text style={styles.doctorStatus}>{doc.isActive ? 'Active Now' : 'Offline'}</Text>
                      </View>
                      {doc.hospitalAddress && (
                        <View style={styles.locationRow}>
                          <Building2 size={13} color={theme.colors.textMuted} />
                          <Text style={styles.locationText}>{doc.hospitalAddress}</Text>
                        </View>
                      )}
                      {doc.phoneNumber && (
                        <TouchableOpacity 
                          style={styles.contactRow}
                          onPress={() => handleDoctorPhoneCall(doc.phoneNumber!)}
                        >
                          <Phone size={13} color={theme.colors.primary} />
                          <Text style={styles.contactText}>{doc.phoneNumber}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.removeBtn}
                      onPress={() => onRemoveDoctor(doc.uid)}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            <Text style={styles.sectionLabel}>{linkedDoctors.length > 0 ? 'Other Specialists' : 'Registered Doctors'}</Text>
            {otherDoctors.map((doc) => {
              const isPending = user?.pendingDoctorIds?.includes(doc.uid);
              const isLinked = user?.linkedDoctorIds?.includes(doc.uid);

              return (
                <View key={doc.uid} style={styles.doctorCard}>
                  <Avatar name={doc.name} size={50} />
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>Dr. {doc.name}</Text>
                    <View style={styles.doctorStatusRow}>
                      <View style={[styles.statusIndicator, { backgroundColor: doc.isActive ? '#10b981' : '#94a3b8' }]} />
                      <Text style={styles.doctorStatus}>{doc.isActive ? 'Active Now' : 'Offline'}</Text>
                    </View>
                    {doc.hospitalAddress && (
                      <View style={styles.locationRow}>
                        <Building2 size={12} color={theme.colors.textMuted} />
                        <Text style={styles.locationText} numberOfLines={1}>{doc.hospitalAddress}</Text>
                      </View>
                    )}
                  </View>
                  
                  {isLinked ? (
                    <View style={styles.linkedBadge}>
                      <Check size={16} color="#059669" />
                      <Text style={styles.linkedText}>My Doctor</Text>
                    </View>
                  ) : isPending ? (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.applyBtn}
                      onPress={() => onApplyToDoctor(doc.uid)}
                      disabled={isApplying === doc.uid}
                    >
                      {isApplying === doc.uid ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <UserPlus size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {doctorContacts.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>General Contacts</Text>
                {doctorContacts.map((contact) => (
                  <View key={contact.id} style={styles.quickDoctorCard}>
                    <View style={styles.quickDoctorAvatar}>
                      <Text style={styles.quickDoctorInitial}>{contact.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.quickDoctorInfo}>
                      <Text style={styles.quickDoctorTitle}>Dr {contact.name}</Text>
                      <Text style={styles.quickDoctorPhone}>{contact.phoneNumber}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.quickDoctorCallBtn}
                      activeOpacity={0.8}
                      onPress={() => handleDoctorPhoneCall(contact.phoneNumber)}
                    >
                      <Phone size={18} color="#ffffff" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {onlineExperts.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Available AI Experts</Text>
                {onlineExperts.map((expert) => (
                  <ExpertCard
                    key={expert.id}
                    expert={expert}
                    onCallPress={() => handleCall(expert.id)}
                    isCallLoading={callingExpertId === expert.id && callState === 'connecting'}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <CallModal
        visible={callState !== 'idle'}
        callState={callState}
        localUid={0}
        remoteUid={remoteUid}
        onEndCall={handleEndCall}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: 4 },
  subtitle: { ...theme.typography.body, color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
  linkedDoctorCard: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    paddingVertical: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  removeText: {
    ...theme.typography.caption,
    color: '#ef4444',
    fontWeight: '700',
  },
  sectionLabel: { 
    ...theme.typography.caption, 
    color: theme.colors.textMuted, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginTop: theme.spacing.xl, 
    marginBottom: theme.spacing.sm 
  },
  doctorCard: {
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
  doctorInfo: { flex: 1 },
  doctorName: { ...theme.typography.body, fontWeight: '700', color: theme.colors.textPrimary },
  doctorStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  doctorStatus: { ...theme.typography.caption, color: theme.colors.textSecondary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { ...theme.typography.caption, color: theme.colors.textMuted, flex: 1 },
  applyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingText: { ...theme.typography.caption, color: '#64748b', fontWeight: '600' },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  linkedText: { ...theme.typography.caption, color: '#059669', fontWeight: '600' },
  quickDoctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  quickDoctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDoctorInitial: { ...theme.typography.h3, color: theme.colors.textPrimary, fontWeight: '700' },
  quickDoctorInfo: { flex: 1 },
  quickDoctorTitle: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '600' },
  quickDoctorPhone: { ...theme.typography.caption, color: theme.colors.textMuted },
  quickDoctorCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
