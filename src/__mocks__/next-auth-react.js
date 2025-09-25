// Mock NextAuth React for Jest tests
const mockSession = {
  user: {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
  },
  expires: "2025-12-31",
};

export const useSession = jest.fn(() => ({
  data: mockSession,
  status: "authenticated",
  update: jest.fn(),
}));

export const signIn = jest.fn();
export const signOut = jest.fn();

export const SessionProvider = ({ children }) => {
  return children;
};
