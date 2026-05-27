// Validates that email is non-empty and ends with @gmail.com
export const validateEmail = (email) => {
    if (email.trim()) {
        const regex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|zohomail\.in)$/;
        return regex.test(email);
    }
    return false;
};
