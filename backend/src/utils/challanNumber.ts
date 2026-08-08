import { prisma } from '../lib/prisma';

export async function generateChallanNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `CH-${currentYear}-`;

  // Query highest sequence number for current year prefix
  const latestChallan = await prisma.salesChallan.findFirst({
    where: {
      challanNumber: {
        startsWith: yearPrefix,
      },
    },
    orderBy: {
      challanNumber: 'desc',
    },
    select: {
      challanNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestChallan && latestChallan.challanNumber) {
    const parts = latestChallan.challanNumber.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${yearPrefix}${paddedSequence}`;
}
