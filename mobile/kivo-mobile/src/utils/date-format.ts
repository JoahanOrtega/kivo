export function formatDateInput(value: string): string {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 8);

    if (digitsOnly.length <= 2) {
        return digitsOnly;
    }

    if (digitsOnly.length <= 4) {
        return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    }

    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
}

export function isValidDateInput(value: string): boolean {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

    if (!match) {
        return false;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (month < 1 || month > 12 || day < 1 || year < 1900) {
        return false;
    }

    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

export function dateInputToIso(value: string): string {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

    if (!match) {
        throw new Error("Invalid date input");
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    return new Date(year, month - 1, day).toISOString();
}

export function isoToDateInput(isoDate: string): string {
    const date = new Date(isoDate);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
}

export function getTodayDateInput(): string {
    return isoToDateInput(new Date().toISOString());
}