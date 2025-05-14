export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-EN', options);
    const parts = formatter.formatToParts(date);

    const day = parts.find(part => part.type === 'day')?.value ?? '';
    const month = parts.find(part => part.type === 'month')?.value ?? '';
    const year = parts.find(part => part.type === 'year')?.value ?? '';

    return `${day} ${month} ${year}`;
}