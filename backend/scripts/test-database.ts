import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    const count = await prisma.booking.count();
    console.log("✅ Database connection successful");
    console.log(`   Total bookings: ${count}`);

    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    console.log(`   Recent bookings: ${recentBookings.length}`);
    recentBookings.forEach((b) => {
      console.log(`   - ${b.name} (${b.email}) - ${b.status}`);
    });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Database connection failed:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testDatabase();
