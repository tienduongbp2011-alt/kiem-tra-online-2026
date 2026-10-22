import { Question, StudentAnswer } from '../types';

export function normalizeShortAnswer(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/,/g, '.'); // allow both 12,5 and 12.5
}

export interface QuestionGradingResult {
  questionId: string;
  isCorrect: boolean;
  scoreAwarded: number;
  maxScore: number;
  details?: string;
}

export function gradeQuestion(question: Question, answer?: StudentAnswer): QuestionGradingResult {
  const maxScore = question.points || 0.25;

  if (!answer) {
    return {
      questionId: question.id,
      isCorrect: false,
      scoreAwarded: 0,
      maxScore,
      details: 'Chưa trả lời',
    };
  }

  // 1. MULTIPLE CHOICE
  if (question.type === 'MULTIPLE_CHOICE') {
    const isCorrect = !!(
      answer.selectedOption &&
      answer.selectedOption.toUpperCase() === question.correctAnswer.toUpperCase()
    );
    return {
      questionId: question.id,
      isCorrect,
      scoreAwarded: isCorrect ? maxScore : 0,
      maxScore,
      details: isCorrect
        ? `Đúng (+${maxScore}đ)`
        : `Sai (Đáp án đúng: ${question.correctAnswer})`,
    };
  }

  // 2. TRUE / FALSE (4 statements a, b, c, d)
  if (question.type === 'TRUE_FALSE') {
    const statements = question.tfStatements || [];
    const selections = answer.tfSelections || {};
    let correctCount = 0;

    statements.forEach((stmt) => {
      const studentVal = selections[stmt.key];
      if (typeof studentVal === 'boolean' && studentVal === stmt.isCorrect) {
        correctCount += 1;
      }
    });

    // Quy định tính điểm chuẩn Bộ GD&ĐT cho câu hỏi Đúng/Sai (thang 1.0):
    // Đúng 1 ý: 0.1 điểm
    // Đúng 2 ý: 0.25 điểm
    // Đúng 3 ý: 0.50 điểm
    // Đúng 4 ý: 1.00 điểm
    let ratio = 0;
    if (correctCount === 1) ratio = 0.1;
    else if (correctCount === 2) ratio = 0.25;
    else if (correctCount === 3) ratio = 0.5;
    else if (correctCount === 4) ratio = 1.0;

    // Scale according to maxScore (default 1.0)
    const scoreAwarded = Math.round(ratio * (maxScore / 1.0) * 100) / 100;
    const isFullCorrect = correctCount === statements.length && statements.length > 0;

    return {
      questionId: question.id,
      isCorrect: isFullCorrect,
      scoreAwarded,
      maxScore,
      details: `Đúng ${correctCount}/${statements.length} ý (+${scoreAwarded}đ)`,
    };
  }

  // 3. SHORT ANSWER
  if (question.type === 'SHORT_ANSWER') {
    const studentNorm = normalizeShortAnswer(answer.shortAnswerText || '');
    const correctNorm = normalizeShortAnswer(question.correctAnswer || '');

    // Allow multiple acceptable answers separated by | or ;
    const acceptedList = correctNorm.split(/[|;]/).map((s) => s.trim());
    const isCorrect = acceptedList.includes(studentNorm) && studentNorm.length > 0;

    return {
      questionId: question.id,
      isCorrect,
      scoreAwarded: isCorrect ? maxScore : 0,
      maxScore,
      details: isCorrect
        ? `Đúng (+${maxScore}đ)`
        : `Sai (Đáp án: ${question.correctAnswer})`,
    };
  }

  return {
    questionId: question.id,
    isCorrect: false,
    scoreAwarded: 0,
    maxScore,
  };
}
