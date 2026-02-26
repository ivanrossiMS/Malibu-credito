/**
 * DateHelper.js - Centralized local date handling for Malibu Crédito
 * Eliminates UTC shifting bugs (e.g., displaying 25/02 instead of 26/02)
 */
const DateHelper = {
    /**
     * Converts any date input to a local YYYY-MM-DD string
     * Handles Date objects, ISO strings, and DB timestamps
     */
    toLocalYYYYMMDD: (val) => {
        if (!val) return '';

        let d;
        if (val instanceof Date) {
            d = val;
        } else if (typeof val === 'string') {
            // Se já for YYYY-MM-DD purinho (vindo do DB ou input date)
            const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                // Retorna a string pura sem passar pelo constructor Date
                // Isso evita deslocamentos de timezone
                return `${match[1]}-${match[2]}-${match[3]}`;
            }

            // Caso seja outro formato de string, tenta tratar
            // Se for string com espaço '2026-02-26 15:00:00', vira '2026-02-26T15:00:00'
            d = new Date(val.replace(' ', 'T'));
        } else {
            d = new Date(val);
        }

        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Formats a date string (YYYY-MM-DD or ISO) to DD/MM/YYYY local
     * This is the safest way for DISPLAY as it ignores timezones completely
     */
    formatLocal: (dateStr) => {
        if (!dateStr) return 'Indisponível';
        // Extract only the date part: YYYY-MM-DD
        const part = dateStr.split('T')[0].split(' ')[0];
        const pieces = part.split('-');
        if (pieces.length !== 3) return dateStr;
        const [y, m, d] = pieces;
        return `${d}/${m}/${y}`;
    },

    /**
     * Safely gets a Date object for the start of the day (Local Time)
     */
    getLocalDate: (dateStr) => {
        if (!dateStr) return new Date();
        const part = dateStr.split('T')[0].split(' ')[0];
        return new Date(part + 'T00:00:00');
    },

    /**
     * Gets today's date as a YYYY-MM-DD local string
     */
    getTodayStr: () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Compara se uma data é anterior a hoje (blindagem de fuso)
     */
    isPast: (dateStr) => {
        const date = DateHelper.toLocalYYYYMMDD(dateStr);
        const today = DateHelper.getTodayStr();
        return date < today && date !== '';
    },

    /**
     * Compara se uma data é hoje
     */
    isToday: (dateStr) => {
        return DateHelper.toLocalYYYYMMDD(dateStr) === DateHelper.getTodayStr();
    },

    /**
     * Compara se uma data é futura
     */
    isFuture: (dateStr) => {
        const date = DateHelper.toLocalYYYYMMDD(dateStr);
        const today = DateHelper.getTodayStr();
        return date > today;
    },

    getDiffDays: (d1, d2) => {
        const date1 = DateHelper.getLocalDate(d1);
        const date2 = DateHelper.getLocalDate(d2);
        const diffTime = Math.abs(date2 - date1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    getLocalDate: (dateStr) => {
        const date = DateHelper.toLocalYYYYMMDD(dateStr);
        if (!date) return new Date();
        const [y, m, d] = date.split('-').map(Number);
        return new Date(y, m - 1, d);
    },

    /**
     * Adds days to a date and returns a YYYY-MM-DD local string
     */
    addDays: (date, days) => {
        const d = (date instanceof Date) ? new Date(date) : DateHelper.getLocalDate(date);
        d.setDate(d.getDate() + days);
        return DateHelper.toLocalYYYYMMDD(d);
    }
};

if (typeof window !== 'undefined') {
    window.DateHelper = DateHelper;
}
