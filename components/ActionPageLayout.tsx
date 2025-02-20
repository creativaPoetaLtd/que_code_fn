'use client';
import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Switch, Dropdown, Menu, Tooltip, DatePicker, InputNumber } from "antd";
import { PlusOutlined, MinusCircleOutlined, MoreOutlined, InfoCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import moment from "moment";

const { Option } = Select;

interface Action {
    key: number;
    name: string;
    type: string;
    dueDate: string;
    dueTime: string;
}

interface FormValues {
    name: string;
    actionType: string;
    hasActivities?: boolean;
    activities?: { activity: string }[];
    limitedDuration?: boolean;
    duration?: string;
    isFree?: boolean;
    freeDescription?: string;
    hasAmount?: boolean;
    targetAmount?: number;
}

export const ActionPageLayout: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [form] = Form.useForm<FormValues>();
    const [hasActivities, setHasActivities] = useState<boolean>(false);
    const [limitedDuration, setLimitedDuration] = useState<boolean>(false);
    const [isFree, setIsFree] = useState<boolean>(false);
    const [hasAmount, setHasAmount] = useState<boolean>(false);

    const [actions, setActions] = useState<Action[]>([
        { key: 1, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
        { key: 2, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
        { key: 3, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
        { key: 4, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
        { key: 5, name: "Miss Rwanda", type: "Vote", dueDate: "12 Dec 2024", dueTime: "00:00" },
    ]);

    const showModal = () => setIsModalOpen(true);

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
        setHasActivities(false);
        setLimitedDuration(false);
        setIsFree(false);
        setHasAmount(false);
    };

    const handleFinish = (values: FormValues) => {
        const newAction: Action = {
            key: actions.length + 1,
            name: values.name,
            type: values.actionType,
            dueDate: "12 Dec 2024",
            dueTime: "00:00",
        };
        setActions([...actions, newAction]);
        setIsModalOpen(false);
        form.resetFields();
    };

    const actionMenu = (
        <Menu>
            <Menu.Item key="edit">Edit</Menu.Item>
            <Menu.Item key="delete">Delete</Menu.Item>
        </Menu>
    );

    const columns: ColumnsType<Action> = [
        { title: "Name", dataIndex: "name", key: "name", responsive: ["xs", "sm", "md", "lg"] },
        { title: "Type", dataIndex: "type", key: "type", responsive: ["sm", "md", "lg"] },
        { title: "Due Date", dataIndex: "dueDate", key: "dueDate", responsive: ["md", "lg"] },
        { title: "Due Time", dataIndex: "dueTime", key: "dueTime", responsive: ["md", "lg"] },
        {
            title: "Action",
            key: "action",
            render: () => (
                <Dropdown overlay={actionMenu} trigger={["click"]}>
                    <Button icon={<MoreOutlined />} />
                </Dropdown>
            ),
            responsive: ["sm", "md", "lg"]
        },
    ];

    return (
        <div className="p-4 md:p-8 bg-white shadow-md rounded-lg overflow-auto h-full">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Search Actions</h2>
                <Button type="primary" onClick={showModal} icon={<PlusOutlined />} className="mt-4 md:mt-0 bg-[#00B512] hover:bg-[#1fd331] border-none">Add Action</Button>
            </div>
            <Table
                dataSource={actions}
                columns={columns}
                pagination={{ pageSize: 5 }}
                rowSelection={{ type: "checkbox" }}
                scroll={{ x: 'max-content' }}
                style={{ overflowX: 'auto' }}
            />
            <Modal
                title="Add Action"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                centered
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }} // Updated line
                >
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input the name!" }]}>
                    <Input placeholder="Enter action name" />
                </Form.Item>
                <Form.Item name="actionType" label="Action Type" rules={[{ required: true, message: "Please select an action type!" }]}>
                    <Select placeholder="Select action type">
                        <Option value="Vote">Vote</Option>
                        <Option value="Survey">Survey</Option>
                    </Select>
                </Form.Item>
                <Form.Item label="Does your action have activities/contents or subactions?" valuePropName="checked">
                    <Switch checked={hasActivities} onChange={(checked) => setHasActivities(checked)} />
                </Form.Item>
                {hasActivities && (
                    <Form.List name="activities">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Form.Item
                                        key={key}
                                        label={`Contestant ${key + 1}`}
                                        required={false}
                                    >
                                        <Form.Item
                                            {...restField}
                                            name={[name, "activity"]}
                                            noStyle
                                        >
                                            <Input placeholder="Contestant Name" style={{ width: "80%" }} />
                                        </Form.Item>
                                        {fields.length > 1 ? (
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        ) : null}
                                    </Form.Item>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Contestant
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                )}
                <Form.Item label="Does your action have limited duration?" valuePropName="checked">
                    <Switch checked={limitedDuration} onChange={(checked) => setLimitedDuration(checked)} />
                </Form.Item>
                {limitedDuration && (
                    <Form.Item name="duration" label="Specify Duration">
                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                    </Form.Item>
                )}
                <Form.Item label="Is your action free?" valuePropName="checked">
                    <Switch checked={isFree} onChange={(checked) => setIsFree(checked)} />
                </Form.Item>
                {isFree && (
                    <Form.Item name="freeDescription" label="Specify Free Description">
                        <Input placeholder="Describe why it's free" />
                    </Form.Item>
                )}
                <Form.Item label="Does your action have amount to achieve?" valuePropName="checked">
                    <Switch checked={hasAmount} onChange={(checked) => setHasAmount(checked)} />
                </Form.Item>
                {hasAmount && (
                    <Form.Item name="targetAmount" label="Specify Target Amount">
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter target amount" />
                    </Form.Item>
                )}
                <Form.Item>
                    <Button type="primary" htmlType="submit" block className="bg-[#00B512] hover:bg-[#1fd331] border-none">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
        </div >
    );
};

export default ActionPageLayout;
