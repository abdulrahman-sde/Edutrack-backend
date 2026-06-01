export type Role = "admin" | "teacher";

export interface JwtPayload {
  sub: string;
  role: Role;
  email: string;
  name: string;
  institutionId: string;
}
