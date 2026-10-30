import { Role } from "./shared/role.type";

export interface User {
   email: string;
   userId: string;
   role: Role;
   active: true;
   createdAt: any;
   displayName?: string;
   coachId?: string;
}