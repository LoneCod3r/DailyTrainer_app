import { LegalDocumentPage, legalDocumentMetadata } from '@/components/legal/LegalDocumentPage';

// Content and activation live in modules/legal (documents.ts, config.ts).
export function generateMetadata() {
  return legalDocumentMetadata('privacy');
}

export default function PrivacyPage() {
  return <LegalDocumentPage id="privacy" />;
}
