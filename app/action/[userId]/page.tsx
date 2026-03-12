'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    Loader2,
    Sparkles,
    Ticket,
    Scan,
    Check,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Header } from '@/components/Header';
import baseUrl from '@/helpers/baseUrl';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useUserInfo } from '@/hooks/use-user-info';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import ActionWizardModal from '@/components/ActionPage/ActionWizardModal';
import QRObjectValidator from '@/components/ActionPage/QRObjectValidator';
import { createSubAction, updateSubAction } from '@/helpers/api';

interface QrObject {
    id: string;
    type: string;
    metadata: {
        quantity?: number;
        seatType?: string;
        actionName?: string;
        subActionName?: string;
        benefits?: string[];
        coverImage?: string;
        actionId?: string;
        organizationId?: string;
        [key: string]: any;
    };
    status: string;
    issuedAt?: string;
    validUntil?: string;
    usedAt?: string | null;
    qrCodeData?: string;
    coverImage?: string;
    createdAt?: string;
    updatedAt?: string;
    actionId?: string;
    organizationId?: string;
}

interface OrganizationAction {
    id: string;
    name: string;
    shortDescription?: string | null;
    description?: string | null;
    coverImage?: string | null;
    visibility?: { mode?: string };
    pricing?: { mode?: string };
    currency?: string | null;
    availability?: {
        startsAt?: string | null;
        endsAt?: string | null;
        timezone?: string | null;
        userQuota?: number | null;
    };
    status?: string;
    subActions?: SubAction[];
    totalSubActionBalance?: number;
}

interface SubAction {
    id: string;
    name: string;
    description?: string | null;
    price: string;
    stock?: number | null;
    stockReserved?: number;
    isActive?: boolean;
    sortOrder?: number;
    metadata?: Record<string, any>;
    wallet?: {
        id: string;
        balance: number;
        currency: string;
    };
}

type AccountMode = 'individual' | 'organization' | null;

const formatDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const statusClasses: Record<string, string> = {
    valid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
    used: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    expired: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
};

const ActionsByAccountPage = () => {
    const params = useParams<{ userId: string }>();
    const paramUserId = params?.userId;
    const { userId: tokenUserId, accountType: loggedInAccountType } = useUserInfo();
    const { getToken } = useAuthToken();
    const { isExpanded } = useSidebar();

    // Check if the logged-in user is an organization viewing another user's QR objects
    const isLoggedInAsOrganization = loggedInAccountType === 'organization';
    const isViewingAnotherUser = paramUserId && paramUserId !== tokenUserId;

    const [effectiveUserId, setEffectiveUserId] = useState<string>('');
    const [accountMode, setAccountMode] = useState<AccountMode>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [purchasedActions, setPurchasedActions] = useState<QrObject[]>([]);
    const [organizationActions, setOrganizationActions] = useState<OrganizationAction[]>([]);
    const [selectedAction, setSelectedAction] = useState<OrganizationAction | null>(null);
    const [subActions, setSubActions] = useState<SubAction[]>([]);
    const [subActionsLoading, setSubActionsLoading] = useState(false);
    const [isSubActionsModalOpen, setIsSubActionsModalOpen] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [editingActionId, setEditingActionId] = useState<string | null>(null);
    const [creatingSubAction, setCreatingSubAction] = useState(false);
    const [qrValidatorOpen, setQrValidatorOpen] = useState(false);
    const [subActionError, setSubActionError] = useState<string | null>(null);
    const [newSubAction, setNewSubAction] = useState({
        name: '',
        price: '',
        seatType: '',
        stock: '',
        description: '',
    });
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
    const [purchasedActionsFilter, setPurchasedActionsFilter] = useState<'all' | 'archive'>('all');
    const [editingSubActionId, setEditingSubActionId] = useState<string | null>(null);
    const [markingAsUsed, setMarkingAsUsed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (paramUserId && paramUserId !== 'undefined') {
            setEffectiveUserId(paramUserId);
        } else if (tokenUserId) {
            setEffectiveUserId(tokenUserId);
        } else {
            setEffectiveUserId('');
        }
    }, [paramUserId, tokenUserId]);

    const fetchData = useCallback(
        async (targetUserId: string) => {
            const token = getToken();
            if (!token) {
                setError('You need to be logged in to view your actions.');
                setLoading(false);
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            try {
                setLoading(true);
                setError(null);

                const [userRes, organizationRes] = await Promise.allSettled([
                    axios.get(`${baseUrl}/users/${targetUserId}`, { headers }),
                    axios.get(`${baseUrl}/organizations/${targetUserId}`, { headers }),
                ]);

                if (userRes.status === 'fulfilled') {
                    setAccountMode('individual');
                    const qrResponse = await axios.get(`${baseUrl}/users/${targetUserId}/qr-objects`, { headers });
                    let qrData = Array.isArray(qrResponse.data?.data) ? qrResponse.data.data : [];
                    
                    // If an organization is viewing another user's QR objects,
                    // filter to only show QR objects from their own actions
                    if (isLoggedInAsOrganization && isViewingAnotherUser && tokenUserId) {
                        try {
                            // Fetch the organization's actions to get their action IDs
                            const orgActionsResponse = await axios.get(
                                `${baseUrl}/organizations/${tokenUserId}/actions`,
                                { headers }
                            );
                            const orgActions = orgActionsResponse.data?.data ?? orgActionsResponse.data ?? [];
                            const orgActionIds = new Set(
                                Array.isArray(orgActions) ? orgActions.map((action: OrganizationAction) => action.id) : []
                            );
                            
                            // Filter QR objects to only include those from the organization's actions
                            qrData = qrData.filter((qrObj: QrObject) => {
                                const actionId = qrObj.actionId || qrObj.metadata?.actionId;
                                const organizationId = qrObj.organizationId || qrObj.metadata?.organizationId;
                                
                                // Match by actionId or organizationId
                                return (actionId && orgActionIds.has(actionId)) || 
                                       (organizationId && organizationId === tokenUserId);
                            });
                        } catch (filterErr) {
                            console.error('Failed to filter QR objects by organization:', filterErr);
                            // If filtering fails, show no QR objects for security
                            qrData = [];
                        }
                    }
                    
                    setPurchasedActions(qrData);
                    setOrganizationActions([]);
                    return;
                }

                if (organizationRes.status === 'fulfilled') {
                    setAccountMode('organization');
                    const searchParams = new URLSearchParams();
                    // Don't send 'archived' to the API - fetch all actions and filter client-side
                    if (statusFilter !== 'all' && statusFilter !== 'archived') {
                        searchParams.append('status', statusFilter);
                    }
                    const query = searchParams.toString();
                    const orgActionsResponse = await axios.get(
                        `${baseUrl}/organizations/${targetUserId}/actions${query ? `?${query}` : ''}`,
                        {
                            headers,
                        },
                    );
                    const actionPayload = orgActionsResponse.data?.data ?? orgActionsResponse.data ?? [];
                    setOrganizationActions(Array.isArray(actionPayload) ? actionPayload : []);
                    setPurchasedActions([]);
                    return;
                }

                throw new Error('Account not found. Please try logging out and back in.');
            } catch (err: any) {
                const errorMessage =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Something went wrong while loading your actions. Please try again.';
                setError(errorMessage);
                setPurchasedActions([]);
                setOrganizationActions([]);
            } finally {
                setLoading(false);
            }
        },
        [getToken, statusFilter, isLoggedInAsOrganization, isViewingAnotherUser, tokenUserId],
    );

    useEffect(() => {
        if (effectiveUserId) {
            fetchData(effectiveUserId);
        }
    }, [effectiveUserId, fetchData]);

    const pageTitle = useMemo(() => {
        if (isLoggedInAsOrganization && isViewingAnotherUser && accountMode === 'individual') {
            return 'User QR Objects';
        }
        if (accountMode === 'organization') return 'Organization Actions';
        if (accountMode === 'individual') return 'My Purchased Actions';
        return 'Actions';
    }, [accountMode, isLoggedInAsOrganization, isViewingAnotherUser]);

    const pageDescription = useMemo(() => {
        if (isLoggedInAsOrganization && isViewingAnotherUser && accountMode === 'individual') {
            return 'View and validate QR objects purchased from your organization. You can mark tickets as used when they are redeemed.';
        }
        if (accountMode === 'organization') {
            return 'Review the actions your organization has published. Each card mirrors the presentation on your public welcome page.';
        }
        if (accountMode === 'individual') {
            return 'Every ticket, pass or QR object you have purchased lives here. Keep them handy and ready for your next experience.';
        }
        return 'Choose an account to get started.';
    }, [accountMode, isLoggedInAsOrganization, isViewingAnotherUser]);

    const handleDownloadTicket = async (qrObject: QrObject) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4',
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 48;
            const ticketHeight = 520;
            const ticketWidth = pageWidth - margin * 2;
            const title = qrObject.metadata?.actionName || 'Action Ticket';
            const subTitle = qrObject.metadata?.subActionName;
            const seat = qrObject.metadata?.seatType;
            const quantity = qrObject.metadata?.quantity ?? 1;
            const status = qrObject.status || 'Unknown';
            const issued = formatDate(qrObject.issuedAt || qrObject.createdAt);
            const valid = formatDate(qrObject.validUntil);
            let coverImage = qrObject.coverImage || qrObject.metadata?.coverImage;

            // If cover image is not available but we have actionId, try to fetch it
            if (!coverImage && qrObject.metadata?.actionId) {
                try {
                    const token = getToken();
                    if (token) {
                        const headers = { Authorization: `Bearer ${token}` };
                        const actionResponse = await axios.get(
                            `${baseUrl}/actions/${qrObject.metadata.actionId}`,
                            { headers }
                        );
                        coverImage = actionResponse.data?.data?.coverImage || actionResponse.data?.coverImage;
                    }
                } catch (err) {
                    console.warn('Could not fetch action cover image:', err);
                }
            }

            // Background: Cover image or gradient effect
            if (coverImage) {
                try {
                    // Add cover image as full page background
                    const imgWidth = pageWidth;
                    const imgHeight = doc.internal.pageSize.getHeight();
                    doc.addImage(coverImage, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
                    
                    // Add subtle overlay for better text readability on white ticket card
                    doc.setFillColor(0, 49, 58);
                    doc.setGState(doc.GState({ opacity: 0.15 }));
                    doc.rect(0, 0, pageWidth, imgHeight, 'F');
                    doc.setGState(doc.GState({ opacity: 1.0 }));
                    
                    // Decorative circles (subtle, behind ticket)
                    doc.setFillColor(0, 181, 18);
                    doc.setGState(doc.GState({ opacity: 0.3 }));
                    doc.circle(pageWidth - 70, 70, 60, 'F');
                    doc.setFillColor(31, 211, 49);
                    doc.circle(80, doc.internal.pageSize.getHeight() - 80, 50, 'F');
                    doc.setGState(doc.GState({ opacity: 1.0 }));
                } catch (imgErr) {
                    console.warn('Could not load cover image, proceeding with gradient background:', imgErr);
                    // Fallback to gradient background
                    doc.setFillColor(0, 49, 58);
                    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
                    doc.setFillColor(0, 181, 18);
                    doc.circle(pageWidth - 70, 70, 60, 'F');
                    doc.setFillColor(31, 211, 49);
                    doc.circle(80, doc.internal.pageSize.getHeight() - 80, 50, 'F');
                }
            } else {
                // Background gradient effect (fallback when no cover image)
                doc.setFillColor(0, 49, 58);
                doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
                doc.setFillColor(0, 181, 18);
                doc.circle(pageWidth - 70, 70, 60, 'F');
                doc.setFillColor(31, 211, 49);
                doc.circle(80, doc.internal.pageSize.getHeight() - 80, 50, 'F');
            }

            // Ticket base (semi-transparent white to show cover image through)
            doc.setFillColor(255, 255, 255);
            doc.setGState(doc.GState({ opacity: 0.85 }));
            doc.roundedRect(margin, margin, ticketWidth, ticketHeight, 24, 24, 'F');
            doc.setGState(doc.GState({ opacity: 1.0 }));

            // Decorative strip
            doc.setFillColor(0, 181, 18);
            doc.roundedRect(margin + 16, margin + 16, ticketWidth - 32, 36, 18, 18, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.text('DIGITAL ENTRY PASS • PROVIDED BY QiewCode', margin + 32, margin + 40);

            // Title section
            let cursorY = margin + 96;
            doc.setTextColor(0, 49, 58);
            doc.setFontSize(28);
            doc.text(title, margin + 32, cursorY);
            cursorY += 28;
            if (subTitle) {
                doc.setFontSize(18);
                doc.setFont('helvetica', 'normal');
                doc.text(subTitle, margin + 32, cursorY);
                cursorY += 32;
            }

            // Details box (semi-transparent to show cover image through)
            const detailBoxWidth = (ticketWidth - 80) / 2;
            doc.setFillColor(244, 255, 249);
            doc.setGState(doc.GState({ opacity: 0.75 }));
            doc.roundedRect(margin + 32, cursorY, detailBoxWidth, 140, 16, 16, 'F');
            doc.roundedRect(margin + 48 + detailBoxWidth, cursorY, detailBoxWidth, 140, 16, 16, 'F');
            doc.setGState(doc.GState({ opacity: 1.0 }));

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 181, 18);
            doc.text('Ticket Details', margin + 48, cursorY + 24);
            doc.setTextColor(0, 49, 58);
            doc.setFont('helvetica', 'normal');
            doc.text(`Status: ${status}`, margin + 48, cursorY + 44);
            doc.text(`Seat: ${seat || 'General'}`, margin + 48, cursorY + 64);
            doc.text(`Quantity: ${quantity}`, margin + 48, cursorY + 84);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 181, 18);
            doc.text('Schedule', margin + 64 + detailBoxWidth, cursorY + 24);
            doc.setTextColor(0, 49, 58);
            doc.setFont('helvetica', 'normal');
            doc.text(`Issued: ${issued}`, margin + 64 + detailBoxWidth, cursorY + 44);
            doc.text(`Valid Until: ${valid}`, margin + 64 + detailBoxWidth, cursorY + 64);
            doc.text(`Ticket ID: ${qrObject.id}`, margin + 64 + detailBoxWidth, cursorY + 84);

            cursorY += 170;

            // Benefits section
            if (qrObject.metadata?.benefits?.length) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(0, 49, 58);
                doc.text('Included Benefits', margin + 32, cursorY);
                cursorY += 18;
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(78, 80, 83);
                qrObject.metadata.benefits.forEach((benefit) => {
                    doc.setFillColor(0, 181, 18);
                    doc.circle(margin + 32, cursorY - 4, 3, 'F');
                    doc.text(benefit, margin + 45, cursorY);
                    cursorY += 18;
                });
            }

            // QR container (semi-transparent to show cover image through)
            if (qrObject.qrCodeData) {
                const imageType = qrObject.qrCodeData.includes('image/jpeg') ? 'JPEG' : 'PNG';
                const qrWidth = 180;
                const qrX = margin + ticketWidth - qrWidth - 48;
                doc.setFillColor(255, 255, 255);
                doc.setGState(doc.GState({ opacity: 0.85 }));
                doc.roundedRect(qrX - 12, margin + 120 - 12, qrWidth + 24, qrWidth + 72, 16, 16, 'F');
                doc.setGState(doc.GState({ opacity: 1.0 }));
                doc.addImage(qrObject.qrCodeData, imageType, qrX, margin + 130, qrWidth, qrWidth);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(0, 181, 18);
                doc.text('SCAN TO VALIDATE', qrX, margin + 130 + qrWidth + 30);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(78, 80, 83);
                doc.text('Show this code at the entry gate.', qrX, margin + 130 + qrWidth + 48);
            }

            // Footer
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 181, 18);
            doc.text('Powered by QiewCode • Seamless money for modern communities', margin + 32, margin + ticketHeight + 40);

            const filename = `${title.replace(/\s+/g, '-').toLowerCase()}-${qrObject.id}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error('Failed to generate ticket PDF:', err);
        }
    };

    const fetchSubActions = useCallback(
        async (actionId: string) => {
            const token = getToken();
            if (!token) return;
            try {
                setSubActionsLoading(true);
                const headers = { Authorization: `Bearer ${token}` };
                const response = await axios.get(`${baseUrl}/actions/${actionId}/sub-actions`, { headers });
                if (response.data?.data) {
                    setSubActions(response.data.data);
                } else if (Array.isArray(response.data)) {
                    setSubActions(response.data);
                } else {
                    setSubActions([]);
                }
            } catch (err) {
                console.error('Failed to fetch sub-actions:', err);
                setSubActions([]);
            } finally {
                setSubActionsLoading(false);
            }
        },
        [getToken],
    );

    const handleOrganizationActionClick = (action: OrganizationAction) => {
        setSelectedAction(action);
        setIsSubActionsModalOpen(true);
        resetSubActionForm();
        setSubActionError(null);
        fetchSubActions(action.id);
    };

    const handleWizardCompleted = () => {
        setWizardOpen(false);
        setEditingActionId(null);
        if (effectiveUserId) {
            fetchData(effectiveUserId);
        }
    };

    const handleWizardClose = () => {
        setWizardOpen(false);
        setEditingActionId(null);
    };

    // Handler for organizations to mark a QR object as used
    const handleMarkQRObjectAsUsed = async (qrObjectId: string) => {
        const token = getToken();
        if (!token) {
            return;
        }

        try {
            setMarkingAsUsed(prev => ({ ...prev, [qrObjectId]: true }));
            const headers = { Authorization: `Bearer ${token}` };
            
            const response = await axios.post(`${baseUrl}/qr-objects/${qrObjectId}/use`, {}, { headers });
            
            if (response.data) {
                // Update the local state to reflect the change
                setPurchasedActions(prev => 
                    prev.map(item => 
                        item.id === qrObjectId 
                            ? { ...item, status: 'used', usedAt: new Date().toISOString() }
                            : item
                    )
                );
            }
        } catch (err: any) {
            console.error('Failed to mark QR object as used:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to mark as used';
            setError(errorMessage);
        } finally {
            setMarkingAsUsed(prev => ({ ...prev, [qrObjectId]: false }));
        }
    };

    const handleSubActionFieldChange = (field: string, value: string) => {
        setNewSubAction((prev) => ({ ...prev, [field]: value }));
    };

    const resetSubActionForm = () => {
        setNewSubAction({
            name: '',
            price: '',
            seatType: '',
            stock: '',
            description: '',
        });
        setEditingSubActionId(null);
    };

    const handleSaveSubAction = async () => {
        if (!selectedAction) return;
        if (!newSubAction.name || !newSubAction.price) {
            setSubActionError('Name and price are required.');
            return;
        }
        try {
            setCreatingSubAction(true);
            setSubActionError(null);
            const payload: Record<string, any> = {
                name: newSubAction.name,
                price: Number(newSubAction.price),
                description: newSubAction.description || null,
                stock: newSubAction.stock ? Number(newSubAction.stock) : null,
                metadata: {},
            };
            if (newSubAction.seatType) {
                payload.metadata.seatType = newSubAction.seatType;
            }
            if (editingSubActionId) {
                await updateSubAction(editingSubActionId, payload);
            } else {
                await createSubAction(selectedAction.id, payload);
            }
            resetSubActionForm();
            fetchSubActions(selectedAction.id);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to create sub action';
            setSubActionError(message);
        } finally {
            setCreatingSubAction(false);
        }
    };

    const handleEditSubActionClick = (subAction: SubAction) => {
        setNewSubAction({
            name: subAction.name || '',
            price: subAction.price ? String(subAction.price) : '',
            seatType: subAction.metadata?.seatType || '',
            stock: subAction.stock !== null && subAction.stock !== undefined ? String(subAction.stock) : '',
            description: subAction.description || '',
        });
        setEditingSubActionId(subAction.id);
        setSubActionError(null);
    };

    const renderPurchasedActions = () => {
        // Check if QR object is expired
        const isQRObjectExpired = (qrObject: QrObject): boolean => {
            if (!qrObject.validUntil) return false;
            return new Date(qrObject.validUntil) < new Date();
        };

        // Check if QR object is used or archived
        const isQRObjectArchived = (qrObject: QrObject): boolean => {
            return qrObject.status?.toLowerCase() === 'used' || isQRObjectExpired(qrObject);
        };

        // Filter purchased actions based on filter tab
        const filteredPurchasedActions = purchasedActionsFilter === 'archive'
            ? purchasedActions.filter(item => isQRObjectArchived(item))
            : purchasedActions.filter(item => !isQRObjectArchived(item));

        if (!purchasedActions.length) {
            return (
                <div className="bg-white dark:bg-darkBg-card border border-emerald-100 dark:border-darkBorder-light rounded-3xl p-8 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-brand-green font-semibold mb-2">
                        <Ticket className="w-5 h-5" />
                        <span>{isLoggedInAsOrganization && isViewingAnotherUser ? 'No matching QR objects' : 'No purchases yet'}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                        {isLoggedInAsOrganization && isViewingAnotherUser 
                            ? 'This user has not purchased any tickets or actions from your organization.'
                            : 'When you buy tickets or actions, they will appear here with instant access to their QR codes.'
                        }
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Filter Buttons - Always Visible */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-xs font-semibold text-[#00313A] dark:text-white uppercase mb-2">Filter</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPurchasedActionsFilter('all')}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    purchasedActionsFilter === 'all'
                                        ? 'bg-[#00B512] text-white shadow'
                                        : 'border border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-interactive dark:text-white text-[#00313A] hover:bg-gray-50 dark:hover:bg-darkBg-card'
                                }`}
                            >
                                Valid ({purchasedActions.filter(item => !item.status?.toLowerCase().includes('used') && (!item.validUntil || new Date(item.validUntil) >= new Date())).length})
                            </button>
                            <button
                                onClick={() => setPurchasedActionsFilter('archive')}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    purchasedActionsFilter === 'archive'
                                        ? 'bg-[#00B512] text-white shadow'
                                        : 'border border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-interactive dark:text-white text-[#00313A] hover:bg-gray-50 dark:hover:bg-darkBg-card'
                                }`}
                            >
                                Archive ({purchasedActions.filter(item => item.status?.toLowerCase().includes('used') || (item.validUntil && new Date(item.validUntil) < new Date())).length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toolbar for organizations viewing user's QR objects */}
                {isLoggedInAsOrganization && isViewingAnotherUser && (
                    <div className="flex flex-wrap gap-3 items-center justify-between bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <Scan className="w-5 h-5" />
                            <span className="font-semibold">Organization Mode</span>
                            <span className="text-sm text-purple-600 dark:text-purple-400">- Showing only tickets from your organization</span>
                        </div>
                        <button
                            onClick={() => setQrValidatorOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold shadow hover:bg-purple-700 transition-colors"
                        >
                            <Scan className="w-4 h-4" />
                            Scan QR Code
                        </button>
                    </div>
                )}

                {/* Content Section - Empty or Grid */}
                {filteredPurchasedActions.length === 0 ? (
                    <div className="bg-white dark:bg-darkBg-card border border-emerald-100 dark:border-darkBorder-light rounded-3xl p-8 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-brand-green font-semibold mb-2">
                            <Ticket className="w-5 h-5" />
                            <span>
                                {purchasedActionsFilter === 'archive'
                                    ? 'No archived or expired items'
                                    : isLoggedInAsOrganization && isViewingAnotherUser
                                    ? 'No valid QR objects'
                                    : 'No valid purchases yet'}
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                            {purchasedActionsFilter === 'archive'
                                ? 'Your used and expired items will appear here.'
                                : isLoggedInAsOrganization && isViewingAnotherUser
                                ? 'This user has not purchased any valid tickets or actions from your organization.'
                                : 'When you buy tickets or actions, they will appear here with instant access to their QR codes.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                    {filteredPurchasedActions.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white/95 dark:bg-darkBg-card backdrop-blur rounded-3xl border border-emerald-50 dark:border-darkBorder-light shadow-lg shadow-emerald-100/40 dark:shadow-none p-6 relative overflow-hidden"
                        >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-emerald-500 dark:text-brand-green font-semibold mb-2">
                                    {item.type || 'QR Object'}
                                </p>
                                <h3 className="text-2xl font-bold text-[#00313A] dark:text-white leading-tight">
                                    {item.metadata?.actionName || 'Unnamed Action'}
                                </h3>
                                {item.metadata?.subActionName && (
                                    <p className="text-sm text-[#00313A]/70 dark:text-gray-300 font-medium mt-1">
                                        {item.metadata.subActionName}
                                    </p>
                                )}
                            </div>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                    isQRObjectExpired(item)
                                        ? statusClasses['expired']
                                        : statusClasses[item.status?.toLowerCase()] ||
                                    'bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-darkBorder-light'
                                }`}
                            >
                                {isQRObjectExpired(item) ? 'Expired' : item.status || 'unknown'}
                            </span>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#00313A] dark:text-gray-200">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-[#00B512] uppercase tracking-widest">Issued</span>
                                <span className="font-medium">{formatDate(item.issuedAt || item.createdAt)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-[#00B512] uppercase tracking-widest">
                                    Valid Until
                                </span>
                                <span className="font-medium">{formatDate(item.validUntil)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-[#00B512] uppercase tracking-widest">Quantity</span>
                                <span className="font-medium">{item.metadata?.quantity ?? 1}</span>
                            </div>
                            {item.metadata?.seatType && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-[#00B512] uppercase tracking-widest">Seat</span>
                                    <span className="font-medium capitalize">{item.metadata.seatType}</span>
                                </div>
                            )}
                        </div>

                        {Array.isArray(item.metadata?.benefits) && item.metadata.benefits.length > 0 ? (
                            <div className="mt-5">
                                <p className="text-xs font-semibold text-[#00B512] dark:text-brand-green uppercase tracking-widest mb-2">Benefits</p>
                                <ul className="space-y-1 text-sm text-[#00313A]/80 dark:text-gray-300">
                                    {item.metadata.benefits.map((benefit) => (
                                        <li key={`${item.id}-${benefit}`} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-[#00B512] dark:text-brand-green" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {item.qrCodeData && (
                            <div className="mt-6 bg-[#f4fff9] dark:bg-darkBg-interactive border border-[#00B512]/10 dark:border-darkBorder-light rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                                <div className="p-2 bg-white dark:bg-darkBg-main rounded-xl border border-[#00B512]/20 dark:border-darkBorder-medium shadow-inner">
                                    <img
                                        src={item.qrCodeData}
                                        alt={`${item.metadata?.actionName || 'Action'} QR`}
                                        className="w-28 h-28 object-contain"
                                    />
                                </div>
                                <div className="flex-1 text-sm text-[#00313A]/80 dark:text-gray-300">
                                    <p className="font-semibold text-[#00313A] dark:text-white">Show this QR code to redeem your action.</p>
                                    <p className="mt-1">
                                        {item.usedAt
                                            ? `Used ${formatDate(item.usedAt)}`
                                            : 'Not used yet. Keep it safe for event day.'}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <button
                                            onClick={() => handleDownloadTicket(item)}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#00B512] text-white text-xs font-semibold shadow hover:bg-[#00a010]"
                                        >
                                            <Download size={16} />
                                            Download Ticket (PDF)
                                        </button>
                                        {/* Show Mark as Used button for organizations viewing another user's QR objects */}
                                        {isLoggedInAsOrganization && isViewingAnotherUser && item.status?.toLowerCase() !== 'used' && (
                                            <button
                                                onClick={() => handleMarkQRObjectAsUsed(item.id)}
                                                disabled={markingAsUsed[item.id]}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-purple-600 text-white text-xs font-semibold shadow hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {markingAsUsed[item.id] ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Check size={16} />
                                                )}
                                                Mark as Used
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                    </div>
                )}
            </div>
        );
    };

    // Check if action is expired based on endsAt date
    const isActionExpired = (action: OrganizationAction): boolean => {
        if (!action.availability?.endsAt) return false;
        return new Date(action.availability.endsAt) < new Date();
    };

    const renderOrganizationActions = () => {
        // Filter actions considering expiration
        const getFilteredOrganizationActions = () => {
            if (statusFilter === 'all') {
                return organizationActions;
            }
            if (statusFilter === 'archived') {
                return organizationActions.filter(action => 
                    action.status === 'archived' || isActionExpired(action)
                );
            }
            return organizationActions.filter(action => 
                action.status === statusFilter && !isActionExpired(action)
            );
        };

        const filteredActions = getFilteredOrganizationActions();

        return (
            <div className="space-y-4">
                {/* Filter and Action Buttons - Always Visible */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div>
                            <label className="block text-xs font-semibold text-[#00313A] dark:text-white uppercase mb-2">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'published', label: 'Published' },
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'archived', label: 'Archived' }
                                ].map(filter => {
                                    let count = 0;
                                    if (filter.value === 'all') {
                                        count = organizationActions.length;
                                    } else if (filter.value === 'archived') {
                                        count = organizationActions.filter(action => action.status === 'archived' || isActionExpired(action)).length;
                                    } else {
                                        count = organizationActions.filter(action => action.status === filter.value && !isActionExpired(action)).length;
                                    }
                                    return (
                                        <button
                                            key={filter.value}
                                            onClick={() => setStatusFilter(filter.value as 'all' | 'draft' | 'published' | 'archived')}
                                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                                statusFilter === filter.value
                                                    ? 'bg-[#00B512] text-white shadow'
                                                    : 'border border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-interactive dark:text-white text-[#00313A] hover:bg-gray-50 dark:hover:bg-darkBg-card'
                                            }`}
                                        >
                                            {`${filter.label} (${count})`}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setQrValidatorOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white text-sm font-semibold shadow hover:shadow-lg transition-all"
                        >
                            <Scan className="w-4 h-4" />
                            Scan QR Code
                        </button>
                        <button
                            onClick={() => {
                                setEditingActionId(null);
                                setWizardOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B512] text-white text-sm font-semibold shadow hover:bg-[#009a0f] transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Create New Action
                        </button>
                    </div>
                </div>

                {/* Content Section - Empty or Actions Grid */}
                {!organizationActions.length ? (
                    <div className="bg-white dark:bg-darkBg-card border border-blue-100 dark:border-darkBorder-light rounded-3xl p-8 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2">
                            <Ticket className="w-5 h-5" />
                            <span>No actions published yet</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
                            Create your first action to start accepting payments or issuing tickets. They will appear here in the same
                            layout visitors see on your welcome page.
                        </p>
                        <button
                            onClick={() => {
                                setEditingActionId(null);
                                setWizardOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00B512] text-white text-sm font-semibold shadow hover:bg-[#009a0f] transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Create Your First Action
                        </button>
                    </div>
                ) : filteredActions.length === 0 ? (
                    <div className="bg-white dark:bg-darkBg-card border border-blue-100 dark:border-darkBorder-light rounded-3xl p-8 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2">
                            <Ticket className="w-5 h-5" />
                            <span>No actions in this category</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                            {statusFilter === 'archived' ? 'No archived or expired actions.' : `No ${statusFilter} actions.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                    {filteredActions.map((action) => (
                        <button
                            type="button"
                            key={action.id}
                            onClick={() => handleOrganizationActionClick(action)}
                            className="text-left bg-white/95 dark:bg-darkBg-card rounded-3xl border border-[#00B512]/10 dark:border-darkBorder-light shadow-lg shadow-emerald-50/60 dark:shadow-none p-6 hover:shadow-emerald-200 dark:hover:bg-darkBg-interactive transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#00313A] dark:text-white leading-tight">{action.name}</h3>
                                    {action.shortDescription && (
                                        <p className="text-sm text-[#00313A]/70 dark:text-gray-300 mt-2 line-clamp-3">{action.shortDescription}</p>
                                    )}
                                </div>
                                {action.status && (
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                            isActionExpired(action)
                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                : action.status === 'published'
                                                ? 'bg-[#00B512]/10 dark:bg-[#00B512]/20 text-[#00B512] dark:text-brand-green'
                                                : 'bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        {isActionExpired(action) ? 'Archived' : action.status}
                                    </span>
                                )}
                            </div>

                            <div className="mt-5 space-y-3 text-sm text-[#00313A]/80 dark:text-gray-300">
                                {action.availability?.startsAt && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold">Starts:</span>
                                        <span>{formatDate(action.availability.startsAt)}</span>
                                    </div>
                                )}
                                {action.availability?.endsAt && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold">Ends:</span>
                                        <span>{formatDate(action.availability.endsAt)}</span>
                                    </div>
                                )}
                                {action.pricing?.mode && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold capitalize">{action.pricing.mode} pricing</span>
                                    </div>
                                )}
                                {action.totalSubActionBalance !== undefined && action.totalSubActionBalance !== null && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#00B512]/10 dark:border-darkBorder-light">
                                        <DollarSign className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold">Total collected:</span>
                                        <span className="font-bold text-[#00B512] dark:text-brand-green">
                                            {action.currency || 'RWF'} {action.totalSubActionBalance.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {action.status === 'draft' && (
                                <div className="mt-4">
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingActionId(action.id);
                                            setWizardOpen(true);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setEditingActionId(action.id);
                                                setWizardOpen(true);
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#00B512] dark:border-brand-green text-[#00B512] dark:text-brand-green text-xs font-semibold hover:bg-[#00B512] dark:hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Continue Setup
                                    </span>
                                </div>
                            )}
                        </button>
                    ))}
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        // Show loading spinner first while we're determining the user ID
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-[#00313A] dark:text-white">
                    <Loader2 className="w-10 h-10 animate-spin text-[#00B512] dark:text-brand-green" />
                    <p className="mt-4 font-medium">Loading your actions...</p>
                </div>
            );
        }

        // Show error if no user ID after loading is complete
        if (!effectiveUserId) {
            return (
                <div className="bg-white dark:bg-darkBg-card border border-red-100 dark:border-darkBorder-light rounded-3xl p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>User ID not found</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">We could not determine which account to load. Please sign in again.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-white dark:bg-darkBg-card border border-red-100 dark:border-darkBorder-light rounded-3xl p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>We hit a snag</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                    <button
                        onClick={() => fetchData(effectiveUserId)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B512] text-white font-semibold shadow hover:bg-[#009a0f]"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        if (accountMode === 'organization') {
            return renderOrganizationActions();
        }

        return renderPurchasedActions();
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-darkBg-main">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col p-4 md:p-8 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    <Header />

                    <section className="mt-6 space-y-6">
                        <div className="bg-white dark:bg-darkBg-card rounded-3xl border border-white/40 dark:border-darkBorder-light shadow-md shadow-emerald-50 dark:shadow-none p-6 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00B512]/10 dark:bg-[#00B512]/20 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#00B512] dark:text-brand-green">
                                    <Sparkles className="w-4 h-4" />
                                    Actions Center
                                </p>
                                <h1 className="text-2xl md:text-3xl font-bold text-[#00313A] dark:text-white mt-2">{pageTitle}</h1>
                                <p className="text-[#00313A]/70 dark:text-gray-300 mt-2 max-w-2xl">{pageDescription}</p>
                            </div>
                        </div>

                        {renderContent()}
                    </section>
                </div>
            </main>

            {/* Bottom Navigation for small devices */}
            <div className="lg:hidden">
                <Navigation />
            </div>

            <Dialog open={isSubActionsModalOpen} onOpenChange={setIsSubActionsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-darkBg-card border-2 border-[#D4AF37]/20 dark:border-[#D4AF37]/20">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-[#00313A] dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#E5C158] rounded-lg flex items-center justify-center shadow-md">
                                <Ticket className="w-5 h-5 text-white" />
                            </div>
                            {selectedAction?.name || 'Action Details'}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedAction && (
                        <div className="space-y-6">
                            {selectedAction.description && (
                                <div className="bg-gradient-to-br from-[#FFF9E6] to-[#FFFEF8] dark:bg-darkBg-interactive rounded-xl p-5 border-2 border-[#D4AF37]/20 dark:border-[#D4AF37]/20 text-sm text-[#00313A] dark:text-[#00313A] leading-relaxed">
                                    {selectedAction.description}
                                </div>
                            )}

                            {accountMode === 'organization' && (
                                <div className="bg-gradient-to-br from-[#FFF9E6] to-[#FFFEF8] dark:bg-darkBg-interactive border-2 border-[#D4AF37]/20 dark:border-[#D4AF37]/20 rounded-2xl p-4 space-y-3">
                                    <h4 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wide flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                        Action Details
                                    </h4>
                                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                                        {selectedAction.status && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Status</span>
                                                <span className={`font-semibold capitalize ${
                                                    isActionExpired(selectedAction)
                                                        ? 'text-orange-600 dark:text-orange-400'
                                                        : selectedAction.status === 'published'
                                                        ? 'text-[#00B512] dark:text-brand-green'
                                                        : 'text-gray-500 dark:text-gray-300'
                                                }`}>
                                                    {isActionExpired(selectedAction) ? 'Archived (Expired)' : selectedAction.status}
                                                </span>
                                            </div>
                                        )}
                                        {selectedAction.currency && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Currency</span>
                                                <span className="font-semibold text-[#00313A] dark:text-[#00313A]">{selectedAction.currency}</span>
                                            </div>
                                        )}
                                        {selectedAction.pricing?.mode && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Pricing Mode</span>
                                                <span className="font-semibold text-[#00313A] dark:text-[#00313A] capitalize">{selectedAction.pricing.mode}</span>
                                            </div>
                                        )}
                                        {selectedAction.totalSubActionBalance !== undefined && selectedAction.totalSubActionBalance !== null && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Total Collected</span>
                                                <span className="font-bold text-[#D4AF37]">
                                                    {selectedAction.currency || 'RWF'} {selectedAction.totalSubActionBalance.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {selectedAction.availability?.startsAt && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Starts At</span>
                                                <span className="font-semibold text-[#00313A] dark:text-[#00313A]">{formatDate(selectedAction.availability.startsAt)}</span>
                                            </div>
                                        )}
                                        {selectedAction.availability?.endsAt && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Ends At</span>
                                                <span className="font-semibold text-[#00313A] dark:text-[#00313A]">{formatDate(selectedAction.availability.endsAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-bold text-[#00313A] dark:text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                                    Available Options
                                </h3>

                                {subActionsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                                    </div>
                                ) : subActions.length === 0 ? (
                                    <div className="text-center py-8 bg-gradient-to-br from-[#FFF9E6] to-[#FFFEF8] dark:bg-darkBg-interactive rounded-xl border-2 border-[#D4AF37]/20">
                                        <Ticket className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-3" />
                                        <p className="text-[#00313A]/60 dark:text-gray-300 font-medium">No sub actions available.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {subActions
                                            .filter((subAction) => subAction.isActive !== false)
                                            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                                            .map((subAction) => (
                                                <div
                                                    key={subAction.id}
                                                    className="bg-white dark:bg-darkBg-main rounded-xl p-5 border-2 border-[#D4AF37]/20 dark:border-[#D4AF37]/20 shadow-md hover:shadow-lg hover:border-[#D4AF37]/40 dark:hover:bg-darkBg-interactive transition-all duration-300"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="text-base font-bold text-[#00313A] dark:text-white">{subAction.name}</h4>
                                                            {subAction.description && (
                                                                <p className="text-sm text-[#00313A]/70 dark:text-gray-300 mt-1">{subAction.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-lg font-bold text-[#D4AF37]">
                                                                {subAction.price && selectedAction.currency
                                                                    ? `${selectedAction.currency} ${parseFloat(subAction.price).toLocaleString()}`
                                                                    : subAction.price}
                                                            </p>
                                                            {subAction.stock !== null && subAction.stock !== undefined && (
                                                                <p className="text-xs text-[#00313A]/60 dark:text-gray-400 mt-0.5">{subAction.stock} available</p>
                                                            )}
                                                            {subAction.stockReserved !== null && subAction.stockReserved !== undefined && (
                                                                <p className="text-xs font-semibold text-[#D4AF37] mt-0.5">{subAction.stockReserved} sold</p>
                                                            )}
                                                            {subAction.wallet && accountMode === 'organization' ? (
                                                                <p className="text-xs font-semibold text-[#D4AF37] mt-1">
                                                                    Wallet: {subAction.wallet.currency} {subAction.wallet.balance.toLocaleString()}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    {accountMode === 'organization' && selectedAction?.status === 'published' && (
                                                        <div className="mt-3 pt-3 border-t border-[#D4AF37]/10 flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditSubActionClick(subAction);
                                                                }}
                                                                className="text-xs font-semibold text-[#D4AF37] hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setIsSubActionsModalOpen(false)}
                            className="px-4 py-2 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-semibold hover:bg-[#D4AF37] hover:text-white transition-colors"
                        >
                            Close
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {accountMode === 'organization' && effectiveUserId && (
                <>
                    <ActionWizardModal
                        open={wizardOpen}
                        onClose={handleWizardClose}
                        organizationId={effectiveUserId}
                        onCompleted={handleWizardCompleted}
                        editingActionId={editingActionId}
                    />
                    <QRObjectValidator
                        isOpen={qrValidatorOpen}
                        onClose={() => setQrValidatorOpen(false)}
                        organizationId={effectiveUserId}
                    />
                </>
            )}

            {/* QR Object Validator for organizations viewing individual users' QR objects */}
            {isLoggedInAsOrganization && isViewingAnotherUser && accountMode === 'individual' && tokenUserId && (
                <QRObjectValidator
                    isOpen={qrValidatorOpen}
                    onClose={() => {
                        setQrValidatorOpen(false);
                        // Refresh the data after validation to update the list
                        if (effectiveUserId) {
                            fetchData(effectiveUserId);
                        }
                    }}
                    organizationId={tokenUserId}
                />
            )}
        </div>
    );
};

export default ActionsByAccountPage;

