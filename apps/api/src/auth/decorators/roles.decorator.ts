import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

// Usage: @Roles(Role.SUPER_ADMIN, Role.AGENT)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
