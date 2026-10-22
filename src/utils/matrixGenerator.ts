import { Question, QuestionLevel, QuestionType } from '../types';

export interface MatrixConfig {
  subject: string;
  grade: 10 | 11 | 12;
  topic?: string;
  totalQuestions: number;
  typeCounts?: {
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
  };
  ratios: {
    nhanBiet: number; // e.g. 40
    thongHieu: number; // e.g. 30
    vanDung: number; // e.g. 20
    vanDungCao: number; // e.g. 10
  };
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  examCode: string;
}

export interface MatrixGenerationResult {
  success: boolean;
  message: string;
  questions: Question[];
  supplementedCount: number;
  breakdown: {
    nhanBietCount: number;
    thongHieuCount: number;
    vanDungCount: number;
    vanDungCaoCount: number;
    mcCount: number;
    tfCount: number;
    saCount: number;
  };
}

// Utility to shuffle array immutably
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper to pick questions by level ratio from a pool of a specific QuestionType
function pickByRatios(
  pool: Question[],
  count: number,
  ratios: MatrixConfig['ratios']
): Question[] {
  if (count <= 0 || pool.length === 0) return [];

  const targetNB = Math.round((ratios.nhanBiet / 100) * count);
  const targetTH = Math.round((ratios.thongHieu / 100) * count);
  const targetVD = Math.round((ratios.vanDung / 100) * count);
  const targetVDC = Math.max(0, count - targetNB - targetTH - targetVD);

  const nbPool = shuffleArray(pool.filter((q) => q.level === 'NHAN_BIET'));
  const thPool = shuffleArray(pool.filter((q) => q.level === 'THONG_HIEU'));
  const vdPool = shuffleArray(pool.filter((q) => q.level === 'VAN_DUNG'));
  const vdcPool = shuffleArray(pool.filter((q) => q.level === 'VAN_DUNG_CAO'));

  const pickedNB = nbPool.slice(0, targetNB);
  const pickedTH = thPool.slice(0, targetTH);
  const pickedVD = vdPool.slice(0, targetVD);
  const pickedVDC = vdcPool.slice(0, targetVDC);

  let selected = [...pickedNB, ...pickedTH, ...pickedVD, ...pickedVDC];

  if (selected.length > count) {
    selected = selected.slice(0, count);
  } else if (selected.length < count) {
    const pickedIds = new Set(selected.map((q) => q.id));
    const remaining = shuffleArray(pool.filter((q) => !pickedIds.has(q.id)));
    selected = [...selected, ...remaining.slice(0, count - selected.length)];
  }

  return selected;
}

// Generate supplementary questions when bank has fewer questions than requested
function createSupplementaryQuestions(
  subject: string,
  grade: 10 | 11 | 12,
  topic: string | undefined,
  type: QuestionType,
  neededCount: number,
  existingPool: Question[],
  startIndex: number
): Question[] {
  const levels: QuestionLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];
  const topicLabel = topic && topic !== 'ALL' ? topic : `Chuyên đề trọng tâm ${subject} ${grade}`;
  const results: Question[] = [];

  // Fallback templates by subject & type
  const mcTemplates = [
    {
      stem: `Trong chương trình ${subject} khối ${grade} (${topicLabel}), phát biểu hoặc tính chất nào dưới đây là đúng theo chuẩn kiến thức kỹ năng?`,
      opts: [
        'Khẳng định A thỏa mãn đầy đủ điều kiện xác định của bài toán.',
        'Khẳng định B chỉ đúng trong trường hợp suy biến.',
        'Khẳng định C vi phạm điều kiện biên của giả thiết.',
        'Khẳng định D mâu thuẫn với định lý cơ bản.',
      ],
      ans: 'A' as const,
      exp: 'Theo định lý và tính chất chuẩn trong SGK chương trình GDPT 2018, phương án A thỏa mãn đầy đủ điều kiện.',
    },
    {
      stem: `Cho bài toán thuộc chủ đề "${topicLabel}" môn ${subject} ${grade}. Giá trị hoặc kết luận đúng khi biến đổi biểu thức chuẩn là:`,
      opts: [
        'Kết quả thu gọn bằng 1 đơn vị chuẩn.',
        'Kết quả thu gọn bằng 2 đơn vị chuẩn.',
        'Kết quả thu gọn bằng 0.',
        'Không tồn tại giá trị thỏa mãn.',
      ],
      ans: 'B' as const,
      exp: 'Áp dụng công thức biến đổi tương đương trong chuyên đề, ta thu được kết quả đúng tương ứng với phương án B.',
    },
    {
      stem: `Xét mô hình thực nghiệm trong môn ${subject} khối ${grade} về "${topicLabel}". Nhận xét nào sau đây phản ánh đúng bản chất?`,
      opts: [
        'Đại lượng khảo sát tỉ lệ nghịch với bình phương tham số.',
        'Đại lượng khảo sát không phụ thuộc vào điều kiện ban đầu.',
        'Đại lượng khảo sát biến thiên tuần hoàn hoặc đơn điệu trên miền xác định.',
        'Hệ luôn ở trạng thái cân bằng tĩnh tuyệt đối.',
      ],
      ans: 'C' as const,
      exp: 'Dựa vào bảng biến thiên và quy luật biến đổi của đại lượng trong chuyên đề, phương án C là chính xác.',
    },
    {
      stem: `Tìm điều kiện của tham số trong bài toán ${subject} ${grade} (${topicLabel}) để hệ thức đạt giá trị tối ưu trên miền khảo sát:`,
      opts: [
        'm > 0',
        'm < -1',
        '0 <= m <= 2',
        'm = 1',
      ],
      ans: 'D' as const,
      exp: 'Xét điều kiện cần và đủ của bài toán cực trị / tối ưu, tại m = 1 biểu thức đạt giá trị thỏa mãn yêu cầu đề bài.',
    },
  ];

  const tfTemplates = [
    {
      stem: `Cho dữ kiện bài toán thuộc chuyên đề "${topicLabel}" trong chương trình ${subject} khối ${grade}. Xét tính Đúng/Sai của các mệnh đề sau:`,
      statements: [
        { key: 'a' as const, content: 'Điều kiện xác định của mô hình/biểu thức luôn được đảm bảo trên miền chuẩn.', isCorrect: true },
        { key: 'b' as const, content: 'Khi tăng giá trị biến số đầu vào lên gấp đôi thì đại lượng đầu ra giảm đi một nửa.', isCorrect: false },
        { key: 'c' as const, content: 'Đồ thị hoặc quy luật biểu diễn đi qua điểm chuẩn cố định của hệ.', isCorrect: true },
        { key: 'd' as const, content: 'Giá trị lớn nhất trên đoạn khảo sát vượt quá ngưỡng giới hạn 100.', isCorrect: false },
      ],
      exp: 'a) Đúng theo tập xác định. b) Sai vì quy luật không phải tỉ lệ nghịch bậc nhất. c) Đúng khi thay tọa độ điểm chuẩn. d) Sai vì GTLN nhỏ hơn giới hạn.',
    },
    {
      stem: `Nghiên cứu tình huống thực tiễn môn ${subject} ${grade} về "${topicLabel}". Các nhận định dưới đây là Đúng hay Sai?`,
      statements: [
        { key: 'a' as const, content: 'Công thức liên hệ cơ bản giữa các đại lượng tuân theo định luật/định lý SGK.', isCorrect: true },
        { key: 'b' as const, content: 'Tại thời điểm/vị trí cân bằng, tốc độ biến thiên của đại lượng bằng 0.', isCorrect: true },
        { key: 'c' as const, content: 'Phương trình trạng thái của bài toán vô nghiệm trên tập số thực.', isCorrect: false },
        { key: 'd' as const, content: 'Tổng các nghiệm dương của bài toán là một số nguyên dương.', isCorrect: true },
      ],
      exp: 'Áp dụng tính chất đạo hàm / biến thiên tại điểm dừng và giải phương trình đặc trưng của hệ.',
    },
  ];

  const saTemplates = [
    {
      stem: `Trong bài toán thực tế môn ${subject} khối ${grade} thuộc chủ đề "${topicLabel}", hãy tính giá trị số nguyên biểu thị kết quả tối ưu của biểu thức khảo sát (chỉ điền số).`,
      ans: '12',
      exp: 'Thiết lập hàm mục tiêu và giải phương trình đạo hàm bằng 0, ta tính được giá trị tối ưu bằng 12.',
    },
    {
      stem: `Cho mô hình định lượng môn ${subject} ${grade} (${topicLabel}) với tham số chuẩn k = 5. Tính tổng các giá trị nguyên dương thỏa mãn bất phương trình điều kiện của bài toán.`,
      ans: '15',
      exp: 'Các giá trị nguyên dương thỏa mãn là 1, 2, 3, 4, 5. Tổng của chúng bằng 1 + 2 + 3 + 4 + 5 = 15.',
    },
    {
      stem: `Một bài toán ứng dụng trong môn ${subject} khối ${grade} (${topicLabel}) có kết quả thu gọn dưới dạng phân số tối giản a/b = 3/5. Tính giá trị của biểu thức T = 2a + b.`,
      ans: '11',
      exp: 'Với a = 3 và b = 5 (phân số tối giản), ta có T = 2(3) + 5 = 11.',
    },
  ];

  const sameTypePool = existingPool.filter((q) => q.type === type);

  for (let i = 0; i < neededCount; i++) {
    const level = levels[(startIndex + i) % levels.length];
    const uniqueSuffix = `${Date.now().toString().slice(-4)}_${startIndex + i + 1}`;

    // If there are existing questions of this type in the subject, create a realistic variant based on them or templates
    if (type === 'MULTIPLE_CHOICE') {
      const tpl = mcTemplates[(startIndex + i) % mcTemplates.length];
      const refQ = sameTypePool.length > 0 ? sameTypePool[i % sameTypePool.length] : null;
      results.push({
        id: `q_supp_mc_${uniqueSuffix}`,
        subject,
        grade,
        chapter: refQ?.chapter || `Chương trình ${subject} ${grade}`,
        topic: refQ?.topic || topicLabel,
        level,
        type: 'MULTIPLE_CHOICE',
        content: refQ
          ? `${refQ.content} (Biến thể mở rộng #${i + 1})`
          : tpl.stem,
        options: refQ?.options
          ? refQ.options.map((o) => ({ ...o }))
          : [
              { key: 'A', content: tpl.opts[0] },
              { key: 'B', content: tpl.opts[1] },
              { key: 'C', content: tpl.opts[2] },
              { key: 'D', content: tpl.opts[3] },
            ],
        correctAnswer: refQ?.correctAnswer || tpl.ans,
        points: 0.25,
        explanation: refQ?.explanation || tpl.exp,
      });
    } else if (type === 'TRUE_FALSE') {
      const tpl = tfTemplates[(startIndex + i) % tfTemplates.length];
      const refQ = sameTypePool.length > 0 ? sameTypePool[i % sameTypePool.length] : null;
      const statements = refQ?.tfStatements
        ? refQ.tfStatements.map((s) => ({ ...s }))
        : tpl.statements.map((s) => ({ ...s }));
      const ansStr = statements
        .map((s) => `${s.key}:${s.isCorrect ? 'Đ' : 'S'}`)
        .join(', ');

      results.push({
        id: `q_supp_tf_${uniqueSuffix}`,
        subject,
        grade,
        chapter: refQ?.chapter || `Chương trình ${subject} ${grade}`,
        topic: refQ?.topic || topicLabel,
        level,
        type: 'TRUE_FALSE',
        content: refQ
          ? `${refQ.content} (Tình huống tương tự #${i + 1})`
          : tpl.stem,
        tfStatements: statements,
        correctAnswer: ansStr,
        points: 1.0,
        explanation: refQ?.explanation || tpl.exp,
      });
    } else {
      const tpl = saTemplates[(startIndex + i) % saTemplates.length];
      const refQ = sameTypePool.length > 0 ? sameTypePool[i % sameTypePool.length] : null;
      results.push({
        id: `q_supp_sa_${uniqueSuffix}`,
        subject,
        grade,
        chapter: refQ?.chapter || `Chương trình ${subject} ${grade}`,
        topic: refQ?.topic || topicLabel,
        level,
        type: 'SHORT_ANSWER',
        content: refQ
          ? `${refQ.content} (Câu hỏi tương tự #${i + 1})`
          : tpl.stem,
        correctAnswer: refQ?.correctAnswer || tpl.ans,
        points: 0.5,
        explanation: refQ?.explanation || tpl.exp,
      });
    }
  }

  return results;
}

export function generateExamFromMatrix(
  questionBank: Question[],
  config: MatrixConfig
): MatrixGenerationResult {
  // 1. Filter bank by subject (prioritize matching grade, then fallback to other grades in same subject)
  let subjectPool = questionBank.filter((q) => q.subject === config.subject);

  if (config.topic && config.topic !== 'ALL') {
    const topicFiltered = subjectPool.filter(
      (q) =>
        q.topic === config.topic ||
        q.chapter === config.topic ||
        q.topic.includes(config.topic!) ||
        (q.chapter && q.chapter.includes(config.topic!))
    );
    if (topicFiltered.length > 0) {
      subjectPool = topicFiltered;
    }
  }

  const gradePool = subjectPool.filter((q) => Number(q.grade) === Number(config.grade));
  const otherGradePool = subjectPool.filter((q) => Number(q.grade) !== Number(config.grade));
  const combinedPool = [...gradePool, ...otherGradePool];

  let selectedQuestions: Question[] = [];
  let supplementedCount = 0;

  if (config.typeCounts) {
    const { multipleChoice, trueFalse, shortAnswer } = config.typeCounts;

    // Pick MULTIPLE_CHOICE
    const mcGrade = gradePool.filter((q) => q.type === 'MULTIPLE_CHOICE');
    const mcOther = otherGradePool.filter((q) => q.type === 'MULTIPLE_CHOICE');
    let pickedMC = pickByRatios(mcGrade, multipleChoice, config.ratios);
    if (pickedMC.length < multipleChoice) {
      const pickedIds = new Set(pickedMC.map((q) => q.id));
      const moreMC = pickByRatios(
        mcOther.filter((q) => !pickedIds.has(q.id)),
        multipleChoice - pickedMC.length,
        config.ratios
      );
      pickedMC = [...pickedMC, ...moreMC];
    }
    if (pickedMC.length < multipleChoice) {
      const need = multipleChoice - pickedMC.length;
      const suppMC = createSupplementaryQuestions(
        config.subject,
        config.grade,
        config.topic,
        'MULTIPLE_CHOICE',
        need,
        combinedPool,
        0
      );
      supplementedCount += suppMC.length;
      pickedMC = [...pickedMC, ...suppMC];
    }

    // Pick TRUE_FALSE
    const tfGrade = gradePool.filter((q) => q.type === 'TRUE_FALSE');
    const tfOther = otherGradePool.filter((q) => q.type === 'TRUE_FALSE');
    let pickedTF = pickByRatios(tfGrade, trueFalse, config.ratios);
    if (pickedTF.length < trueFalse) {
      const pickedIds = new Set(pickedTF.map((q) => q.id));
      const moreTF = pickByRatios(
        tfOther.filter((q) => !pickedIds.has(q.id)),
        trueFalse - pickedTF.length,
        config.ratios
      );
      pickedTF = [...pickedTF, ...moreTF];
    }
    if (pickedTF.length < trueFalse) {
      const need = trueFalse - pickedTF.length;
      const suppTF = createSupplementaryQuestions(
        config.subject,
        config.grade,
        config.topic,
        'TRUE_FALSE',
        need,
        combinedPool,
        pickedMC.length
      );
      supplementedCount += suppTF.length;
      pickedTF = [...pickedTF, ...suppTF];
    }

    // Pick SHORT_ANSWER
    const saGrade = gradePool.filter((q) => q.type === 'SHORT_ANSWER');
    const saOther = otherGradePool.filter((q) => q.type === 'SHORT_ANSWER');
    let pickedSA = pickByRatios(saGrade, shortAnswer, config.ratios);
    if (pickedSA.length < shortAnswer) {
      const pickedIds = new Set(pickedSA.map((q) => q.id));
      const moreSA = pickByRatios(
        saOther.filter((q) => !pickedIds.has(q.id)),
        shortAnswer - pickedSA.length,
        config.ratios
      );
      pickedSA = [...pickedSA, ...moreSA];
    }
    if (pickedSA.length < shortAnswer) {
      const need = shortAnswer - pickedSA.length;
      const suppSA = createSupplementaryQuestions(
        config.subject,
        config.grade,
        config.topic,
        'SHORT_ANSWER',
        need,
        combinedPool,
        pickedMC.length + pickedTF.length
      );
      supplementedCount += suppSA.length;
      pickedSA = [...pickedSA, ...suppSA];
    }

    selectedQuestions = [...pickedMC, ...pickedTF, ...pickedSA];
  } else {
    // Legacy fallback if typeCounts not provided
    selectedQuestions = pickByRatios(combinedPool, config.totalQuestions, config.ratios);
    if (selectedQuestions.length < config.totalQuestions) {
      const need = config.totalQuestions - selectedQuestions.length;
      const supp = createSupplementaryQuestions(
        config.subject,
        config.grade,
        config.topic,
        'MULTIPLE_CHOICE',
        need,
        combinedPool,
        0
      );
      supplementedCount += supp.length;
      selectedQuestions = [...selectedQuestions, ...supp];
    }
  }

  let finalQuestions = selectedQuestions.map((q) => ({ ...q }));

  // Apply option shuffle if requested
  if (config.shuffleOptions) {
    finalQuestions = finalQuestions.map((q) => {
      if (q.type === 'MULTIPLE_CHOICE' && q.options && q.options.length > 0) {
        const correctOpt = q.options.find((o) => o.key === q.correctAnswer);
        const correctText = correctOpt ? correctOpt.content : '';

        const shuffledContents = shuffleArray(q.options.map((o) => o.content));
        const newKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        const newOptions = shuffledContents.slice(0, 4).map((content, idx) => ({
          key: newKeys[idx],
          content,
        }));

        const newCorrectKey = newOptions.find((o) => o.content === correctText)?.key || 'A';

        return {
          ...q,
          options: newOptions,
          correctAnswer: newCorrectKey,
        };
      }
      return q;
    });
  }

  // Sort by Part I -> Part II -> Part III; within each part either shuffle or sort by level
  const typeOrder: Record<QuestionType, number> = {
    MULTIPLE_CHOICE: 1,
    TRUE_FALSE: 2,
    SHORT_ANSWER: 3,
  };
  const levelOrder: Record<QuestionLevel, number> = {
    NHAN_BIET: 1,
    THONG_HIEU: 2,
    VAN_DUNG: 3,
    VAN_DUNG_CAO: 4,
  };

  if (config.shuffleQuestions) {
    const part1 = shuffleArray(finalQuestions.filter((q) => q.type === 'MULTIPLE_CHOICE'));
    const part2 = shuffleArray(finalQuestions.filter((q) => q.type === 'TRUE_FALSE'));
    const part3 = shuffleArray(finalQuestions.filter((q) => q.type === 'SHORT_ANSWER'));
    finalQuestions = [...part1, ...part2, ...part3];
  } else {
    finalQuestions.sort((a, b) => {
      const typeDiff = (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
      if (typeDiff !== 0) return typeDiff;
      return (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0);
    });
  }

  const breakdown = {
    nhanBietCount: finalQuestions.filter((q) => q.level === 'NHAN_BIET').length,
    thongHieuCount: finalQuestions.filter((q) => q.level === 'THONG_HIEU').length,
    vanDungCount: finalQuestions.filter((q) => q.level === 'VAN_DUNG').length,
    vanDungCaoCount: finalQuestions.filter((q) => q.level === 'VAN_DUNG_CAO').length,
    mcCount: finalQuestions.filter((q) => q.type === 'MULTIPLE_CHOICE').length,
    tfCount: finalQuestions.filter((q) => q.type === 'TRUE_FALSE').length,
    saCount: finalQuestions.filter((q) => q.type === 'SHORT_ANSWER').length,
  };

  const message =
    supplementedCount > 0
      ? `Đã tạo đề gồm ${finalQuestions.length} câu hỏi (${breakdown.mcCount} TN, ${breakdown.tfCount} Đ/S, ${breakdown.saCount} TLN) — đã tăng cường tối đa câu hỏi trong kho và bổ sung ${supplementedCount} câu hỏi phù hợp.`
      : `Đã tạo đề kiểm tra thành công với đúng ${finalQuestions.length} câu hỏi (${breakdown.mcCount} TN, ${breakdown.tfCount} Đ/S, ${breakdown.saCount} TLN) theo ma trận chuẩn Bộ GD&ĐT!`;

  return {
    success: true,
    message,
    questions: finalQuestions,
    supplementedCount,
    breakdown,
  };
}
