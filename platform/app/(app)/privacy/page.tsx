import { LegalDocumentPage, legalDocumentMetadata } from '@/components/legal/LegalDocumentPage';

// Content and activation live in modules/legal (documents.ts, config.ts).
export function generateMetadata() {
  return legalDocumentMetadata('privacy');
}

export default function PrivacyPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <LegalDocumentPage id="privacy" searchParams={searchParams} />;
}
