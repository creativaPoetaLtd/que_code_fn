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

            return `Sent ${new Intl.NumberFormat('en-RW', { 
                style: 'currency', 
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount)}${note}`;
        }

        if (data.type === 'group_donation') {
            const amount = data.amount || 0;
            const currency = data.currency || 'RWF';
            const groupName = data.groupName || 'group';

            return `💙 Donated ${new Intl.NumberFormat('en-RW', { 
                style: 'currency', 
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount)} to ${groupName}`;
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
    type?: 'money_transfer' | 'group_donation';
    groupId?: string;
    groupName?: string;
} | null {
    try {
        const data = JSON.parse(content);

        if (data.type === 'money_transfer' || data.type === 'group_donation') {
            return {
                amount: data.amount || 0,
                currency: data.currency || 'RWF',
                note: data.note,
                recipientName: data.recipientName,
                senderName: data.senderName,
                transactionId: data.transactionId,
                receiptUrl: data.receiptUrl,
                type: data.type,
                groupId: data.groupId,
                groupName: data.groupName,
            };
        }

        return null;
    } catch (e) {
        return null;
    }
}
