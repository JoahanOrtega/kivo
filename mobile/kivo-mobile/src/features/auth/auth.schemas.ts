import { z } from "zod";

/**
 * Esquema de validación para inicio de sesión.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Ingresa tu correo")
    .email("Ingresa un correo válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

/**
 * Esquema de validación para registro.
 */
export const registerSchema = z
  .object({
    name: z.string().min(1, "Ingresa tu nombre"),
    email: z
      .string()
      .min(1, "Ingresa tu correo")
      .email("Ingresa un correo válido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;