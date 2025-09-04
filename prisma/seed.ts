// prisma/seed.ts

import { Role } from "../src/decorator/enums/roles";
import { Status , PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

// prisma/seed.ts


async function main() {
  console.log("🚀 Starting seed...");

  // 1️⃣ Create Teachers
  await prisma.user.createMany({
    data: Array.from({ length: 3 }).map((_, i) => ({
      name: `Teacher ${i + 1}`,
      email: `teacher${i + 1}@example.com`,
      password: "hashed_pw",
      role: Role.TEACHER,
    })),
    skipDuplicates: true,
  });

  const teacherRecords = await prisma.user.findMany({
    where: { role: Role.TEACHER },
  });

  // 2️⃣ Create Students
  await prisma.user.createMany({
    data: Array.from({ length: 15 }).map((_, i) => ({
      name: `Student ${i + 1}`,
      email: `student${i + 1}@example.com`,
      password: "hashed_pw",
      role: Role.STUDENT,
    })),
    skipDuplicates: true,
  });

  const studentRecords = await prisma.user.findMany({
    where: { role: Role.STUDENT },
  });

  // 3️⃣ Create Subjects & Groups
  for (const [index, teacher] of teacherRecords.entries()) {
    const subject = await prisma.subject.create({
      data: {
        title: `Subject ${index + 1}`,
        description: `Description for subject ${index + 1}`,
        teacherId: teacher.id,
      },
    });

    // Each teacher has 2 groups
    for (let g = 1; g <= 2; g++) {
      const group = await prisma.group.create({
        data: {
          name: `Group ${index + 1}-${g}`,
          capacity: 30,
          subjectId: subject.id,
          createdById: teacher.id,
        },
      });

      // Randomly assign 5 students per group
      const groupStudents = studentRecords
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

      for (const [sIdx, student] of groupStudents.entries()) {
        await prisma.membership.create({
          data: {
            studentId: student.id,
            groupId: group.id,
            status: sIdx === 4 ? Status.REJECTED : Status.APPROVED, // last student rejected
          },
        });
      }

      // Create Group Conversation
      const groupConversation = await prisma.conversation.create({
        data: {
          isGroup: true,
          groupId: group.id,
        },
      });

      // Add Group Messages
      const messages = [
        {
          senderId: teacher.id,
          content: `Welcome to ${group.name}!`,
        },
        ...groupStudents
          .filter((_, idx) => idx < 4) // approved only
          .map((student, idx) => ({
            senderId: student.id,
            content: `Hello from ${student.name}! (msg ${idx + 1})`,
          })),
      ];

      await prisma.message.createMany({
        data: messages.map((m) => ({
          conversationId: groupConversation.id,
          senderId: m.senderId,
          content: m.content,
        })),
        skipDuplicates: true,
      });

      // Direct Conversations (teacher ↔ each approved student)
      for (const student of groupStudents.filter((_, idx) => idx < 4)) {
        let directConversation = await prisma.conversation.findFirst({
          where: {
            isGroup: false,
            studentId: student.id,
            teacherId: teacher.id,
          },
        });

        if (!directConversation) {
          directConversation = await prisma.conversation.create({
            data: {
              isGroup: false,
              studentId: student.id,
              teacherId: teacher.id,
            },
          });
        }

        await prisma.message.createMany({
          data: [
            {
              conversationId: directConversation.id,
              senderId: teacher.id,
              content: `Hello ${student.name}, welcome to ${subject.title}.`,
            },
            {
              conversationId: directConversation.id,
              senderId: student.id,
              content: `Thanks, teacher ${teacher.name}!`,
            },
          ],
          skipDuplicates: true, // ✅ prevents duplicate messages
        });
      }
    }
  }

  console.log("✅ Seed data inserted successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });