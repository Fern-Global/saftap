export const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password: string) => password.length >= 8;

export const validatePhone = (phone: string) => phone.length >= 7;

export const validateTotpCode = (code: string) => /^\d{6}$/.test(code);
