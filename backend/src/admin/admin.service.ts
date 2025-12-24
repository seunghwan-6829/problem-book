import { Injectable } from '@nestjs/common';
import { UsersService, UserRole } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(private usersService: UsersService) {}

  async getAllUsers() {
    return this.usersService.findAll();
  }

  async getStats() {
    return this.usersService.getStats();
  }

  async updateUserRole(userId: string, role: UserRole) {
    return this.usersService.updateUserRole(userId, role);
  }
}

