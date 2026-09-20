import { describe, it, expect, vi, beforeEach } from 'vitest';

// Route-level tests for POST /api/account/locale: the real route + the real
// billing service, with only the outer boundaries (session, cookie, DB,
// Stripe) mocked.
const cookieStore = { value: undefined as string | undefined };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name: string) => (name === 'ptd_locale' && cookieStore.value ? { value: cookieStore.value } : undefined) }),
}));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(() => true) }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: vi.fn() } } }));

const stripeMock = {
  customers: { create: vi.fn(), retrieve: vi.fn(), update: vi.fn() },
};
vi.mock('@/lib/stripe', () => ({ getStripeClient: () => stripeMock }));

const { getServerSession } = await import('next-auth');
const { prisma } = await import('@/lib/prisma');
const { POST } = await import('@/app/api/account/locale/route');

function signIn() {
  (getServerSession as any).mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
}
function customerHas(locales: string[] | null) {
  (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: 'cus_1' });
  stripeMock.customers.retrieve.mockResolvedValue({ id: 'cus_1', preferred_locales: locales });
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.value = undefined;
});

describe('POST /api/account/locale', () => {
  it('switching bg -> en updates the existing customer from [bg] to [en]', async () => {
    signIn();
    cookieStore.value = 'en';
    customerHas(['bg']);

    const res = await POST();

    expect(res.status).toBe(200);
    expect(stripeMock.customers.update).toHaveBeenCalledWith('cus_1', { preferred_locales: ['en'] });
  });

  it('switching en -> bg updates the existing customer from [en] to [bg]', async () => {
    signIn();
    cookieStore.value = 'bg';
    customerHas(['en']);

    const res = await POST();

    expect(res.status).toBe(200);
    expect(stripeMock.customers.update).toHaveBeenCalledWith('cus_1', { preferred_locales: ['bg'] });
  });

  it('sends only preferred_locales, so other customer fields are untouched', async () => {
    signIn();
    cookieStore.value = 'bg';
    customerHas([]);

    await POST();

    expect(stripeMock.customers.update).toHaveBeenCalledTimes(1);
    const payload = stripeMock.customers.update.mock.calls[0][1];
    expect(Object.keys(payload)).toEqual(['preferred_locales']);
  });

  it.each([['bg'], ['en']])('does not call Stripe update when the customer already has [%s]', async (locale) => {
    signIn();
    cookieStore.value = locale;
    customerHas([locale]);

    const res = await POST();

    expect(res.status).toBe(200);
    expect(stripeMock.customers.update).not.toHaveBeenCalled();
  });

  it('does nothing (and creates no customer) for a user without a Stripe customer', async () => {
    signIn();
    cookieStore.value = 'en';
    (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: null });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(stripeMock.customers.create).not.toHaveBeenCalled();
    expect(stripeMock.customers.retrieve).not.toHaveBeenCalled();
    expect(stripeMock.customers.update).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request and never touches Stripe', async () => {
    (getServerSession as any).mockResolvedValue(null);
    cookieStore.value = 'en';

    const res = await POST();

    expect(res.status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(stripeMock.customers.update).not.toHaveBeenCalled();
  });

  it.each([['fr'], [''], [undefined]])('rejects an unsupported or missing locale cookie (%s)', async (value) => {
    signIn();
    cookieStore.value = value as string | undefined;

    const res = await POST();

    expect(res.status).toBe(400);
    expect(stripeMock.customers.update).not.toHaveBeenCalled();
  });

  it('a Stripe update failure does not break the language switch', async () => {
    signIn();
    cookieStore.value = 'en';
    customerHas(['bg']);
    stripeMock.customers.update.mockRejectedValue(new Error('stripe down'));

    const res = await POST();

    expect(res.status).toBe(200);
  });

  it('a Stripe retrieve failure does not break the language switch', async () => {
    signIn();
    cookieStore.value = 'en';
    (prisma.user.findUnique as any).mockResolvedValue({ stripeCustomerId: 'cus_1' });
    stripeMock.customers.retrieve.mockRejectedValue(new Error('stripe down'));

    const res = await POST();

    expect(res.status).toBe(200);
    expect(stripeMock.customers.update).not.toHaveBeenCalled();
  });
});
