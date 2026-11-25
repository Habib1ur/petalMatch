import { z } from "zod";

/**
 * Strip control characters, angle brackets, and collapse excessive whitespace
 * to prevent XSS and keep stored names clean.
 */
export function sanitizeTextInput(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F<>]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

const nameFieldSchema = z
  .string()
  .transform(sanitizeTextInput)
  .pipe(
    z
      .string()
      .min(1, "Please enter a name")
      .max(60, "Name must be 60 characters or fewer")
      .refine(
        (val) => /[\p{L}\p{N}]/u.test(val),
        "Name must contain at least one letter or number"
      )
  );

export const submissionSchema = z.object({
  participantName: nameFieldSchema,
  crushName: nameFieldSchema,
  slug: z
    .string()
    .trim()
    .min(1, "Invalid link")
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid link format"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").max(128),
  rememberMe: z.boolean().default(true),
});

export const registerSchema = z.object({
  name: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(
      z
        .string()
        .min(1, "Name is required")
        .max(60, "Name must be 60 characters or fewer")
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  rememberMe: z.boolean().default(true),
});

export const shareLinkSchema = z.object({
  name: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(
      z
        .string()
        .min(1, "Link name is required")
        .max(80, "Link name must be 80 characters or fewer")
    ),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be 50 characters or fewer")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Slug may only contain letters, numbers, hyphens, and underscores"
    ),
  description: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().max(240, "Description must be 240 characters or fewer"))
    .optional()
    .or(z.literal("")),
  customHeading: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().max(140, "Heading must be 140 characters or fewer"))
    .optional()
    .or(z.literal("")),
  welcomeMessage: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().max(240, "Welcome message must be 240 characters or fewer"))
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
  maxSubmissions: z
    .union([z.number().int().positive().max(1000000), z.null(), z.nan()])
    .optional()
    .nullable(),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().min(1, "Name is required").max(60)),
  email: z.string().trim().toLowerCase().email("Valid email required"),
  retentionDays: z
    .union([z.number().int().min(1).max(3650), z.null()])
    .optional()
    .nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password too long"),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ShareLinkInput = z.infer<typeof shareLinkSchema>;
