import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AnalysisService {
  constructor(private prisma: PrismaService) {}

  // Student Analysis
  async getStudentAnalysis(studentId: number) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: true }
    });
    const examsTaken = attempts.length;

    // Attendance: lessons attended / total lessons in student's approved groups
    const memberships = await this.prisma.membership.findMany({ where: { studentId, status: 'APPROVED' }, select: { groupId: true } });
    const groupIds = memberships.map(m => m.groupId);
    const totalLessons = await this.prisma.lesson.count({ where: { groups: { some: { groupId: { in: groupIds } } } } });
    const attendedLessonCount = await this.prisma.lesson.count({ where: { groups: { some: { groupId: { in: groupIds } } } } });
    const attendancePercent = totalLessons > 0 ? Math.round((attendedLessonCount / totalLessons) * 100) : 0;

    // Results per exam
    const results = await this.prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: true }
    });
    const examOverview = results.map(r => ({
      examId: r.quizId,
      examName: r.quiz.title,
      date: r.quiz.startsAt,
      score: r.score ?? 0,
      pass: (r.score ?? 0) >= 50
    }));

    return {
      examsTaken,
      attendancePercent,
      results: examOverview
    };
  }

  // Group Analysis
  async getGroupAnalysis(groupId: number, passingThreshold = 50) {
    const studentsCount = await this.prisma.membership.count({ where: { groupId, status: 'APPROVED' } });
    const examsCount = await this.prisma.quiz.count({ where: { groupId } });
    const materialsCount = await this.prisma.lesson.count({ where: { groups: { some: { groupId } } } });

    // Attendance per exam = attempts/ students
    const quizzes = await this.prisma.quiz.findMany({ where: { groupId }, include: { attempts: true } });
    const examsAttendance = quizzes.map(q => {
      const attended = q.attempts.length;
      const attendance = studentsCount > 0 ? Math.round((attended / studentsCount) * 100) : 0;
      const absence = 100 - attendance;
      const scores = q.attempts.map(a => a.score ?? 0);
      const avg = scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : 0;
      const success = studentsCount > 0 ? Math.round((q.attempts.filter(a => (a.score ?? 0) >= passingThreshold).length / studentsCount) * 100) : 0;
      const failure = 100 - success;
      return { examId: q.id, name: q.title, attendance, absence, averageScore: avg, success, failure };
    });

    return {
      counts: { students: studentsCount, exams: examsCount, materials: materialsCount },
      exams: examsAttendance
    };
  }

  // Exam Analysis
  async getExamAnalysis(quizId: number, passingThreshold = 50) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId }, include: { attempts: { include: { studentAnswers: { include: { question: true } } } }, group: { include: { memberships: { where: { status: 'APPROVED' } } } } } });
    const totalStudents = quiz?.group.memberships.length ?? 0;
    const participants = quiz?.attempts.length ?? 0;
    const attendance = totalStudents > 0 ? Math.round((participants / totalStudents) * 100) : 0;

    const studentsScores = (quiz?.attempts ?? []).map(a => ({ studentId: a.studentId, score: a.score ?? 0 }));

    // Wrongly answered questions count
    const wrongCount: Record<number, number> = {};
    for (const attempt of quiz?.attempts ?? []) {
      for (const ans of attempt.studentAnswers as any[]) {
        const isWrong = ans.question.type !== 'Written' && ans.answer !== ans.question.answer;
        if (isWrong) wrongCount[ans.questionId] = (wrongCount[ans.questionId] ?? 0) + 1;
      }
    }
    const hardestQuestions = Object.entries(wrongCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([questionId, count]) => ({ questionId: Number(questionId), wrongCount: count }));

    // Score distribution buckets
    const buckets = [0, 50, 70, 85, 100];
    const distribution = [0, 0, 0, 0];
    for (const s of studentsScores) {
      const pct = s.score;
      if (pct < 50) distribution[0]++; else if (pct < 70) distribution[1]++; else if (pct < 85) distribution[2]++; else distribution[3]++;
    }

    const success = totalStudents > 0 ? Math.round(((quiz?.attempts.filter(a => (a.score ?? 0) >= passingThreshold).length ?? 0) / totalStudents) * 100) : 0;
    const failure = 100 - success;

    return {
      participants,
      attendancePercent: attendance,
      studentsScores,
      hardestQuestions,
      distribution: { ranges: ['0-50', '50-70', '70-85', '85-100'], counts: distribution },
      successPercent: success,
      failurePercent: failure
    };
  }
}
