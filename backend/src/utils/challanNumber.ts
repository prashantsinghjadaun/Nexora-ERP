import { prisma } from '../lib/prisma';

export async function generateChallanNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `CH-${currentYear}-`;

  // Fetch all challan numbers for the current year
  const yearChallans = await prisma.salesChallan.findMany({
    where: {
      challanNumber: {
        startsWith: yearPrefix,
      },
    },
    select: {
      challanNumber: true,
    },
  });

  let maxSequence = 0;

  for (const c of yearChallans) {
    if (c.challanNumber) {
      const parts = c.challanNumber.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSequence) {
          maxSequence = seq;
        }
      }
    }
  }

  const nextSequence = maxSequence + 1;
  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${yearPrefix}${paddedSequence}`;
}
