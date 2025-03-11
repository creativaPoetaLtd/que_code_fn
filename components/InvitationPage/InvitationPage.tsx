'use client';
import React, { useState } from "react";
import { Card, Typography, Button, Space, Divider, message } from "antd";
import { CheckOutlined, CloseOutlined, CalendarOutlined, MailOutlined, TagOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface InvitationPageProps {
    actionName: string;
    actionType: string;
    dueDate: string;
    dueTime: string;
    inviterName: string;
    inviterEmail: string;
}

const InvitationPage: React.FC<InvitationPageProps> = ({
    actionName,
    actionType,
    dueDate,
    dueTime,
    inviterName,
    inviterEmail,
}) => {
    const [loading, setLoading] = useState(false);

    const handleAccept = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            message.success({
                content: "Invitation accepted successfully!",
                className: "font-medium",
                duration: 4,
            });
            setLoading(false);
        }, 1000);
        // Add logic to handle acceptance
    };

    const handleDecline = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            message.warning({
                content: "Invitation declined.",
                className: "font-medium",
                duration: 4,
            });
            setLoading(false);
        }, 1000);
        // Add logic to handle decline
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
            <Card 
                className="w-full max-w-2xl shadow-xl rounded-lg overflow-hidden border-0"
                bodyStyle={{ padding: '2rem' }}
            >
                <div className="text-center mb-2">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                        <MailOutlined className="text-3xl text-green-600" />
                    </div>
                    <Title level={2} className="text-green-600 mb-1 font-semibold">
                        You've Been Invited!
                    </Title>
                    <Text type="secondary" className="text-lg block">
                        <span className="font-medium">{inviterName}</span> ({inviterEmail}) has invited you to participate in:
                    </Text>
                </div>

                <Divider className="my-6" />

                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <Paragraph className="text-center mb-4">
                        <Text strong className="text-2xl block">
                            {actionName}
                        </Text>
                    </Paragraph>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <TagOutlined className="text-gray-500" />
                            <Text type="secondary">Type: <span className="font-medium text-black">{actionType}</span></Text>
                        </div>
                        
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <CalendarOutlined className="text-gray-500" />
                            <Text type="secondary">Due: <span className="font-medium text-black">{dueDate} at {dueTime}</span></Text>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Space className="flex flex-col sm:flex-row justify-center gap-3">
                        <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            size="large"
                            className="bg-green-600 hover:bg-green-700 border-none px-8 h-12 text-base"
                            onClick={handleAccept}
                            loading={loading}
                        >
                            Accept Invitation
                        </Button>
                        <Button
                            danger
                            icon={<CloseOutlined />}
                            size="large"
                            onClick={handleDecline}
                            loading={loading}
                            className="px-8 h-12 text-base"
                        >
                            Decline Invitation
                        </Button>
                    </Space>
                </div>
                
                <div className="mt-6 text-center text-xs text-gray-400">
                    <p>If you have any questions, please contact the organizer directly.</p>
                </div>
            </Card>
        </div>
    );
};

export default InvitationPage;