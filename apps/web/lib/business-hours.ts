/**
 * Business Hours Utility
 * Parses Google Places opening_hours JSONB and returns live open/closed status.
 * 
 * DB format (from Google Places API):
 * {
 *   weekdayDescriptions: ["Monday: 7:00 AM – 5:00 PM", ...],
 *   periods: [{ open: { day: 1, hour: 7, minute: 0 }, close: { day: 1, hour: 17, minute: 0 } }, ...]
 * }
 */

interface Period {
    open: { day: number; hour: number; minute: number } | null;
    close: { day: number; hour: number; minute: number } | null;
}

export interface OpeningHours {
    weekdayDescriptions?: string[];
    periods?: Period[];
}

export interface BusinessHoursStatus {
    isOpen: boolean;
    opensAt?: string;
    closesAt?: string;
    todayHours?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTimeFromParts(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return minute === 0 ? `${displayHour} ${period}` : `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

export function getBusinessHoursStatus(hours: OpeningHours | string | null | undefined): BusinessHoursStatus {
    if (!hours) return { isOpen: false };

    let parsed: OpeningHours;
    if (typeof hours === 'string') {
        try { parsed = JSON.parse(hours); } catch { return { isOpen: false }; }
    } else {
        parsed = hours;
    }

    const periods = parsed.periods;
    if (!periods || periods.length === 0) return { isOpen: false };

    // Check for 24/7 (single period with open day 0 hour 0 and no close)
    if (periods.length === 1 && periods[0].open?.day === 0 && periods[0].open?.hour === 0 && !periods[0].close) {
        return { isOpen: true, todayHours: 'Open 24 hours' };
    }

    // Use AEST timezone for Australian businesses
    const now = new Date();
    const aest = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
    const currentDay = aest.getDay(); // 0=Sunday
    const currentMinutes = aest.getHours() * 60 + aest.getMinutes();

    // Find today's periods
    const todayPeriods = periods.filter(p => p.open?.day === currentDay);

    // Get today's description from weekdayDescriptions
    const todayDesc = parsed.weekdayDescriptions?.[currentDay === 0 ? 6 : currentDay - 1] || undefined;

    // Check if currently open
    for (const period of todayPeriods) {
        if (!period.open) continue;
        const openMinutes = period.open.hour * 60 + period.open.minute;
        const closeMinutes = period.close ? period.close.hour * 60 + period.close.minute : 24 * 60;

        if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
            return {
                isOpen: true,
                closesAt: period.close ? formatTimeFromParts(period.close.hour, period.close.minute) : undefined,
                todayHours: todayDesc,
            };
        }
    }

    // Currently closed — find next opening time
    // Check if opens later today
    for (const period of todayPeriods) {
        if (!period.open) continue;
        const openMinutes = period.open.hour * 60 + period.open.minute;
        if (currentMinutes < openMinutes) {
            return {
                isOpen: false,
                opensAt: formatTimeFromParts(period.open.hour, period.open.minute),
                todayHours: todayDesc,
            };
        }
    }

    // Find next day with opening hours
    for (let offset = 1; offset <= 7; offset++) {
        const nextDay = (currentDay + offset) % 7;
        const nextPeriods = periods.filter(p => p.open?.day === nextDay);
        if (nextPeriods.length > 0 && nextPeriods[0].open) {
            const dayName = offset === 1 ? 'tomorrow' : DAY_NAMES[nextDay];
            const time = formatTimeFromParts(nextPeriods[0].open.hour, nextPeriods[0].open.minute);
            return {
                isOpen: false,
                opensAt: `${dayName} at ${time}`,
                todayHours: todayDesc,
            };
        }
    }

    return { isOpen: false, todayHours: todayDesc };
}

/**
 * Convert Google Places opening_hours to schema.org OpeningHoursSpecification
 */
export function toOpeningHoursSchema(hours: OpeningHours | string | null | undefined): any[] {
    if (!hours) return [];

    let parsed: OpeningHours;
    if (typeof hours === 'string') {
        try { parsed = JSON.parse(hours); } catch { return []; }
    } else {
        parsed = hours;
    }

    const periods = parsed.periods;
    if (!periods || periods.length === 0) return [];

    // Group periods by day pattern for compact schema
    const dayMap: Record<string, { opens: string; closes: string; days: string[] }> = {};

    for (const period of periods) {
        if (!period.open) continue;
        const opens = `${period.open.hour.toString().padStart(2, '0')}:${period.open.minute.toString().padStart(2, '0')}`;
        const closes = period.close
            ? `${period.close.hour.toString().padStart(2, '0')}:${period.close.minute.toString().padStart(2, '0')}`
            : '23:59';
        const key = `${opens}-${closes}`;
        if (!dayMap[key]) dayMap[key] = { opens, closes, days: [] };
        dayMap[key].days.push(DAY_NAMES[period.open.day]);
    }

    return Object.values(dayMap).map(({ opens, closes, days }) => ({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": days,
        "opens": opens,
        "closes": closes,
    }));
}
