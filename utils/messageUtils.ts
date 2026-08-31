export function parseMessageContent(content: string, messageType: string): string {
    // Action cards ride on text messages, so those need parsing too
    const isActionCandidate = messageType === 'text' && content.startsWith('{');
    if (messageType !== 'money' && messageType !== 'escrow' && !isActionCandidate) {
        return content;
    }

    try {
        const data = JSON.parse(content);

        if (data.type === 'action_transfer') {
            return `🎟️ Ticket "${data.actionName || 'ticket'}" sent to ${data.toName || 'someone'}`;
        }

        if (data.type === 'shared_note') {
            return `📝 Shared note: ${data.title || 'untitled'}`;
        }

        if (data.type === 'poll') {
            return `📊 Poll: ${data.question || 'new poll'}`;
        }

        if (data.type === 'action_share') {
            return `📅 Shared "${data.actionName || 'an action'}"`;
        }

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

        if (data.type === 'money_request') {
            const amount = data.amount || 0;
            const currency = data.currency || 'RWF';
            const status = data.status || 'pending';
            const note = data.note ? `: ${data.note}` : '';

            return `Requested ${new Intl.NumberFormat('en-RW', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount)} (${status})${note}`;
        }

        if (data.type === 'escrow') {
            const amount = data.amount || 0;
            const currency = data.currency || 'RWF';
            const formatted = new Intl.NumberFormat('en-RW', {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);

            return `🔒 Held ${formatted} in escrow for ${data.payeeName || 'recipient'}`;
        }

        if (data.type === 'group_contribution') {
            const amount = data.goalAmount || 0;
            const currency = data.currency || 'RWF';
            const title = data.title || 'contribution';

            return `Contribution request: "${title}" — goal ${new Intl.NumberFormat('en-RW', {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount)}`;
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
    type?: 'money_transfer' | 'group_donation' | 'money_request';
    groupId?: string;
    groupName?: string;
} | null {
    try {
        const data = JSON.parse(content);

        if (data.type === 'money_transfer' || data.type === 'group_donation' || data.type === 'money_request') {
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
