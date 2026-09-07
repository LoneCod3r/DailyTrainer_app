import type { Role, UserStatus } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

// Augments NextAuth's built-in types with our app-specific fields so
// `session.user.role` etc. are strongly typed everywhere they're used.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      emailVerified: Date | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: Role;
    status: UserStatus;
    emailVerified: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
    emailVerified: Date | null;
  }
}
