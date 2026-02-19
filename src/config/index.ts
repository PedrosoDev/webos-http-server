import { env } from "./env";

export const config = {
  port: env.PORT,
  host: env.HOST,
  nodeEnv: env.NODE_ENV,
  swagger: {
    routePrefix: "/docs",
    openapi: {
      info: {
        title: "WebOS HTTP Server API",
        description: "API documentation for WebOS HTTP Server",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
      tags: [{ name: "tv", description: "TV LG webOS management endpoints" }],
    },
    uiConfig: {
      docExpansion: "list" as const,
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
  },
};
