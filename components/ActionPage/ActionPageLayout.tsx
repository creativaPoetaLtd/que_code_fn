'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Button, Dropdown, Tag, message, Empty, Tabs, Modal, Select, Input, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { MoreOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { OrganizationAction, SubActionSummary } from "@/types/action.types";
import { deleteAction, getOrganizationActions, getSubActions, transferMoney } from "@/helpers/api";
import { useUserInfo } from "@/hooks/use-user-info";
import ActionWizardModal from "./ActionWizardModal";

interface TableAction extends OrganizationAction {
    key: string;
}

type FilterTab = 'active' | 'archive';

const ActionPageLayout: React.FC = () => {
    const searchParams = useSearchParams();
    const { accountType, userId } = useUserInfo();
    const isOrganization = accountType === 'organization';
    const prefillActionId = searchParams.get('transferActionId');
    const prefillSubActionId = searchParams.get('transferSubActionId');
    const [actions, setActions] = useState<OrganizationAction[]>([]);
    const [loading, setLoading] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<FilterTab>('active');
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [transferSubmitting, setTransferSubmitting] = useState(false);
    const [transferAction, setTransferAction] = useState<OrganizationAction | null>(null);
    const [subActionsLoading, setSubActionsLoading] = useState(false);
    const [subActions, setSubActions] = useState<SubActionSummary[]>([]);
    const [selectedSubActionId, setSelectedSubActionId] = useState<string>('');
    const [transferAmount, setTransferAmount] = useState<number | null>(null);
    const [receiverMode, setReceiverMode] = useState<'organization' | 'wallet'>('organization');
    const [receiverWalletId, setReceiverWalletId] = useState('');
    const [transferPin, setTransferPin] = useState('');
    const [autoTransferHandled, setAutoTransferHandled] = useState(false);

    const fetchActions = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const response = await getOrganizationActions(userId);
            const data = response.data?.data ?? response.data ?? [];
            setActions(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || 'Failed to load actions');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isOrganization && userId) {
            fetchActions();
        }
    }, [isOrganization, userId, fetchActions]);

    const resetTransferState = () => {
        setTransferModalOpen(false);
        setTransferSubmitting(false);
        setTransferAction(null);
        setSubActionsLoading(false);
        setSubActions([]);
        setSelectedSubActionId('');
        setTransferAmount(null);
        setReceiverMode('organization');
        setReceiverWalletId('');
        setTransferPin('');
    };

    const openTransferModal = async (action: OrganizationAction, preselectedSubActionId?: string) => {
        try {
            setTransferAction(action);
            setTransferModalOpen(true);
            setSubActionsLoading(true);

            const response = await getSubActions(action.id);
            const data = response?.data?.data ?? response?.data ?? [];
            const normalizedSubActions = Array.isArray(data) ? data : [];

            setSubActions(normalizedSubActions);

            const preselected = preselectedSubActionId
                ? normalizedSubActions.find((item: SubActionSummary) => item.id === preselectedSubActionId)
                : undefined;
            const firstWithBalance = normalizedSubActions.find((item: SubActionSummary) => Number(item.wallet?.balance || 0) > 0);
            const firstAny = normalizedSubActions[0];
            const defaultSubAction = preselected || firstWithBalance || firstAny;

            if (defaultSubAction?.id) {
                setSelectedSubActionId(defaultSubAction.id);
                setTransferAmount(Number(defaultSubAction.wallet?.balance || 0) > 0 ? Number(defaultSubAction.wallet?.balance || 0) : null);
            }
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Failed to load sub-actions for transfer');
            resetTransferState();
        } finally {
            setSubActionsLoading(false);
        }
    };

    useEffect(() => {
        if (autoTransferHandled || !prefillActionId || !actions.length) return;

        const actionToOpen = actions.find((item) => item.id === prefillActionId);
        setAutoTransferHandled(true);

        if (!actionToOpen) {
            message.error('Action not found for transfer prefill');
            return;
        }

        openTransferModal(actionToOpen, prefillSubActionId || undefined);

        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/action');
        }
    }, [actions, autoTransferHandled, prefillActionId, prefillSubActionId]);

    const selectedSubAction = useMemo(
        () => subActions.find((item) => item.id === selectedSubActionId),
        [subActions, selectedSubActionId],
    );

    const selectedSubActionBalance = Number(selectedSubAction?.wallet?.balance || 0);

    const handleTransferSubActionFunds = async () => {
        if (!userId) {
            message.error('Organization account not detected');
            return;
        }

        if (!selectedSubActionId) {
            message.error('Please select a sub-action wallet');
            return;
        }

        if (!transferAmount || transferAmount <= 0) {
            message.error('Enter a valid transfer amount');
            return;
        }

        if (transferAmount > selectedSubActionBalance) {
            message.error('Amount exceeds sub-action wallet balance');
            return;
        }

        if (receiverMode === 'wallet' && !receiverWalletId.trim()) {
            message.error('Enter destination wallet ID');
            return;
        }

        if (transferPin.trim().length < 4) {
            message.error('Enter your 4-digit PIN');
            return;
        }

        try {
            setTransferSubmitting(true);

            const payload: any = {
                senderSubActionId: selectedSubActionId,
                amount: Number(transferAmount),
                description: transferAction?.name
                    ? `Sub-action transfer from ${transferAction.name}`
                    : 'Sub-action transfer',
                type: 'transfer',
                pin: transferPin.trim(),
            };

            if (receiverMode === 'organization') {
                payload.receiverOrganizationId = userId;
            } else {
                payload.receiverWalletId = receiverWalletId.trim();
            }

            const result = await transferMoney(payload);

            if (result?.success) {
                message.success(result?.message || 'Sub-action funds transferred successfully');
                resetTransferState();
                fetchActions();
            } else {
                message.error(result?.message || 'Transfer failed');
            }
        } catch (err: any) {
            message.error(err?.response?.data?.message || err?.message || 'Transfer failed');
        } finally {
            setTransferSubmitting(false);
        }
    };

    const handleDelete = async (actionId: string) => {
        try {
            setLoading(true);
            await deleteAction(actionId);
            message.success('Action archived');
            fetchActions();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || 'Failed to delete action');
        } finally {
            setLoading(false);
        }
    };

    // Check if action is expired
    const isActionExpired = (action: OrganizationAction): boolean => {
        if (!action.availability?.endsAt) return false;
        return dayjs(action.availability.endsAt).isBefore(dayjs());
    };

    // Check if action is archived
    const isActionArchived = (action: OrganizationAction): boolean => {
        return action.status === 'archived';
    };

    // Filter actions based on tab
    const filteredActions = useMemo(() => {
        if (activeTab === 'archive') {
            // Show archived and expired actions
            return actions.filter(action => isActionArchived(action) || isActionExpired(action));
        } else {
            // Show active actions (not archived and not expired)
            return actions.filter(action => !isActionArchived(action) && !isActionExpired(action));
        }
    }, [actions, activeTab]);

    const getActionMenu = (action: OrganizationAction): MenuProps => ({
        items: [
            {
                key: 'view',
                label: 'View Details',
                onClick: () => {
                    window.open(`/welcome/${action.id}`, '_blank');
                },
            },
            {
                key: 'delete',
                label: 'Archive',
                danger: true,
                onClick: () => handleDelete(action.id),
            },
        ],
    });

    const tableData: TableAction[] = useMemo(
        () =>
            filteredActions.map((action) => ({
                ...action,
                key: action.id,
            })),
        [filteredActions],
    );

    const columns: ColumnsType<TableAction> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            className: "font-medium",
            render: (text, record) => (
                <div>
                    <p className="font-semibold text-[#00313A]">{text}</p>
                    {record.shortDescription && (
                        <p className="text-xs text-gray-500 line-clamp-1">{record.shortDescription}</p>
                    )}
                </div>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (value) => <Tag color="green">{value}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === 'published' ? 'green' : status === 'draft' ? 'orange' : 'default'} className="uppercase">
                    {status}
                </Tag>
            ),
        },
        {
            title: "Collected",
            key: "totalSubActionBalance",
            render: (_, record) => {
                if (record.totalSubActionBalance === undefined || record.totalSubActionBalance === null) {
                    return <span className="text-gray-400">—</span>;
                }
                return (
                    <span className="font-semibold text-[#00B512]">
                        {record.currency || 'RWF'} {record.totalSubActionBalance.toLocaleString()}
                    </span>
                );
            },
        },
        {
            title: "Visibility",
            dataIndex: ["visibility", "mode"],
            key: "visibility",
            render: (value) => <span className="text-gray-600 capitalize">{value || 'public'}</span>,
        },
        {
            title: "Schedule",
            dataIndex: ["availability", "startsAt"],
            key: "schedule",
            render: (_, record) => {
                const start = record.availability?.startsAt ? dayjs(record.availability.startsAt).format('DD MMM, HH:mm') : 'TBD';
                const end = record.availability?.endsAt ? dayjs(record.availability.endsAt).format('DD MMM, HH:mm') : 'TBD';
                return (
                    <div className="text-sm text-gray-600">
                        <p>Start: {start}</p>
                        <p>End: {end}</p>
                    </div>
                );
            },
        },
        {
            title: "Actions",
            key: "action",
            align: "center",
            render: (_, record) => (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="small"
                        className="border-[#00B512] text-[#00B512] hover:border-[#009e10] hover:text-[#009e10]"
                        onClick={() => openTransferModal(record)}
                    >
                        Transfer funds
                    </Button>
                    <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
                        <Button icon={<MoreOutlined />} className="border-none shadow-none hover:bg-gray-100" />
                    </Dropdown>
                </div>
            ),
        },
    ];

    if (!isOrganization) {
        return (
            <div className="p-8 bg-white rounded-3xl border border-gray-100 text-center h-full flex flex-col items-center justify-center space-y-4">
                <p className="text-2xl font-bold text-[#00313A]">Organization Area Only</p>
                <p className="text-gray-600">
                    Switch to an organization profile to create and manage actions, tickets, and QR experiences.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-white shadow-md rounded-3xl h-full flex flex-col">
            <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#00B512] font-semibold">Actions</p>
                    <h2 className="text-2xl font-bold text-[#00313A]">Organization Actions</h2>
                    <p className="text-sm text-gray-600">Design QR-powered experiences and manage them in one place.</p>
                </div>
                <div className="flex gap-3">
                    <Button icon={<ReloadOutlined />} onClick={fetchActions}>
                        Refresh
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        className="bg-[#00B512] border-none hover:bg-[#009e10]"
                        onClick={() => setWizardOpen(true)}
                    >
                        New Action
                    </Button>
                </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6">
                <p className="text-sm text-emerald-800">
                    Need inspiration? Build tickets, donations, group payments, or memberships. The wizard walks you through steps A–I.
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6">
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as FilterTab)}
                    items={[
                        {
                            key: 'active',
                            label: `Active (${actions.filter(a => !isActionArchived(a) && !isActionExpired(a)).length})`,
                            children: null,
                        },
                        {
                            key: 'archive',
                            label: `Archive (${actions.filter(a => isActionArchived(a) || isActionExpired(a)).length})`,
                            children: null,
                        },
                    ]}
                />
            </div>

            <div className="flex-1 overflow-auto">
                <Table
                    loading={loading}
                    dataSource={tableData}
                    columns={columns}
                    pagination={{ pageSize: 6, showSizeChanger: false }}
                    rowSelection={{ type: 'checkbox' }}
                    locale={{
                        emptyText: (
                            <Empty 
                                description={
                                    activeTab === 'archive' 
                                        ? "No archived or expired actions yet." 
                                        : "No actions yet. Create your first one to get started."
                                } 
                            />
                        ),
                    }}
                    className="border border-gray-100 rounded-2xl"
                />
            </div>

            {userId && (
                <ActionWizardModal
                    open={wizardOpen}
                    onClose={() => setWizardOpen(false)}
                    organizationId={userId}
                    onCompleted={fetchActions}
                />
            )}

            <Modal
                title={transferAction ? `Transfer from ${transferAction.name}` : 'Transfer Sub-Action Funds'}
                open={transferModalOpen}
                onCancel={resetTransferState}
                onOk={handleTransferSubActionFunds}
                okText="Transfer"
                confirmLoading={transferSubmitting}
                okButtonProps={{ className: 'bg-[#00B512] border-none hover:bg-[#009e10]' }}
                destroyOnClose
            >
                <div className="space-y-4 pt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Action Wallet</label>
                        <Select
                            className="w-full"
                            placeholder="Select sub-action"
                            loading={subActionsLoading}
                            value={selectedSubActionId || undefined}
                            onChange={(value) => {
                                setSelectedSubActionId(value);
                                const next = subActions.find((item) => item.id === value);
                                setTransferAmount(Number(next?.wallet?.balance || 0) > 0 ? Number(next?.wallet?.balance || 0) : null);
                            }}
                            options={subActions.map((item) => ({
                                value: item.id,
                                label: `${item.name} (${item.wallet?.currency || transferAction?.currency || 'RWF'} ${Number(item.wallet?.balance || 0).toLocaleString()})`,
                            }))}
                        />
                    </div>

                    <div className="text-xs text-gray-500">
                        Available: {selectedSubAction?.wallet?.currency || transferAction?.currency || 'RWF'} {selectedSubActionBalance.toLocaleString()}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <InputNumber
                            className="w-full"
                            min={1}
                            max={selectedSubActionBalance || undefined}
                            value={transferAmount as number | null}
                            onChange={(value) => setTransferAmount(typeof value === 'number' ? value : null)}
                            placeholder="Enter amount"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                        <Select
                            className="w-full"
                            value={receiverMode}
                            onChange={(value: 'organization' | 'wallet') => setReceiverMode(value)}
                            options={[
                                { value: 'organization', label: 'Organization wallet' },
                                { value: 'wallet', label: 'Specific wallet ID' },
                            ]}
                        />
                    </div>

                    {receiverMode === 'wallet' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wallet ID</label>
                            <Input
                                value={receiverWalletId}
                                onChange={(event) => setReceiverWalletId(event.target.value)}
                                placeholder="Enter destination wallet ID"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">PIN</label>
                        <Input.Password
                            value={transferPin}
                            onChange={(event) => setTransferPin(event.target.value)}
                            placeholder="Enter 4-digit PIN"
                            maxLength={6}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ActionPageLayout;