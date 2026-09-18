import { z } from 'zod';

// Citizen Registration Validation Schema (matches backend Pydantic rules)
export const registrationSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Service Application Form Validation Schema
export const applicationFormSchema = z.object({
  service_id: z.string().min(1, 'Please select a government service'),
  citizen_name: z.string().min(2, 'Citizen name must be at least 2 characters'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  district: z.string().min(2, 'District is required'),
  annual_income: z.number().min(0, 'Annual income must be positive'),
  employment_status: z.enum(['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'FARMER', 'STUDENT', 'OTHER'], {
    message: 'Please select a valid employment category'
  })
});

export type ApplicationFormData = z.infer<typeof applicationFormSchema>;

// Resident Profile Update Validation Schema
export const residentProfileSchema = z.object({
  legal_name: z.string().min(2, 'Legal name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  gender: z.enum(['MALE', 'FEMALE', 'TRANSGENDER', 'OTHER']),
  marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
  community_caste: z.string().min(1, 'Caste category is required'),
  district: z.string().min(2, 'District is required'),
  full_address: z.string().min(5, 'Full address is required'),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format').optional().or(z.literal('')),
  bank_name: z.string().optional().or(z.literal('')),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format').optional().or(z.literal(''))
});

export type ResidentProfileFormData = z.infer<typeof residentProfileSchema>;

// Consent Decision Validation Schema
export const consentDecisionSchema = z.object({
  consent_id: z.string().min(1, 'Consent ID required'),
  decision: z.enum(['APPROVE', 'REJECT']),
  remarks: z.string().optional()
});

export type ConsentDecisionFormData = z.infer<typeof consentDecisionSchema>;
