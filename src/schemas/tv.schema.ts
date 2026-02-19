import { z } from "zod";

// Regex para validar IP v4
const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

// Schema para adicionar uma nova TV
export const addTvSchema = z.object({
  ip: z
    .string()
    .min(7, "IP inválido")
    .regex(ipv4Regex, "IP deve estar no formato xxx.xxx.xxx.xxx"),
  name: z.string().min(1).optional(),
  port: z
    .number()
    .int()
    .positive("Porta deve ser um número positivo")
    .default(3000),
  secure: z.boolean().default(false),
});

// Schema para enviar comando SAPP
export const sendCommandSchema = z.object({
  uri: z
    .string()
    .min(1, "URI é obrigatória")
    .startsWith("ssap://", "URI deve começar com ssap://"),
  payload: z.any().optional(),
});

// Schema para parâmetro tvId
export const tvIdParamsSchema = z.object({
  tvId: z.string().min(1, "tvId é obrigatório"),
});

// Tipos inferidos
export type AddTvInput = z.infer<typeof addTvSchema>;
export type SendCommandInput = z.infer<typeof sendCommandSchema>;
export type TvIdParams = z.infer<typeof tvIdParamsSchema>;
