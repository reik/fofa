import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: { VITE_API_URL: 'http://localhost:4000/api' },
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));
