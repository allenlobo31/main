import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, UserPlus, Info } from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/constants/theme';
import { User } from '../../src/types';

export default function ConnectDoctorScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [doctors, setDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const docsRes = await apiClient.get('/users/doctors');
      const normalized: User[] = docsRes.data.map((d: any) => ({
        ...d,
        uid: d.uid || d.id || d._id,
      }));
      setDoctors(normalized);
    } catch (error) {
      console.error('[ConnectDoctorScreen] fetchDoctors error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Filter out already linked and pending doctors
  const availableDoctors = useMemo(() => {
    const linkedIds = user?.linkedDoctorIds || [];
    const pendingIds = user?.pendingDoctorIds || [];
    return doctors.filter(
      (d) => !linkedIds.includes(d.uid) && !pendingIds.includes(d.uid)
    );
  }, [doctors, user?.linkedDoctorIds, user?.pendingDoctorIds]);

  // Apply search filter (case-insensitive, partial match on name or phone)
  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableDoctors;
    return availableDoctors.filter((d) => {
      const nameMatch = (d.name ?? '').toLowerCase().includes(q);
      const phoneMatch = (d.phoneNumber ?? '').toLowerCase().includes(q);
      return nameMatch || phoneMatch;
    });
  }, [availableDoctors, searchQuery]);

  const onApplyToDoctor = useCallback(
    async (doctorId: string) => {
      if (!user?.uid) return;
      setIsApplying(doctorId);
      try {
        await apiClient.post('/users/apply/' + doctorId);
        Alert.alert(
          'Request Sent 📩',
          'Your connection request has been sent successfully. The doctor will review your profile shortly.'
        );
        // Refresh user profile to update linked/pending lists
        const meRes = await apiClient.get('/users/me');
        updateProfile(meRes.data);
      } catch (error) {
        Alert.alert('Error', 'Could not send request. Please try again.');
      } finally {
        setIsApplying(null);
      }
    },
    [user?.uid, updateProfile]
  );

  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  const renderDoctorCard = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => router.push({ pathname: '/(patient)/doctor-profile', params: { doctorId: item.uid } })}
      activeOpacity={0.8}
    >
      <View style={styles.doctorRow}>
        {/* Avatar */}
        <View style={styles.avatarCircle}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
          )}
        </View>

        {/* Doctor Info */}
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName} numberOfLines={1}>
            Dr. {item.name}
          </Text>
          <Text style={styles.doctorSpecialty}>Hernia Specialist</Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#0d5c75', marginTop: 4 }}>
            View Profile →
          </Text>
        </View>

        {/* Connect Button */}
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={(e) => {
            e.stopPropagation(); // prevent card tap navigation
            onApplyToDoctor(item.uid);
          }}
          disabled={isApplying !== null}
          activeOpacity={0.9}
        >
          {isApplying === item.uid ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.connectBtnText}>Connect</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Info size={40} color="#94a3b8" strokeWidth={2} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery.trim() ? 'No Doctors Found' : 'No Doctors Available'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery.trim()
          ? 'No doctors match your search. Try a different name or phone number.'
          : 'There are no new doctors to connect with at the moment. Please check back later.'}
      </Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Find Doctors</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" strokeWidth={2.5} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d5c75" />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.uid}
          renderItem={renderDoctorCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
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

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    paddingVertical: 0,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Doctor Card
  doctorCard: {
    backgroundColor: '#fef9c3',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  // Avatar
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0d5c75',
    borderWidth: 2,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Doctor Info
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  doctorSpecialty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },

  // Connect Button
  connectBtn: {
    backgroundColor: '#0d5c75',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  connectBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
