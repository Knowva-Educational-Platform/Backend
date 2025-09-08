import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { ParseIntPipe } from '@nestjs/common';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  // /analysis/students/:id/analysis
  @Get('students/:id/analysis')
  getStudentAnalysis(@Param('id', ParseIntPipe) id: number) {
    return this.analysisService.getStudentAnalysis(id);
  }

  // /analysis/groups/:id/analysis
  @Get('groups/:id/analysis')
  getGroupAnalysis(@Param('id', ParseIntPipe) id: number, @Query('passing') passing?: string) {
    const passingThreshold = passing ? parseFloat(passing) : 50;
    return this.analysisService.getGroupAnalysis(id, passingThreshold);
  }

  // /analysis/exams/:id/analysis
  @Get('exams/:id/analysis')
  getExamAnalysis(@Param('id', ParseIntPipe) id: number, @Query('passing') passing?: string) {
    const passingThreshold = passing ? parseFloat(passing) : 50;
    return this.analysisService.getExamAnalysis(id, passingThreshold);
  }
}
