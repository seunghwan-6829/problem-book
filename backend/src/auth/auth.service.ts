import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, User } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    return this.usersService.validatePassword(username, password);
  }

  async login(user: User) {
    // 방문 횟수 증가
    await this.usersService.incrementVisitCount(user.id);
    
    const payload = { username: user.username, sub: user.id, role: user.role, tier: user.tier };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        tier: user.tier || 'basic',
      },
    };
  }

  async register(username: string, password: string, name: string) {
    try {
      const user = await this.usersService.create(username, password, name);
      return this.login(user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      tier: user.tier || 'basic',
      visit_count: user.visit_count,
      created_at: user.created_at,
    };
  }
}
