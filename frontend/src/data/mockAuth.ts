// Mock authentication data stored in localStorage

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'customer';
}

export const mockLogin = (email: string, password: string): { user: MockUser | null; error: string | null } => {
  // Admin emails - add more as needed
  const adminEmails = ['admin@test.com', 'akshaynanvatkark@gmail.com'];
  
  // Use email as consistent user ID to maintain affiliate data across sessions
  const userId = email.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  if (adminEmails.includes(email.toLowerCase()) && password.length >= 6) {
    const user: MockUser = {
      id: userId,
      email: email,
      full_name: email === 'akshaynanvatkark@gmail.com' ? 'Akshay Nanvatkar (Owner)' : 'Admin User',
      role: 'admin'
    };
    localStorage.setItem('mockUser', JSON.stringify(user));
    return { user, error: null };
  } else if (password.length >= 6) {
    const user: MockUser = {
      id: userId,
      email: email,
      full_name: email.split('@')[0],
      role: 'customer'
    };
    localStorage.setItem('mockUser', JSON.stringify(user));
    return { user, error: null };
  }
  
  return { user: null, error: 'Invalid credentials' };
};

export const mockSignup = (email: string, password: string, fullName: string): { user: MockUser | null; error: string | null } => {
  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters' };
  }
  
  // Use email as consistent user ID to maintain affiliate data across sessions
  const userId = email.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const user: MockUser = {
    id: userId,
    email: email,
    full_name: fullName,
    role: 'customer'
  };
  localStorage.setItem('mockUser', JSON.stringify(user));
  return { user, error: null };
};

export const mockLogout = () => {
  localStorage.removeItem('mockUser');
};

export const getCurrentMockUser = (): MockUser | null => {
  const userStr = localStorage.getItem('mockUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};