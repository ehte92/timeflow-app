// Mock NextAuth React for Jest tests
export const useSession = jest.fn(() => ({
  data: null,
  status: "unauthenticated",
}));

export const signIn = jest.fn();
export const signOut = jest.fn();

export const SessionProvider = ({ children }) => {
  return children;
};
