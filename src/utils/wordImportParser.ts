import { Question, QuestionLevel, QuestionType, WordImportResult } from '../types';

export const SAMPLE_WORD_IMPORT_TEMPLATE = `PHẦN I. TRẮC NGHIỆM LỰA CHỌN
Câu 1 [Nhận biết]: Cho hàm số y = f(x) có bảng biến thiên trên đoạn [-2; 3]. Điểm cực đại của hàm số là:
A. x = -1
B. x = 2
C. y = 4
D. x = 0
Đáp án đúng: A
Điểm: 0.25
Giải thích: Dựa vào bảng biến thiên, đạo hàm đổi dấu từ dương sang âm tại x = -1.

Câu 2 [Thông hiểu]: Nghiệm của phương trình log2(x - 1) = 3 là:
A. x = 7
B. x = 9
C. x = 8
D. x = 10
Đáp án đúng: B
Điểm: 0.25
Giải thích: Điều kiện x > 1. log2(x - 1) = 3 <=> x - 1 = 2^3 = 8 <=> x = 9.

PHẦN II. TRẮC NGHIỆM ĐÚNG/SAI
Câu 3 [Thông hiểu]: Cho hình lập phương ABCD.A'B'C'D' cạnh a. Các khẳng định sau Đúng hay Sai:
a) Vectơ AB và vectơ CD là hai vectơ cùng hướng. Sai
b) Đường thẳng A'C vuông góc với mặt phẳng (BDD'B'). Đúng
c) Khoảng cách giữa hai đường thẳng AB và C'D' bằng a. Đúng
d) Góc giữa hai đường thẳng AC và A'D bằng 90 độ. Sai
Điểm: 1.0
Giải thích: AB và CD ngược hướng nhau. AC và A'D tạo góc 60 độ do tam giác A'CD đều.

PHẦN III. TỰ LUẬN
Câu 4 [Vận dụng]: Tìm giá trị nhỏ nhất của hàm số y = x + 4/x trên khoảng (0; +inf).
Phần trả lời: 4
Điểm: 0.5
Giải thích: Áp dụng bất đẳng thức Cauchy: x + 4/x >= 2*sqrt(x * 4/x) = 4. Đẳng thức xảy ra khi x = 2.
`;

export function parseWordQuestionText(
  rawText: string,
  defaultSubject = 'Toán',
  defaultGrade: 10 | 11 | 12 = 12
): WordImportResult {
  const lines = rawText.split(/\r?\n/);
  const questions: Question[] = [];
  const errors: { line: number; message: string; snippet?: string }[] = [];

  let currentSection: QuestionType = 'MULTIPLE_CHOICE';
  let i = 0;

  function parseLevel(text: string): QuestionLevel {
    const lower = text.toLowerCase();
    if (lower.includes('nhận biết') || lower.includes('nhan biet')) return 'NHAN_BIET';
    if (lower.includes('thông hiểu') || lower.includes('thong hieu')) return 'THONG_HIEU';
    if (lower.includes('vận dụng cao') || lower.includes('van dung cao')) return 'VAN_DUNG_CAO';
    if (lower.includes('vận dụng') || lower.includes('van dung')) return 'VAN_DUNG';
    return 'THONG_HIEU';
  }

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    const lineNum = i + 1;

    if (!line) {
      i++;
      continue;
    }

    // Detect section headers
    const upperLine = line.toUpperCase();
    if (upperLine.includes('PHẦN I') || upperLine.includes('PHAN I') || upperLine.includes('PHẦN 1')) {
      currentSection = 'MULTIPLE_CHOICE';
      i++;
      continue;
    }
    if (upperLine.includes('PHẦN II') || upperLine.includes('PHAN II') || upperLine.includes('PHẦN 2')) {
      currentSection = 'TRUE_FALSE';
      i++;
      continue;
    }
    if (upperLine.includes('PHẦN III') || upperLine.includes('PHAN III') || upperLine.includes('PHẦN 3')) {
      currentSection = 'SHORT_ANSWER';
      i++;
      continue;
    }

    // Check if line starts a question (e.g., "Câu 1:", "Câu hỏi 1", "Câu 1 [Nhận biết]:")
    const questionMatch = line.match(/^(?:Câu\s*(?:hỏi)?\s*\d*|Question\s*\d*)\s*(\[[^\]]+\])?\s*[:.-]?(.*)$/i);
    if (questionMatch) {
      const levelTag = questionMatch[1] || '';
      let content = questionMatch[2]?.trim() || '';
      const level = parseLevel(levelTag || line);
      const startLineNum = lineNum;

      // In case content spans next lines until options/statements
      i++;
      const blockLines: { text: string; lineNum: number }[] = [];
      while (i < lines.length) {
        const nextRaw = lines[i];
        const nextTrim = nextRaw.trim();
        if (
          nextTrim.match(/^(?:Câu\s*(?:hỏi)?\s*\d*|Question\s*\d*)/i) ||
          nextTrim.toUpperCase().startsWith('PHẦN')
        ) {
          break; // Next question or section starts
        }
        if (nextTrim) {
          blockLines.push({ text: nextTrim, lineNum: i + 1 });
        }
        i++;
      }

      // If initial line had empty content, take first block line if not starting with option
      if (!content && blockLines.length > 0 && !blockLines[0].text.match(/^[A-Da-d][.):-]/)) {
        content = blockLines.shift()!.text;
      }

      // Now parse according to currentSection
      if (currentSection === 'MULTIPLE_CHOICE') {
        const options: { key: 'A' | 'B' | 'C' | 'D'; content: string }[] = [];
        let correctAnswer = '';
        let points = 0.25;
        let explanation = '';

        for (const blk of blockLines) {
          const t = blk.text;
          const optMatch = t.match(/^([A-D])[.):\s]\s*(.*)$/i);
          const ansMatch = t.match(/^(?:Đáp án(?:\s*đúng)?|Answer)\s*[:.-]?\s*([A-D])/i);
          const ptsMatch = t.match(/^(?:Điểm|Points?)\s*[:.-]?\s*([\d.]+)/i);
          const expMatch = t.match(/^(?:Giải thích|Lời giải|Explanation)\s*[:.-]?\s*(.*)$/i);

          if (ansMatch) {
            correctAnswer = ansMatch[1].toUpperCase();
          } else if (ptsMatch) {
            points = parseFloat(ptsMatch[1]) || 0.25;
          } else if (expMatch) {
            explanation = expMatch[1];
          } else if (optMatch) {
            const key = optMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
            options.push({ key, content: optMatch[2].trim() });
          } else if (explanation) {
            explanation += ' ' + t;
          } else if (options.length === 0) {
            content += ' ' + t;
          }
        }

        // Validate
        if (!content) {
          errors.push({ line: startLineNum, message: 'Nội dung câu hỏi không được để trống', snippet: rawLine });
        }
        if (options.length < 2) {
          errors.push({ line: startLineNum, message: `Câu hỏi thiếu các phương án lựa chọn A, B, C, D (hiện có ${options.length} phương án)`, snippet: rawLine });
        }
        if (!correctAnswer) {
          errors.push({ line: startLineNum, message: 'Chưa có dòng "Đáp án đúng: [A/B/C/D]"', snippet: rawLine });
        }

        questions.push({
          id: `imp_${Date.now()}_${questions.length + 1}`,
          subject: defaultSubject,
          grade: defaultGrade,
          topic: 'Kiểm tra tổng hợp',
          level,
          type: 'MULTIPLE_CHOICE',
          content,
          options,
          correctAnswer,
          points,
          explanation,
        });
      } else if (currentSection === 'TRUE_FALSE') {
        const tfStatements: { key: 'a' | 'b' | 'c' | 'd'; content: string; isCorrect: boolean }[] = [];
        let points = 1.0;
        let explanation = '';

        for (const blk of blockLines) {
          const t = blk.text;
          const stmtMatch = t.match(/^([a-d])[.):\s]\s*(.*?)(?:\s*[:.-]?\s*(Đúng|Sai|Đ|S|True|False))?$/i);
          const ptsMatch = t.match(/^(?:Điểm|Points?)\s*[:.-]?\s*([\d.]+)/i);
          const expMatch = t.match(/^(?:Giải thích|Lời giải|Explanation)\s*[:.-]?\s*(.*)$/i);

          if (ptsMatch) {
            points = parseFloat(ptsMatch[1]) || 1.0;
          } else if (expMatch) {
            explanation = expMatch[1];
          } else if (stmtMatch) {
            const key = stmtMatch[1].toLowerCase() as 'a' | 'b' | 'c' | 'd';
            let stmtContent = stmtMatch[2]?.trim() || '';
            const statusWord = stmtMatch[3]?.toLowerCase();
            let isCorrect = false;

            if (statusWord) {
              isCorrect = statusWord.startsWith('đ') || statusWord.startsWith('t');
            } else {
              // Check if end of content has (Đúng) or (Sai)
              if (/[\s(](Đúng|True|Đ)[)]?$/i.test(stmtContent)) {
                isCorrect = true;
                stmtContent = stmtContent.replace(/[\s(](Đúng|True|Đ)[)]?$/i, '').trim();
              } else if (/[\s(](Sai|False|S)[)]?$/i.test(stmtContent)) {
                isCorrect = false;
                stmtContent = stmtContent.replace(/[\s(](Sai|False|S)[)]?$/i, '').trim();
              }
            }

            tfStatements.push({ key, content: stmtContent, isCorrect });
          } else if (explanation) {
            explanation += ' ' + t;
          } else if (tfStatements.length === 0) {
            content += ' ' + t;
          }
        }

        if (tfStatements.length !== 4) {
          errors.push({
            line: startLineNum,
            message: `Câu hỏi Đúng/Sai cần đủ 4 nhận định a, b, c, d (hiện có ${tfStatements.length} nhận định)`,
            snippet: rawLine,
          });
        }

        const ansString = tfStatements.map((s) => `${s.key}:${s.isCorrect ? 'Đ' : 'S'}`).join(', ');

        questions.push({
          id: `imp_${Date.now()}_${questions.length + 1}`,
          subject: defaultSubject,
          grade: defaultGrade,
          topic: 'Kiểm tra tổng hợp',
          level,
          type: 'TRUE_FALSE',
          content,
          tfStatements,
          correctAnswer: ansString,
          points,
          explanation,
        });
      } else if (currentSection === 'SHORT_ANSWER') {
        let correctAnswer = '';
        let points = 0.5;
        let explanation = '';

        for (const blk of blockLines) {
          const t = blk.text;
          const ansMatch = t.match(/^(?:Phần trả lời|Đáp án|Trả lời|Answer)\s*[:.-]?\s*(.*)$/i);
          const ptsMatch = t.match(/^(?:Điểm|Points?)\s*[:.-]?\s*([\d.]+)/i);
          const expMatch = t.match(/^(?:Giải thích|Lời giải|Explanation)\s*[:.-]?\s*(.*)$/i);

          if (ansMatch) {
            correctAnswer = ansMatch[1].trim();
          } else if (ptsMatch) {
            points = parseFloat(ptsMatch[1]) || 0.5;
          } else if (expMatch) {
            explanation = expMatch[1];
          } else if (explanation) {
            explanation += ' ' + t;
          } else if (!correctAnswer) {
            content += ' ' + t;
          }
        }

        if (!content) {
          errors.push({ line: startLineNum, message: 'Nội dung câu hỏi ngắn không được để trống', snippet: rawLine });
        }
        if (!correctAnswer) {
          errors.push({ line: startLineNum, message: 'Chưa có dòng "Phần trả lời: [Đáp án]"', snippet: rawLine });
        }

        questions.push({
          id: `imp_${Date.now()}_${questions.length + 1}`,
          subject: defaultSubject,
          grade: defaultGrade,
          topic: 'Kiểm tra tổng hợp',
          level,
          type: 'SHORT_ANSWER',
          content,
          correctAnswer,
          points,
          explanation,
        });
      }

      continue;
    }

    i++;
  }

  return {
    questions,
    errors,
    rawText,
  };
}
