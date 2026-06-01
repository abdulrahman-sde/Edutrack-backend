import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

if (!process.env["DATABASE_URL"]) {
  try { process.loadEnvFile(); } catch { /* ignore */ }
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

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {

  const hash = await bcrypt.hash("password123", 12);
  const today = new Date();

  // ───────────── 1. Institution ─────────────
  const institution = await prisma.institution.create({
    data: { id: INSTITUTION_ID, name: "Al-Hira Public School" },
  });
  console.log(`1. ${institution.name}`);

  // ───────────── 2. Admin ─────────────
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
  console.log(`2. Admin: admin@edutrack.pk / password123`);

  // ───────────── 3. Subjects ─────────────
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
  console.log(`3. ${subjects.length} subjects`);

  // ───────────── 4. Classes ─────────────
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
  console.log(`4. ${classes.length} classes`);

  // ───────────── 5. Teachers ─────────────
  const teacherData = [
    { email: "teacher1@edutrack.pk", empId: "T-001", firstName: "Ahmed", lastName: "Khan", qual: "M.Sc Mathematics", phone: "0301-1111111" },
    { email: "teacher2@edutrack.pk", empId: "T-002", firstName: "Fatima", lastName: "Ali", qual: "M.Sc Physics", phone: "0301-2222222" },
    { email: "teacher3@edutrack.pk", empId: "T-003", firstName: "Muhammad", lastName: "Usman", qual: "M.Sc Chemistry", phone: "0301-3333333" },
    { email: "teacher4@edutrack.pk", empId: "T-004", firstName: "Ayesha", lastName: "Ahmed", qual: "M.Sc Biology", phone: "0301-4444444" },
    { email: "teacher5@edutrack.pk", empId: "T-005", firstName: "Sana", lastName: "Malik", qual: "MA English", phone: "0301-5555555" },
    { email: "teacher6@edutrack.pk", empId: "T-006", firstName: "Zaid", lastName: "Hassan", qual: "MA Urdu", phone: "0301-6666666" },
    { email: "teacher7@edutrack.pk", empId: "T-007", firstName: "Hina", lastName: "Riaz", qual: "M.Sc Computer Science", phone: "0301-7777777" },
    { email: "teacher8@edutrack.pk", empId: "T-008", firstName: "Kashif", lastName: "Malik", qual: "MA Islamiyat", phone: "0301-8888888" },
    { email: "teacher9@edutrack.pk", empId: "T-009", firstName: "Nadia", lastName: "Jamil", qual: "MA Pakistan Studies", phone: "0301-9999999" },
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
  console.log(`5. ${teachers.length} teachers`);

  // ───────────── 6. TSC assignments ─────────────
  const tscAssignments: { teacherIdx: number; classIdx: number; subjectName: string }[] = [
    { teacherIdx: 0, classIdx: 0, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 0, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 0, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 0, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 0, subjectName: "English" },
    { teacherIdx: 5, classIdx: 0, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 0, subjectName: "Islamiyat" },
    { teacherIdx: 0, classIdx: 1, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 1, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 1, subjectName: "English" },
    { teacherIdx: 5, classIdx: 1, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 1, subjectName: "Islamiyat" },
    { teacherIdx: 0, classIdx: 2, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 2, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 2, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 2, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 2, subjectName: "English" },
    { teacherIdx: 5, classIdx: 2, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 2, subjectName: "Islamiyat" },
    { teacherIdx: 0, classIdx: 3, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 3, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 3, subjectName: "English" },
    { teacherIdx: 5, classIdx: 3, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 3, subjectName: "Islamiyat" },
    { teacherIdx: 0, classIdx: 4, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 4, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 4, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 4, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 4, subjectName: "English" },
    { teacherIdx: 5, classIdx: 4, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 4, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 4, subjectName: "Computer Science" },
    { teacherIdx: 0, classIdx: 5, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 5, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 5, subjectName: "English" },
    { teacherIdx: 5, classIdx: 5, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 5, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 5, subjectName: "Computer Science" },
    { teacherIdx: 0, classIdx: 6, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 6, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 6, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 6, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 6, subjectName: "English" },
    { teacherIdx: 5, classIdx: 6, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 6, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 6, subjectName: "Computer Science" },
    { teacherIdx: 8, classIdx: 6, subjectName: "Pakistan Studies" },
    { teacherIdx: 0, classIdx: 7, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 7, subjectName: "Physics" },
    { teacherIdx: 4, classIdx: 7, subjectName: "English" },
    { teacherIdx: 5, classIdx: 7, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 7, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 7, subjectName: "Computer Science" },
    { teacherIdx: 0, classIdx: 8, subjectName: "Mathematics" },
    { teacherIdx: 1, classIdx: 8, subjectName: "Physics" },
    { teacherIdx: 2, classIdx: 8, subjectName: "Chemistry" },
    { teacherIdx: 3, classIdx: 8, subjectName: "Biology" },
    { teacherIdx: 4, classIdx: 8, subjectName: "English" },
    { teacherIdx: 5, classIdx: 8, subjectName: "Urdu" },
    { teacherIdx: 7, classIdx: 8, subjectName: "Islamiyat" },
    { teacherIdx: 6, classIdx: 8, subjectName: "Computer Science" },
    { teacherIdx: 8, classIdx: 8, subjectName: "Pakistan Studies" },
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
    const perClass = tscAssignments.filter((x) => x.classIdx === a.classIdx);
    const subjIdx = perClass.indexOf(a);
    const { dayOfWeek, startTime, endTime } = scheduleForSubjInClass(subjIdx, a.classIdx);
    await prisma.teacherSubjectClass.create({
      data: {
        teacherId,
        classId: classes[a.classIdx]!.id,
        subjectId: subjMap[a.subjectName]!.id,
        dayOfWeek,
        startTime,
        endTime,
        institutionId: INSTITUTION_ID,
      },
    });
    tscCount++;
  }
  console.log(`6. ${tscCount} subject-teacher-class assignments`);

  // ───────────── 7. Students ─────────────
  const firstNames = {
    male: ["Abdullah","Bilal","Usman","Hamza","Hassan","Ali","Husnain","Rayan","Ahmad","Saad","Taha","Shahzaib","Farhan","Danish","Talha","Rohaan","Omar","Zaid","Ibrahim","Haroon"],
    female: ["Hafsa","Ayesha","Zainab","Maryam","Fatima","Sara","Noor","Eman","Komal","Hira","Laiba","Manahil","Sania","Alina","Mahnoor","Iqra","Areeba","Sana","Mariam","Sabeen"],
  };
  const lastNames = ["Khan","Ahmed","Ali","Hussain","Iqbal","Malik","Shah","Raza","Rizvi","Siddiqui","Qureshi","Hassan","Farooq","Akhtar","Nawaz","Yousaf","Anjum","Aziz","Shaikh","Hashmi"];
  const cities = ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta","Sialkot","Gujranwala"];
  const streetNames = ["Gulistan-e-Jauhar","F-10","G-11","Johar Town","Gulberg","Defence","Clifton","Saddar","Satellite Town","Cantt"];

  const gradeDobBase = [2014, 2013, 2012, 2011, 2010];

  interface StudentSeed {
    adm: string;
    first: string;
    last: string;
    gender: "MALE" | "FEMALE";
    guardian: string;
    phone: string;
    address: string;
    classIdx: number;
    ability: number;
    punctuality: number;
  }

  const studentSeedData: StudentSeed[] = [];
  let studentCounter = 0;

  for (let ci = 0; ci < classData.length; ci++) {
    const classLabel = classData[ci]!.name.replace("Grade ", "GR") + classData[ci]!.section;
    const grIdx = parseInt(classData[ci]!.name.replace("Grade ", "")) - 6;
    const dobYear = gradeDobBase[grIdx] ?? 2010;
    const count = ci === 0 || ci === 6 || ci === 8 ? 10 : 8;

    for (let si = 0; si < count; si++) {
      studentCounter++;
      const isMale = studentCounter % 3 !== 0;
      const namePool = isMale ? firstNames.male : firstNames.female;
      const first = namePool[studentCounter % namePool.length]!;
      const last = lastNames[studentCounter % lastNames.length]!;
      const gender = isMale ? "MALE" as const : "FEMALE" as const;

      studentSeedData.push({
        adm: `${classLabel}-${String(si + 1).padStart(3, "0")}`,
        first,
        last,
        gender,
        guardian: `${pick(lastNames)} Sb`,
        phone: `0310-${String(1000000 + studentCounter).slice(1)}`,
        address: `House #${studentCounter}, Street ${(studentCounter % 20) + 1}, ${pick(streetNames)}, ${pick(cities)}`,
        classIdx: ci,
        ability: clamp(0.3 + Math.random() * 0.7, 0.3, 1.0),
        punctuality: clamp(0.5 + Math.random() * 0.5, 0.5, 1.0),
      });
    }
  }

  const students = await Promise.all(
    studentSeedData.map((s) =>
      prisma.student.create({
        data: {
          admissionNumber: s.adm,
          firstName: s.first,
          lastName: s.last,
          dob: new Date(`${randBetween(1, 12).toString().padStart(2, "0")}-${randBetween(1, 28).toString().padStart(2, "0")}`),
          gender: s.gender,
          guardianName: s.guardian,
          guardianPhone: s.phone,
          address: s.address,
          institutionId: INSTITUTION_ID,
        },
      }),
    ),
  );
  console.log(`7. ${students.length} students`);

  // ───────────── 8. Enrollments ─────────────
  let enrolled = 0;
  for (let i = 0; i < studentSeedData.length; i++) {
    await prisma.enrollment.create({
      data: {
        studentId: students[i]!.id,
        classId: classes[studentSeedData[i]!.classIdx]!.id,
        rollNumber: (i % 40) + 1,
        status: "ACTIVE",
        institutionId: INSTITUTION_ID,
      },
    });
    enrolled++;
  }
  console.log(`8. ${enrolled} enrollments`);

  // ───────────── 9. Attendance ─────────────
  const attnDates = (() => {
    const dates: Date[] = [];
    const now = new Date();
    let d = 0;
    while (dates.length < 25) {
      d++;
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      if (date.getDay() !== 5 && date.getDay() !== 6) dates.push(date);
    }
    return dates;
  })();

  let attnCount = 0;
  const statuses: ("PRESENT" | "ABSENT" | "LATE" | "LEAVE")[] = ["PRESENT","ABSENT","LATE","LEAVE"];

  for (let ci = 0; ci < classData.length; ci++) {
    const clsStudents = students.filter((_, i) => studentSeedData[i]!.classIdx === ci);
    const clsSubjects = [...new Set(tscAssignments.filter((a) => a.classIdx === ci).map((a) => a.subjectName))];

    for (const date of attnDates) {
      for (const subjectName of clsSubjects) {
        for (const student of clsStudents) {
          const seed = studentSeedData[students.indexOf(student)]!;
          const roll = Math.random();
          const threshold = seed.punctuality * 0.85;

          const status = roll < threshold ? "PRESENT" : roll < threshold + 0.08 ? "ABSENT" : roll < threshold + 0.14 ? "LATE" : "LEAVE";

          try {
            await prisma.attendance.create({
              data: {
                studentId: student.id,
                classId: classes[ci]!.id,
                subjectId: subjMap[subjectName]!.id,
                date,
                status,
                recordedById: adminUser.id,
                institutionId: INSTITUTION_ID,
              },
            });
            attnCount++;
          } catch { /* skip duplicates */ }
        }
      }
    }
  }
  console.log(`9. ${attnCount} attendance records`);

  // ───────────── 10. Exams ─────────────
  const examConfigs = [
    {
      title: "Monthly Test — March 2026",
      term: "MONTHLY" as const,
      start: new Date("2026-03-20"),
      end: new Date("2026-03-21"),
      classIdxs: [0, 2, 4],
      maxMarksBySubj: () => 100,
      variance: 0.08,
    },
    {
      title: "Midterm Examinations 2026",
      term: "MIDTERM" as const,
      start: new Date("2026-05-01"),
      end: new Date("2026-05-15"),
      classIdxs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      maxMarksBySubj: (sn: string) => sn === "Mathematics" || sn === "English" ? 100 : 75,
      variance: 0.1,
    },
    {
      title: "Pre-Board Examinations 2026",
      term: "PRE_BOARD" as const,
      start: new Date("2026-08-01"),
      end: new Date("2026-08-15"),
      classIdxs: [6, 7, 8, 9],
      maxMarksBySubj: (sn: string) => sn === "Mathematics" || sn === "English" ? 100 : 75,
      variance: 0.1,
    },
    {
      title: "Final Examinations 2026",
      term: "FINAL" as const,
      start: new Date("2026-11-01"),
      end: new Date("2026-11-20"),
      classIdxs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      maxMarksBySubj: (sn: string) => sn === "Mathematics" || sn === "English" ? 100 : 75,
      variance: 0.12,
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
      const clsStudents = students.filter((_, i) => studentSeedData[i]!.classIdx === ci);
      const clsSubjects = [...new Set(tscAssignments.filter((a) => a.classIdx === ci).map((a) => a.subjectName))];

      for (const subjectName of clsSubjects) {
        const subject = subjMap[subjectName];
        if (!subject) continue;
        const maxMarks = cfg.maxMarksBySubj(subjectName);

        for (const student of clsStudents) {
          const seed = studentSeedData[students.indexOf(student)]!;
          const basePct = seed.ability * 100;
          const jitter = (Math.random() - 0.5) * 2 * cfg.variance * 100;
          const pct = clamp(basePct + jitter, 15, 99);
          const obtained = Math.round((pct / 100) * maxMarks);

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
            examMarksCount++;
          } catch { /* skip duplicates */ }
        }
      }
    }
    totalMarksCount += examMarksCount;
    console.log(`10${String(examConfigs.indexOf(cfg) + 1)}. "${cfg.title}" — ${examMarksCount} marks`);
  }
  console.log(`10. ${totalMarksCount} total exam marks`);

  // ───────────── 11. Resources ─────────────
  const resourceItems = [
    { title: "Algebra Basics — Chapter 1", type: "STUDY_MATERIAL" as const, classIdx: 6, subjectName: "Mathematics", url: "https://res.cloudinary.com/demo/materials/algebra-basics.pdf" },
    { title: "Linear Equations Assignment", type: "ASSIGNMENT" as const, classIdx: 6, subjectName: "Mathematics", url: "https://res.cloudinary.com/demo/assignments/linear-equations.pdf" },
    { title: "Newton's Laws of Motion", type: "STUDY_MATERIAL" as const, classIdx: 8, subjectName: "Physics", url: "https://res.cloudinary.com/demo/materials/newton-laws.pdf" },
    { title: "Periodic Table Reference", type: "STUDY_MATERIAL" as const, classIdx: 8, subjectName: "Chemistry", url: "https://res.cloudinary.com/demo/materials/periodic-table.pdf" },
    { title: "Essay: My Hero", type: "ASSIGNMENT" as const, classIdx: 6, subjectName: "English", url: "https://res.cloudinary.com/demo/assignments/essay-hero.pdf" },
    { title: "Urdu Grammar Exercises", type: "ASSIGNMENT" as const, classIdx: 6, subjectName: "Urdu", url: "https://res.cloudinary.com/demo/assignments/urdu-grammar.pdf" },
    { title: "Syllabus Breakdown 2026", type: "SYLLABUS" as const, classIdx: 6, subjectName: "Mathematics", url: "https://res.cloudinary.com/demo/syllabus/math-2026.pdf" },
    { title: "Cell Structure — Biology", type: "STUDY_MATERIAL" as const, classIdx: 8, subjectName: "Biology", url: "https://res.cloudinary.com/demo/materials/cell-structure.pdf" },
    { title: "Programming Basics — Python", type: "STUDY_MATERIAL" as const, classIdx: 8, subjectName: "Computer Science", url: "https://res.cloudinary.com/demo/materials/programming.pdf" },
    { title: "Pakistan Studies Chapter 1", type: "STUDY_MATERIAL" as const, classIdx: 8, subjectName: "Pakistan Studies", url: "https://res.cloudinary.com/demo/materials/pak-studies-ch1.pdf" },
    { title: "Quadratic Equations Practice", type: "ASSIGNMENT" as const, classIdx: 8, subjectName: "Mathematics", url: "https://res.cloudinary.com/demo/assignments/quadratic.pdf" },
    { title: "Chemical Bonding Notes", type: "STUDY_MATERIAL" as const, classIdx: 6, subjectName: "Chemistry", url: "https://res.cloudinary.com/demo/materials/chemical-bonding.pdf" },
  ];

  for (const r of resourceItems) {
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
  console.log(`11. ${resourceItems.length} resources`);

  // ───────────── Done ─────────────
  console.log("\n✅ Seed complete!\n");
  console.log("Login credentials:");
  console.log(`  Admin:   admin@edutrack.pk / password123`);
  for (const t of teacherData) console.log(`  ${t.empId}:  ${t.email} / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
