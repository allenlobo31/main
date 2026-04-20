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
import { Phone } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doctorContactsCol, expertsCol, getDocs, query, orderBy } from '../../src/services/firebase/firestore';
import { ExpertCard } from '../../src/components/call/ExpertCard';
import { CallModal } from '../../src/components/call/CallModal';
import { useCall } from '../../src/hooks/useCall';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { DoctorContact, Expert } from '../../src/types';

export default function ExpertsScreen() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [doctorContacts, setDoctorContacts] = useState<DoctorContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [callingExpertId, setCallingExpertId] = useState<string | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const { horizontalPadding } = useResponsiveLayout();

  const { callState, startCall, endCall, agoraChannelName } = useCall();

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    setIsLoading(true);
    try {
      const expertsQuery = query(expertsCol() as never, orderBy('isOnline', 'desc'));
      const expertsSnap = await getDocs(expertsQuery);

      const expertData = expertsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expert, 'id'>) } as Expert));

      setExperts(expertData);

      try {
        const contactsSnap = await getDocs(doctorContactsCol() as never);
        const contactData = contactsSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<DoctorContact, 'id'>) } as DoctorContact))
          .filter((contact) => contact.isActive !== false && !!contact.phoneNumber && !!contact.name);
        setDoctorContacts(contactData);
      } catch (contactError) {
        console.error('[ExpertsScreen] doctorContacts fetch error:', contactError);
        setDoctorContacts([]);
      }
    } catch (error) {
      console.error('[ExpertsScreen] fetchExperts error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = async (expertId: string) => {
    setCallingExpertId(expertId);
    await startCall(expertId);
    setRemoteUid(experts.find((e) => e.id === expertId)?.agoraUid ?? null);
  };

  const handleEndCall = async () => {
    await endCall();
    setCallingExpertId(null);
    setRemoteUid(null);
  };

  const onlineExperts = experts.filter((e) => e.isOnline);
  const offlineExperts = experts.filter((e) => !e.isOnline);

  const handleDoctorPhoneCall = async (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;

    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (!canOpen) {
      Alert.alert('Call unavailable', `Please call ${phoneNumber} manually.`);
      return;
    }

    await Linking.openURL(phoneUrl);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Expert Connect</Text>
        <Text style={styles.subtitle}>
          {onlineExperts.length} specialist{onlineExperts.length !== 1 ? 's' : ''} online
        </Text>

        {doctorContacts.map((contact) => {
          const displayName = contact.name.trim();
          const initial = displayName.charAt(0).toUpperCase();

          return (
            <View key={contact.id} style={styles.quickDoctorCard}>
              <View style={styles.quickDoctorAvatar}>
                <Text style={styles.quickDoctorInitial}>{initial}</Text>
              </View>
              <View style={styles.quickDoctorInfo}>
                <Text style={styles.quickDoctorTitle}>Dr {displayName}</Text>
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
          );
        })}

        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {onlineExperts.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Available Now</Text>
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

            {offlineExperts.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Offline</Text>
                {offlineExperts.map((expert) => (
                  <ExpertCard
                    key={expert.id}
                    expert={expert}
                    onCallPress={() => {}}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Call Modal */}
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
  quickDoctorInitial: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  quickDoctorInfo: {
    flex: 1,
    minWidth: 0,
  },
  quickDoctorTitle: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  quickDoctorPhone: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  quickDoctorCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
  },
  sectionLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
});
