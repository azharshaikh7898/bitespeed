"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class IdentifyService {
    async identify({ email, phoneNumber }) {
        if (!email && !phoneNumber) {
            throw new Error('At least one of email or phoneNumber is required');
        }
        // Find all contacts matching email or phoneNumber
        const contacts = await prisma.contact.findMany({
            where: {
                OR: [
                    email ? { email } : undefined,
                    phoneNumber ? { phoneNumber } : undefined,
                ].filter(Boolean),
            },
            orderBy: { createdAt: 'asc' },
        });
        if (contacts.length === 0) {
            // No contact exists, create primary
            // Check if email or phone already exists (shouldn't, but double-check for safety)
            const existingEmail = email ? await prisma.contact.findUnique({ where: { email } }) : null;
            const existingPhone = phoneNumber ? await prisma.contact.findUnique({ where: { phoneNumber } }) : null;
            if (existingEmail || existingPhone) {
                // If either exists, return error or handle gracefully
                throw new Error('Contact with this email or phone number already exists');
            }
            const newContact = await prisma.contact.create({
                data: {
                    email,
                    phoneNumber,
                    linkPrecedence: 'PRIMARY',
                },
            });
            return {
                primaryContactId: newContact.id,
                emails: newContact.email ? [newContact.email] : [],
                phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
                secondaryContactIds: [],
            };
        }
        // Find all related contacts (by linkedId or id)
        const allContactIds = new Set();
        contacts.forEach(c => {
            allContactIds.add(c.id);
            if (c.linkedId)
                allContactIds.add(c.linkedId);
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
            await Promise.all(primaries.slice(1).map(p => prisma.contact.update({
                where: { id: p.id },
                data: { linkPrecedence: 'SECONDARY', linkedId: oldest.id },
            })));
            primary = oldest;
        }
        // If new info (email/phone) not present, create secondary
        const emails = Array.from(new Set(relatedContacts.map(c => c.email).filter(Boolean)));
        const phoneNumbers = Array.from(new Set(relatedContacts.map(c => c.phoneNumber).filter(Boolean)));
        let newSecondary = null;
        // Only create if email/phone is not already present globally
        const globalEmailExists = email ? await prisma.contact.findFirst({ where: { email } }) : null;
        const globalPhoneExists = phoneNumber ? await prisma.contact.findFirst({ where: { phoneNumber } }) : null;
        if ((email && !globalEmailExists) && (phoneNumber && !globalPhoneExists)) {
            newSecondary = await prisma.contact.create({
                data: {
                    email,
                    phoneNumber,
                    linkPrecedence: 'SECONDARY',
                    linkedId: primary.id,
                },
            });
        }
        else {
            // If either exists, skip creation and just return existing contact info
            // Optionally, you can log or handle this case as needed
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
            primaryContactId: primary.id,
            emails: Array.from(new Set(finalContacts.map(c => c.email).filter((e) => !!e))),
            phoneNumbers: Array.from(new Set(finalContacts.map(c => c.phoneNumber).filter((p) => !!p))),
            secondaryContactIds: finalContacts
                .filter(c => c.linkPrecedence === 'SECONDARY')
                .map(c => c.id),
        };
    }
}
exports.identifyService = new IdentifyService();
