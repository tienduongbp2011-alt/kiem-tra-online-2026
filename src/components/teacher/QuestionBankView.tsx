import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Question, QuestionLevel, QuestionType, TrueFalseStatement } from '../../types';
import {
  parseWordQuestionText,
  SAMPLE_WORD_IMPORT_TEMPLATE,
} from '../../utils/wordImportParser';
import {
  Database,
  PlusCircle,
  FileText,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit3,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Upload,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export const QuestionBankView: React.FC = () => {
  const {
    questions,
    subjects: appSubjects,
    currentUser,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    importQuestions,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(
    currentUser?.subject || 'ALL'
  );
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Manual Question Form State
  const [formSubject, setFormSubject] = useState('Toán');
  const [formGrade, setFormGrade] = useState<10 | 11 | 12>(12);
  const [formChapter, setFormChapter] = useState('Chương 1: Khảo sát hàm số');
  const [formLesson, setFormLesson] = useState('Bài 1: Tính đơn điệu');
  const [formTopic, setFormTopic] = useState('Khảo sát hàm số');
  const [formLevel, setFormLevel] = useState<QuestionLevel>('THONG_HIEU');
  const [formType, setFormType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [formContent, setFormContent] = useState('');
  const [formPoints, setFormPoints] = useState(0.25);
  const [formExplanation, setFormExplanation] = useState('');

  // Form options for MC
  const [mcOptions, setMcOptions] = useState([
    { key: 'A' as const, content: '' },
    { key: 'B' as const, content: '' },
    { key: 'C' as const, content: '' },
    { key: 'D' as const, content: '' },
  ]);
  const [mcCorrect, setMcCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Form statements for True/False
  const [tfStatements, setTfStatements] = useState<TrueFalseStatement[]>([
    { key: 'a', content: '', isCorrect: true },
    { key: 'b', content: '', isCorrect: false },
    { key: 'c', content: '', isCorrect: true },
    { key: 'd', content: '', isCorrect: false },
  ]);

  // Form for Short Answer
  const [saCorrect, setSaCorrect] = useState('');

  // Word Import State
  const [importText, setImportText] = useState(SAMPLE_WORD_IMPORT_TEMPLATE);
  const [importSubject, setImportSubject] = useState('Toán');
  const [importGrade, setImportGrade] = useState<10 | 11 | 12>(12);
  const [importErrors, setImportErrors] = useState<
    { line: number; message: string; snippet?: string }[]
  >([]);
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState<Question[]>([]);
  const [importSuccessBanner, setImportSuccessBanner] = useState<string | null>(null);

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.chapter && q.chapter.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSubject = selectedSubject === 'ALL' || q.subject === selectedSubject;
    const matchGrade = selectedGrade === 'ALL' || String(q.grade) === selectedGrade;
    const matchLevel = selectedLevel === 'ALL' || q.level === selectedLevel;
    const matchType = selectedType === 'ALL' || q.type === selectedType;
    return matchSearch && matchSubject && matchGrade && matchLevel && matchType;
  });

  const availableSubjectNames = Array.from(
    new Set([...appSubjects.map((s) => s.name), ...questions.map((q) => q.subject)])
  );

  // Open manual add modal
  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setFormSubject(currentUser?.subject || appSubjects[0]?.name || 'Toán');
    setFormGrade(12);
    setFormChapter('');
    setFormLesson('');
    setFormTopic('Chủ đề ôn tập');
    setFormLevel('THONG_HIEU');
    setFormType('MULTIPLE_CHOICE');
    setFormContent('');
    setFormPoints(0.25);
    setFormExplanation('');
    setMcOptions([
      { key: 'A', content: '' },
      { key: 'B', content: '' },
      { key: 'C', content: '' },
      { key: 'D', content: '' },
    ]);
    setMcCorrect('A');
    setTfStatements([
      { key: 'a', content: '', isCorrect: true },
      { key: 'b', content: '', isCorrect: false },
      { key: 'c', content: '', isCorrect: true },
      { key: 'd', content: '', isCorrect: false },
    ]);
    setSaCorrect('');
    setShowAddModal(true);
  };

  // Open manual edit modal
  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormSubject(q.subject);
    setFormGrade(q.grade);
    setFormChapter(q.chapter || '');
    setFormLesson(q.lesson || '');
    setFormTopic(q.topic);
    setFormLevel(q.level);
    setFormType(q.type);
    setFormContent(q.content);
    setFormPoints(q.points);
    setFormExplanation(q.explanation || '');

    if (q.type === 'MULTIPLE_CHOICE' && q.options) {
      setMcOptions(q.options);
      setMcCorrect((q.correctAnswer as any) || 'A');
    }
    if (q.type === 'TRUE_FALSE' && q.tfStatements) {
      setTfStatements(q.tfStatements);
    }
    if (q.type === 'SHORT_ANSWER') {
      setSaCorrect(q.correctAnswer || '');
    }
    setShowAddModal(true);
  };

  // Save manual question
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    let correctAnswer = '';
    if (formType === 'MULTIPLE_CHOICE') {
      correctAnswer = mcCorrect;
    } else if (formType === 'TRUE_FALSE') {
      correctAnswer = tfStatements.map((s) => `${s.key}:${s.isCorrect ? 'Đ' : 'S'}`).join(', ');
    } else {
      correctAnswer = saCorrect.trim();
    }

    const payload = {
      subject: formSubject,
      grade: formGrade,
      chapter: formChapter,
      lesson: formLesson,
      topic: formTopic || 'Tổng hợp',
      level: formLevel,
      type: formType,
      content: formContent.trim(),
      points: Number(formPoints),
      explanation: formExplanation.trim(),
      correctAnswer,
      options: formType === 'MULTIPLE_CHOICE' ? mcOptions : undefined,
      tfStatements: formType === 'TRUE_FALSE' ? tfStatements : undefined,
    };

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, payload);
    } else {
      addQuestion(payload);
    }

    setShowAddModal(false);
    setEditingQuestion(null);
  };

  // Live validator for Word text
  const handleValidateWordText = () => {
    const result = parseWordQuestionText(importText, importSubject, importGrade);
    setImportErrors(result.errors);
    setParsedPreviewQuestions(result.questions);
    return result;
  };

  // Commit Word Import into Question Bank
  const handleExecuteWordImport = () => {
    const result = handleValidateWordText();
    if (result.errors.length > 0) {
      alert(
        `Vẫn còn ${result.errors.length} lỗi cú pháp. Vui lòng kiểm tra dòng bị lỗi được đánh dấu màu đỏ bên dưới!`
      );
      return;
    }

    if (result.questions.length === 0) {
      alert('Chưa tìm thấy câu hỏi hợp lệ nào trong văn bản.');
      return;
    }

    const count = importQuestions(result.questions);
    setImportSuccessBanner(`Đã lưu thành công ${count} câu hỏi vào ngân hàng câu hỏi!`);
    setTimeout(() => {
      setShowImportModal(false);
      setImportSuccessBanner(null);
    }, 1500);
  };

  // File upload handler (reads .txt / .docx text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportText(text);
        // Automatically validate
        const res = parseWordQuestionText(text, importSubject, importGrade);
        setImportErrors(res.errors);
        setParsedPreviewQuestions(res.questions);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            NGÂN HÀNG CÂU HỎI
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Phân loại theo Môn &rarr; Khối &rarr; Chương &rarr; Bài &rarr; Chủ đề &rarr; Mức độ (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao)
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setShowImportModal(true);
              handleValidateWordText();
            }}
            className="py-2.5 px-4 rounded-xl bg-[#FF8A00] hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>IMPORT TỪ FILE WORD</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>THÊM CÂU HỎI MỚI</span>
          </button>
        </div>
      </div>

      {/* Filter and Taxonomy Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo nội dung câu hỏi, chủ đề..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#0D47A1]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto text-xs font-bold text-slate-600">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Tất cả môn</option>
              {availableSubjectNames.map((s) => (
                <option key={s} value={s}>
                  Môn {s}
                </option>
              ))}
            </select>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Tất cả khối</option>
              <option value="12">Khối 12</option>
              <option value="11">Khối 11</option>
              <option value="10">Khối 10</option>
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Mọi mức độ</option>
              <option value="NHAN_BIET">Nhận biết</option>
              <option value="THONG_HIEU">Thông hiểu</option>
              <option value="VAN_DUNG">Vận dụng</option>
              <option value="VAN_DUNG_CAO">Vận dụng cao</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Mọi định dạng</option>
              <option value="MULTIPLE_CHOICE">Phần I: 4 lựa chọn</option>
              <option value="TRUE_FALSE">Phần II: Đúng / Sai</option>
              <option value="SHORT_ANSWER">Phần III: Trả lời ngắn</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="font-semibold">
            Hiển thị <span className="text-[#0D47A1] font-bold">{filteredQuestions.length}</span> / {questions.length} câu hỏi trong ngân hàng
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Chuẩn ngân hàng đề thi tốt nghiệp THPT năm học 2026–2027
          </span>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q, index) => {
          const levelLabels = {
            NHAN_BIET: { label: 'Nhận biết', color: 'bg-blue-100 text-blue-800' },
            THONG_HIEU: { label: 'Thông hiểu', color: 'bg-emerald-100 text-emerald-800' },
            VAN_DUNG: { label: 'Vận dụng', color: 'bg-amber-100 text-amber-800' },
            VAN_DUNG_CAO: { label: 'Vận dụng cao', color: 'bg-rose-100 text-rose-800' },
          }[q.level];

          const typeLabel = {
            MULTIPLE_CHOICE: 'Phần I: 4 lựa chọn',
            TRUE_FALSE: 'Phần II: Đúng / Sai (4 ý)',
            SHORT_ANSWER: 'Phần III: Trả lời ngắn',
          }[q.type];

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#0D47A1] text-white flex items-center justify-center font-black text-xs">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {q.subject} - K{q.grade}
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${levelLabels.color}`}
                  >
                    {levelLabels.label}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {typeLabel}
                  </span>
                  <span className="text-xs font-bold text-[#FF8A00] bg-orange-50 px-2 py-0.5 rounded">
                    {q.points} điểm
                  </span>
                </div>

                {/* Question Actions */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditModal(q)}
                    title="Chỉnh sửa câu hỏi"
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicateQuestion(q.id)}
                    title="Sao chép câu hỏi"
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa câu hỏi này khỏi ngân hàng?')) {
                        deleteQuestion(q.id);
                      }
                    }}
                    title="Xóa câu hỏi"
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-bold text-slate-800 mb-3 whitespace-pre-wrap">
                {q.content}
              </div>

              {/* Question Format Display */}
              {q.type === 'MULTIPLE_CHOICE' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                  {q.options.map((opt) => {
                    const isAns = q.correctAnswer === opt.key;
                    return (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                          isAns
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-extrabold">{opt.key}.</span>
                        <span>{opt.content}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'TRUE_FALSE' && q.tfStatements && (
                <div className="space-y-1.5 text-xs mb-3">
                  {q.tfStatements.map((stmt) => (
                    <div
                      key={stmt.key}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <span>
                        <span className="font-bold mr-2">{stmt.key})</span>
                        {stmt.content}
                      </span>
                      <span
                        className={`font-black px-2 py-0.5 rounded ${
                          stmt.isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {stmt.isCorrect ? 'ĐÚNG' : 'SAI'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'SHORT_ANSWER' && (
                <div className="text-xs p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 mb-3">
                  <span className="font-bold">Đáp án chuẩn:</span>{' '}
                  <span className="font-mono font-black">{q.correctAnswer}</span>
                </div>
              )}

              {/* Taxonomy detail & Explanation */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 gap-2">
                <div>
                  Chủ đề: <span className="font-semibold text-slate-700">{q.topic}</span>
                  {q.chapter && ` • ${q.chapter}`}
                </div>
                {q.explanation && (
                  <div className="text-slate-600 italic">
                    Lời giải: {q.explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: IMPORT CÂU HỎI TỪ FILE WORD / VĂN BẢN (CHỨC NĂNG QUAN TRỌNG) */}
      {/* ========================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF8A00] flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">
                    IMPORT CÂU HỎI TỪ FILE WORD
                  </h2>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ đầy đủ 3 phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai (4 ý a-b-c-d) và Tự luận trả lời ngắn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success notification */}
            {importSuccessBanner && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{importSuccessBanner}</span>
              </div>
            )}

            {/* Config & file upload bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Môn học mặc định</label>
                <select
                  value={importSubject}
                  onChange={(e) => setImportSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  {availableSubjectNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp mặc định</label>
                <select
                  value={importGrade}
                  onChange={(e) => setImportGrade(Number(e.target.value) as 10 | 11 | 12)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="12">Khối 12</option>
                  <option value="11">Khối 11</option>
                  <option value="10">Khối 10</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tải file Word/Text</label>
                <label className="w-full px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#0D47A1] text-xs font-bold text-slate-700 flex items-center justify-center space-x-1.5 cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#0D47A1]" />
                  <span>Chọn tệp văn bản (.txt/.docx)</span>
                  <input
                    type="file"
                    accept=".txt,.docx,.doc"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Template sample load button */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Soạn thảo / Dán nội dung đề thi từ Word vào đây:
              </span>
              <button
                type="button"
                onClick={() => {
                  setImportText(SAMPLE_WORD_IMPORT_TEMPLATE);
                  const res = parseWordQuestionText(SAMPLE_WORD_IMPORT_TEMPLATE, importSubject, importGrade);
                  setImportErrors(res.errors);
                  setParsedPreviewQuestions(res.questions);
                }}
                className="text-xs font-bold text-[#0D47A1] hover:underline"
              >
                + Tải lại mẫu chuẩn 3 phần của Bộ GD
              </button>
            </div>

            {/* Text Editor area */}
            <div className="relative mb-4">
              <textarea
                rows={12}
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  const res = parseWordQuestionText(e.target.value, importSubject, importGrade);
                  setImportErrors(res.errors);
                  setParsedPreviewQuestions(res.questions);
                }}
                className="w-full font-mono text-xs sm:text-sm p-4 rounded-2xl border-2 border-slate-300 focus:border-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1] bg-slate-50 text-slate-800 leading-relaxed"
                placeholder="Dán nội dung từ file Word theo mẫu..."
              />
            </div>

            {/* Line-by-line syntax error indicator as requested */}
            {importErrors.length > 0 && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 max-h-36 overflow-y-auto">
                <div className="flex items-center space-x-2 text-rose-800 font-extrabold text-xs mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>PHÁT HIỆN {importErrors.length} LỖI CÚ PHÁP CẦN SỬA:</span>
                </div>
                <div className="space-y-1.5 text-xs text-rose-700 font-medium">
                  {importErrors.map((err, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="font-bold bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded text-[10px]">
                        Dòng {err.line}
                      </span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Preview Summary */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Số câu hỏi hợp lệ đã nhận diện: {parsedPreviewQuestions.length} câu
                </span>
              </div>
              <span className="text-slate-500 font-medium">
                (Tự động kiểm tra từng dòng khi bạn chỉnh sửa)
              </span>
            </div>

            {/* Action buttons */}
            <div className="pt-5 mt-5 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs sm:text-sm"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExecuteWordImport}
                disabled={parsedPreviewQuestions.length === 0 || importErrors.length > 0}
                className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                <span>LƯU VÀO NGÂN HÀNG CÂU HỎI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: THÊM / SỬA CÂU HỎI THỦ CÔNG                      */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <h2 className="text-lg font-black text-slate-800">
                {editingQuestion ? 'CHỈNH SỬA CÂU HỎI' : 'THÊM CÂU HỎI VÀO NGÂN HÀNG'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    {availableSubjectNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(Number(e.target.value) as 10 | 11 | 12)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="12">Khối 12</option>
                    <option value="11">Khối 11</option>
                    <option value="10">Khối 10</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức độ nhận thức</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as QuestionLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="NHAN_BIET">Nhận biết</option>
                    <option value="THONG_HIEU">Thông hiểu</option>
                    <option value="VAN_DUNG">Vận dụng</option>
                    <option value="VAN_DUNG_CAO">Vận dụng cao</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Định dạng câu hỏi</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      setFormType(newType);
                      if (newType === 'MULTIPLE_CHOICE') setFormPoints(0.25);
                      else if (newType === 'TRUE_FALSE') setFormPoints(1.0);
                      else setFormPoints(0.5);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-[#0D47A1]"
                  >
                    <option value="MULTIPLE_CHOICE">Phần I: Trắc nghiệm 4 lựa chọn (A,B,C,D)</option>
                    <option value="TRUE_FALSE">Phần II: Đúng / Sai (4 ý a,b,c,d)</option>
                    <option value="SHORT_ANSWER">Phần III: Tự luận / Trả lời ngắn</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm số</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chủ đề bài học</label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Ví dụ: Cực trị của hàm số, Định luật nhiệt động lực học..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung câu hỏi</label>
                <textarea
                  required
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* Multiple choice fields */}
              {formType === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">4 phương án lựa chọn:</span>
                  {mcOptions.map((opt, i) => (
                    <div key={opt.key} className="flex items-center space-x-2">
                      <span className="w-6 font-bold text-slate-800 text-center">{opt.key}.</span>
                      <input
                        type="text"
                        required
                        value={opt.content}
                        onChange={(e) => {
                          const updated = [...mcOptions];
                          updated[i].content = e.target.value;
                          setMcOptions(updated);
                        }}
                        placeholder={`Nội dung phương án ${opt.key}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name="mcCorrectGroup"
                          checked={mcCorrect === opt.key}
                          onChange={() => setMcCorrect(opt.key)}
                          className="text-[#0D47A1]"
                        />
                        <span className="text-xs font-bold text-emerald-700">Đúng</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* True/False fields */}
              {formType === 'TRUE_FALSE' && (
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">4 nhận định Đúng/Sai:</span>
                  {tfStatements.map((stmt, i) => (
                    <div key={stmt.key} className="flex items-center space-x-2">
                      <span className="w-6 font-bold text-slate-800 text-center">{stmt.key})</span>
                      <input
                        type="text"
                        required
                        value={stmt.content}
                        onChange={(e) => {
                          const updated = [...tfStatements];
                          updated[i].content = e.target.value;
                          setTfStatements(updated);
                        }}
                        placeholder={`Nhận định ${stmt.key}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                      <select
                        value={stmt.isCorrect ? 'true' : 'false'}
                        onChange={(e) => {
                          const updated = [...tfStatements];
                          updated[i].isCorrect = e.target.value === 'true';
                          setTfStatements(updated);
                        }}
                        className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                      >
                        <option value="true">Đúng (Đ)</option>
                        <option value="false">Sai (S)</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Short Answer fields */}
              {formType === 'SHORT_ANSWER' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-700">Đáp án chuẩn:</label>
                  <input
                    type="text"
                    required
                    value={saCorrect}
                    onChange={(e) => setSaCorrect(e.target.value)}
                    placeholder="Ví dụ: 100 hoặc 4 hoặc a"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    * Có thể nhập nhiều phương án tương đương phân tách bằng dấu chấm phẩy ; (ví dụ: 0.5; 1/2)
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Giải thích chi tiết (lời giải)</label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Lời giải thích hiển thị cho học sinh sau khi thi..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold shadow-md cursor-pointer"
                >
                  Lưu câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
