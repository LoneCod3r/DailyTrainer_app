import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import { type RegisterInput } from '@/lib/validations/auth';

const log = createLogger('auth.service');
const SALT_ROUNDS = 12;

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Errors.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      profile: { create: {} },
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  log.info('user registered', { userId: user.id });
  return user;
}
