import { LegalDocumentPage, legalDocumentMetadata } from '@/components/legal/LegalDocumentPage';

// Content and activation live in modules/legal (documents.ts, config.ts).
export function generateMetadata() {
  return legalDocumentMetadata('terms');
}

export default function TermsPage() {
  return <LegalDocumentPage id="terms" />;
}
