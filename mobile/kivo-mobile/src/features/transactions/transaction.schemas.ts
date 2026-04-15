import { z } from "zod";
import { isValidDateInput } from "@/utils/date-format";

export const transactionSchema = z.object({
    type: z.enum(["income", "expense"], {
        message: "Selecciona el tipo de movimiento",
    }),
    amount: z
        .string()
        .min(1, "Ingresa un monto")
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
            message: "Ingresa un monto válido",
        }),
    transactionDate: z
        .string()
        .min(1, "Ingresa una fecha")
        .refine((value) => isValidDateInput(value), {
            message: "Ingresa una fecha válida en formato DD/MM/YYYY",
        }),
    categoryId: z.string().min(1, "Selecciona una categoría"),
    accountId: z.string().min(1, "Selecciona una cuenta"),
    concept: z.string().optional(),
    note: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;