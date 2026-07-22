import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating dev users...");

  // Owner account: x / zx12345
  const user1 = await prisma.user.upsert({
    where: { email: "x@syrix.com" },
    update: { role: "owner" },
    create: {
      firebaseUid: `dev-${Date.now()}-1`,
      email: "x@syrix.com",
      name: "مستخدم مخفي",
      role: "owner",
      department: "hr",
      devPassword: "zx12345",
    },
  });
  console.log(`Created user: ${user1.email} (${user1.role})`);

  // Super Admin: admin@syrix.com / سش12345
  const user2 = await prisma.user.upsert({
    where: { email: "admin@syrix.com" },
    update: {},
    create: {
      firebaseUid: `dev-${Date.now()}-2`,
      email: "admin@syrix.com",
      name: "مدير النظام",
      role: "super_admin",
      department: "accounts",
      devPassword: "سش12345",
    },
  });
  console.log(`Created user: ${user2.email} (${user2.role})`);

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
