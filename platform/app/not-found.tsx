import Link from 'next/link';
import { Container, Button } from '@/components/ui';

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-sm font-medium text-brand-700">404</p>
      <h1 className="text-2xl font-semibold text-ink-900">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-500">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </Container>
  );
}
