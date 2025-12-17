/**
 * Configuration pour les emails d'authentification Supabase
 * 
 * Pour configurer les templates d'email dans Supabase:
 * 1. Allez dans Authentication > Email Templates
 * 2. Configurez les templates suivants:
 *    - Confirm signup (confirmation d'inscription)
 *    - Reset password (réinitialisation de mot de passe)
 *    - Magic Link (lien magique)
 */

export const emailConfig = {
    // URL de redirection après confirmation d'email
    confirmationRedirectUrl: `${window.location.origin}/verify-email`,

    // URL de redirection après réinitialisation de mot de passe
    resetPasswordRedirectUrl: `${window.location.origin}/reset-password`,

    // Options pour l'inscription avec confirmation d'email
    signUpOptions: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
    },

    // Options pour la réinitialisation de mot de passe
    resetPasswordOptions: {
        redirectTo: `${window.location.origin}/reset-password`,
    },
};

/**
 * Validation de la force du mot de passe
 */
export const validatePassword = (password: string): {
    isValid: boolean;
    errors: string[]
} => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push("Le mot de passe doit contenir au moins 8 caractères");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins une majuscule");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins une minuscule");
    }

    if (!/[0-9]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins un chiffre");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins un caractère spécial");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Calcul de la force du mot de passe (0-100)
 */
export const calculatePasswordStrength = (password: string): number => {
    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;

    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;

    return Math.min(strength, 100);
};

/**
 * Obtenir le label de force du mot de passe
 */
export const getPasswordStrengthLabel = (strength: number): {
    label: string;
    color: string;
} => {
    if (strength < 30) {
        return { label: "Très faible", color: "text-red-500" };
    } else if (strength < 50) {
        return { label: "Faible", color: "text-orange-500" };
    } else if (strength < 70) {
        return { label: "Moyen", color: "text-yellow-500" };
    } else if (strength < 90) {
        return { label: "Fort", color: "text-green-500" };
    } else {
        return { label: "Très fort", color: "text-emerald-500" };
    }
};
