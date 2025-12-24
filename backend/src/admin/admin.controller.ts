import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService, UserRole, UserTier } from '../users/users.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private usersService: UsersService,
  ) {}

  private async checkAdmin(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
  }

  @Get('users')
  async getAllUsers(@Request() req) {
    await this.checkAdmin(req.user.userId);
    return this.adminService.getAllUsers();
  }

  @Get('stats')
  async getStats(@Request() req) {
    await this.checkAdmin(req.user.userId);
    return this.adminService.getStats();
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { role: UserRole },
  ) {
    await this.checkAdmin(req.user.userId);
    return this.usersService.updateUserRole(id, body.role);
  }

  @Patch('users/:id/tier')
  async updateUserTier(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { tier: UserTier },
  ) {
    await this.checkAdmin(req.user.userId);
    return this.usersService.updateUserTier(id, body.tier);
  }

  @Delete('users/:id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    await this.checkAdmin(req.user.userId);
    
    // 자기 자신은 삭제 불가
    if (req.user.userId === id) {
      throw new ForbiddenException('자신을 삭제할 수 없습니다.');
    }
    
    return this.usersService.deleteUser(id);
  }
}
