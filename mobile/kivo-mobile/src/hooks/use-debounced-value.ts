import { useEffect, useState } from "react";

/**
 * Retarda la propagación de un valor para evitar ejecutar lógica costosa
 * en cada pulsación del usuario.
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [value, delay]);

    return debouncedValue;
}