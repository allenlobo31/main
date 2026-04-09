import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, expertsCol, getDocs, query, orderBy } from '../../src/services/firebase/firestore';
import { ExpertCard } from '../../src/components/call/ExpertCard';
import { CallModal } from '../../src/components/call/CallModal';
import { useCall } from '../../src/hooks/useCall';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { Expert } from '../../src/types';

export default function ExpertsScreen() {
  const [experts, setExperts] = useState<Expert[]>([]);
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
      const q = query(expertsCol() as never, orderBy('isOnline', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expert, 'id'>) } as Expert));
      setExperts(data);
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
  sectionLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
});
