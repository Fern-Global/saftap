export type ServiceName = "backend" | "mobile";

export interface HealthResponse {
  service: ServiceName;
  status: "ok";
  timestamp: string;
}
