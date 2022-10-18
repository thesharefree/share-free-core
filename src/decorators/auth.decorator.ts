import { SetMetadata } from '@nestjs/common';

export const Auth = (...roles: string[]) => SetMetadata('roles', roles);
