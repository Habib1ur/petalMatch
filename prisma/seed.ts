import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (
    process.env.ADMIN_EMAIL || "admin@petalmatch.com"
  )
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeThisStrongPassword123!";
  const name = process.env.ADMIN_NAME || "Administrator";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      name,
    },
    create: {
      email,
      name,
      passwordHash,
    },
  });

  console.log(`Admin ready: ${admin.email} (${admin.id})`);

  // Ensure a default sharing link exists for initial setup
  const existingLink = await prisma.shareLink.findUnique({
    where: { slug: "welcome" },
  });

  if (!existingLink) {
    const link = await prisma.shareLink.create({
      data: {
        adminId: admin.id,
        slug: "welcome",
        name: "Welcome Link",
        description: "Default PetalMatch sharing link",
        customHeading: "Let's see what the stars say about you two.",
        welcomeMessage: "Two names. One little experiment. A surprising result.",
        isActive: true,
      },
    });
    console.log(`Default share link created: /m/${link.slug}`);
  }
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
