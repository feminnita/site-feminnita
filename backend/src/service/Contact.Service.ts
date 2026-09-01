import * as EmailService from '../integrations/resend/Services';

export type ContactInput = {
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    message?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContact(input: ContactInput) {
    const name = (input.name ?? '').trim();
    const email = (input.email ?? '').trim();
    const phone = (input.phone ?? '').trim();
    const subject = (input.subject ?? '').trim();
    const message = (input.message ?? '').trim();

    if (!name || !email || !subject || !message) {
        throw new Error('CONTACT_MISSING_FIELDS');
    }

    if (!EMAIL_REGEX.test(email)) {
        throw new Error('CONTACT_INVALID_EMAIL');
    }

    await EmailService.sendContactMessage({ name, email, phone, subject, message });
}
