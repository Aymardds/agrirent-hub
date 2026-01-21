/**
 * Centralized role normalization utility
 * Handles French/English variants, spacing, and capitalization
 */

export const normalizeRole = (role: string | undefined): string | null => {
    if (!role) return null;

    const clean = role.trim().toLowerCase();

    const mappings: Record<string, string> = {
        'super admin': 'super_admin',
        'super_admin': 'super_admin',
        'superadmin': 'super_admin',
        'admin': 'admin',
        'administrateur': 'admin',
        'stock manager': 'stock_manager',
        'stock_manager': 'stock_manager',
        'gestionnaire stock': 'stock_manager',
        'gestionnaire_stock': 'stock_manager',
        'technician': 'technician',
        'technicien': 'technician',
        'client': 'client',
        'cooperative': 'cooperative',
        'provider': 'provider',
        'accountant': 'accountant',
        'comptable': 'accountant',
    };

    // Check direct match, snake_case match, or fallback to snake_case
    return mappings[clean] || mappings[clean.replace(/ /g, '_')] || clean.replace(/ /g, '_');
};

export type UserRole = 'super_admin' | 'admin' | 'stock_manager' | 'technician' | 'client' | 'accountant' | 'cooperative' | 'provider';
