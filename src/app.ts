import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { config } from "./config";
import { tvRoutes } from "./routes/tv.routes";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === "development" ? "info" : "warn",
      transport:
        config.nodeEnv === "development"
          ? {
              target: "pino-pretty",
              options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
  });

  // Configurar validação e serialização com Zod
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Registrar Swagger
  await app.register(swagger, {
    openapi: config.swagger.openapi,
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: config.swagger.routePrefix,
    uiConfig: config.swagger.uiConfig,
    staticCSP: config.swagger.staticCSP,
    transformStaticCSP: config.swagger.transformStaticCSP,
  });

  // Registrar rotas
  await app.register(tvRoutes);

  return app;
}
