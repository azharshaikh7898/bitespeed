import { PrismaClient, LinkPrecedence } from '@prisma/client';

const prisma = new PrismaClient();

interface IdentifyInput {
  email?: string;
  phoneNumber?: string;
}

interface IdentifyResult {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

class IdentifyService {
  async identify({ email, phoneNumber }: IdentifyInput): Promise<IdentifyResult> {
    if (!email && !phoneNumber) {
      throw new Error('At least one of email or phoneNumber is required');
    }

    // Find all contacts matching email or phoneNumber
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          email ? { email } : undefined,
          phoneNumber ? { phoneNumber } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (contacts.length === 0) {
      // No contact exists, create primary
      const newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'PRIMARY',
        },
      });
      return {
        primaryContatctId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryContactIds: [],
      };
    }

    // Find all related contacts (by linkedId or id)
    const allContactIds = new Set<number>();
    contacts.forEach(c => {
      allContactIds.add(c.id);
      if (c.linkedId) allContactIds.add(c.linkedId);
    });
    const relatedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: { in: Array.from(allContactIds) } },
          { linkedId: { in: Array.from(allContactIds) } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Determine primary (oldest primary)
    let primary = relatedContacts.find(c => c.linkPrecedence === 'PRIMARY');
    if (!primary) {
      primary = relatedContacts[0];
    }
    // Merge if multiple primaries
    const primaries = relatedContacts.filter(c => c.linkPrecedence === 'PRIMARY');
    if (primaries.length > 1) {
      // Oldest stays primary, others become secondary
      const oldest = primaries[0];
      await Promise.all(
        primaries.slice(1).map(p =>
          prisma.contact.update({
            where: { id: p.id },
            data: { linkPrecedence: 'SECONDARY', linkedId: oldest.id },
          })
        )
      );
      primary = oldest;
    }

    // If new info (email/phone) not present, create secondary
    const emails = Array.from(new Set(relatedContacts.map(c => c.email).filter(Boolean)));
    const phoneNumbers = Array.from(new Set(relatedContacts.map(c => c.phoneNumber).filter(Boolean)));
    let newSecondary = null;
    if ((email && !emails.includes(email)) || (phoneNumber && !phoneNumbers.includes(phoneNumber))) {
      newSecondary = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'SECONDARY',
          linkedId: primary.id,
        },
      });
    }

    // Re-fetch all related contacts if new secondary was created
    const finalContacts = newSecondary
      ? await prisma.contact.findMany({
          where: {
            OR: [
              { id: primary.id },
              { linkedId: primary.id },
            ],
          },
        })
      : relatedContacts;

    return {
      primaryContatctId: primary.id,
      emails: Array.from(new Set(finalContacts.map(c => c.email).filter((e): e is string => !!e))),
      phoneNumbers: Array.from(new Set(finalContacts.map(c => c.phoneNumber).filter((p): p is string => !!p))),
      secondaryContactIds: finalContacts
        .filter(c => c.linkPrecedence === 'SECONDARY')
        .map(c => c.id),
    };
  }
}

export const identifyService = new IdentifyService();
