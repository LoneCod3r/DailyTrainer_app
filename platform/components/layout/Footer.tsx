import { Container } from '@/components/ui';

export function Footer({ appName }: { appName: string }) {
  return (
    <footer className="mt-24 border-t border-sand-200 bg-sand-50">
      <Container className="flex flex-col items-center justify-between gap-4 py-10 text-sm text-ink-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </p>
        <p className="text-xs text-ink-300">An independent platform · not affiliated with any third-party product.</p>
      </Container>
    </footer>
  );
}
