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
        create: {
          firstName: "Super",
          lastName: "Admin",
          phone: "0300-1234567",
        },
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
      prisma.subject.create({
        data: { name: s.name, code: s.code, institutionId: INSTITUTION_ID },
      }),
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
        data: {
          name: c.name,
          section: c.section,
          capacity: c.capacity,
          institutionId: INSTITUTION_ID,
        },
      }),
    ),
  );
  console.log(`✓ ${classes.length} classes`);

  // ──────────────────────────────────────────────
  // 5. Teachers
  // ──────────────────────────────────────────────
  const teacherData = [
    {
      email: "teacher1@edutrack.pk",
      empId: "T-001",
      firstName: "Ahmed",
      lastName: "Khan",
      qual: "M.Sc Mathematics",
      phone: "0301-1111111",
    },
    {
      email: "teacher2@edutrack.pk",
      empId: "T-002",
      firstName: "Fatima",
      lastName: "Ali",
      qual: "M.Sc Physics",
      phone: "0301-2222222",
    },
    {
      email: "teacher3@edutrack.pk",
      empId: "T-003",
      firstName: "Muhammad",
      lastName: "Usman",
      qual: "M.Sc Chemistry",
      phone: "0301-3333333",
    },
    {
      email: "teacher4@edutrack.pk",
      empId: "T-004",
      firstName: "Ayesha",
      lastName: "Ahmed",
      qual: "M.Sc Biology",
      phone: "0301-4444444",
    },
    {
      email: "teacher5@edutrack.pk",
      empId: "T-005",
      firstName: "Sana",
      lastName: "Malik",
      qual: "MA English",
      phone: "0301-5555555",
    },
    {
      email: "teacher6@edutrack.pk",
      empId: "T-006",
      firstName: "Zaid",
      lastName: "Hassan",
      qual: "MA Urdu",
      phone: "0301-6666666",
    },
    {
      email: "teacher7@edutrack.pk",
      empId: "T-007",
      firstName: "Hina",
      lastName: "Riaz",
      qual: "M.Sc Computer Science",
      phone: "0301-7777777",
    },
    {
      email: "teacher8@edutrack.pk",
      empId: "T-008",
      firstName: "Kashif",
      lastName: "Malik",
      qual: "MA Islamiyat",
      phone: "0301-8888888",
    },
    {
      email: "teacher9@edutrack.pk",
      empId: "T-009",
      firstName: "Nadia",
      lastName: "Jamil",
      qual: "MA Pakistan Studies",
      phone: "0301-9999999",
    },
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
    // Grade 6-A
    { teacherIdx: 0, classIdx: 0, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 0, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 0, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 0, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 0, subjectName: "English" },
    { teacherIdx: 5, classIdx: 0, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 0, subjectName: "Islamiyat" },
    // Grade 6-B
    { teacherIdx: 0, classIdx: 1, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 1, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 1, subjectName: "English" },
    { teacherIdx: 5, classIdx: 1, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 1, subjectName: "Islamiyat" },
    // Grade 7-A
    { teacherIdx: 0, classIdx: 2, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 2, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 2, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 2, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 2, subjectName: "English" },
    { teacherIdx: 5, classIdx: 2, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 2, subjectName: "Islamiyat" },
    // Grade 7-B
    { teacherIdx: 0, classIdx: 3, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 3, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 3, subjectName: "English" },
    { teacherIdx: 5, classIdx: 3, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 3, subjectName: "Islamiyat" },
    // Grade 8-A
    { teacherIdx: 0, classIdx: 4, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 4, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 4, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 4, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 4, subjectName: "English" },
    { teacherIdx: 5, classIdx: 4, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 4, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 4, subjectName: "Computer Science" },
    // Grade 8-B
    { teacherIdx: 0, classIdx: 5, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 5, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 5, subjectName: "English" },
    { teacherIdx: 5, classIdx: 5, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 5, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 5, subjectName: "Computer Science" },
    // Grade 9-A
    { teacherIdx: 0, classIdx: 6, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 6, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 6, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 6, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 6, subjectName: "English" },
    { teacherIdx: 5, classIdx: 6, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 6, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 6, subjectName: "Computer Science" },
    { teacherIdx: 8, classIdx: 6, subjectName: "Pakistan Studies" },
    // Grade 9-B
    { teacherIdx: 0, classIdx: 7, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 7, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 7, subjectName: "English" },
    { teacherIdx: 5, classIdx: 7, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 7, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 7, subjectName: "Computer Science" },
    // Grade 10-A
    { teacherIdx: 0, classIdx: 8, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 8, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 8, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 8, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 8, subjectName: "English" },
    { teacherIdx: 5, classIdx: 8, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 8, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 8, subjectName: "Computer Science" },
    { teacherIdx: 8, classIdx: 8, subjectName: "Pakistan Studies" },
    // Grade 10-B
    { teacherIdx: 0, classIdx: 9, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 9, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 9, subjectName: "English" },
    { teacherIdx: 5, classIdx: 9, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 9, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 9, subjectName: "Computer Science" },
  ];

  let tscCount = 0;
  for (const a of tscAssignments) {
    const teacherId = teachers[a.teacherIdx]!.teacherProfile!.id;
    const classId = classes[a.classIdx]!.id;
    const subjectId = subjMap[a.subjectName]!.id;

    const perClass = tscAssignments.filter((x) => x.classIdx === a.classIdx);
    const subjIdx = perClass.indexOf(a);
    const { dayOfWeek, startTime, endTime } = scheduleForSubjInClass(
      subjIdx,
      a.classIdx,
    );

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
  // 7. Students (8-10 per class)
  // ──────────────────────────────────────────────
  const firstNames = {
    male: [
      "Abdullah",
      "Bilal",
      "Usman",
      "Hamza",
      "Hassan",
      "Ali",
      "Husnain",
      "Rayan",
      "Ahmad",
      "Saad",
      "Taha",
      "Shahzaib",
      "Farhan",
      "Danish",
      "Talha",
      "Abdul",
      "Rohaan",
      "Omar",
      "Zaid",
      "Ibrahim",
    ],
    female: [
      "Hafsa",
      "Ayesha",
      "Zainab",
      "Maryam",
      "Fatima",
      "Sara",
      "Noor",
      "Eman",
      "Komal",
      "Hira",
      "Laiba",
      "Manahil",
      "Sania",
      "Alina",
      "Mahnoor",
      "Iqra",
      "Areeba",
      "Sana",
      "Mariam",
      "Sabeen",
    ],
  };
  const lastNames = [
    "Khan",
    "Ahmed",
    "Ali",
    "Hussain",
    "Iqbal",
    "Malik",
    "Shah",
    "Raza",
    "Rizvi",
    "Siddiqui",
    "Qureshi",
    "Hassan",
    "Farooq",
    "Akhtar",
    "Nawaz",
    "Yousaf",
    "Anjum",
    "Aziz",
    "Shaikh",
    "Hashmi",
  ];

  const studentData: {
    adm: string;
    first: string;
    last: string;
    gender: "MALE" | "FEMALE";
    guardian: string;
    phone: string;
    classIdx: number;
  }[] = [];

  let studentCounter = 0;
  for (let ci = 0; ci < classData.length; ci++) {
    const classLabel =
      classData[ci]!.name.replace("Grade ", "GR") + classData[ci]!.section;
    const count = ci === 0 || ci === 6 || ci === 8 ? 10 : 8;

    for (let si = 0; si < count; si++) {
      studentCounter++;
      const isMale = studentCounter % 3 !== 0;
      const namePool = isMale ? firstNames.male : firstNames.female;
      const first = namePool[studentCounter % namePool.length]!;
      const last = lastNames[studentCounter % lastNames.length]!;
      const gender = isMale ? ("MALE" as const) : ("FEMALE" as const);

      studentData.push({
        adm: `${classLabel}-${String(si + 1).padStart(3, "0")}`,
        first,
        last,
        gender,
        guardian: `${last} Sb`,
        phone: `0310-${String(1000000 + studentCounter).slice(1)}`,
        classIdx: ci,
      });
    }
  }

  const students = await Promise.all(
    studentData.map((s) =>
      prisma.student.create({
        data: {
          admissionNumber: s.adm,
          firstName: s.first,
          lastName: s.last,
          dob: new Date(
            `2010-${String((studentData.indexOf(s) % 12) + 1).padStart(2, "0")}-15`,
          ),
          gender: s.gender,
          guardianName: s.guardian,
          guardianPhone: s.phone,
          address: `House #${studentData.indexOf(s) + 1}, Street ${(studentData.indexOf(s) % 20) + 1}, Gulistan-e-Jauhar, Karachi`,
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
        rollNumber: (i % 40) + 1,
        status: "ACTIVE",
        institutionId: INSTITUTION_ID,
      },
    });
    enrollmentCount++;
  }
  console.log(`✓ ${enrollmentCount} enrollments`);

  // ──────────────────────────────────────────────
  // 9. Attendance (Grade 9-A & 10-A, last 10 weekdays)
  // ──────────────────────────────────────────────
  const attendanceClasses = [classes[6]!, classes[8]!];

  const pastDates: Date[] = [];
  const today = new Date();
  let daysBack = 0;
  while (pastDates.length < 10) {
    daysBack++;
    const date = new Date(today);
    date.setDate(date.getDate() - daysBack);
    if (date.getDay() !== 5 && date.getDay() !== 6) {
      pastDates.push(date);
    }
  }

  const attendanceSubjectNames = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Urdu",
    "Islamiyat",
    "Computer Science",
    "Pakistan Studies",
  ];

  let attendanceCount = 0;
  for (const cls of attendanceClasses) {
    const clsStudents = students.filter(
      (_, idx) => studentData[idx]!.classIdx === classes.indexOf(cls),
    );
    const clsSubjects = tscAssignments
      .filter((a) => classes.indexOf(cls) === a.classIdx)
      .map((a) => a.subjectName)
      .filter((v, i, a) => a.indexOf(v) === i);

    for (const date of pastDates) {
      for (const subjectName of clsSubjects) {
        for (const student of clsStudents) {
          const statusRoll = Math.random();
          const status =
            statusRoll < 0.72
              ? "PRESENT"
              : statusRoll < 0.85
                ? "ABSENT"
                : statusRoll < 0.94
                  ? "LATE"
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
  // 10. Exams (one per term)
  // ──────────────────────────────────────────────
  const examConfigs = [
    {
      title: "Monthly Test — March 2026",
      term: "MONTHLY" as const,
      start: new Date("2026-03-20"),
      end: new Date("2026-03-21"),
      classIdxs: [0, 2, 4],
      markRange: [20, 80],
      maxMarksBySubj: () => 100,
    },
    {
      title: "Midterm Examinations 2026",
      term: "MIDTERM" as const,
      start: new Date("2026-05-01"),
      end: new Date("2026-05-15"),
      classIdxs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      markRange: [30, 95],
      maxMarksBySubj: (sn: string) =>
        sn === "Mathematics" || sn === "English" ? 100 : 75,
    },
    {
      title: "Pre-Board Examinations 2026",
      term: "PRE_BOARD" as const,
      start: new Date("2026-08-01"),
      end: new Date("2026-08-15"),
      classIdxs: [6, 7, 8, 9],
      markRange: [35, 98],
      maxMarksBySubj: (sn: string) =>
        sn === "Mathematics" || sn === "English" ? 100 : 75,
    },
    {
      title: "Final Examinations 2026",
      term: "FINAL" as const,
      start: new Date("2026-11-01"),
      end: new Date("2026-11-20"),
      classIdxs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      markRange: [25, 99],
      maxMarksBySubj: (sn: string) =>
        sn === "Mathematics" || sn === "English" ? 100 : 75,
    },
  ];

  let totalMarksCount = 0;

  for (const cfg of examConfigs) {
    const exam = await prisma.exam.create({
      data: {
        title: cfg.title,
        term: cfg.term,
        startDate: cfg.start,
        endDate: cfg.end,
        institutionId: INSTITUTION_ID,
        examClasses: {
          create: cfg.classIdxs.map((ci) => ({
            classId: classes[ci]!.id,
            institutionId: INSTITUTION_ID,
          })),
        },
      },
    });

    let examMarksCount = 0;
    for (const ci of cfg.classIdxs) {
      const clsStudents = students.filter(
        (_, idx) => studentData[idx]!.classIdx === ci,
      );
      const clsSubjects = tscAssignments
        .filter((a) => a.classIdx === ci)
        .map((a) => a.subjectName)
        .filter((v, i, a) => a.indexOf(v) === i);

      for (const subjectName of clsSubjects) {
        const subject = subjMap[subjectName];
        if (!subject) continue;
        const maxMarks = cfg.maxMarksBySubj(subjectName);

        for (const student of clsStudents) {
          const obtained = Math.floor(
            Math.random() *
              (((cfg.markRange[1] as any) - cfg.markRange[0]!) as any) +
              cfg.markRange[0]!,
          );
          try {
            await prisma.examMark.create({
              data: {
                examId: exam.id,
                studentId: student.id,
                subjectId: subject.id,
                marksObtained: Math.min(obtained, maxMarks),
                maxMarks,
                recordedById: adminUser.id,
                institutionId: INSTITUTION_ID,
              },
            });
            examMarksCount++;
          } catch {
            // skip duplicates
          }
        }
      }
    }

    totalMarksCount += examMarksCount;
    console.log(`✓ "${cfg.title}" — ${examMarksCount} marks`);
  }

  console.log(`✓ ${totalMarksCount} total exam marks`);

  // ──────────────────────────────────────────────
  // 11. Resources
  // ──────────────────────────────────────────────
  const resourceData = [
    {
      title: "Chapter 1 - Algebra Basics",
      type: "STUDY_MATERIAL" as const,
      classIdx: 6,
      subjectName: "Mathematics",
      url: "https://res.cloudinary.com/demo/materials/algebra-basics.pdf",
    },
    {
      title: "Assignment 1 - Linear Equations",
      type: "ASSIGNMENT" as const,
      classIdx: 6,
      subjectName: "Mathematics",
      url: "https://res.cloudinary.com/demo/assignments/linear-equations.pdf",
    },
    {
      title: "Newton's Laws of Motion Notes",
      type: "STUDY_MATERIAL" as const,
      classIdx: 8,
      subjectName: "Physics",
      url: "https://res.cloudinary.com/demo/materials/newton-laws.pdf",
    },
    {
      title: "Periodic Table Reference",
      type: "STUDY_MATERIAL" as const,
      classIdx: 8,
      subjectName: "Chemistry",
      url: "https://res.cloudinary.com/demo/materials/periodic-table.pdf",
    },
    {
      title: "Essay Writing - My Hero",
      type: "ASSIGNMENT" as const,
      classIdx: 6,
      subjectName: "English",
      url: "https://res.cloudinary.com/demo/assignments/essay-hero.pdf",
    },
    {
      title: "Urdu Grammar Exercises",
      type: "ASSIGNMENT" as const,
      classIdx: 6,
      subjectName: "Urdu",
      url: "https://res.cloudinary.com/demo/assignments/urdu-grammar.pdf",
    },
    {
      title: "Syllabus Breakdown 2026",
      type: "SYLLABUS" as const,
      classIdx: 6,
      subjectName: "Mathematics",
      url: "https://res.cloudinary.com/demo/syllabus/math-2026.pdf",
    },
    {
      title: "Biology - Cell Structure",
      type: "STUDY_MATERIAL" as const,
      classIdx: 8,
      subjectName: "Biology",
      url: "https://res.cloudinary.com/demo/materials/cell-structure.pdf",
    },
    {
      title: "Computer - Programming Basics",
      type: "STUDY_MATERIAL" as const,
      classIdx: 8,
      subjectName: "Computer Science",
      url: "https://res.cloudinary.com/demo/materials/programming.pdf",
    },
    {
      title: "Pakistan Studies - Chapter 1",
      type: "STUDY_MATERIAL" as const,
      classIdx: 8,
      subjectName: "Pakistan Studies",
      url: "https://res.cloudinary.com/demo/materials/pak-studies-ch1.pdf",
    },
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
  console.log("  T-007:  teacher7@edutrack.pk / password123");
  console.log("  T-008:  teacher8@edutrack.pk / password123");
  console.log("  T-009:  teacher9@edutrack.pk / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
