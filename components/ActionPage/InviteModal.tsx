import React, { useState } from "react";
import { Modal, Tabs, Form, Input, Button, Space, Typography, Divider, message } from "antd";
import { UserAddOutlined, QrcodeOutlined, MailOutlined, PhoneOutlined, CopyOutlined, ShareAltOutlined } from "@ant-design/icons";
import { Action, InviteFormValues } from "@/types/action.types";
import type { TabsProps } from "antd";

const { Text, Paragraph } = Typography;

interface InviteModalProps {
    isOpen: boolean;
    onCancel: () => void;
    currentAction: Action | null;
}

const InviteModal: React.FC<InviteModalProps> = ({
    isOpen,
    onCancel,
    currentAction
}) => {
    const [form] = Form.useForm<InviteFormValues>();
    const [inviteTab, setInviteTab] = useState<string>("qr");

    const handleCancel = () => {
        form.resetFields();
        setInviteTab("qr");
        onCancel();
    };

    const handleFinish = (values: InviteFormValues) => {
        message.success({
            content: "Invitation sent successfully!",
            className: "font-medium"
        });
        form.resetFields();
        onCancel();
    };

    const copyInviteLink = () => {
        // In a real app, this would copy an actual link to the clipboard
        const dummyLink = `https://yourdomain.com/action/${currentAction?.key}`;
        navigator.clipboard.writeText(dummyLink)
            .then(() => message.success({
                content: "Link copied to clipboard!",
                className: "font-medium"
            }))
            .catch(() => message.error("Failed to copy link"));
    };

    const tabItems: TabsProps['items'] = [
        {
            key: 'qr',
            label: (
                <span className="flex items-center">
                    <QrcodeOutlined className="mr-1" />
                    QR Code
                </span>
            ),
            children: (
                <div className="flex flex-col items-center justify-center py-6">
                    <div className="border-2 border-emerald-100 p-6 rounded-lg mb-6 bg-white shadow-sm">
                        {/* This would be a real QR code in production */}
                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                            <div className="w-40 h-40 bg-gray-800 p-2 rounded">
                                <div className="w-full h-full bg-white flex items-center justify-center text-xs text-gray-500">
                                    QR code for {currentAction?.name}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Paragraph>
                        <Text strong className="text-gray-700">
                            Scan the QR code to participate in this action
                        </Text>
                    </Paragraph>

                    <Space className="mt-6">
                        <Button
                            icon={<CopyOutlined />}
                            onClick={copyInviteLink}
                            className="border-[#00B512] text-[#00B512] hover:text-white hover:bg-emerald-500"
                        >
                            Copy Link
                        </Button>
                        <Button
                            type="primary"
                            icon={<ShareAltOutlined />}
                            className="bg-[#00B512] hover:bg-[#39ac44] border-none"
                        >
                            Share
                        </Button>
                    </Space>
                </div>
            )
        },
        {
            key: 'contact',
            label: (
                <span className="flex items-center">
                    <MailOutlined className="mr-1" />
                    Email/Phone
                </span>
            ),
            children: (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    className="py-4"
                >
                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { type: 'email', message: 'Please enter a valid email address!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined className="text-gray-400" />}
                            placeholder="Enter recipient's email"
                            className="rounded-md"
                        />
                    </Form.Item>

                    <Divider plain className="my-4">
                        <Text type="secondary" className="text-xs">OR</Text>
                    </Divider>

                    <Form.Item
                        name="phone"
                        label="Phone Number"
                    >
                        <Input
                            prefix={<PhoneOutlined className="text-gray-400" />}
                            placeholder="Enter recipient's phone number"
                            className="rounded-md"
                        />
                    </Form.Item>

                    <Form.Item
                        name="message"
                        label="Custom Message (Optional)"
                        initialValue={`I'd like to invite you to participate in "${currentAction?.name}"`}
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Add a personal message to your invitation"
                            className="rounded-md"
                        />
                    </Form.Item>

                    <Form.Item className="mt-6 mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            className="bg-[#00B512] hover:bg-[#39ac44] border-none"
                            icon={<UserAddOutlined />}
                        >
                            Send Invitation
                        </Button>
                    </Form.Item>
                </Form>
            )
        }
    ];

    return (
        <Modal
            title={
                <div className="flex items-center text-[#00B512] font-bold">
                    <UserAddOutlined className="mr-2" />
                    <span>Invite to {currentAction?.name}</span>
                </div>
            }
            open={isOpen}
            onCancel={handleCancel}
            footer={null}
            centered
            width={500}
            styles={{
                header: {
                    borderBottom: '1px solid #f0f0f0',
                    padding: '16px 24px'
                }
            }}
            className="rounded-lg"
        >
            <Tabs
                activeKey={inviteTab}
                onChange={setInviteTab}
                items={tabItems}
                centered
                className="mt-4"
            />
        </Modal>
    );
};

export default InviteModal;