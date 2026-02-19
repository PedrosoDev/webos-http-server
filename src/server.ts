import { buildApp } from "./app";
import { config } from "./config";
import TvManager from "./services/tv-manager.service";

async function start() {
  try {
    // Inicializar TvManager (carrega TVs salvas)
    TvManager.getInstance();

    const app = await buildApp();

    await app.listen({
      port: Number(config.port),
      host: config.host,
    });

    console.log(`🚀 Server running at http://${config.host}:${config.port}`);
    console.log(
      `📚 Swagger documentation at http://${config.host}:${config.port}${config.swagger.routePrefix}`,
    );
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

start();
