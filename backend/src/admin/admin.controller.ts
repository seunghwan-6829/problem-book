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

  private async checkAdminOrMaster(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'master')) {
      throw new ForbiddenException('관리자 또는 마스터 권한이 필요합니다.');
    }
    return user;
  }

  @Get('users')
  async getAllUsers(@Request() req) {
    await this.checkAdminOrMaster(req.user.userId);
    return this.adminService.getAllUsers();
  }

  @Get('stats')
  async getStats(@Request() req) {
    await this.checkAdminOrMaster(req.user.userId);
    return this.adminService.getStats();
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { role: UserRole },
  ) {
    const currentUser = await this.checkAdminOrMaster(req.user.userId);
    const targetUser = await this.usersService.findById(id);

    if (!targetUser) {
      throw new ForbiddenException('사용자를 찾을 수 없습니다.');
    }

    // 자기 자신 변경 불가
    if (req.user.userId === id) {
      throw new ForbiddenException('자신의 역할은 변경할 수 없습니다.');
    }

    // 마스터는 관리자를 변경할 수 없음
    if (currentUser.role === 'master' && targetUser.role === 'admin') {
      throw new ForbiddenException('마스터는 관리자를 변경할 수 없습니다.');
    }

    // 마스터는 다른 마스터를 변경할 수 없음
    if (currentUser.role === 'master' && targetUser.role === 'master') {
      throw new ForbiddenException('마스터는 다른 마스터를 변경할 수 없습니다.');
    }

    // 마스터는 사용자를 마스터까지만 승격 가능 (admin 불가)
    if (currentUser.role === 'master' && body.role === 'admin') {
      throw new ForbiddenException('마스터는 관리자를 지정할 수 없습니다.');
    }

    return this.usersService.updateUserRole(id, body.role);
  }

  @Patch('users/:id/tier')
  async updateUserTier(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { tier: UserTier },
  ) {
    const currentUser = await this.checkAdminOrMaster(req.user.userId);
    const targetUser = await this.usersService.findById(id);

    if (!targetUser) {
      throw new ForbiddenException('사용자를 찾을 수 없습니다.');
    }

    // 마스터는 관리자의 등급을 변경할 수 없음
    if (currentUser.role === 'master' && targetUser.role === 'admin') {
      throw new ForbiddenException('마스터는 관리자의 등급을 변경할 수 없습니다.');
    }

    return this.usersService.updateUserTier(id, body.tier);
  }

  @Delete('users/:id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    const currentUser = await this.checkAdminOrMaster(req.user.userId);
    const targetUser = await this.usersService.findById(id);

    if (!targetUser) {
      throw new ForbiddenException('사용자를 찾을 수 없습니다.');
    }

    // 자기 자신 삭제 불가
    if (req.user.userId === id) {
      throw new ForbiddenException('자신을 삭제할 수 없습니다.');
    }

    // 마스터는 관리자를 삭제할 수 없음
    if (currentUser.role === 'master' && targetUser.role === 'admin') {
      throw new ForbiddenException('마스터는 관리자를 삭제할 수 없습니다.');
    }

    // 마스터는 다른 마스터를 삭제할 수 없음
    if (currentUser.role === 'master' && targetUser.role === 'master') {
      throw new ForbiddenException('마스터는 다른 마스터를 삭제할 수 없습니다.');
    }

    return this.usersService.deleteUser(id);
  }
}
