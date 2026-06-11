import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import {
  UserPlus,
  Clock,
  X,
  ShieldAlert,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import apiClient from '../../src/services/apiClient';
import { theme } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { User } from '../../src/types';
import { useLanguageStore } from '../../src/store/languageStore';
import { fetchDoctorsCached, getCachedDoctors } from '../../src/utils/doctorsCache';

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

export default function ExpertsScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const user = useAuthStore(state => state.user);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const [appDoctors, setAppDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Confirmation Modals States
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [cancelTargetDoc, setCancelTargetDoc] = useState<User | null>(null);

  const fetchData = useCallback(async (showLoader = true) => {
    const cached = getCachedDoctors();
    if (cached && cached.length > 0) {
      setAppDoctors(cached);
      setIsLoading(false);
      showLoader = false;
    }

    if (showLoader) {
      setIsLoading(true);
    }
    try {
      // 1. Refresh my own profile to get latest linkedDoctorIds/pendingDoctorIds
      const meRes = await apiClient.get('/users/me');
      updateProfile(meRes.data);

      // 2. Fetch all doctors
      const doctorsList = await fetchDoctorsCached();
      setAppDoctors(doctorsList);
    } catch (error) {
      console.error('[ExpertsScreen] fetchData error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateProfile]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false); // background refresh
    }, 30000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [fetchData]);

  const handleConfirmCancelPending = async () => {
    setRemoveModalVisible(false);
    if (!cancelTargetDoc) return;
    try {
      await apiClient.post(`/users/remove-doctor/${cancelTargetDoc.uid}`);
      fetchData(false);
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

  const isLinkedSync = !!(user?.linkedDoctorIds && user.linkedDoctorIds.length > 0);
  const isPendingSync = !isLinkedSync && !!(user?.pendingDoctorIds && user.pendingDoctorIds.length > 0);

  const isLinked = isLinkedSync || linkedDoctors.length > 0;
  const isPending = isPendingSync || pendingDoctors.length > 0;

  const isFocused = useIsFocused();

  // Automatically redirect to doctor profile when active/connected
  useEffect(() => {
    if (isFocused && isLinkedSync && user?.linkedDoctorIds?.[0]) {
      router.replace({
        pathname: '/(patient)/doctor-profile',
        params: { doctorId: user.linkedDoctorIds[0] }
      });
    }
  }, [isFocused, isLinkedSync, user?.linkedDoctorIds]);

  // Redirect instantly if linked to avoid rendering Connect Placeholder or loaders
  if (isLinkedSync) {
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

  // If loading and we have no cached doctors, show loading spinner
  if (isLoading && appDoctors.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingArea}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // If not connected and not pending, display the clean Connect Placeholder screen only
  if (!isLinked && !isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.placeholderWrapper}>
          <View style={styles.placeholderCard}>
            <View style={styles.placeholderIconContainer}>
              <UserPlus size={40} color="#0d5c75" strokeWidth={2.5} />
            </View>
            <Text style={styles.placeholderTitle}>{t('experts.connectWithSpecialist')}</Text>
            <Text style={styles.placeholderSubtitle}>
              {t('experts.connectWithSpecialistDesc')}
            </Text>
            
            <TouchableOpacity
              style={styles.placeholderBtn}
              onPress={() => router.push('/(patient)/connect-doctor')}
              activeOpacity={0.9}
            >
              <Text style={styles.placeholderBtnText}>{t('experts.connectWithDoctorBtn')}</Text>
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
              onRefresh={() => fetchData(false)}
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
              <Text style={styles.placeholderTitle}>{t('experts.requestsPending')}</Text>
              <Text style={styles.placeholderSubtitle}>
                {t('experts.requestsPendingDesc')}
              </Text>
            </View>
          </View>

          {/* List of Pending Requests */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>
              {t('experts.pendingRequestsLabel', { count: pendingDoctors.length })}
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
                      <Text style={{ fontSize: 11, color: '#d97706', fontWeight: '700', marginLeft: 4 }}>{t('common.pending')}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={[doctorListStyles.connectBtn, { backgroundColor: '#ffffff' }]}
                    onPress={() => router.push({ pathname: '/(patient)/doctor-profile', params: { doctorId: pendDoc.uid } })}
                    activeOpacity={0.9}
                  >
                    <Text style={[doctorListStyles.connectBtnText, { color: '#0f172a' }]}>{t('experts.profileBtn')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[doctorListStyles.connectBtn, { backgroundColor: '#fef08a' }]}
                    onPress={() => {
                      setRemoveModalVisible(true);
                      setCancelTargetDoc(pendDoc);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[doctorListStyles.connectBtnText, { color: '#92400e' }]}>{t('common.cancel')}</Text>
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
              <Text style={styles.placeholderBtnText}>{t('experts.connectWithDoctorBtn')}</Text>
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
  placeholderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  placeholderCard: {
    backgroundColor: '#fef9c3',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  placeholderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  placeholderBtn: {
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  placeholderBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  loadingArea: {
    paddingVertical: 100,
    alignItems: 'center',
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
});

const doctorListStyles = StyleSheet.create({
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
