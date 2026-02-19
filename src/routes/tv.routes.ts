import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  addTvSchema,
  sendCommandSchema,
  tvIdParamsSchema,
} from "../schemas/tv.schema";
import TvManager from "../services/tv-manager.service";

const tvManager = TvManager.getInstance();

export const tvRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // POST /tv - Adicionar nova TV
  fastify.post(
    "/tv",
    {
      schema: {
        tags: ["tv"],
        description: "Add a new LG webOS TV",
        body: addTvSchema,
        response: {
          201: z.object({
            tvId: z.string(),
            message: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { ip, name, port, secure } = request.body;
        const tvId = await tvManager.addTv(ip, name, port, secure);

        return reply.status(201).send({
          tvId,
          message: "TV added successfully. Connecting in background...",
        });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );

  // GET /tv - Listar todas as TVs
  fastify.get(
    "/tv",
    {
      schema: {
        tags: ["tv"],
        description: "List all registered TVs",
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              name: z.string().optional(),
              ip: z.string(),
              port: z.number(),
              secure: z.boolean(),
              status: z.string(),
              connectedAt: z.string().optional(),
              lastError: z.string().optional(),
            }),
          ),
        },
      },
    },
    async (request, reply) => {
      const tvs = tvManager.listTvs();
      return tvs;
    },
  );

  // GET /tv/:tvId - Obter detalhes de uma TV específica
  fastify.get(
    "/tv/:tvId",
    {
      schema: {
        tags: ["tv"],
        description: "Get details of a specific TV",
        params: tvIdParamsSchema,
        response: {
          200: z.object({
            id: z.string(),
            name: z.string().optional(),
            ip: z.string(),
            port: z.number(),
            secure: z.boolean(),
            status: z.string(),
            connectedAt: z.string().optional(),
            lastError: z.string().optional(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { tvId } = request.params;
      const tv = tvManager.getTv(tvId);

      if (!tv) {
        return reply.status(404).send({ error: "TV not found" });
      }

      return {
        id: tv.id,
        name: tv.config.name,
        ip: tv.config.ip,
        port: tv.config.port || 3000,
        secure: tv.config.secure || false,
        status: tv.status,
        connectedAt: tv.connectedAt?.toISOString(),
        lastError: tv.lastError,
      };
    },
  );

  // DELETE /tv/:tvId - Remover TV
  fastify.delete(
    "/tv/:tvId",
    {
      schema: {
        tags: ["tv"],
        description: "Remove a TV and disconnect",
        params: tvIdParamsSchema,
        response: {
          200: z.object({
            message: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { tvId } = request.params;
        await tvManager.removeTv(tvId);

        return { message: "TV removed successfully" };
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    },
  );

  // POST /tv/:tvId/command - Enviar comando SAPP
  fastify.post(
    "/tv/:tvId/command",
    {
      schema: {
        tags: ["tv"],
        description: "Send a SAPP command to the TV",
        params: tvIdParamsSchema,
        body: sendCommandSchema,
        response: {
          200: z.object({
            success: z.boolean(),
            data: z.any().optional(),
            error: z.string().optional(),
          }),
          400: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { tvId } = request.params;
        const { uri, payload } = request.body;

        const result = await tvManager.sendCommand(tvId, uri, payload);

        if (!result.success) {
          return reply
            .status(400)
            .send({ error: result.error || "Command failed" });
        }

        return result;
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );
};
