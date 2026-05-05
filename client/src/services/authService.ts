import apiClient, { setAuthToken } from './apiClient';
import { UserRole } from '../types';

export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}) {
  const response = await apiClient.post('/auth/register', params);
  const { token, user: rawUser } = response.data;
  const user = { ...rawUser, uid: rawUser.uid || rawUser.id || rawUser._id };
  setAuthToken(token);
  return { user, token };
}

export async function loginUser(params: {
  email: string;
  password: string;
}) {
  const response = await apiClient.post('/auth/login', params);
  const { token, user: rawUser } = response.data;
  const user = { ...rawUser, uid: rawUser.uid || rawUser.id || rawUser._id };
  setAuthToken(token);
  return { user, token };
}

export async function logoutUser() {
  setAuthToken(null);
}

export async function fetchUserRole(uid: string) {
  const response = await apiClient.get('/users/me');
  return response.data.role;
}