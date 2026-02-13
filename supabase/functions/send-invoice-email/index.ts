// Supabase Edge Function to send invoice emails using Resend
// Deploy with: supabase functions deploy send-invoice-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface InvoiceEmailRequest {
    rentalId: string;
    type: 'invoice' | 'payment_confirmation' | 'payment_reminder';
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    try {
        const { rentalId, type }: InvoiceEmailRequest = await req.json()

        // Create Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Fetch rental data with related information
        const { data: rental, error: rentalError } = await supabase
            .from('rentals')
            .select(`
        *,
        client:renter_id (
          id,
          full_name,
          email,
          company
        ),
        equipment:equipment_id (
          id,
          name,
          category
        )
      `)
            .eq('id', rentalId)
            .single()

        if (rentalError || !rental) {
            throw new Error(`Rental not found: ${rentalError?.message}`)
        }

        // Fetch payment transactions if needed
        let paymentData = null
        if (type === 'payment_confirmation') {
            const { data: payments } = await supabase
                .from('payment_transactions')
                .select('*')
                .eq('rental_id', rentalId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            paymentData = payments
        }

        // Prepare email data
        const clientEmail = rental.client?.email
        if (!clientEmail) {
            throw new Error('Client email not found')
        }

        let emailHtml = ''
        let emailSubject = ''

        // Generate appropriate email based on type
        if (type === 'invoice') {
            emailSubject = `Facture N° ${rental.id.substring(0, 8).toUpperCase()} - AgriRent Hub`
            emailHtml = generateInvoiceHTML({
                invoiceNumber: rental.id.substring(0, 8).toUpperCase(),
                clientName: rental.client?.full_name || 'Client',
                clientEmail: clientEmail,
                equipmentName: rental.equipment?.name || 'Équipement',
                serviceType: rental.prestation_type || 'Location',
                startDate: rental.start_date,
                endDate: rental.end_date,
                totalPrice: rental.total_price || 0,
                paymentStatus: rental.payment_status || 'pending',
                companyName: rental.client?.company,
            })
        } else if (type === 'payment_confirmation' && paymentData) {
            emailSubject = `Confirmation de paiement - AgriRent Hub`
            emailHtml = generatePaymentConfirmationHTML({
                clientName: rental.client?.full_name || 'Client',
                amount: paymentData.amount,
                paymentMethod: paymentData.payment_method,
                paymentDate: paymentData.payment_date,
                transactionReference: paymentData.transaction_reference,
                rentalInfo: `${rental.equipment?.name || 'Service'} - ${rental.prestation_type || 'Location'}`,
            })
        } else if (type === 'payment_reminder') {
            emailSubject = `Rappel de paiement - Facture N° ${rental.id.substring(0, 8).toUpperCase()}`
            emailHtml = generatePaymentReminderHTML({
                invoiceNumber: rental.id.substring(0, 8).toUpperCase(),
                clientName: rental.client?.full_name || 'Client',
                clientEmail: clientEmail,
                equipmentName: rental.equipment?.name || 'Équipement',
                serviceType: rental.prestation_type || 'Location',
                startDate: rental.start_date,
                endDate: rental.end_date,
                totalPrice: rental.total_price || 0,
                paymentStatus: rental.payment_status || 'pending',
                companyName: rental.client?.company,
            })
        }

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'AgriRent Hub <noreply@outiltech.com>',
                to: [clientEmail],
                subject: emailSubject,
                html: emailHtml,
            }),
        })

        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
            throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
        }

        return new Response(
            JSON.stringify({
                success: true,
                emailId: resendData.id,
                message: 'Email sent successfully',
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    } catch (error) {
        console.error('Error sending email:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    }
})

// Email template functions (simplified versions - use the full templates from email-templates.ts in production)
function generateInvoiceHTML(data: any): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture - AgriRent Hub</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #10b981;">
      <div style="font-size: 28px; font-weight: bold; color: #10b981; margin-bottom: 10px;">🚜 OUTILTECH</div>
      <p style="color: #6b7280; margin: 0;">Plateforme de location de matériel agricole</p>
    </div>

    <h1 style="font-size: 24px; color: #1f2937; margin: 20px 0;">Facture de Service</h1>
    <p style="color: #6b7280; font-size: 14px;">N° ${data.invoiceNumber}</p>

    <div style="margin: 25px 0;">
      <h2 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 10px;">Informations Client</h2>
      <p><strong>Nom:</strong> ${data.clientName}</p>
      ${data.companyName ? `<p><strong>Entreprise:</strong> ${data.companyName}</p>` : ''}
    </div>

    <div style="margin: 25px 0;">
      <h2 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 10px;">Détails du Service</h2>
      <p><strong>Équipement:</strong> ${data.equipmentName}</p>
      <p><strong>Type de service:</strong> ${data.serviceType}</p>
      <p><strong>Date de début:</strong> ${new Date(data.startDate).toLocaleDateString('fr-FR')}</p>
      <p><strong>Date de fin:</strong> ${new Date(data.endDate).toLocaleDateString('fr-FR')}</p>
    </div>

    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="color: #6b7280; font-size: 14px;">Montant Total</div>
          <div style="font-size: 24px; color: #10b981; font-weight: bold;">${data.totalPrice.toLocaleString('fr-FR')} FCFA</div>
        </div>
        <span style="padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; background-color: ${data.paymentStatus === 'paid' ? '#d1fae5' : '#fef3c7'}; color: ${data.paymentStatus === 'paid' ? '#065f46' : '#92400e'};">
          ${data.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
        </span>
      </div>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
      <p><strong>AgriRent Hub - OUTILTECH</strong></p>
      <p>Pour toute question, contactez-nous à outiltech@grainotech.com</p>
    </div>
  </div>
</body>
</html>
  `
}

function generatePaymentConfirmationHTML(data: any): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de paiement</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
      <h1 style="font-size: 24px; color: #1f2937; margin: 10px 0;">Paiement confirmé</h1>
      <p style="color: #6b7280; font-size: 16px;">Votre paiement a été reçu avec succès</p>
    </div>

    <div style="text-align: center;">
      <div style="font-size: 36px; color: #10b981; font-weight: bold; margin: 20px 0;">${data.amount.toLocaleString('fr-FR')} FCFA</div>
    </div>

    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p><strong>Date:</strong> ${new Date(data.paymentDate).toLocaleDateString('fr-FR')}</p>
      <p><strong>Méthode de paiement:</strong> ${data.paymentMethod === 'cash' ? 'Espèces' : data.paymentMethod === 'credit' ? 'Crédit' : 'Mobile Money'}</p>
      ${data.transactionReference ? `<p><strong>Référence:</strong> ${data.transactionReference}</p>` : ''}
      <p><strong>Service:</strong> ${data.rentalInfo}</p>
    </div>

    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;">
        <strong>Merci pour votre confiance !</strong><br>
        Un reçu détaillé est disponible dans votre espace client.
      </p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
      <p><strong>AgriRent Hub - OUTILTECH</strong></p>
      <p>Pour toute question, contactez-nous à outiltech@grainotech.com</p>
    </div>
  </div>
</body>
</html>
  `
}

function generatePaymentReminderHTML(data: any): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de paiement</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1f2937;">Rappel de paiement</h1>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;">
        <strong>Bonjour ${data.clientName},</strong><br><br>
        Nous vous rappelons qu'un paiement est en attente pour votre service.
      </p>
    </div>

    <p><strong>Détails de la facture :</strong></p>
    <ul>
      <li>Facture N° ${data.invoiceNumber}</li>
      <li>Service : ${data.equipmentName}</li>
      <li>Montant : <strong style="font-size: 20px; color: #f59e0b;">${data.totalPrice.toLocaleString('fr-FR')} FCFA</strong></li>
    </ul>

    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      Si vous avez déjà effectué ce paiement, veuillez ignorer ce message.
    </p>
  </div>
</body>
</html>
  `
}
