// Content validation for each document type (plan section 7.7).
import { z } from 'zod';

const MAX_FIELD = 100;
export const MAX_DOCUMENT_BYTES = 32 * 1024;
export const MAX_PEOPLE = 50;

const field = z.string().max(MAX_FIELD);
const checked = z.object({ checked: z.array(field).max(MAX_FIELD) }).strict();

export const DOCUMENT_SCHEMAS = {
  home: z
    .object({
      homeType: field,
      floor: field,
      streetAccess: field,
      stairs: field,
      elevator: field,
      emergencyExit: field,
      evacuationRoute: field,
      meetingPoint: field,
    })
    .strict(),
  contacts: z
    .object({
      people: z
        .array(z.object({ name: field, relationship: field, phone: field }).strict())
        .max(MAX_PEOPLE),
    })
    .strict(),
  kit: checked,
  firstAidKit: checked,
  checklist: checked,
  preferences: z.object({ language: z.enum(['es', 'en']), shareDiscount: z.boolean() }).strict(),
} as const;

export type DocumentType = keyof typeof DOCUMENT_SCHEMAS;

export function isDocumentType(value: string): value is DocumentType {
  return Object.hasOwn(DOCUMENT_SCHEMAS, value);
}

export const putDocumentBody = z
  .object({
    content: z.unknown(),
    updatedAt: z.number().int().nonnegative(),
    /** Version the client edited; 0 = the document did not exist on the server yet. */
    baseVersion: z.number().int().nonnegative(),
  })
  .strict();

export const consentBody = z.object({ policyVersion: z.string().min(1).max(MAX_FIELD) }).strict();
