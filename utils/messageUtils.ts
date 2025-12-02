export function parseMessageContent(content: string, messageType: string): string {
    if (messageType !== 'money') {
        return content;
    }

    try {
        const data = JSON.parse(content);

        if (data.type === 'money_transfer') {
            const amount = data.amount || 0;
            const currency = data.currency || 'RWF';
            const note = data.note ? ` - ${data.note}` : '';

            return `Sent ${currency} ${amount.toLocaleString()}${note}`;
        }

        return content;
    } catch (e) {
        return content;
    }
}

export function getLastMessageDisplay(content: string, messageType: string, senderName?: string): string {
    const parsedContent = parseMessageContent(content, messageType);
    const prefix = senderName ? `${senderName}: ` : '';
    const maxLength = 50;
    if (parsedContent.length > maxLength) {
        return prefix + parsedContent.substring(0, maxLength) + '...';
    }

    return prefix + parsedContent;
}

export function extractMoneyTransferData(content: string): {
    amount: number;
    currency: string;
    note?: string;
    recipientName?: string;
    senderName?: string;
    transactionId?: string;
    receiptUrl?: string;
} | null {
    try {
        const data = JSON.parse(content);

        if (data.type === 'money_transfer') {
            return {
                amount: data.amount || 0,
                currency: data.currency || 'RWF',
                note: data.note,
                recipientName: data.recipientName,
                senderName: data.senderName,
                transactionId: data.transactionId,
                receiptUrl: data.receiptUrl,
            };
        }

        return null;
    } catch (e) {
        return null;
    }
}
