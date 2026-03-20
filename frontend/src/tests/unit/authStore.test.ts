import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../contexts/authStore';
import { User } from '../../types';

const mockUser: User = {
  id: 'u1', email: 'test@example.com', name: 'Jane Smith',
  city: 'Los Angeles', state: 'CA', thumbnail: null,
  verified: true, created_at: new Date().toISOString(),
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it('starts with no user or token', () => {
    const { user, token } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
  });

  it('setAuth sets user and token', () => {
    useAuthStore.getState().setAuth(mockUser, 'tok123');
    const { user, token } = useAuthStore.getState();
    expect(user?.email).toBe('test@example.com');
    expect(token).toBe('tok123');
  });

  it('logout clears user and token', () => {
    useAuthStore.getState().setAuth(mockUser, 'tok123');
    useAuthStore.getState().logout();
    const { user, token } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
  });

  it('updateUser merges partial updates', () => {
    useAuthStore.getState().setAuth(mockUser, 'tok123');
    useAuthStore.getState().updateUser({ city: 'San Francisco', state: 'CA' });
    const { user } = useAuthStore.getState();
    expect(user?.city).toBe('San Francisco');
    expect(user?.name).toBe('Jane Smith'); // unchanged
  });
});
