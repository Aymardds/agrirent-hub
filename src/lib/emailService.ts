import { supabase } from './supabase';

/**
 * Helper functions for sending emails via Supabase Edge Functions
 */

export type EmailType = 'invoice' | 'payment_confirmation' | 'payment_reminder';

interface SendEmailParams {
    rentalId: string;
    type: EmailType;
}

/**
 * Send an invoice or payment email
 */
export const sendEmail = async ({ rentalId, type }: SendEmailParams): Promise<{
    success: boolean;
    emailId?: string;
    error?: string;
}> => {
    try {
        const { data, error } = await supabase.functions.invoke('send-invoice-email', {
            body: {
                rentalId,
                type,
            },
        });

        if (error) {
            console.error('Error invoking email function:', error);
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: data.success,
            emailId: data.emailId,
            error: data.error,
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

/**
 * Send invoice email for a rental
 */
export const sendInvoiceEmail = async (rentalId: string) => {
    return sendEmail({ rentalId, type: 'invoice' });
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmationEmail = async (rentalId: string) => {
    return sendEmail({ rentalId, type: 'payment_confirmation' });
};

/**
 * Send payment reminder email
 */
export const sendPaymentReminderEmail = async (rentalId: string) => {
    return sendEmail({ rentalId, type: 'payment_reminder' });
};
