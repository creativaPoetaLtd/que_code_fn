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
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Header } from '@/components/Header';
import baseUrl from '@/helpers/baseUrl';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useUserInfo } from '@/hooks/use-user-info';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import ActionWizardModal from '@/components/ActionPage/ActionWizardModal';
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
        [key: string]: any;
    };
    status: string;
    issuedAt?: string;
    validUntil?: string;
    usedAt?: string | null;
    qrCodeData?: string;
    createdAt?: string;
    updatedAt?: string;
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
    valid: 'bg-green-100 text-green-700 border border-green-200',
    used: 'bg-blue-100 text-blue-700 border border-blue-200',
    expired: 'bg-red-100 text-red-700 border border-red-200',
};

const ActionsByAccountPage = () => {
    const params = useParams<{ userId: string }>();
    const paramUserId = params?.userId;
    const { userId: tokenUserId } = useUserInfo();
    const { getToken } = useAuthToken();

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
    const [subActionError, setSubActionError] = useState<string | null>(null);
    const [newSubAction, setNewSubAction] = useState({
        name: '',
        price: '',
        seatType: '',
        stock: '',
        description: '',
    });
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
    const [editingSubActionId, setEditingSubActionId] = useState<string | null>(null);

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
                    const qrData = Array.isArray(qrResponse.data?.data) ? qrResponse.data.data : [];
                    setPurchasedActions(qrData);
                    setOrganizationActions([]);
                    return;
                }

                if (organizationRes.status === 'fulfilled') {
                    setAccountMode('organization');
                    const searchParams = new URLSearchParams();
                    if (statusFilter !== 'all') {
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
        [getToken, statusFilter],
    );

    useEffect(() => {
        if (effectiveUserId) {
            fetchData(effectiveUserId);
        }
    }, [effectiveUserId, fetchData]);

    const pageTitle = useMemo(() => {
        if (accountMode === 'organization') return 'Organization Actions';
        if (accountMode === 'individual') return 'My Purchased Actions';
        return 'Actions';
    }, [accountMode]);

    const pageDescription = useMemo(() => {
        if (accountMode === 'organization') {
            return 'Review the actions your organization has published. Each card mirrors the presentation on your public welcome page.';
        }
        if (accountMode === 'individual') {
            return 'Every ticket, pass or QR object you have purchased lives here. Keep them handy and ready for your next experience.';
        }
        return 'Choose an account to get started.';
    }, [accountMode]);

    const handleDownloadTicket = (qrObject: QrObject) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4',
            });

            const pageWidth = doc.internal.pageSize.getWidth();
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

            // Background gradient effect
            doc.setFillColor(0, 49, 58);
            doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
            doc.setFillColor(0, 181, 18);
            doc.circle(pageWidth - 70, 70, 60, 'F');
            doc.setFillColor(31, 211, 49);
            doc.circle(80, doc.internal.pageSize.getHeight() - 80, 50, 'F');

            // Ticket base
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(margin, margin, ticketWidth, ticketHeight, 24, 24, 'F');

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

            // Details box
            const detailBoxWidth = (ticketWidth - 80) / 2;
            doc.setFillColor(244, 255, 249);
            doc.roundedRect(margin + 32, cursorY, detailBoxWidth, 140, 16, 16, 'F');
            doc.roundedRect(margin + 48 + detailBoxWidth, cursorY, detailBoxWidth, 140, 16, 16, 'F');

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

            // QR container
            if (qrObject.qrCodeData) {
                const imageType = qrObject.qrCodeData.includes('image/jpeg') ? 'JPEG' : 'PNG';
                const qrWidth = 180;
                const qrX = margin + ticketWidth - qrWidth - 48;
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(qrX - 12, margin + 120 - 12, qrWidth + 24, qrWidth + 72, 16, 16, 'F');
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
        if (!purchasedActions.length) {
            return (
                <div className="bg-white border border-emerald-100 rounded-3xl p-8 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold mb-2">
                        <Ticket className="w-5 h-5" />
                        <span>No purchases yet</span>
                    </div>
                    <p className="text-gray-600 max-w-md mx-auto">
                        When you buy tickets or actions, they will appear here with instant access to their QR codes.
                    </p>
                </div>
            );
        }

        return (
            <div className="grid gap-6 md:grid-cols-2">
                {purchasedActions.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white/95 backdrop-blur rounded-3xl border border-emerald-50 shadow-lg shadow-emerald-100/40 p-6 relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-emerald-500 font-semibold mb-2">
                                    {item.type || 'QR Object'}
                                </p>
                                <h3 className="text-2xl font-bold text-[#00313A] leading-tight">
                                    {item.metadata?.actionName || 'Unnamed Action'}
                                </h3>
                                {item.metadata?.subActionName && (
                                    <p className="text-sm text-[#00313A]/70 font-medium mt-1">
                                        {item.metadata.subActionName}
                                    </p>
                                )}
                            </div>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                    statusClasses[item.status?.toLowerCase()] ||
                                    'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}
                            >
                                {item.status || 'unknown'}
                            </span>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#00313A]">
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

                        {item.metadata?.benefits?.length ? (
                            <div className="mt-5">
                                <p className="text-xs font-semibold text-[#00B512] uppercase tracking-widest mb-2">Benefits</p>
                                <ul className="space-y-1 text-sm text-[#00313A]/80">
                                    {item.metadata.benefits.map((benefit) => (
                                        <li key={`${item.id}-${benefit}`} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-[#00B512]" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {item.qrCodeData && (
                            <div className="mt-6 bg-[#f4fff9] border border-[#00B512]/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                                <div className="p-2 bg-white rounded-xl border border-[#00B512]/20 shadow-inner">
                                    <img
                                        src={item.qrCodeData}
                                        alt={`${item.metadata?.actionName || 'Action'} QR`}
                                        className="w-28 h-28 object-contain"
                                    />
                                </div>
                                <div className="flex-1 text-sm text-[#00313A]/80">
                                    <p className="font-semibold text-[#00313A]">Show this QR code to redeem your action.</p>
                                    <p className="mt-1">
                                        {item.usedAt
                                            ? `Used ${formatDate(item.usedAt)}`
                                            : 'Not used yet. Keep it safe for event day.'}
                                    </p>
                                    <button
                                        onClick={() => handleDownloadTicket(item)}
                                        className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#00B512] text-white text-xs font-semibold shadow hover:bg-[#00a010]"
                                    >
                                        <Download size={16} />
                                        Download Ticket (PDF)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderOrganizationActions = () => {
        if (!organizationActions.length) {
            return (
                <div className="bg-white border border-blue-100 rounded-3xl p-8 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold mb-2">
                        <Ticket className="w-5 h-5" />
                        <span>No actions published yet</span>
                    </div>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Create your first action to start accepting payments or issuing tickets. They will appear here in the same
                        layout visitors see on your welcome page.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div>
                            <label className="block text-xs font-semibold text-[#00313A] uppercase mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published' | 'archived')}
                                className="rounded-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                            >
                                <option value="all">All</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <button
                            onClick={() => fetchData(effectiveUserId)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-[#00313A] hover:bg-gray-50"
                        >
                            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                    <div className="flex justify-end">
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
                <div className="grid gap-6 md:grid-cols-2">
                    {organizationActions.map((action) => (
                        <button
                            type="button"
                            key={action.id}
                            onClick={() => handleOrganizationActionClick(action)}
                            className="text-left bg-white/95 rounded-3xl border border-[#00B512]/10 shadow-lg shadow-emerald-50/60 p-6 hover:shadow-emerald-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#00313A] leading-tight">{action.name}</h3>
                                    {action.shortDescription && (
                                        <p className="text-sm text-[#00313A]/70 mt-2 line-clamp-3">{action.shortDescription}</p>
                                    )}
                                </div>
                                {action.status && (
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                            action.status === 'published'
                                                ? 'bg-[#00B512]/10 text-[#00B512]'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {action.status}
                                    </span>
                                )}
                            </div>

                            <div className="mt-5 space-y-3 text-sm text-[#00313A]/80">
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
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#00B512] text-[#00B512] text-xs font-semibold hover:bg-[#00B512] hover:text-white transition-colors cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Continue Setup
                                    </span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (!effectiveUserId) {
            return (
                <div className="bg-white border border-red-100 rounded-3xl p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-red-600 font-semibold mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>User ID not found</span>
                    </div>
                    <p className="text-gray-600">We could not determine which account to load. Please sign in again.</p>
                </div>
            );
        }

        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-[#00313A]">
                    <Loader2 className="w-10 h-10 animate-spin text-[#00B512]" />
                    <p className="mt-4 font-medium">Loading your actions...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-white border border-red-100 rounded-3xl p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-red-600 font-semibold mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>We hit a snag</span>
                    </div>
                    <p className="text-gray-600 mb-4">{error}</p>
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
        <div className="flex min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-4 md:p-8 lg:ml-64 transition-all duration-300">
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    <Header />

                    <section className="mt-6 space-y-6">
                        <div className="bg-white rounded-3xl border border-white/40 shadow-md shadow-emerald-50 p-6 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00B512]/10 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#00B512]">
                                    <Sparkles className="w-4 h-4" />
                                    Actions Center
                                </p>
                                <h1 className="text-2xl md:text-3xl font-bold text-[#00313A] mt-2">{pageTitle}</h1>
                                <p className="text-[#00313A]/70 mt-2 max-w-2xl">{pageDescription}</p>
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-[#00313A] flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-lg flex items-center justify-center shadow-md">
                                <Ticket className="w-5 h-5 text-white" />
                            </div>
                            {selectedAction?.name || 'Action Details'}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedAction && (
                        <div className="space-y-6">
                            {selectedAction.description && (
                                <div className="bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-xl p-5 border-2 border-[#00B512]/10 text-sm text-[#00313A]/80 leading-relaxed">
                                    {selectedAction.description}
                                </div>
                            )}

                            <div className="space-y-3 text-sm text-[#00313A]/80">
                                {selectedAction.availability?.startsAt && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold">Starts:</span>
                                        <span>{formatDate(selectedAction.availability.startsAt)}</span>
                                    </div>
                                )}
                                {selectedAction.availability?.endsAt && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold">Ends:</span>
                                        <span>{formatDate(selectedAction.availability.endsAt)}</span>
                                    </div>
                                )}
                                {selectedAction.pricing?.mode && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold capitalize">{selectedAction.pricing.mode} pricing</span>
                                    </div>
                                )}
                            </div>

                            {accountMode === 'organization' && (
                                <div className="bg-gray-50 border border-[#00B512]/10 rounded-2xl p-4 space-y-3">
                                    <h4 className="text-sm font-semibold text-[#00313A]">Add Sub-action</h4>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            value={newSubAction.name}
                                            onChange={(e) => handleSubActionFieldChange('name', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={newSubAction.price}
                                            onChange={(e) => handleSubActionFieldChange('price', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Seat / Zone"
                                            value={newSubAction.seatType}
                                            onChange={(e) => handleSubActionFieldChange('seatType', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Stock (optional)"
                                            value={newSubAction.stock}
                                            onChange={(e) => handleSubActionFieldChange('stock', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                                        />
                                    </div>
                                    <textarea
                                        placeholder="Description (optional)"
                                        value={newSubAction.description}
                                        onChange={(e) => handleSubActionFieldChange('description', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                                        rows={3}
                                    />
                                    {subActionError && <p className="text-sm text-red-500">{subActionError}</p>}
                                    <div className="flex items-center gap-3">
                                        {editingSubActionId && (
                                            <button
                                                type="button"
                                                onClick={resetSubActionForm}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSaveSubAction}
                                            disabled={creatingSubAction}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#00B512] text-white text-sm font-semibold shadow hover:bg-[#009a0f] disabled:opacity-60"
                                        >
                                            {creatingSubAction ? 'Saving...' : editingSubActionId ? 'Update Sub-action' : 'Add Sub-action'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-bold text-[#00313A] mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#00B512]" />
                                    Available Options
                                </h3>

                                {subActionsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-[#00B512] animate-spin" />
                                    </div>
                                ) : subActions.length === 0 ? (
                                    <div className="text-center py-8 bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-xl border-2 border-[#00B512]/10">
                                        <Ticket className="w-12 h-12 text-[#00B512]/30 mx-auto mb-3" />
                                        <p className="text-[#00313A]/60 font-medium">No sub actions available.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {subActions
                                            .filter((subAction) => subAction.isActive !== false)
                                            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                                            .map((subAction) => (
                                                <div
                                                    key={subAction.id}
                                                    className="bg-white rounded-xl p-5 border-2 border-[#00B512]/10 shadow-md hover:shadow-lg transition-all duration-300"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="text-base font-bold text-[#00313A]">{subAction.name}</h4>
                                                            {subAction.description && (
                                                                <p className="text-sm text-[#00313A]/70 mt-1">{subAction.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-[#00B512]">
                                                                {subAction.price && selectedAction.currency
                                                                    ? `${selectedAction.currency} ${parseFloat(subAction.price).toLocaleString()}`
                                                                    : subAction.price}
                                                            </p>
                                                            {subAction.stock !== null && subAction.stock !== undefined && (
                                                                <p className="text-xs text-[#00313A]/60">{subAction.stock} available</p>
                                                            )}
                                                        </div>
                                                    <div className="flex items-center gap-2">
                                                        {accountMode === 'organization' && selectedAction?.status === 'published' && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditSubActionClick(subAction);
                                                                }}
                                                                className="text-xs font-semibold text-[#00B512] hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
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
                            className="px-4 py-2 rounded-full border-2 border-[#00B512] text-[#00B512] font-semibold hover:bg-[#00B512] hover:text-white transition-colors"
                        >
                            Close
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {accountMode === 'organization' && effectiveUserId && (
                <ActionWizardModal
                    open={wizardOpen}
                    onClose={handleWizardClose}
                    organizationId={effectiveUserId}
                    onCompleted={handleWizardCompleted}
                    editingActionId={editingActionId}
                />
            )}
        </div>
    );
};

export default ActionsByAccountPage;

