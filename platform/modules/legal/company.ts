// Operator details the legal documents refer to. EVERY VALUE IS DELIBERATELY
// UNSET: they must come from the owner, through the "Legal Information
// Request" document in KUKO_WAY_Legal_Documents/, and must never be guessed.
//
// Approved document text references these values as `{legalEntityName}`,
// `{contactEmail}`, ... instead of hard-coding them. A document that
// references a value still unset here can't become active
// (see legal.service.ts), so a missing fact never ships as an empty gap.
export interface CompanyInfo {
  legalEntityName: string | null; // [LEGAL ENTITY NAME]
  companyRegistrationNumber: string | null; // [COMPANY REGISTRATION NUMBER] (ЕИК)
  registeredAddress: string | null; // [REGISTERED ADDRESS]
  country: string | null; // [COUNTRY]
  contactEmail: string | null; // [CONTACT EMAIL]
  dpoContact: string | null; // [DPO CONTACT, IF APPLICABLE]
}

export type CompanyInfoKey = keyof CompanyInfo;

export const COMPANY_INFO: CompanyInfo = {
  legalEntityName: null,
  companyRegistrationNumber: null,
  registeredAddress: null,
  country: null,
  contactEmail: null,
  dpoContact: null,
};
