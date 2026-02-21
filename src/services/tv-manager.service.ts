import LGTV from "lgtv2";
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type {
  TvConfig,
  TvConnection,
  TvStatus,
  SappCommandResponse,
  TvListResponse,
} from "../types/tv.types";
import { TvStatus as Status } from "../types/tv.types";

// Ignorar erros de certificado SSL para conexões WSS com TVs LG
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const DATA_DIR = join(process.cwd(), "data");
const CLIENTS_FILE = join(DATA_DIR, "tv-clients.json");

interface StoredTvData {
  id: string;
  config: TvConfig;
}

class TvManager {
  private static instance: TvManager;
  private connections: Map<string, TvConnection> = new Map();

  private constructor() {
    this.ensureDataDir();
    this.loadSavedTvs();
  }

  static getInstance(): TvManager {
    if (!TvManager.instance) {
      TvManager.instance = new TvManager();
    }
    return TvManager.instance;
  }

  private ensureDataDir(): void {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private generateTvId(ip: string): string {
    return createHash("md5").update(ip).digest("hex").substring(0, 8);
  }

  private loadSavedTvs(): void {
    if (!existsSync(CLIENTS_FILE)) {
      return;
    }

    try {
      const data = readFileSync(CLIENTS_FILE, "utf-8");
      const savedTvs: StoredTvData[] = JSON.parse(data);

      for (const tvData of savedTvs) {
        this.connections.set(tvData.id, {
          id: tvData.id,
          config: tvData.config,
          status: Status.DISCONNECTED,
          lgtv: null,
        });

        // Tentar conectar em background
        this.connectTv(tvData.id).catch((err) => {
          console.error(`Failed to auto-connect TV ${tvData.id}:`, err.message);
        });
      }

      console.log(`✅ Loaded ${savedTvs.length} saved TV(s)`);
    } catch (error) {
      console.error("Error loading saved TVs:", error);
    }
  }

  private saveTvs(): void {
    const savedTvs: StoredTvData[] = Array.from(this.connections.values()).map(
      (conn) => ({
        id: conn.id,
        config: conn.config,
      }),
    );

    try {
      writeFileSync(CLIENTS_FILE, JSON.stringify(savedTvs, null, 2));
    } catch (error) {
      console.error("Error saving TVs:", error);
    }
  }

  private async connectTv(tvId: string): Promise<void> {
    const connection = this.connections.get(tvId);
    if (!connection) {
      throw new Error("TV not found");
    }

    if (connection.status === Status.CONNECTING) {
      throw new Error("TV is already connecting");
    }

    connection.status = Status.CONNECTING;

    return new Promise((resolve, reject) => {
      const keyFilePath = join(DATA_DIR, `tv-${tvId}.key`);
      const lgtv = new LGTV({
        url: `ws${connection.config.secure ? "s" : ""}://${connection.config.ip}:${connection.config.port || 3000}`,
        timeout: 5000,
        reconnect: 3000,
        clientKey: connection.config.clientKey,
        keyFile: keyFilePath,
        rejectUnauthorized: false, // Ignorar erros de certificado SSL
      });

      lgtv.on("connect", () => {
        connection.status = Status.CONNECTED;
        connection.lgtv = lgtv;
        connection.connectedAt = new Date();
        connection.lastError = undefined;
        console.log(`✅ TV ${tvId} connected`);
        resolve();
      });

      lgtv.on("close", () => {
        if (connection.status === Status.CONNECTED) {
          connection.status = Status.DISCONNECTED;
          console.log(`⚠️ TV ${tvId} disconnected`);
        }
      });

      lgtv.on("error", (err: Error) => {
        connection.status = Status.ERROR;
        connection.lastError = err.message;
        console.error(`❌ TV ${tvId} error:`, err.message);
        reject(err);
      });

      lgtv.on("prompt", () => {
        console.log(
          `📺 TV ${tvId} is prompting for permission. Please approve on the TV.`,
        );
      });

      lgtv.on("connecting", () => {
        console.log(`🔄 TV ${tvId} is connecting...`);
      });
    });
  }

  async addTv(
    ip: string,
    name?: string,
    port: number = 3000,
    secure: boolean = false,
  ): Promise<string> {
    const tvId = this.generateTvId(ip);

    if (this.connections.has(tvId)) {
      throw new Error("TV already exists");
    }

    const config: TvConfig = {
      ip,
      name,
      port,
      secure,
    };

    const connection: TvConnection = {
      id: tvId,
      config,
      status: Status.DISCONNECTED,
      lgtv: null,
    };

    this.connections.set(tvId, connection);
    this.saveTvs();

    // Conectar em background
    this.connectTv(tvId)
      .then(() => {
        // Salvar clientKey após conexão bem-sucedida
        if (connection.lgtv && (connection.lgtv as any).clientKey) {
          connection.config.clientKey = (connection.lgtv as any).clientKey;
          this.saveTvs();
        }
      })
      .catch((err) => {
        console.error(`Failed to connect TV ${tvId}:`, err.message);
      });

    return tvId;
  }

  async removeTv(tvId: string): Promise<void> {
    const connection = this.connections.get(tvId);
    if (!connection) {
      throw new Error("TV not found");
    }

    if (connection.lgtv) {
      connection.lgtv.disconnect();
    }

    this.connections.delete(tvId);
    this.saveTvs();
  }

  getTv(tvId: string): TvConnection | undefined {
    return this.connections.get(tvId);
  }

  listTvs(): TvListResponse[] {
    return Array.from(this.connections.values()).map((conn) => ({
      id: conn.id,
      name: conn.config.name,
      ip: conn.config.ip,
      port: conn.config.port || 3000,
      secure: conn.config.secure || false,
      status: conn.status,
      connectedAt: conn.connectedAt?.toISOString(),
      lastError: conn.lastError,
    }));
  }

  async sendCommand(
    tvId: string,
    uri: string,
    payload?: any,
  ): Promise<SappCommandResponse> {
    const connection = this.connections.get(tvId);
    if (!connection) {
      return { success: false, error: "TV not found" };
    }

    if (connection.status !== Status.CONNECTED || !connection.lgtv) {
      return { success: false, error: "TV is not connected" };
    }

    return new Promise((resolve) => {
      connection.lgtv!.request(
        uri,
        payload || {},
        (err: Error | null, res: any) => {
          if (err) {
            resolve({ success: false, error: err.message });
          } else {
            resolve({ success: true, data: res });
          }
        },
      );
    });
  }
}

export default TvManager;
