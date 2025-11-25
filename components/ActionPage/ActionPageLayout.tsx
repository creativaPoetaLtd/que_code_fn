'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Button, Dropdown, Tag, message, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { MoreOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { OrganizationAction } from "@/types/action.types";
import { deleteAction, getOrganizationActions } from "@/helpers/api";
import { useUserInfo } from "@/hooks/use-user-info";
import ActionWizardModal from "./ActionWizardModal";

interface TableAction extends OrganizationAction {
    key: string;
}

const ActionPageLayout: React.FC = () => {
    const { accountType, userId } = useUserInfo();
    const isOrganization = accountType === 'organization';
    const [actions, setActions] = useState<OrganizationAction[]>([]);
    const [loading, setLoading] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);

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
            actions.map((action) => ({
                ...action,
                key: action.id,
            })),
        [actions],
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
                <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
                    <Button icon={<MoreOutlined />} className="border-none shadow-none hover:bg-gray-100" />
                </Dropdown>
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

            <div className="flex-1 overflow-auto">
                <Table
                    loading={loading}
                    dataSource={tableData}
                    columns={columns}
                    pagination={{ pageSize: 6, showSizeChanger: false }}
                    rowSelection={{ type: 'checkbox' }}
                    locale={{
                        emptyText: <Empty description="No actions yet. Create your first one to get started." />,
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
        </div>
    );
};

export default ActionPageLayout;