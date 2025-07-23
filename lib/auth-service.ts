
  const userRecord = mockUsers.get(email.toLowerCase());

 
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string
): Promise<AuthUser> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (mockUsers.has(email.toLowerCase()))
    throw new Error('Email already in use.');
  if (password.length < 6)
    throw new Error('Password must be at least 6 characters.');

  const newUser: AuthUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase(),
    provider: 'email',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  mockUsers.set(email.toLowerCase(), {
    password: hashPassword(password),
    user: newUser,
  });

  return newUser;
};

// Sign Out
export const signOutUser = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log('✅ Mock sign-out successful');
};

// Get current user data
export const getCurrentUserData = async (
  userId: string
): Promise<AuthUser | null> => {
  for (const [, userRecord] of mockUsers.entries()) {
    if (userRecord.user.id === userId) {
      return userRecord.user;
    }
  }
  return null;
};
