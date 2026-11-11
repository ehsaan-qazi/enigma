import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: z.string().optional(),
    full_name: z.string().optional(),
    institution: z.string().optional(),
    role: z.enum(["student", "instructor", "evaluator"]).optional().default("student"),
  })
  .transform((data) => ({
    email: data.email,
    password: data.password,
    fullName: data.fullName || data.full_name || "Enigma Student",
    institution: data.institution || "University / Academic Institution",
    role: data.role || "student",
  }));

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
