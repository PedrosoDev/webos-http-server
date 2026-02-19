import type LGTV from "lgtv2";

export enum TvStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  ERROR = "error",
}

export interface TvConfig {
  ip: string;
  name?: string;
  port?: number;
  secure?: boolean;
  clientKey?: string;
}

export interface TvConnection {
  id: string;
  config: TvConfig;
  status: TvStatus;
  lgtv: LGTV | null;
  lastError?: string;
  connectedAt?: Date;
}

export interface SappCommandRequest {
  uri: string;
  payload?: any;
}

export interface SappCommandResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TvListResponse {
  id: string;
  name?: string;
  ip: string;
  port: number;
  secure: boolean;
  status: TvStatus;
  connectedAt?: string;
  lastError?: string;
}
