export type SubjectPerformance = {
  subject: string;
  averagePercentage: number;
  grade: string;
};

export type StudentReportResponse = {
  studentId: string;
  studentName: string;
  classId: string;
  attendancePercentage: number;
  overallPercentage: number;
  overallGrade: string;
  subjects: SubjectPerformance[];
};

export type InstitutionStatResponse = {
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down";
};

export type AttendanceRecord = {
  date: string;
  subject: string;
  status: string;
};

export type ExamScoreEntry = {
  examTitle: string;
  term: string;
  date: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
};

export type SubjectDetail = {
  subject: string;
  scores: ExamScoreEntry[];
  averagePercentage: number;
  grade: string;
};

export type StudentDetailReportResponse = {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  overallAttendancePercentage: number;
  overallPercentage: number;
  overallGrade: string;
  subjects: SubjectDetail[];
  recentAttendance: AttendanceRecord[];
};
