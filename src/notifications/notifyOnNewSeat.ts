import dotenv from "dotenv";
import prisma from "../utils/prisma";
import { runMatchingPipeline } from "../matching/pipeline";

dotenv.config();

const THRESHOLD = parseInt(process.env.NOTIFICATION_THRESHOLD || "70", 10);

interface NotificationResult {
  seat_id: string;
  notified: { serial: string; name: string; email: string; score: number }[];
  skipped: number;
}

export async function notifyOnNewSeat(seatId: string): Promise<NotificationResult> {
  const seat = await prisma.project.findUnique({
    where: { seat_id: seatId },
  });

  if (!seat) {
    throw new Error(`Seat ${seatId} not found`);
  }

  const benchEmployees = await prisma.employee.findMany({
    where: { on_bench: true },
    include: {
      languages: true,
      industry_experience: true,
      ibm_assignments: true,
      roles: true,
    },
  });

  const notified: NotificationResult["notified"] = [];
  let skipped = 0;

  for (const employee of benchEmployees) {
    const result = await runMatchingPipeline(employee, seat);

    if (result.pass && result.score >= THRESHOLD) {
      if (process.env.SENDGRID_API_KEY) {
        try {
          const sgMail = await import("@sendgrid/mail");
          sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
          await sgMail.default.send({
            to: employee.email,
            from: "talentflow@ibm.com",
            subject: `TalentFlow: New matching opportunity - ${seat.title}`,
            html: `
              <h2>New matching seat found</h2>
              <p>Hi ${employee.name},</p>
              <p>A new open seat matches your profile with a score of <strong>${result.score}/100</strong>.</p>
              <h3>${seat.title}</h3>
              <p><strong>Client:</strong> ${seat.client_confidential ? "Confidential" : seat.client_name}</p>
              <p><strong>Location:</strong> ${seat.work_location_city}, ${seat.work_location_country} ${seat.remote_working ? "(Remote OK)" : ""}</p>
              <p><strong>Start date:</strong> ${seat.start_date?.toISOString().slice(0, 10) || "TBD"}</p>
              <p><strong>Match explanation:</strong> ${result.explanation}</p>
              <p>Log in to TalentFlow to review and apply.</p>
            `,
          });
        } catch (err) {
          console.error(`Failed to send email to ${employee.email}:`, err);
        }
      } else {
        console.log(
          `[NOTIFICATION] Would email ${employee.name} (${employee.email}) — ` +
          `Score: ${result.score}/100 for seat ${seat.title}`
        );
        console.log(`  Explanation: ${result.explanation}`);
      }

      notified.push({
        serial: employee.serial,
        name: employee.name,
        email: employee.email,
        score: result.score,
      });
    } else {
      skipped++;
    }
  }

  console.log(
    `\nNotification summary for seat ${seatId}: ` +
    `${notified.length} notified, ${skipped} below threshold (${THRESHOLD})`
  );

  return { seat_id: seatId, notified, skipped };
}

if (require.main === module) {
  const seatId = process.argv[2];
  if (!seatId) {
    console.error("Usage: tsx src/notifications/notifyOnNewSeat.ts <seat_id>");
    process.exit(1);
  }

  notifyOnNewSeat(seatId)
    .then((result) => {
      console.log("\nResult:", JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("Notification failed:", err);
      process.exit(1);
    });
}
