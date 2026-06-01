import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

if (!process.env["DATABASE_URL"]) {
  try {
    process.loadEnvFile();
  } catch {
    // ignore
  }
}

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"] ?? "",
});
const prisma = new PrismaClient({ adapter });

const INSTITUTION_ID = "00000000-0000-0000-0000-000000000001";

function scheduleForSubjInClass(subjIdx: number, classIdx: number) {
  const dayOfWeek = (subjIdx + classIdx * 7) % 5;
  const period = Math.floor((subjIdx + classIdx * 7) / 5);
  const hour = 8 + period;
  const min = period % 2 === 0 ? "00" : "30";
  const endMin = period % 2 === 0 ? "40" : "10";
  return {
    dayOfWeek,
    startTime: `${String(hour).padStart(2, "0")}:${min}`,
    endTime: `${String(hour).padStart(2, "0")}:${endMin}`,
  };
}

async function cleanDatabase() {
  console.log("Clearing existing data…");
  await prisma.$transaction([
    prisma.assessmentEntry.deleteMany(),
    prisma.assessment.deleteMany(),
    prisma.examMark.deleteMany(),
    prisma.examClass.deleteMany(),
    prisma.exam.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.resource.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.teacherSubjectClass.deleteMany(),
    prisma.student.deleteMany(),
    prisma.class.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.adminProfile.deleteMany(),
    prisma.teacherProfile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.institution.deleteMany(),
  ]);
  console.log("✓ Database cleared");
}

async function main() {
  await cleanDatabase();

  const hash = await bcrypt.hash("password123", 12);

  // ──────────────────────────────────────────────
  // 1. Institution
  // ──────────────────────────────────────────────
  const institution = await prisma.institution.create({
    data: { id: INSTITUTION_ID, name: "Al-Hira Public School" },
  });
  console.log(`✓ Institution: ${institution.name}`);

  // ──────────────────────────────────────────────
  // 2. Admin user
  // ──────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@edutrack.pk",
      passwordHash: hash,
      role: "ADMIN",
      institutionId: INSTITUTION_ID,
      createdInstitutions: { connect: { id: INSTITUTION_ID } },
      adminProfile: {
        create: { firstName: "Super", lastName: "Admin", phone: "0300-1234567" },
      },
    },
    include: { adminProfile: true },
  });
  console.log(`✓ Admin: ${adminUser.email}`);

  // ──────────────────────────────────────────────
  // 3. Subjects
  // ──────────────────────────────────────────────
  const subjectData = [
    { name: "Mathematics", code: "MATH-101" },
    { name: "Physics", code: "PHY-101" },
    { name: "Chemistry", code: "CHEM-101" },
    { name: "Biology", code: "BIO-101" },
    { name: "English", code: "ENG-101" },
    { name: "Urdu", code: "URD-101" },
    { name: "Islamiyat", code: "ISL-101" },
    { name: "Computer Science", code: "CS-101" },
    { name: "Pakistan Studies", code: "PKST-101" },
  ];

  const subjects = await Promise.all(
    subjectData.map((s) =>
      prisma.subject.create({ data: { name: s.name, code: s.code, institutionId: INSTITUTION_ID } }),
    ),
  );
  const subjMap = Object.fromEntries(subjects.map((s) => [s.name, s]));
  console.log(`✓ ${subjects.length} subjects`);

  // ──────────────────────────────────────────────
  // 4. Classes
  // ──────────────────────────────────────────────
  const classData = [
    { name: "Grade 6", section: "A", capacity: 35 },
    { name: "Grade 6", section: "B", capacity: 35 },
    { name: "Grade 7", section: "A", capacity: 35 },
    { name: "Grade 7", section: "B", capacity: 35 },
    { name: "Grade 8", section: "A", capacity: 35 },
    { name: "Grade 8", section: "B", capacity: 35 },
    { name: "Grade 9", section: "A", capacity: 40 },
    { name: "Grade 9", section: "B", capacity: 40 },
    { name: "Grade 10", section: "A", capacity: 40 },
    { name: "Grade 10", section: "B", capacity: 40 },
  ];

  const classes = await Promise.all(
    classData.map((c) =>
      prisma.class.create({
        data: { name: c.name, section: c.section, capacity: c.capacity, institutionId: INSTITUTION_ID },
      }),
    ),
  );
  console.log(`✓ ${classes.length} classes`);

  // ──────────────────────────────────────────────
  // 5. Teachers
  // ──────────────────────────────────────────────
  const teacherData = [
    { email: "teacher1@edutrack.pk", empId: "T-001", firstName: "Ahmed", lastName: "Khan", qual: "M.Sc Mathematics", phone: "0301-1111111" },
    { email: "teacher2@edutrack.pk", empId: "T-002", firstName: "Fatima", lastName: "Ali", qual: "M.Sc Physics", phone: "0301-2222222" },
    { email: "teacher3@edutrack.pk", empId: "T-003", firstName: "Muhammad", lastName: "Usman", qual: "M.Sc Chemistry", phone: "0301-3333333" },
    { email: "teacher4@edutrack.pk", empId: "T-004", firstName: "Ayesha", lastName: "Ahmed", qual: "M.Sc Biology", phone: "0301-4444444" },
    { email: "teacher5@edutrack.pk", empId: "T-005", firstName: "Sana", lastName: "Malik", qual: "MA English", phone: "0301-5555555" },
    { email: "teacher6@edutrack.pk", empId: "T-006", firstName: "Zaid", lastName: "Hassan", qual: "MA Urdu", phone: "0301-6666666" },
  ];

  const teachers = await Promise.all(
    teacherData.map((t) =>
      prisma.user.create({
        data: {
          email: t.email,
          passwordHash: hash,
          role: "TEACHER",
          institutionId: INSTITUTION_ID,
          teacherProfile: {
            create: {
              employeeId: t.empId,
              firstName: t.firstName,
              lastName: t.lastName,
              qualification: t.qual,
              phone: t.phone,
              joiningDate: new Date("2025-08-01"),
              institutionId: INSTITUTION_ID,
            },
          },
        },
        include: { teacherProfile: true },
      }),
    ),
  );
  console.log(`✓ ${teachers.length} teachers`);

  // ──────────────────────────────────────────────
  // 6. Teacher-Subject-Class assignments (with schedule)
  // ──────────────────────────────────────────────
  const tscAssignments: {
    teacherIdx: number;
    classIdx: number;
    subjectName: string;
  }[] = [
    { teacherIdx: 0, classIdx: 0, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 0, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 0, subjectName: "Chemistry" },
    { teacherIdx: 4, classIdx: 0, subjectName: "English" },
    { teacherIdx: 5, classIdx: 0, subjectName: "Urdu" },
    { teacherIdx: 3, classIdx: 0, subjectName: "Biology" },
    { teacherIdx: 0, classIdx: 1, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 1, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 1, subjectName: "English" },
    { teacherIdx: 5, classIdx: 1, subjectName: "Urdu" },
    { teacherIdx: 0, classIdx: 2, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 2, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 2, subjectName: "Chemistry" },
    { teacherIdx: 4, classIdx: 2, subjectName: "English" },
    { teacherIdx: 5, classIdx: 2, subjectName: "Urdu" },
    { teacherIdx: 3, classIdx: 2, subjectName: "Biology" },
    { teacherIdx: 0, classIdx: 3, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 3, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 3, subjectName: "English" },
    { teacherIdx: 5, classIdx: 3, subjectName: "Urdu" },
    { teacherIdx: 0, classIdx: 4, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 4, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 4, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 4, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 4, subjectName: "English" },
    { teacherIdx: 5, classIdx: 4, subjectName: "Urdu" },
    { teacherIdx: 0, classIdx: 5, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 5, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 5, subjectName: "English" },
    { teacherIdx: 5, classIdx: 5, subjectName: "Urdu" },
    { teacherIdx: 0, classIdx: 6, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 6, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 6, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 6, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 6, subjectName: "English" },
    { teacherIdx: 5, classIdx: 6, subjectName: "Urdu" },
    { teacherIdx: 0, classIdx: 7, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 7, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 7, subjectName: "English" },
    { teacherIdx: 5, classIdx: 7, subjectName: "Urdu" },
    { teacherIdx: 0, classIdx: 8, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 8, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 8, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 8, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 8, subjectName: "English" },
    { teacherIdx: 5, classIdx: 8, subjectName: "Urdu" },
    { teacherIdx: 0, classIdx: 9, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 9, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 9, subjectName: "English" },
    { teacherIdx: 5, classIdx: 9, subjectName: "Urdu" },
  ];

  // Group by class to assign sequential schedule slots
  const perClass: Record<number, typeof tscAssignments> = {};
  for (const a of tscAssignments) {
    if (!perClass[a.classIdx]) perClass[a.classIdx] = [];
    perClass[a.classIdx].push(a);
  }

  let tscCount = 0;
  for (const a of tscAssignments) {
    const teacherId = teachers[a.teacherIdx]!.teacherProfile!.id;
    const classId = classes[a.classIdx]!.id;
    const subjectId = subjMap[a.subjectName]!.id;

    const subjIdx = perClass[a.classIdx]!.indexOf(a);
    const { dayOfWeek, startTime, endTime } = scheduleForSubjInClass(subjIdx, a.classIdx);

    await prisma.teacherSubjectClass.create({
      data: {
        teacherId,
        classId,
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        institutionId: INSTITUTION_ID,
      },
    });
    tscCount++;
  }
  console.log(`✓ ${tscCount} TSC assignments (with schedule)`);

  // ──────────────────────────────────────────────
  // 7. Students
  // ──────────────────────────────────────────────
  const studentData = [
    { adm: "GR6A-001", first: "Abdullah", last: "Khan", gender: "MALE" as const, guardian: "Tariq Khan", phone: "0310-1000001", classIdx: 0 },
    { adm: "GR6A-002", first: "Hafsa", last: "Ahmed", gender: "FEMALE" as const, guardian: "Naveed Ahmed", phone: "0310-1000002", classIdx: 0 },
    { adm: "GR6A-003", first: "Bilal", last: "Hussain", gender: "MALE" as const, guardian: "Rashid Hussain", phone: "0310-1000003", classIdx: 0 },
    { adm: "GR6A-004", first: "Ayesha", last: "Iqbal", gender: "FEMALE" as const, guardian: "M. Iqbal", phone: "0310-1000004", classIdx: 0 },
    { adm: "GR6A-005", first: "Usman", last: "Ali", gender: "MALE" as const, guardian: "Ali Ahmed", phone: "0310-1000005", classIdx: 0 },
    { adm: "GR6B-001", first: "Zainab", last: "Fatima", gender: "FEMALE" as const, guardian: "Hassan Ali", phone: "0310-2000001", classIdx: 1 },
    { adm: "GR6B-002", first: "Hamza", last: "Malik", gender: "MALE" as const, guardian: "Imran Malik", phone: "0310-2000002", classIdx: 1 },
    { adm: "GR6B-003", first: "Maryam", last: "Shah", gender: "FEMALE" as const, guardian: "Shahid Shah", phone: "0310-2000003", classIdx: 1 },
    { adm: "GR6B-004", first: "Omar", last: "Farooq", gender: "MALE" as const, guardian: "Farooq Ahmed", phone: "0310-2000004", classIdx: 1 },
    { adm: "GR7A-001", first: "Hassan", last: "Raza", gender: "MALE" as const, guardian: "Raza Ali", phone: "0310-3000001", classIdx: 2 },
    { adm: "GR7A-002", first: "Fatima", last: "Zahra", gender: "FEMALE" as const, guardian: "Jafar Rizvi", phone: "0310-3000002", classIdx: 2 },
    { adm: "GR7A-003", first: "Ali", last: "Rizvi", gender: "MALE" as const, guardian: "Hasan Rizvi", phone: "0310-3000003", classIdx: 2 },
    { adm: "GR7A-004", first: "Sara", last: "Khan", gender: "FEMALE" as const, guardian: "Akram Khan", phone: "0310-3000004", classIdx: 2 },
    { adm: "GR7A-005", first: "Husnain", last: "Ali", gender: "MALE" as const, guardian: "Ali Raza", phone: "0310-3000005", classIdx: 2 },
    { adm: "GR7B-001", first: "Noor", last: "Fatima", gender: "FEMALE" as const, guardian: "Khalid Ahmed", phone: "0310-4000001", classIdx: 3 },
    { adm: "GR7B-002", first: "Rayan", last: "Ahmed", gender: "MALE" as const, guardian: "Ahmed Khan", phone: "0310-4000002", classIdx: 3 },
    { adm: "GR7B-003", first: "Eman", last: "Ali", gender: "FEMALE" as const, guardian: "Tahir Ali", phone: "0310-4000003", classIdx: 3 },
    { adm: "GR8A-001", first: "Ahmad", last: "Nawaz", gender: "MALE" as const, guardian: "Nawaz Sharif", phone: "0310-5000001", classIdx: 4 },
    { adm: "GR8A-002", first: "Komal", last: "Rizwan", gender: "FEMALE" as const, guardian: "Rizwan Ahmed", phone: "0310-5000002", classIdx: 4 },
    { adm: "GR8A-003", first: "Saad", last: "Yousaf", gender: "MALE" as const, guardian: "Yousaf Ali", phone: "0310-5000003", classIdx: 4 },
    { adm: "GR8A-004", first: "Hira", last: "Manzoor", gender: "FEMALE" as const, guardian: "Manzoor Hussain", phone: "0310-5000004", classIdx: 4 },
    { adm: "GR8B-001", first: "Taha", last: "Siddiqui", gender: "MALE" as const, guardian: "Siddiqui Ahmed", phone: "0310-6000001", classIdx: 5 },
    { adm: "GR8B-002", first: "Laiba", last: "Mustafa", gender: "FEMALE" as const, guardian: "Mustafa Kamal", phone: "0310-6000002", classIdx: 5 },
    { adm: "GR9A-001", first: "Shahzaib", last: "Khan", gender: "MALE" as const, guardian: "Javed Khan", phone: "0310-7000001", classIdx: 6 },
    { adm: "GR9A-002", first: "Manahil", last: "Qureshi", gender: "FEMALE" as const, guardian: "Qureshi Sahab", phone: "0310-7000002", classIdx: 6 },
    { adm: "GR9A-003", first: "Farhan", last: "Akhtar", gender: "MALE" as const, guardian: "Akhtar Ali", phone: "0310-7000003", classIdx: 6 },
    { adm: "GR9A-004", first: "Sania", last: "Mirza", gender: "FEMALE" as const, guardian: "Mirza Ahmed", phone: "0310-7000004", classIdx: 6 },
    { adm: "GR9B-001", first: "Danish", last: "Iqbal", gender: "MALE" as const, guardian: "Iqbal Ahmed", phone: "0310-8000001", classIdx: 7 },
    { adm: "GR9B-002", first: "Alina", last: "Hassan", gender: "FEMALE" as const, guardian: "Hassan Ali", phone: "0310-8000002", classIdx: 7 },
    { adm: "GR10A-001", first: "Talha", last: "Anjum", gender: "MALE" as const, guardian: "Anjum Latif", phone: "0310-9000001", classIdx: 8 },
    { adm: "GR10A-002", first: "Mahnoor", last: "Siddiqui", gender: "FEMALE" as const, guardian: "Siddiqui Sb", phone: "0310-9000002", classIdx: 8 },
    { adm: "GR10A-003", first: "Abdul", last: "Rauf", gender: "MALE" as const, guardian: "Rauf Ahmed", phone: "0310-9000003", classIdx: 8 },
    { adm: "GR10A-004", first: "Iqra", last: "Aziz", gender: "FEMALE" as const, guardian: "Aziz Ahmed", phone: "0310-9000004", classIdx: 8 },
    { adm: "GR10B-001", first: "Rohaan", last: "Ali", gender: "MALE" as const, guardian: "Ali Khan", phone: "0310-0000001", classIdx: 9 },
    { adm: "GR10B-002", first: "Areeba", last: "Shahid", gender: "FEMALE" as const, guardian: "Shahid Iqbal", phone: "0310-0000002", classIdx: 9 },
  ];

  const students = await Promise.all(
    studentData.map((s, i) =>
      prisma.student.create({
        data: {
          admissionNumber: s.adm,
          firstName: s.first,
          lastName: s.last,
          dob: new Date(`2010-${String((i % 12) + 1).padStart(2, "0")}-15`),
          gender: s.gender,
          guardianName: s.guardian,
          guardianPhone: s.phone,
          address: `${i + 1}, Street ${i + 1}, Gulistan-e-Jauhar, Karachi`,
          institutionId: INSTITUTION_ID,
        },
      }),
    ),
  );
  console.log(`✓ ${students.length} students`);

  // ──────────────────────────────────────────────
  // 8. Enrollments
  // ──────────────────────────────────────────────
  let enrollmentCount = 0;
  for (let i = 0; i < studentData.length; i++) {
    const classId = classes[studentData[i]!.classIdx]!.id;
    await prisma.enrollment.create({
      data: {
        studentId: students[i]!.id,
        classId,
        rollNumber: i + 1,
        status: "ACTIVE",
        institutionId: INSTITUTION_ID,
      },
    });
    enrollmentCount++;
  }
  console.log(`✓ ${enrollmentCount} enrollments`);

  // ──────────────────────────────────────────────
  // 9. Attendance
  // ──────────────────────────────────────────────
  const attendanceClasses = [classes[6]!, classes[8]!];
  const attendanceSubjects = ["Mathematics", "Physics", "English", "Urdu"];

  const today = new Date();
  const pastDates: Date[] = [];
  for (let d = 5; d >= 1; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() !== 5 && date.getDay() !== 6) {
      pastDates.push(date);
    }
  }

  let attendanceCount = 0;
  for (const cls of attendanceClasses) {
    const classStudents = students.filter((_, idx) => studentData[idx]!.classIdx === classes.indexOf(cls));
    for (const date of pastDates) {
      for (const subjectName of attendanceSubjects) {
        for (const student of classStudents) {
          const statusRoll = Math.random();
          const status =
            statusRoll < 0.75 ? "PRESENT"
            : statusRoll < 0.88 ? "ABSENT"
            : statusRoll < 0.95 ? "LATE"
            : "LEAVE";

          try {
            await prisma.attendance.create({
              data: {
                studentId: student.id,
                classId: cls.id,
                subjectId: subjMap[subjectName]!.id,
                date,
                status: status as any,
                recordedById: adminUser.id,
                institutionId: INSTITUTION_ID,
              },
            });
            attendanceCount++;
          } catch {
            // skip duplicates
          }
        }
      }
    }
  }
  console.log(`✓ ${attendanceCount} attendance records`);

  // ──────────────────────────────────────────────
  // 10. Exams & Marks
  // ──────────────────────────────────────────────
  const exam = await prisma.exam.create({
    data: {
      title: "Midterm 2026",
      term: "MIDTERM",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-15"),
      institutionId: INSTITUTION_ID,
      examClasses: {
        create: [classes[6]!, classes[8]!].map((c) => ({
          classId: c.id,
          institutionId: INSTITUTION_ID,
        })),
      },
    },
  });

  const examClasses = [classes[6]!, classes[8]!];
  const examSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Pakistan Studies", "Islamiyat"];

  let marksCount = 0;
  for (const cls of examClasses) {
    const classStudents = students.filter((_, idx) => studentData[idx]!.classIdx === classes.indexOf(cls));
    for (const subjectName of examSubjects) {
      const subject = subjMap[subjectName];
      if (!subject) continue;
      const maxMarks = subjectName === "Mathematics" || subjectName === "English" ? 100 : 75;

      for (const student of classStudents) {
        const obtained = Math.floor(Math.random() * (maxMarks * 0.5) + maxMarks * 0.35);
        try {
          await prisma.examMark.create({
            data: {
              examId: exam.id,
              studentId: student.id,
              subjectId: subject.id,
              marksObtained: obtained,
              maxMarks,
              recordedById: adminUser.id,
              institutionId: INSTITUTION_ID,
            },
          });
          marksCount++;
        } catch {
          // skip
        }
      }
    }
  }
  console.log(`✓ ${marksCount} exam marks`);

  // Additional exam — Monthly Test
  const monthlyExam = await prisma.exam.create({
    data: {
      title: "Monthly Test — April 2026",
      term: "MONTHLY",
      startDate: new Date("2026-04-15"),
      endDate: new Date("2026-04-16"),
      institutionId: INSTITUTION_ID,
      examClasses: {
        create: [classes[0]!, classes[2]!, classes[4]!].map((c) => ({
          classId: c.id,
          institutionId: INSTITUTION_ID,
        })),
      },
    },
  });

  let monthlyMarks = 0;
  for (const cls of [classes[0]!, classes[2]!, classes[4]!]) {
    const classStudents = students.filter((_, idx) => studentData[idx]!.classIdx === classes.indexOf(cls));
    for (const student of classStudents) {
      const obtained = Math.floor(Math.random() * 61 + 20);
      try {
        await prisma.examMark.create({
          data: {
            examId: monthlyExam.id,
            studentId: student.id,
            subjectId: subjMap["Mathematics"]!.id,
            marksObtained: obtained,
            maxMarks: 100,
            recordedById: adminUser.id,
            institutionId: INSTITUTION_ID,
          },
        });
        monthlyMarks++;
      } catch { /* skip */ }
    }
  }
  console.log(`✓ ${monthlyMarks} monthly exam marks`);

  // ──────────────────────────────────────────────
  // 11a. Assessments (teacher-level quizzes & assignments)
  // ──────────────────────────────────────────────
  const assessmentClasses = [classes[0]!, classes[6]!, classes[8]!];
  const assessmentSubjects = ["Mathematics", "English", "Urdu"];
  let assessmentCount = 0;
  let entryCount = 0;

  for (const cls of assessmentClasses) {
    const classStudents = students.filter((_, idx) => studentData[idx]!.classIdx === classes.indexOf(cls));

    for (const subjectName of assessmentSubjects) {
      const subject = subjMap[subjectName];
      if (!subject) continue;

      const quiz = await prisma.assessment.create({
        data: {
          classId: cls.id,
          subjectId: subject.id,
          type: "QUIZ",
          title: `${subjectName} Quiz — Week 1`,
          totalMarks: 20,
          date: new Date("2026-05-04"),
          institutionId: INSTITUTION_ID,
        },
      });
      assessmentCount++;

      for (const student of classStudents) {
        const obtained = Math.floor(Math.random() * 11 + 5);
        try {
          await prisma.assessmentEntry.create({
            data: {
              assessmentId: quiz.id,
              studentId: student.id,
              obtained: Math.min(obtained, 20),
            },
          });
          entryCount++;
        } catch { /* skip */ }
      }

      const assignment = await prisma.assessment.create({
        data: {
          classId: cls.id,
          subjectId: subject.id,
          type: "ASSIGNMENT",
          title: `${subjectName} Assignment — Algebra`,
          totalMarks: 50,
          date: new Date("2026-05-11"),
          institutionId: INSTITUTION_ID,
        },
      });
      assessmentCount++;

      for (const student of classStudents) {
        const obtained = Math.floor(Math.random() * 21 + 15);
        try {
          await prisma.assessmentEntry.create({
            data: {
              assessmentId: assignment.id,
              studentId: student.id,
              obtained: Math.min(obtained, 50),
            },
          });
          entryCount++;
        } catch { /* skip */ }
      }
    }
  }
  console.log(`✓ ${assessmentCount} assessments, ${entryCount} entries`);

  // ──────────────────────────────────────────────
  // 11. Resources
  // ──────────────────────────────────────────────
  const resourceData = [
    { title: "Chapter 1 - Algebra Basics", type: "STUDY_MATERIAL" as const, classIdx: 6, subjectName: "Mathematics", url: "https://res.cloudinary.com/demo/materials/algebra-basics.pdf" },
    { title: "Assignment 1 - Linear Equations", type: "ASSIGNMENT" as const, classIdx: 6, subjectName: "Mathematics", url: "https://res.cloudinary.com/demo/assignments/linear-equations.pdf" },
    { title: "Newton's Laws of Motion Notes", type: "STUDY_MATERIAL" as const, classIdx: 8, subjectName: "Physics", url: "https://res.cloudinary.com/demo/materials/newton-laws.pdf" },
    { title: "Periodic Table Reference", type: "STUDY_MATERIAL" as const, classIdx: 8, subjectName: "Chemistry", url: "https://res.cloudinary.com/demo/materials/periodic-table.pdf" },
    { title: "Essay Writing - My Hero", type: "ASSIGNMENT" as const, classIdx: 6, subjectName: "English", url: "https://res.cloudinary.com/demo/assignments/essay-hero.pdf" },
    { title: "Urdu Grammar Exercises", type: "ASSIGNMENT" as const, classIdx: 6, subjectName: "Urdu", url: "https://res.cloudinary.com/demo/assignments/urdu-grammar.pdf" },
    { title: "Syllabus Breakdown 2026", type: "SYLLABUS" as const, classIdx: 6, subjectName: "Mathematics", url: "https://res.cloudinary.com/demo/syllabus/math-2026.pdf" },
    { title: "Biology - Cell Structure", type: "STUDY_MATERIAL" as const, classIdx: 8, subjectName: "Biology", url: "https://res.cloudinary.com/demo/materials/cell-structure.pdf" },
  ];

  for (const r of resourceData) {
    await prisma.resource.create({
      data: {
        title: r.title,
        type: r.type,
        fileUrl: r.url,
        classId: classes[r.classIdx]!.id,
        subjectId: subjMap[r.subjectName]!.id,
        uploaderId: adminUser.id,
        institutionId: INSTITUTION_ID,
      },
    });
  }
  console.log(`✓ ${resourceData.length} resources`);

  // ──────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log("\nLogin credentials:");
  console.log("  Admin:  admin@edutrack.pk / password123");
  console.log("  T-001:  teacher1@edutrack.pk / password123");
  console.log("  T-002:  teacher2@edutrack.pk / password123");
  console.log("  T-003:  teacher3@edutrack.pk / password123");
  console.log("  T-004:  teacher4@edutrack.pk / password123");
  console.log("  T-005:  teacher5@edutrack.pk / password123");
  console.log("  T-006:  teacher6@edutrack.pk / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
