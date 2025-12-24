import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ProblemsService } from './problems.service';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  getAllProblems() {
    return this.problemsService.findAll();
  }

  @Get(':id')
  getProblem(@Param('id') id: string) {
    return this.problemsService.findOne(id);
  }

  @Post()
  createProblem(@Body() createProblemDto: any) {
    return this.problemsService.create(createProblemDto);
  }
}

