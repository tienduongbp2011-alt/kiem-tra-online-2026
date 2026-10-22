import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Exam, ExamStatus, Question, QuestionLevel } from '../../types';
import { generateExamFromMatrix, MatrixConfig, shuffleArray } from '../../utils/matrixGenerator';
import {
  PlusCircle,
  Wand2,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit3,
  Play,
  Pause,
  Eye,
  CheckCircle,
  HelpCircle,
  Shuffle,
  X,
  Sparkles,
  BookmarkCheck,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

interface ExamManagementProps {
  onViewResults: (examId: string) => void;
}

type MatrixPresetType = '15P' | '45P' | 'THPTQG' | 'CUSTOM';

const LEVEL_LABELS: Record<QuestionLevel, { label: string; color: string }> = {
  NHAN_BIET: { label: 'Nhận biết', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  THONG_HIEU: { label: 'Thông hiểu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  VAN_DUNG: { label: 'Vận dụng', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  VAN_DUNG_CAO: { label: 'Vận dụng cao', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const ExamManagement: React.FC<ExamManagementProps> = ({ onViewResults }) => {
  const {
    exams,
    classes,
    questions,
    subjects: appSubjects,
    currentUser,
    createExam,
    updateExam,
    deleteExam,
    duplicateExam,
    toggleExamStatus,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState(
    currentUser?.subject || 'ALL'
  );
  const [filterGrade, setFilterGrade] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [viewingExamPaper, setViewingExamPaper] = useState<Exam | null>(null);

  // Form State for Manual / General Exam Editing
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState(
    currentUser?.subject || appSubjects[0]?.name || 'Toán'
  );
  const [formGrade, setFormGrade] = useState<10 | 11 | 12>(12);
  const [formClasses, setFormClasses] = useState<string[]>(['12A1']);
  const [formDuration, setFormDuration] = useState(45);
  const [formStartTime, setFormStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [formEndTime, setFormEndTime] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [formMaxAttempts, setFormMaxAttempts] = useState(1);
  const [formShowAnswers, setFormShowAnswers] = useState(true);
  const [formShuffleQuestions, setFormShuffleQuestions] = useState(false);
  const [formShuffleOptions, setFormShuffleOptions] = useState(false);
  const [formStatus, setFormStatus] = useState<ExamStatus>('OPEN');
  const [formExamCode, setFormExamCode] = useState('DE-101');
  const [formQuestionIds, setFormQuestionIds] = useState<string[]>([]);

  // Matrix Generator Form State (GDPT 2018 Standard as in screenshot)
  const [matrixExamTitle, setMatrixExamTitle] = useState('');
  const [matrixSubject, setMatrixSubject] = useState(
    currentUser?.subject || appSubjects[0]?.name || 'Toán'
  );
  const [matrixGrade, setMatrixGrade] = useState<10 | 11 | 12>(10);
  const [matrixTopic, setMatrixTopic] = useState('ALL');
  const [matrixPreset, setMatrixPreset] = useState<MatrixPresetType>('CUSTOM');
  const [matrixMCCount, setMatrixMCCount] = useState(11);
  const [matrixTFCount, setMatrixTFCount] = useState(3);
  const [matrixSACount, setMatrixSACount] = useState(2);

  const [ratioNB, setRatioNB] = useState(40);
  const [ratioTH, setRatioTH] = useState(30);
  const [ratioVD, setRatioVD] = useState(20);
  const [ratioVDC, setRatioVDC] = useState(10);
  const [matrixShuffleQ, setMatrixShuffleQ] = useState(true);
  const [matrixShuffleOpt, setMatrixShuffleOpt] = useState(true);
  const [matrixCode, setMatrixCode] = useState('101');
  const [matrixTargetClasses, setMatrixTargetClasses] = useState<string[]>(['10C1', '12A1']);
  const [matrixDuration, setMatrixDuration] = useState(45);
  const [showAdvancedMatrixSettings, setShowAdvancedMatrixSettings] = useState(false);

  // Preview state inside Matrix Modal
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [showPreviewSection, setShowPreviewSection] = useState(true);
  const [showPreviewAnswers, setShowPreviewAnswers] = useState(true);
  const [matrixFeedback, setMatrixFeedback] = useState<{ message: string; success: boolean } | null>(
    null
  );

  const previewRef = useRef<HTMLDivElement>(null);

  // Filter exams
  const filteredExams = exams.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.examCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = filterSubject === 'ALL' || e.subject === filterSubject;
    const matchGrade = filterGrade === 'ALL' || String(e.grade) === filterGrade;
    return matchSearch && matchSubject && matchGrade;
  });

  const availableSubjectNames = Array.from(
    new Set([...appSubjects.map((s) => s.name), ...exams.map((e) => e.subject), ...questions.map((q) => q.subject)])
  );

  // Topics / Chapters available for selected matrixSubject
  const subjectQuestionsPool = questions.filter((q) => q.subject === matrixSubject);
  const availableTopics = Array.from(
    new Set(
      subjectQuestionsPool
        .map((q) => q.chapter || q.topic)
        .filter((t): t is string => Boolean(t && t.trim()))
    )
  );

  // Filtered pool for counting "Kho hiện có"
  const topicFilteredPool =
    matrixTopic === 'ALL'
      ? subjectQuestionsPool
      : subjectQuestionsPool.filter(
          (q) =>
            q.chapter === matrixTopic ||
            q.topic === matrixTopic ||
            q.topic.includes(matrixTopic) ||
            (q.chapter && q.chapter.includes(matrixTopic))
        );

  const availMC = topicFilteredPool.filter((q) => q.type === 'MULTIPLE_CHOICE').length;
  const availTF = topicFilteredPool.filter((q) => q.type === 'TRUE_FALSE').length;
  const availSA = topicFilteredPool.filter((q) => q.type === 'SHORT_ANSWER').length;

  const totalMatrixQuestions = matrixMCCount + matrixTFCount + matrixSACount;
  const isExceedingBank =
    matrixMCCount > availMC || matrixTFCount > availTF || matrixSACount > availSA;

  // Build preview exam questions whenever matrix configuration changes or when opened
  const buildMatrixPreview = (
    customMC = matrixMCCount,
    customTF = matrixTFCount,
    customSA = matrixSACount,
    customSubj = matrixSubject,
    customGrade = matrixGrade,
    customTopic = matrixTopic,
    customShuffleQ = matrixShuffleQ,
    customShuffleOpt = matrixShuffleOpt
  ) => {
    const total = customMC + customTF + customSA;
    if (total <= 0) {
      setPreviewQuestions([]);
      return;
    }

    const config: MatrixConfig = {
      subject: customSubj,
      grade: customGrade,
      topic: customTopic,
      totalQuestions: total,
      typeCounts: {
        multipleChoice: customMC,
        trueFalse: customTF,
        shortAnswer: customSA,
      },
      ratios: {
        nhanBiet: ratioNB,
        thongHieu: ratioTH,
        vanDung: ratioVD,
        vanDungCao: ratioVDC,
      },
      shuffleQuestions: customShuffleQ,
      shuffleOptions: customShuffleOpt,
      examCode: matrixCode,
    };

    const res = generateExamFromMatrix(questions, config);
    setPreviewQuestions(res.questions);
  };

  useEffect(() => {
    if (showMatrixModal) {
      buildMatrixPreview();
    }
  }, [
    showMatrixModal,
    matrixSubject,
    matrixGrade,
    matrixTopic,
    matrixMCCount,
    matrixTFCount,
    matrixSACount,
    ratioNB,
    ratioTH,
    ratioVD,
    ratioVDC,
    matrixShuffleQ,
    matrixShuffleOpt,
  ]);

  // Preset selection handler
  const handleSelectPreset = (preset: MatrixPresetType) => {
    setMatrixPreset(preset);
    if (preset === '15P') {
      setMatrixMCCount(6);
      setMatrixTFCount(2);
      setMatrixSACount(2);
      setMatrixDuration(15);
    } else if (preset === '45P') {
      setMatrixMCCount(12);
      setMatrixTFCount(4);
      setMatrixSACount(4);
      setMatrixDuration(45);
    } else if (preset === 'THPTQG') {
      setMatrixMCCount(22);
      setMatrixTFCount(4);
      setMatrixSACount(8);
      setMatrixDuration(50);
    }
  };

  // Swap a single question in preview with another from bank/supplement
  const handleSwapQuestionInPreview = (questionToSwap: Question, indexInPreview: number) => {
    const currentIds = new Set(previewQuestions.map((q) => q.id));
    const candidates = topicFilteredPool.filter(
      (q) => q.type === questionToSwap.type && !currentIds.has(q.id)
    );

    if (candidates.length > 0) {
      const replacement = shuffleArray(candidates)[0];
      const updated = [...previewQuestions];
      updated[indexInPreview] = { ...replacement };
      setPreviewQuestions(updated);
    } else {
      // Generate a fresh supplementary question of the same type
      const res = generateExamFromMatrix(questions, {
        subject: matrixSubject,
        grade: matrixGrade,
        topic: matrixTopic,
        totalQuestions: 1,
        typeCounts: {
          multipleChoice: questionToSwap.type === 'MULTIPLE_CHOICE' ? 1 : 0,
          trueFalse: questionToSwap.type === 'TRUE_FALSE' ? 1 : 0,
          shortAnswer: questionToSwap.type === 'SHORT_ANSWER' ? 1 : 0,
        },
        ratios: { nhanBiet: 25, thongHieu: 25, vanDung: 25, vanDungCao: 25 },
        shuffleQuestions: true,
        shuffleOptions: true,
        examCode: matrixCode,
      });
      if (res.questions.length > 0) {
        const updated = [...previewQuestions];
        updated[indexInPreview] = {
          ...res.questions[0],
          id: `${res.questions[0].id}_swap_${Date.now().toString().slice(-3)}`,
        };
        setPreviewQuestions(updated);
      }
    }
  };

  // Export exam paper to Word (.doc)
  const handleExportExamToWord = (
    title: string,
    subject: string,
    grade: number,
    duration: number,
    code: string,
    examQuestions: Question[],
    includeAnswers = true
  ) => {
    const part1 = examQuestions.filter((q) => q.type === 'MULTIPLE_CHOICE');
    const part2 = examQuestions.filter((q) => q.type === 'TRUE_FALSE');
    const part3 = examQuestions.filter((q) => q.type === 'SHORT_ANSWER');

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>${title}</title>
      <style>
        body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.5; }
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .header-table td { text-align: center; vertical-align: top; }
        .part-title { font-weight: bold; text-transform: uppercase; margin-top: 14px; margin-bottom: 6px; }
        .question { margin-bottom: 10px; }
        .options { margin-left: 16px; }
      </style>
      </head><body>
      <table class="header-table">
        <tr>
          <td style="width: 45%;">
            <b>SỞ GD&ĐT ĐỒNG NAI</b><br/>
            <b>TRƯỜNG THPT THANH HÒA</b><br/>
            <span>--------------------</span>
          </td>
          <td style="width: 55%;">
            <b>${title.toUpperCase()}</b><br/>
            <b>Môn: ${subject} – Khối ${grade}</b><br/>
            <i>Thời gian làm bài: ${duration} phút (không kể thời gian phát đề)</i><br/>
            <b>Mã đề: ${code}</b>
          </td>
        </tr>
      </table>
      <hr/>
    `;

    if (part1.length > 0) {
      html += `<div class="part-title">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (${part1.length} câu). Thí sinh trả lời từ câu 1 đến câu ${part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.</div>`;
      part1.forEach((q, idx) => {
        html += `<div class="question"><b>Câu ${idx + 1}:</b> ${q.content}<div class="options">`;
        (q.options || []).forEach((opt) => {
          const isAns = includeAnswers && opt.key === q.correctAnswer;
          html += `<div>${isAns ? `<u><b>${opt.key}.</b></u>` : `<b>${opt.key}.</b>`} ${opt.content}</div>`;
        });
        html += `</div></div>`;
      });
    }

    if (part2.length > 0) {
      html += `<div class="part-title">PHẦN II. Câu trắc nghiệm đúng sai (${part2.length} câu). Thí sinh trả lời từ câu 1 đến câu ${part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.</div>`;
      part2.forEach((q, idx) => {
        html += `<div class="question"><b>Câu ${idx + 1}:</b> ${q.content}<div class="options">`;
        (q.tfStatements || []).forEach((st) => {
          html += `<div><b>${st.key})</b> ${st.content} ${
            includeAnswers ? `<b>[${st.isCorrect ? 'ĐÚNG' : 'SAI'}]</b>` : ''
          }</div>`;
        });
        html += `</div></div>`;
      });
    }

    if (part3.length > 0) {
      html += `<div class="part-title">PHẦN III. Câu trắc nghiệm trả lời ngắn (${part3.length} câu). Thí sinh trả lời từ câu 1 đến câu ${part3.length}.</div>`;
      part3.forEach((q, idx) => {
        html += `<div class="question"><b>Câu ${idx + 1}:</b> ${q.content}`;
        if (includeAnswers) {
          html += `<br/><i>Đáp án: <b>${q.correctAnswer}</b></i>`;
        }
        html += `</div>`;
      });
    }

    html += `<p style="text-align:center; font-weight:bold; margin-top:24px;">--- HẾT ---</p></body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `De_Thi_${subject}_Khoi_${grade}_Ma_${code}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handlers for manual form
  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormTitle(exam.title);
    setFormSubject(exam.subject);
    setFormGrade(exam.grade);
    setFormClasses(exam.classIds);
    setFormDuration(exam.durationMinutes);
    setFormStartTime(exam.startTime?.slice(0, 16) || '');
    setFormEndTime(exam.endTime?.slice(0, 16) || '');
    setFormMaxAttempts(exam.maxAttempts);
    setFormShowAnswers(exam.showAnswersAfterSubmit);
    setFormShuffleQuestions(exam.shuffleQuestions);
    setFormShuffleOptions(exam.shuffleOptions);
    setFormStatus(exam.status);
    setFormExamCode(exam.examCode);
    setFormQuestionIds(exam.questionIds);
    setShowCreateModal(true);
  };

  const handleOpenCreateNew = () => {
    setEditingExam(null);
    setFormTitle('');
    setFormSubject('Toán');
    setFormGrade(12);
    setFormClasses(['12A1']);
    setFormDuration(45);
    setFormStartTime(new Date().toISOString().slice(0, 16));
    setFormEndTime(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 16));
    setFormMaxAttempts(1);
    setFormShowAnswers(true);
    setFormShuffleQuestions(false);
    setFormShuffleOptions(false);
    setFormStatus('OPEN');
    setFormExamCode(`DE-${Math.floor(100 + Math.random() * 900)}`);
    setFormQuestionIds([]);
    setShowCreateModal(true);
  };

  const handleSaveManualExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      return;
    }

    const availableQ = questions.filter(
      (q) => formQuestionIds.includes(q.id) || (q.subject === formSubject && q.grade === formGrade)
    );
    const chosenQ =
      formQuestionIds.length > 0
        ? questions.filter((q) => formQuestionIds.includes(q.id))
        : availableQ.slice(0, 10);

    const examData = {
      title: formTitle.trim(),
      subject: formSubject,
      grade: formGrade,
      classIds: formClasses,
      durationMinutes: formDuration,
      startTime: formStartTime,
      endTime: formEndTime,
      questionIds: chosenQ.map((q) => q.id),
      questions: chosenQ,
      totalPoints: 10,
      maxAttempts: formMaxAttempts,
      showAnswersAfterSubmit: formShowAnswers,
      shuffleQuestions: formShuffleQuestions,
      shuffleOptions: formShuffleOptions,
      status: formStatus,
      examCode: formExamCode.trim(),
    };

    if (editingExam) {
      updateExam(editingExam.id, examData);
    } else {
      createExam(examData);
    }

    setShowCreateModal(false);
    setEditingExam(null);
  };

  // Matrix generation & official creation from previewed questions
  const handleConfirmCreateMatrixExam = () => {
    if (previewQuestions.length === 0) {
      setMatrixFeedback({
        message: 'Vui lòng chọn ít nhất 1 câu hỏi trong cấu hình ma trận đề thi!',
        success: false,
      });
      return;
    }

    const finalTitle =
      matrixExamTitle.trim() ||
      `Kiểm tra ${matrixDuration} phút ${matrixSubject} ${matrixGrade} (Ma trận GDPT)`;

    const matchingGradeClasses = classes
      .filter((c) => c.grade === matrixGrade)
      .map((c) => c.name);
    const assignedClasses =
      matrixTargetClasses.length > 0
        ? matrixTargetClasses
        : matchingGradeClasses.length > 0
        ? matchingGradeClasses
        : ['10C1'];

    createExam({
      title: finalTitle,
      subject: matrixSubject,
      grade: matrixGrade,
      classIds: assignedClasses,
      durationMinutes: matrixDuration,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      questionIds: previewQuestions.map((q) => q.id),
      questions: previewQuestions,
      totalPoints: 10,
      maxAttempts: 1,
      showAnswersAfterSubmit: true,
      shuffleQuestions: matrixShuffleQ,
      shuffleOptions: matrixShuffleOpt,
      status: 'OPEN',
      examCode: matrixCode || '101',
    });

    const mc = previewQuestions.filter((q) => q.type === 'MULTIPLE_CHOICE').length;
    const tf = previewQuestions.filter((q) => q.type === 'TRUE_FALSE').length;
    const sa = previewQuestions.filter((q) => q.type === 'SHORT_ANSWER').length;

    setMatrixFeedback({
      message: `Đã xuất và tạo đề thi "${finalTitle}" thành công với ${previewQuestions.length} câu hỏi (${mc} TN • ${tf} Đ/S • ${sa} TLN)!`,
      success: true,
    });

    setTimeout(() => {
      setShowMatrixModal(false);
      setMatrixFeedback(null);
    }, 1200);
  };

  const part1Preview = previewQuestions.filter((q) => q.type === 'MULTIPLE_CHOICE');
  const part2Preview = previewQuestions.filter((q) => q.type === 'TRUE_FALSE');
  const part3Preview = previewQuestions.filter((q) => q.type === 'SHORT_ANSWER');

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            QUẢN LÝ BÀI KIỂM TRA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tạo đề thi theo ma trận đặc tả Bộ GD&ĐT (GDPT 2018), xem trước đề, giao lớp và kiểm soát thời gian thi
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setMatrixFeedback(null);
              setShowPreviewSection(true);
              setShowMatrixModal(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-[#FF8A00] hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>TẠO ĐỀ THEO MA TRẬN ĐẶC TẢ</span>
          </button>
          <button
            onClick={handleOpenCreateNew}
            className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>TẠO BÀI KIỂM TRA MỚI</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bài thi, mã đề..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#0D47A1] focus:border-[#0D47A1]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Môn:</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-700"
            >
              <option value="ALL">Tất cả môn</option>
              {availableSubjectNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
            <span>Khối:</span>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-700"
            >
              <option value="ALL">Tất cả</option>
              <option value="12">Khối 12</option>
              <option value="11">Khối 11</option>
              <option value="10">Khối 10</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Tên bài kiểm tra</th>
                <th className="py-3.5 px-3">Môn & Khối</th>
                <th className="py-3.5 px-3">Lớp được giao</th>
                <th className="py-3.5 px-3 text-center">Thời gian</th>
                <th className="py-3.5 px-3 text-center">Số câu</th>
                <th className="py-3.5 px-3 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredExams.map((exam) => {
                const questionCount = exam.questions?.length || exam.questionIds.length;
                const isOpened = exam.status === 'OPEN';

                return (
                  <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-800">{exam.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Mã đề:{' '}
                        <span className="font-mono text-slate-600 font-bold">{exam.examCode}</span>
                        {exam.shuffleQuestions && ' • Trộn câu'}
                        {exam.shuffleOptions && ' • Trộn phương án'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0D47A1] font-bold text-xs">
                        {exam.subject} - K{exam.grade}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      {exam.classIds.join(', ')}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {exam.durationMinutes} phút
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {questionCount} câu
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          isOpened
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isOpened ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Preview Exam Paper */}
                        <button
                          onClick={() => setViewingExamPaper(exam)}
                          title="Xem nội dung đề thi & Xuất Word"
                          className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Toggle Open/Closed */}
                        <button
                          onClick={() => toggleExamStatus(exam.id)}
                          title={isOpened ? 'Đóng bài kiểm tra' : 'Mở bài kiểm tra'}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            isOpened
                              ? 'text-amber-700 hover:bg-amber-100'
                              : 'text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {isOpened ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        {/* View Results */}
                        <button
                          onClick={() => onViewResults(exam.id)}
                          title="Xem kết quả học sinh"
                          className="p-1.5 rounded-lg text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(exam)}
                          title="Chỉnh sửa bài kiểm tra"
                          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => duplicateExam(exam.id)}
                          title="Sao chép đề kiểm tra"
                          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteExam(exam.id)}
                          title="Xóa đề kiểm tra"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO ĐỀ THI TỰ ĐỘNG THEO MA TRẬN ĐỀ (CHUẨN BỘ GD&ĐT GDPT 2018)   */}
      {/* ========================================================================= */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 animate-in fade-in zoom-in-95">
            {/* TOP DARK NAVY HEADER AS IN SCREENSHOT */}
            <div className="bg-[#0F3174] px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1E4590] border border-white/15 flex items-center justify-center shadow-inner flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-[#FF8A00]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase text-white">
                    TẠO ĐỀ THI TỰ ĐỘNG THEO MA TRẬN ĐỀ
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-200/90 mt-0.5 font-medium">
                    Ma trận cấu trúc theo chuẩn Bộ GD&ĐT (GDPT 2018): Trắc nghiệm nhiều phương án, Đúng/Sai 4 ý, Trả lời ngắn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="text-blue-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
              {matrixFeedback && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2.5 ${
                    matrixFeedback.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {matrixFeedback.success ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <HelpCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                  )}
                  <span>{matrixFeedback.message}</span>
                </div>
              )}

              {/* ROW 1: TÊN BÀI KIỂM TRA * & MÔN HỌC * */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-8">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                    TÊN BÀI KIỂM TRA *
                  </label>
                  <input
                    type="text"
                    value={matrixExamTitle}
                    onChange={(e) => setMatrixExamTitle(e.target.value)}
                    placeholder={`Ví dụ: Kiểm tra 15 phút ${matrixSubject} ${matrixGrade} - Chương 1 (Ma trận GDPT)`}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0D47A1] focus:border-[#0D47A1] outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                    MÔN HỌC *
                  </label>
                  <select
                    value={matrixSubject}
                    onChange={(e) => {
                      setMatrixSubject(e.target.value);
                      setMatrixTopic('ALL');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-extrabold text-[#0D47A1] bg-white focus:ring-2 focus:ring-[#0D47A1] focus:border-[#0D47A1] outline-none cursor-pointer"
                  >
                    {availableSubjectNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROW 2: ĐƠN VỊ & PHẠM VI KIẾN THỨC / CHỦ ĐỀ */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-4">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                    ĐƠN VỊ
                  </label>
                  <select
                    value={matrixGrade}
                    onChange={(e) => {
                      const newGrade = Number(e.target.value) as 10 | 11 | 12;
                      setMatrixGrade(newGrade);
                      const matchingCls = classes
                        .filter((c) => c.grade === newGrade)
                        .map((c) => c.name);
                      if (matchingCls.length > 0) {
                        setMatrixTargetClasses(matchingCls);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/90 text-slate-700 font-semibold text-sm focus:ring-2 focus:ring-[#0D47A1] outline-none cursor-pointer"
                  >
                    <option value={10}>Khối 10 – THPT Thanh Hòa (Đồng Nai)</option>
                    <option value={11}>Khối 11 – THPT Thanh Hòa (Đồng Nai)</option>
                    <option value={12}>Khối 12 – THPT Thanh Hòa (Đồng Nai)</option>
                  </select>
                </div>

                <div className="md:col-span-8">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                    PHẠM VI KIẾN THỨC / CHỦ ĐỀ
                  </label>
                  <select
                    value={matrixTopic}
                    onChange={(e) => setMatrixTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-[#0D47A1] outline-none cursor-pointer"
                  >
                    <option value="ALL">
                      Toàn bộ các chương trình & chủ đề trong môn {matrixSubject}
                    </option>
                    {availableTopics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MAIN CONFIGURATION CONTAINER (BỘ GD&ĐT) AS IN SCREENSHOT */}
              <div className="bg-[#F6F9FF] border border-blue-200/80 rounded-3xl p-5 sm:p-6 space-y-5">
                {/* Header bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-blue-100">
                  <div className="flex items-center space-x-2 text-[#0D47A1]">
                    <BookmarkCheck className="w-5 h-5 stroke-[2.2]" />
                    <h3 className="font-black text-sm sm:text-base uppercase tracking-tight">
                      CẤU HÌNH CÂU HỎI TRONG ĐỀ THI (BỘ GD&ĐT)
                    </h3>
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-[#DCE8FF] text-[#0D47A1] font-extrabold text-xs sm:text-sm">
                    Tổng cộng: {totalMatrixQuestions} câu hỏi
                  </span>
                </div>

                {/* Preset Templates */}
                <div className="space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                    CHỌN CHUẨN MA TRẬN CẤU TRÚC MẪU:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('15P')}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        matrixPreset === '15P'
                          ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-extrabold text-xs sm:text-sm">Mẫu 15 phút (10 câu)</div>
                      <div
                        className={`text-xs mt-1 font-medium ${
                          matrixPreset === '15P' ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        6 TN • 2 Đ/S • 2 TLN
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset('45P')}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        matrixPreset === '45P'
                          ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-extrabold text-xs sm:text-sm">
                        Mẫu 45-50 phút (20 câu)
                      </div>
                      <div
                        className={`text-xs mt-1 font-medium ${
                          matrixPreset === '45P' ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        12 TN • 4 Đ/S • 4 TLN
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset('THPTQG')}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        matrixPreset === 'THPTQG'
                          ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-extrabold text-xs sm:text-sm">Mẫu THPT QG (34 câu)</div>
                      <div
                        className={`text-xs mt-1 font-medium ${
                          matrixPreset === 'THPTQG' ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        22 TN • 4 Đ/S • 8 TLN
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset('CUSTOM')}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        matrixPreset === 'CUSTOM'
                          ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-extrabold text-xs sm:text-sm">Tự cấu hình số</div>
                      <div
                        className={`text-xs mt-1 font-extrabold ${
                          matrixPreset === 'CUSTOM' ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        Tùy chỉnh số
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3 Question Type Cards: I, II, III */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* CARD I: Multiple Choice 4 options */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#0D47A1] font-black text-xs">
                          I
                        </span>
                        <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                          Trắc nghiệm 4 lựa chọn
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={matrixMCCount}
                          onChange={(e) => {
                            setMatrixPreset('CUSTOM');
                            setMatrixMCCount(Math.max(0, Number(e.target.value)));
                          }}
                          className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-center font-black text-base text-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1] outline-none"
                        />
                        <span className="text-xs sm:text-sm text-slate-600 font-medium">câu</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Kho hiện có:</span>
                      <span className="font-extrabold text-slate-900">{availMC} câu</span>
                    </div>
                  </div>

                  {/* CARD II: True / False (4 statements) */}
                  <div className="bg-white rounded-2xl border border-purple-200 p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-black text-xs">
                          II
                        </span>
                        <span className="font-extrabold text-purple-900 text-xs sm:text-sm">
                          Câu hỏi Đúng / Sai (4 ý)
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={matrixTFCount}
                          onChange={(e) => {
                            setMatrixPreset('CUSTOM');
                            setMatrixTFCount(Math.max(0, Number(e.target.value)));
                          }}
                          className="w-24 px-3 py-2 rounded-xl border border-purple-200 text-center font-black text-base text-purple-700 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                        <span className="text-xs sm:text-sm text-slate-600 font-medium">
                          câu ( {matrixTFCount * 4} ý)
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Kho hiện có:</span>
                      <span className="font-extrabold text-purple-700">{availTF} câu</span>
                    </div>
                  </div>

                  {/* CARD III: Short Answer */}
                  <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-black text-xs">
                          III
                        </span>
                        <span className="font-extrabold text-emerald-900 text-xs sm:text-sm">
                          Câu hỏi Trả lời ngắn
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={matrixSACount}
                          onChange={(e) => {
                            setMatrixPreset('CUSTOM');
                            setMatrixSACount(Math.max(0, Number(e.target.value)));
                          }}
                          className="w-24 px-3 py-2 rounded-xl border border-emerald-200 text-center font-black text-base text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <span className="text-xs sm:text-sm text-slate-600 font-medium">câu</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Kho hiện có:</span>
                      <span className="font-extrabold text-emerald-700">{availSA} câu</span>
                    </div>
                  </div>
                </div>

                {/* Yellow Warning Notice when requested > available */}
                {isExceedingBank && (
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 flex items-start space-x-3 text-xs sm:text-sm text-[#92400E]">
                    <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <span className="font-extrabold text-[#B45309]">
                        Lưu ý về số lượng câu hỏi:
                      </span>{' '}
                      Số lượng câu hỏi yêu cầu ở một số dạng đang lớn hơn số câu hiện có trong đề
                      môn {matrixSubject} . Hệ thống sẽ tăng cường tối đa số lượng câu hỏi có sẵn
                      và bổ sung các câu hỏi phù hợp nhất để đảm bảo đủ bài thi.
                    </p>
                  </div>
                )}

                {/* Collapsible Advanced Settings (Time, Code, Classes, Level Ratios) */}
                <div className="pt-2 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedMatrixSettings(!showAdvancedMatrixSettings)}
                    className="flex items-center justify-between w-full text-xs font-extrabold text-slate-600 hover:text-[#0D47A1] py-1.5 cursor-pointer"
                  >
                    <span>
                      CÀI ĐẶT THỜI GIAN ({matrixDuration} PHÚT), MÃ ĐỀ ({matrixCode}), LỚP GIAO BÀI
                      & TỶ LỆ NHẬN THỨC
                    </span>
                    {showAdvancedMatrixSettings ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showAdvancedMatrixSettings && (
                    <div className="mt-3 pt-3 border-t border-blue-100/60 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Thời gian làm bài (phút)
                          </label>
                          <input
                            type="number"
                            min={5}
                            max={180}
                            value={matrixDuration}
                            onChange={(e) => setMatrixDuration(Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Mã đề thi
                          </label>
                          <input
                            type="text"
                            value={matrixCode}
                            onChange={(e) => setMatrixCode(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm"
                          />
                        </div>
                        <div className="flex flex-col justify-center space-y-2 pt-3">
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={matrixShuffleQ}
                              onChange={(e) => setMatrixShuffleQ(e.target.checked)}
                              className="w-4 h-4 rounded text-[#0D47A1]"
                            />
                            <span>Trộn thứ tự câu hỏi</span>
                          </label>
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={matrixShuffleOpt}
                              onChange={(e) => setMatrixShuffleOpt(e.target.checked)}
                              className="w-4 h-4 rounded text-[#0D47A1]"
                            />
                            <span>Trộn phương án A, B, C, D</span>
                          </label>
                        </div>
                      </div>

                      {/* Target classes pills */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Chọn lớp giao bài kiểm tra:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {classes.map((cls) => {
                            const selected = matrixTargetClasses.includes(cls.name);
                            return (
                              <button
                                key={cls.id}
                                type="button"
                                onClick={() => {
                                  if (selected) {
                                    setMatrixTargetClasses(
                                      matrixTargetClasses.filter((c) => c !== cls.name)
                                    );
                                  } else {
                                    setMatrixTargetClasses([...matrixTargetClasses, cls.name]);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                                  selected
                                    ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                }`}
                              >
                                {selected && <Check className="w-3.5 h-3.5" />}
                                <span>
                                  Lớp {cls.name} (K{cls.grade})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cognitive Level Ratios */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-xs font-bold text-blue-700 block mb-1">
                            Nhận biết (%)
                          </span>
                          <input
                            type="number"
                            value={ratioNB}
                            onChange={(e) => setRatioNB(Number(e.target.value))}
                            className="w-16 text-center font-black border border-slate-300 rounded p-1 text-xs"
                          />
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-xs font-bold text-emerald-700 block mb-1">
                            Thông hiểu (%)
                          </span>
                          <input
                            type="number"
                            value={ratioTH}
                            onChange={(e) => setRatioTH(Number(e.target.value))}
                            className="w-16 text-center font-black border border-slate-300 rounded p-1 text-xs"
                          />
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-xs font-bold text-amber-700 block mb-1">
                            Vận dụng (%)
                          </span>
                          <input
                            type="number"
                            value={ratioVD}
                            onChange={(e) => setRatioVD(Number(e.target.value))}
                            className="w-16 text-center font-black border border-slate-300 rounded p-1 text-xs"
                          />
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-xs font-bold text-rose-700 block mb-1">
                            Vận dụng cao (%)
                          </span>
                          <input
                            type="number"
                            value={ratioVDC}
                            onChange={(e) => setRatioVDC(Number(e.target.value))}
                            className="w-16 text-center font-black border border-slate-300 rounded p-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* XEM TRƯỚC ĐỀ THI CHO GIÁO VIÊN TRƯỚC KHI XUẤT / TẠO ĐỀ                    */}
              {/* ========================================================================= */}
              <div
                ref={previewRef}
                className="border-2 border-indigo-200 bg-white rounded-3xl overflow-hidden shadow-sm"
              >
                {/* Preview Header Toolbar */}
                <div className="bg-gradient-to-r from-indigo-900 to-[#0D47A1] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base uppercase tracking-tight">
                        XEM TRƯỚC ĐỀ THI TRƯỚC KHI XUẤT TẠO ĐỀ ({previewQuestions.length} CÂU)
                      </h3>
                      <p className="text-xs text-blue-100">
                        Giáo viên kiểm tra nội dung câu hỏi, đáp án hoặc đổi câu hỏi bất kỳ trước khi xuất đề chính thức
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPreviewAnswers(!showPreviewAnswers)}
                      className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {showPreviewAnswers ? 'Ẩn đáp án & lời giải' : 'Hiện đáp án & lời giải'}
                    </button>

                    <button
                      type="button"
                      onClick={() => buildMatrixPreview()}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Bốc lại bộ đề khác</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setShowPreviewSection(!showPreviewSection)
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                    >
                      {showPreviewSection ? 'Thu gọn' : 'Mở rộng'}
                    </button>
                  </div>
                </div>

                {showPreviewSection && (
                  <div className="p-5 sm:p-6 space-y-6 bg-slate-50/60">
                    {/* Official Exam Paper Header Box */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center border-b border-slate-200 pb-4">
                        <div>
                          <div className="text-xs font-bold text-slate-600 uppercase">
                            SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐỒNG NAI
                          </div>
                          <div className="text-sm font-black text-slate-900 uppercase mt-0.5">
                            TRƯỜNG THPT THANH HÒA
                          </div>
                          <div className="w-24 h-0.5 bg-slate-400 mx-auto mt-1.5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-[#0D47A1] uppercase">
                            {matrixExamTitle.trim() ||
                              `ĐỀ KIỂM TRA ĐỊNH KỲ MÔN ${matrixSubject.toUpperCase()} - KHỐI ${matrixGrade}`}
                          </div>
                          <div className="text-xs font-bold text-slate-700 mt-1">
                            Môn: {matrixSubject} • Khối {matrixGrade} • Thời gian làm bài:{' '}
                            {matrixDuration} phút
                          </div>
                          <div className="inline-block mt-1.5 px-3 py-0.5 rounded bg-slate-100 border border-slate-300 text-xs font-black text-slate-800">
                            Mã đề: {matrixCode || '101'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-slate-600 font-semibold">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0D47A1] font-bold">
                            Phần I (Trắc nghiệm 4 lựa chọn): {part1Preview.length} câu
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold">
                            Phần II (Đúng/Sai 4 ý): {part2Preview.length} câu (
                            {part2Preview.length * 4} ý)
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                            Phần III (Trả lời ngắn): {part3Preview.length} câu
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleExportExamToWord(
                              matrixExamTitle.trim() ||
                                `Đề kiểm tra ${matrixSubject} Khối ${matrixGrade}`,
                              matrixSubject,
                              matrixGrade,
                              matrixDuration,
                              matrixCode || '101',
                              previewQuestions,
                              showPreviewAnswers
                            )
                          }
                          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-[#0D47A1]" />
                          <span>Tải file Word (.doc) đề này</span>
                        </button>
                      </div>
                    </div>

                    {previewQuestions.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-sm font-medium bg-white rounded-2xl border border-slate-200">
                        Chưa có câu hỏi nào. Vui lòng nhập số lượng câu hỏi lớn hơn 0 ở phần cấu hình bên trên.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* PHẦN I: MULTIPLE CHOICE */}
                        {part1Preview.length > 0 && (
                          <div className="space-y-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                              <div className="font-black text-[#0D47A1] text-xs sm:text-sm uppercase">
                                PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn ({part1Preview.length}{' '}
                                câu)
                              </div>
                              <span className="text-xs font-semibold text-blue-700">
                                Thí sinh trả lời từ câu 1 đến câu {part1Preview.length}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {part1Preview.map((q, idx) => {
                                const globalIdx = previewQuestions.findIndex(
                                  (item) => item.id === q.id
                                );
                                const lv = LEVEL_LABELS[q.level] || LEVEL_LABELS.NHAN_BIET;
                                return (
                                  <div
                                    key={`${q.id}_${idx}`}
                                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                                        <span className="font-black text-[#0D47A1] mr-1.5">
                                          Câu {idx + 1}:
                                        </span>
                                        <span className="font-semibold">{q.content}</span>
                                      </div>
                                      <div className="flex items-center space-x-2 flex-shrink-0">
                                        <span
                                          className={`px-2 py-0.5 rounded border text-[11px] font-bold ${lv.color}`}
                                        >
                                          {lv.label}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleSwapQuestionInPreview(q, globalIdx)}
                                          title="Đổi câu hỏi khác cùng dạng"
                                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-xs font-bold text-slate-600 hover:text-[#0D47A1] flex items-center space-x-1 transition-colors cursor-pointer"
                                        >
                                          <Shuffle className="w-3 h-3" />
                                          <span>Đổi câu</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                      {(q.options || []).map((opt) => {
                                        const isCorrect =
                                          showPreviewAnswers && opt.key === q.correctAnswer;
                                        return (
                                          <div
                                            key={opt.key}
                                            className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm flex items-center space-x-2.5 ${
                                              isCorrect
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                                : 'bg-slate-50/70 border-slate-200 text-slate-700'
                                            }`}
                                          >
                                            <span
                                              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                                isCorrect
                                                  ? 'bg-emerald-600 text-white'
                                                  : 'bg-white border border-slate-300 text-slate-700'
                                              }`}
                                            >
                                              {opt.key}
                                            </span>
                                            <span>{opt.content}</span>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {showPreviewAnswers && q.explanation && (
                                      <div className="text-xs bg-amber-50/70 border border-amber-200/80 text-amber-900 rounded-xl p-3">
                                        <span className="font-extrabold">Lời giải chi tiết: </span>
                                        {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* PHẦN II: TRUE / FALSE (4 STATEMENTS) */}
                        {part2Preview.length > 0 && (
                          <div className="space-y-3">
                            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                              <div className="font-black text-purple-900 text-xs sm:text-sm uppercase">
                                PHẦN II. Câu trắc nghiệm Đúng / Sai ({part2Preview.length} câu •{' '}
                                {part2Preview.length * 4} ý)
                              </div>
                              <span className="text-xs font-semibold text-purple-700">
                                Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai
                              </span>
                            </div>

                            <div className="space-y-3">
                              {part2Preview.map((q, idx) => {
                                const globalIdx = previewQuestions.findIndex(
                                  (item) => item.id === q.id
                                );
                                const lv = LEVEL_LABELS[q.level] || LEVEL_LABELS.THONG_HIEU;
                                return (
                                  <div
                                    key={`${q.id}_${idx}`}
                                    className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-2xs space-y-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                                        <span className="font-black text-purple-700 mr-1.5">
                                          Câu {idx + 1}:
                                        </span>
                                        <span className="font-semibold">{q.content}</span>
                                      </div>
                                      <div className="flex items-center space-x-2 flex-shrink-0">
                                        <span
                                          className={`px-2 py-0.5 rounded border text-[11px] font-bold ${lv.color}`}
                                        >
                                          {lv.label}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleSwapQuestionInPreview(q, globalIdx)}
                                          title="Đổi câu hỏi khác cùng dạng"
                                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-xs font-bold text-slate-600 hover:text-purple-700 flex items-center space-x-1 transition-colors cursor-pointer"
                                        >
                                          <Shuffle className="w-3 h-3" />
                                          <span>Đổi câu</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-2 pt-1">
                                      {(q.tfStatements || []).map((st) => (
                                        <div
                                          key={st.key}
                                          className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs sm:text-sm"
                                        >
                                          <div className="text-slate-700">
                                            <span className="font-black text-purple-700 mr-2">
                                              {st.key})
                                            </span>
                                            <span>{st.content}</span>
                                          </div>
                                          {showPreviewAnswers && (
                                            <span
                                              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex-shrink-0 ${
                                                st.isCorrect
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : 'bg-rose-100 text-rose-800'
                                              }`}
                                            >
                                              {st.isCorrect ? 'Đúng' : 'Sai'}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {showPreviewAnswers && q.explanation && (
                                      <div className="text-xs bg-amber-50/70 border border-amber-200/80 text-amber-900 rounded-xl p-3">
                                        <span className="font-extrabold">Lời giải chi tiết: </span>
                                        {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* PHẦN III: SHORT ANSWER */}
                        {part3Preview.length > 0 && (
                          <div className="space-y-3">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                              <div className="font-black text-emerald-900 text-xs sm:text-sm uppercase">
                                PHẦN III. Câu trắc nghiệm trả lời ngắn ({part3Preview.length} câu)
                              </div>
                              <span className="text-xs font-semibold text-emerald-700">
                                Thí sinh điền kết quả số vào ô trả lời
                              </span>
                            </div>

                            <div className="space-y-3">
                              {part3Preview.map((q, idx) => {
                                const globalIdx = previewQuestions.findIndex(
                                  (item) => item.id === q.id
                                );
                                const lv = LEVEL_LABELS[q.level] || LEVEL_LABELS.VAN_DUNG;
                                return (
                                  <div
                                    key={`${q.id}_${idx}`}
                                    className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-2xs space-y-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                                        <span className="font-black text-emerald-700 mr-1.5">
                                          Câu {idx + 1}:
                                        </span>
                                        <span className="font-semibold">{q.content}</span>
                                      </div>
                                      <div className="flex items-center space-x-2 flex-shrink-0">
                                        <span
                                          className={`px-2 py-0.5 rounded border text-[11px] font-bold ${lv.color}`}
                                        >
                                          {lv.label}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleSwapQuestionInPreview(q, globalIdx)}
                                          title="Đổi câu hỏi khác cùng dạng"
                                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center space-x-1 transition-colors cursor-pointer"
                                        >
                                          <Shuffle className="w-3 h-3" />
                                          <span>Đổi câu</span>
                                        </button>
                                      </div>
                                    </div>

                                    {showPreviewAnswers && (
                                      <div className="flex flex-wrap items-center gap-3 pt-1">
                                        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-black">
                                          Đáp án đúng: {q.correctAnswer}
                                        </div>
                                        {q.explanation && (
                                          <div className="text-xs text-slate-600">
                                            <span className="font-bold text-slate-700">
                                              Giải thích:{' '}
                                            </span>
                                            {q.explanation}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                Đề thi gồm <span className="font-black text-slate-800">{previewQuestions.length}</span> câu hỏi ({part1Preview.length} TN • {part2Preview.length} Đ/S • {part3Preview.length} TLN)
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMatrixModal(false)}
                  className="py-2.5 px-5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewSection(true);
                    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-extrabold text-xs sm:text-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem trước đề ({previewQuestions.length} câu)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleExportExamToWord(
                      matrixExamTitle.trim() ||
                        `Đề kiểm tra ${matrixSubject} Khối ${matrixGrade}`,
                      matrixSubject,
                      matrixGrade,
                      matrixDuration,
                      matrixCode || '101',
                      previewQuestions,
                      showPreviewAnswers
                    )
                  }
                  className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs sm:text-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#0D47A1]" />
                  <span>Xuất file Word</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCreateMatrixExam}
                  className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                  <span>XUẤT & TẠO ĐỀ THI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XEM ĐỀ THI ĐÃ TẠO (CHO BẤT KỲ ĐỀ THI NÀO TRONG DANH SÁCH)          */}
      {/* ========================================================================= */}
      {viewingExamPaper && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="bg-[#0F3174] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-[#FF8A00]" />
                <div>
                  <h2 className="text-base sm:text-lg font-black uppercase">
                    XEM ĐỀ THI: {viewingExamPaper.title}
                  </h2>
                  <p className="text-xs text-blue-200">
                    Môn: {viewingExamPaper.subject} - Khối {viewingExamPaper.grade} • Mã đề:{' '}
                    {viewingExamPaper.examCode} • Thời gian: {viewingExamPaper.durationMinutes} phút
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingExamPaper(null)}
                className="text-blue-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4 bg-slate-50">
              {(
                viewingExamPaper.questions ||
                questions.filter((q) => viewingExamPaper.questionIds.includes(q.id))
              ).map((q, idx) => (
                <div
                  key={`${q.id}_${idx}`}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs sm:text-sm font-semibold text-slate-800">
                      <span className="font-black text-[#0D47A1] mr-1.5">Câu {idx + 1}:</span>
                      {q.content}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-bold flex-shrink-0">
                      {q.type === 'MULTIPLE_CHOICE'
                        ? 'Trắc nghiệm'
                        : q.type === 'TRUE_FALSE'
                        ? 'Đúng/Sai'
                        : 'Trả lời ngắn'}
                    </span>
                  </div>

                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(q.options || []).map((opt) => (
                        <div
                          key={opt.key}
                          className={`px-3 py-1.5 rounded-xl border text-xs ${
                            opt.key === q.correctAnswer
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <b>{opt.key}.</b> {opt.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'TRUE_FALSE' && (
                    <div className="space-y-1.5">
                      {(q.tfStatements || []).map((st) => (
                        <div
                          key={st.key}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <span>
                            <b>{st.key})</b> {st.content}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              st.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {st.isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'SHORT_ANSWER' && (
                    <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl inline-block">
                      Đáp án: {q.correctAnswer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() =>
                  handleExportExamToWord(
                    viewingExamPaper.title,
                    viewingExamPaper.subject,
                    viewingExamPaper.grade,
                    viewingExamPaper.durationMinutes,
                    viewingExamPaper.examCode,
                    viewingExamPaper.questions ||
                      questions.filter((q) => viewingExamPaper.questionIds.includes(q.id)),
                    true
                  )
                }
                className="py-2 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất file Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingExamPaper(null)}
                className="py-2 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: TẠO HOẶC CHỈNH SỬA THÔNG SỐ ĐỀ THI               */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <h2 className="text-lg font-black text-slate-800">
                {editingExam ? 'CHỈNH SỬA BÀI KIỂM TRA' : 'CÀI ĐẶT BÀI KIỂM TRA MỚI'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualExam} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài kiểm tra</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra 1 tiết Đại số 12 Chương 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium"
                  >
                    {availableSubjectNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(Number(e.target.value) as 10 | 11 | 12)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="12">Khối 12</option>
                    <option value="11">Khối 11</option>
                    <option value="10">Khối 10</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lớp được phép làm bài
                  </label>
                  <select
                    multiple
                    value={formClasses}
                    onChange={(e) =>
                      setFormClasses(Array.from(e.target.selectedOptions, (o) => o.value))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium h-24"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Lớp {cls.name} (Khối {cls.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Thời gian làm bài (phút)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={180}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số lần được làm bài
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formMaxAttempts}
                      onChange={(e) => setFormMaxAttempts(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày giờ bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày giờ kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShowAnswers}
                    onChange={(e) => setFormShowAnswers(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0D47A1]"
                  />
                  <span>Cho phép học sinh xem đáp án và lời giải sau khi nộp</span>
                </label>

                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShuffleQuestions}
                    onChange={(e) => setFormShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0D47A1]"
                  />
                  <span>Xáo trộn thứ tự các câu hỏi</span>
                </label>

                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShuffleOptions}
                    onChange={(e) => setFormShuffleOptions(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0D47A1]"
                  />
                  <span>Xáo trộn thứ tự các phương án lựa chọn (A, B, C, D)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã đề</label>
                  <input
                    type="text"
                    value={formExamCode}
                    onChange={(e) => setFormExamCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái mở bài</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ExamStatus)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="OPEN">Mở cho học sinh làm (OPEN)</option>
                    <option value="CLOSED">Đóng đề thi (CLOSED)</option>
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold shadow-md transition-all cursor-pointer"
                >
                  Lưu bài kiểm tra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
