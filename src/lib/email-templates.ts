/**
 * Email templates for AgriRent Hub
 * Templates for invoices, payment confirmations, and reminders
 */

interface InvoiceData {
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    equipmentName: string;
    serviceType: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    paymentStatus: 'pending' | 'paid' | 'failed';
    paymentMethod?: string;
    companyName?: string;
}

interface PaymentData {
    clientName: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    transactionReference?: string;
    rentalInfo: string;
}

/**
 * Generate invoice email HTML
 */
export const generateInvoiceEmail = (data: InvoiceData): string => {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture - AgriRent Hub</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 10px;
    }
    .invoice-title {
      font-size: 24px;
      color: #1f2937;
      margin: 20px 0;
    }
    .invoice-number {
      color: #6b7280;
      font-size: 14px;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-label {
      color: #6b7280;
      font-weight: 500;
    }
    .info-value {
      color: #1f2937;
      font-weight: 600;
    }
    .total-row {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin-top: 20px;
    }
    .total-amount {
      font-size: 24px;
      color: #10b981;
      font-weight: bold;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-paid {
      background-color: #d1fae5;
      color: #065f46;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #10b981;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🚜 OUTILTECH</div>
      <p style="color: #6b7280; margin: 0;">Plateforme de location de matériel agricole</p>
    </div>

    <h1 class="invoice-title">Facture de Service</h1>
    <p class="invoice-number">N° ${data.invoiceNumber}</p>

    <div class="section">
      <div class="section-title">Informations Client</div>
      <div class="info-row">
        <span class="info-label">Nom</span>
        <span class="info-value">${data.clientName}</span>
      </div>
      ${data.companyName ? `
      <div class="info-row">
        <span class="info-label">Entreprise</span>
        <span class="info-value">${data.companyName}</span>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <div class="section-title">Détails du Service</div>
      <div class="info-row">
        <span class="info-label">Équipement</span>
        <span class="info-value">${data.equipmentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type de service</span>
        <span class="info-value">${data.serviceType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date de début</span>
        <span class="info-value">${new Date(data.startDate).toLocaleDateString('fr-FR')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date de fin</span>
        <span class="info-value">${new Date(data.endDate).toLocaleDateString('fr-FR')}</span>
      </div>
    </div>

    <div class="total-row">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="color: #6b7280; font-size: 14px;">Montant Total</div>
          <div class="total-amount">${data.totalPrice.toLocaleString('fr-FR')} FCFA</div>
        </div>
        <span class="status-badge ${data.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
          ${data.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
        </span>
      </div>
    </div>

    ${data.paymentStatus === 'pending' ? `
    <div style="text-align: center;">
      <a href="${process.env.VITE_APP_URL || 'https://outiltech.com'}/dashboard/my-invoices" class="button">
        Voir la facture
      </a>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>AgriRent Hub - OUTILTECH</strong></p>
      <p>Pour toute question, contactez-nous à outiltech@grainotech.com</p>
      <p style="font-size: 12px; color: #9ca3af;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate payment confirmation email HTML
 */
export const generatePaymentConfirmationEmail = (data: PaymentData): string => {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de paiement - AgriRent Hub</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .success-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      color: #1f2937;
      margin: 10px 0;
    }
    .subtitle {
      color: #6b7280;
      font-size: 16px;
    }
    .amount {
      font-size: 36px;
      color: #10b981;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-box {
      background-color: #f9fafb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .info-label {
      color: #6b7280;
    }
    .info-value {
      color: #1f2937;
      font-weight: 600;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1 class="title">Paiement confirmé</h1>
      <p class="subtitle">Votre paiement a été reçu avec succès</p>
    </div>

    <div style="text-align: center;">
      <div class="amount">${data.amount.toLocaleString('fr-FR')} FCFA</div>
    </div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${new Date(data.paymentDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Méthode de paiement</span>
        <span class="info-value">${data.paymentMethod === 'cash' ? 'Espèces' : data.paymentMethod === 'credit' ? 'Crédit' : 'Mobile Money'}</span>
      </div>
      ${data.transactionReference ? `
      <div class="info-row">
        <span class="info-label">Référence</span>
        <span class="info-value">${data.transactionReference}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Service</span>
        <span class="info-value">${data.rentalInfo}</span>
      </div>
    </div>

    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;">
        <strong>Merci pour votre confiance !</strong><br>
        Un reçu détaillé est disponible dans votre espace client.
      </p>
    </div>

    <div class="footer">
      <p><strong>AgriRent Hub - OUTILTECH</strong></p>
      <p>Pour toute question, contactez-nous à outiltech@grainotech.com</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate payment reminder email HTML
 */
export const generatePaymentReminderEmail = (data: InvoiceData): string => {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de paiement - AgriRent Hub</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .amount {
      font-size: 28px;
      color: #f59e0b;
      font-weight: bold;
      margin: 15px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #10b981;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="color: #1f2937;">Rappel de paiement</h1>
    
    <div class="warning-box">
      <p style="margin: 0; color: #92400e;">
        <strong>Bonjour ${data.clientName},</strong><br><br>
        Nous vous rappelons qu'un paiement est en attente pour votre service.
      </p>
    </div>

    <p><strong>Détails de la facture :</strong></p>
    <ul>
      <li>Facture N° ${data.invoiceNumber}</li>
      <li>Service : ${data.equipmentName}</li>
      <li>Montant : <span class="amount">${data.totalPrice.toLocaleString('fr-FR')} FCFA</span></li>
    </ul>

    <div style="text-align: center;">
      <a href="${process.env.VITE_APP_URL || 'https://outiltech.com'}/dashboard/my-invoices" class="button">
        Effectuer le paiement
      </a>
    </div>

    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      Si vous avez déjà effectué ce paiement, veuillez ignorer ce message.
    </p>
  </div>
</body>
</html>
  `;
};
