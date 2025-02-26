'use client';
import React, { useState } from "react";
import { Table, Button, Dropdown } from "antd";
import { PlusOutlined, MoreOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import AddActionModal from "./AddActionModal";
import InviteModal from "./InviteModal";
import { Action } from "@/types/action.types";

const ActionPageLayout: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
    const [currentAction, setCurrentAction] = useState<Action | null>(null);

    const [actions, setActions] = useState<Action[]>([
        { key: 1, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
        { key: 2, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
        { key: 3, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
        { key: 4, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
        { key: 5, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
    ]);

    const showAddModal = () => setIsAddModalOpen(true);

    const showInviteModal = (action: Action) => {
        setCurrentAction(action);
        setIsInviteModalOpen(true);
    };

    const handleAddAction = (newAction: Action) => {
        setActions([...actions, newAction]);
        setIsAddModalOpen(false);
    };

    const getActionMenu = (action: Action): MenuProps => ({
        items: [
            {
                key: 'edit',
                label: 'Edit'
            },
            {
                key: 'invite',
                label: 'Invite',
                onClick: () => showInviteModal(action)
            },
            {
                key: 'delete',
                label: 'Delete'
            }
        ]
    });

    const columns: ColumnsType<Action> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            responsive: ["xs", "sm", "md", "lg"],
            className: "font-medium"
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            responsive: ["sm", "md", "lg"],
            render: (text) => (
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    {text}
                </span>
            )
        },
        {
            title: "Due Date",
            dataIndex: "dueDate",
            key: "dueDate",
            responsive: ["md", "lg"],
            className: "text-gray-600"
        },
        {
            title: "Due Time",
            dataIndex: "dueTime",
            key: "dueTime",
            responsive: ["md", "lg"],
            className: "text-gray-600"
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
                    <Button
                        icon={<MoreOutlined />}
                        className="border-none shadow-none hover:bg-gray-100"
                    />
                </Dropdown>
            ),
            responsive: ["sm", "md", "lg"],
            width: 80,
            align: "center"
        },
    ];

    return (
        <div className="p-4 md:p-8 bg-white shadow-md rounded-lg overflow-auto h-full">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Search Actions</h2>
                <Button
                    type="primary"
                    onClick={showAddModal}
                    icon={<PlusOutlined />}
                    className="mt-4 md:mt-0 bg-[#00B512] hover:bg-[#39ac44] border-none shadow-md"
                >
                    Add Action
                </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-600">
                    Manage your actions and invite participants. Select actions to perform bulk operations.
                </p>
            </div>

            <Table
                dataSource={actions}
                columns={columns}
                pagination={{
                    pageSize: 5,
                    className: "mt-6"
                }}
                rowSelection={{
                    type: "checkbox",
                    columnWidth: 48
                }}
                scroll={{ x: 'max-content' }}
                className="border border-gray-200 rounded-lg overflow-hidden"
                rowClassName="hover:bg-gray-50 transition-colors"
            />

            <AddActionModal
                isOpen={isAddModalOpen}
                onCancel={() => setIsAddModalOpen(false)}
                onSubmit={handleAddAction}
                currentActionCount={actions.length}
            />

            <InviteModal
                isOpen={isInviteModalOpen}
                onCancel={() => setIsInviteModalOpen(false)}
                currentAction={currentAction}
            />
        </div>
    );
};

export default ActionPageLayout;