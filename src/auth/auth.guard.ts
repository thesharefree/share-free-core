import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user: User = request.user;
        if (user == null || user.roles == null || user.roles.length < 1) {
            return false;
        }
        return this.matchRoles(roles, user.roles);
    }

    private matchRoles(roles: string[], userRoles: string[]): boolean {
        for (let role of userRoles) {
            if (roles.includes(role)) {
                return true;
            }
        }
        return false;
    }
}