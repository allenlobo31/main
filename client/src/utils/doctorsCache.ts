import apiClient from '../services/apiClient';
import { User } from '../types';

let cachedDoctors: User[] | null = null;
let lastFetchedTime = 0;
const CACHE_TTL = 30000; // 30 seconds cache TTL

export const getCachedDoctors = (): User[] | null => {
  return cachedDoctors;
};

export const fetchDoctorsCached = async (forceRefresh = false): Promise<User[]> => {
  const now = Date.now();
  if (cachedDoctors && !forceRefresh && (now - lastFetchedTime < CACHE_TTL)) {
    return cachedDoctors;
  }

  const res = await apiClient.get('/users/doctors');
  const normalized: User[] = res.data.map((d: any) => ({
    ...d,
    uid: d.uid || d.id || d._id,
  }));
  
  cachedDoctors = normalized;
  lastFetchedTime = Date.now();
  return normalized;
};
