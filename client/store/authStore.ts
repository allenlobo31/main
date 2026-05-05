import create from 'zustand';

export interface AuthState {
  isLoggedIn: boolean;
  profileSetupCompleted: boolean;
}

export interface AuthActions {
  setProfileSetupCompleted: (completed: boolean) => void;
}

const initialState: AuthState = {
  isLoggedIn: false,
  profileSetupCompleted: false,
};

const authStore = create<AuthState & AuthActions>((set) => ({
  isLoggedIn: initialState.isLoggedIn,
  profileSetupCompleted: initialState.profileSetupCompleted,
  setProfileSetupCompleted: (completed: boolean) => set({ profileSetupCompleted: completed }),
}));

export const useAuthStore = authStore;

export { AuthState, AuthActions };