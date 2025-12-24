import { Controller, Get, Param, Post, Patch, Delete, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('problems')
export class ProblemsController {
  constructor(
    private readonly problemsService: ProblemsService,
    private readonly usersService: UsersService,
  ) {}

  private async checkAdmin(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
  }

  @Get()
  getAllProblems() {
    return this.problemsService.findAll();
  }

  @Get(':id')
  getProblem(@Param('id') id: string) {
    return this.problemsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProblem(@Request() req, @Body() createProblemDto: any) {
    await this.checkAdmin(req.user.userId);
    return this.problemsService.create(createProblemDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateProblem(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProblemDto: any,
  ) {
    await this.checkAdmin(req.user.userId);
    return this.problemsService.update(id, updateProblemDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteProblem(@Request() req, @Param('id') id: string) {
    await this.checkAdmin(req.user.userId);
    return this.problemsService.delete(id);
  }
}
