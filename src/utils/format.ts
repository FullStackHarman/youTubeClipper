export function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';

    const date = new Date(0);
    date.setSeconds(seconds);
    const timeString = date.toISOString().substr(11, 8);
    // Remove leading "00:" if less than an hour
    return timeString.startsWith('00:') ? timeString.substr(3) : timeString;
}
