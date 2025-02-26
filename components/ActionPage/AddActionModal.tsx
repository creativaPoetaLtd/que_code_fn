import React, { useState } from "react";
import { Modal, Form, Input, Select, Switch, Button, DatePicker, InputNumber } from "antd";
import { PlusOutlined, MinusCircleOutlined, CalendarOutlined, DollarOutlined } from "@ant-design/icons";
import { FormValues, Action } from "@/types/action.types";

const { Option } = Select;

interface AddActionModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onSubmit: (action: Action) => void;
    currentActionCount: number;
}

const AddActionModal: React.FC<AddActionModalProps> = ({
    isOpen,
    onCancel,
    onSubmit,
    currentActionCount
}) => {
    const [form] = Form.useForm<FormValues>();
    const [hasActivities, setHasActivities] = useState<boolean>(false);
    const [limitedDuration, setLimitedDuration] = useState<boolean>(false);
    const [isFree, setIsFree] = useState<boolean>(false);
    const [hasAmount, setHasAmount] = useState<boolean>(false);

    const handleCancel = () => {
        form.resetFields();
        setHasActivities(false);
        setLimitedDuration(false);
        setIsFree(false);
        setHasAmount(false);
        onCancel();
    };

    const handleFinish = (values: FormValues) => {
        const newAction: Action = {
            key: currentActionCount + 1,
            name: values.name,
            type: values.actionType,
            dueDate: limitedDuration && values.duration
                ? new Date(values.duration).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : "12 Dec 2024",
            dueTime: limitedDuration && values.duration
                ? new Date(values.duration).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                : "00:00",
        };
        onSubmit(newAction);
        form.resetFields();
    };

    return (
        <Modal
            title={
                < div className="flex items-center text-[#00B512] font-bold" >
                    <PlusOutlined className="mr-2" />
                    <span>Add New Action </span>
                </div>
            }
            open={isOpen}
            onCancel={handleCancel}
            footer={null}
            centered
            styles={{
                body: {
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    padding: '16px 24px'
                },
                header: {
                    borderBottom: '1px solid #f0f0f0',
                    padding: '16px 24px'
                }
            }}
            className="rounded-lg"
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                className="mt-4"
            >
                <Form.Item
                    name="name"
                    label="Action Name"
                    rules={[{ required: true, message: "Please input the name!" }]}
                >
                    <Input
                        placeholder="Enter action name"
                        className="rounded-md"
                    />
                </Form.Item>

                < Form.Item
                    name="actionType"
                    label="Action Type"
                    rules={[{ required: true, message: "Please select an action type!" }]}
                >
                    <Select
                        placeholder="Select action type"
                        className="rounded-md"
                    >
                        <Option value="Vote" > Vote </Option>
                        < Option value="Survey" > Survey </Option>
                        < Option value="Petition" > Petition </Option>
                        < Option value="Event" > Event </Option>
                    </Select>
                </Form.Item>

                < div className="bg-gray-50 p-4 rounded-lg mb-4" >
                    <Form.Item
                        label={
                            <span className="font-medium" >
                                Does your action have activities / contents or subactions ?
                            </span>
                        }
                        valuePropName="checked"
                        className="mb-0"
                    >
                        <Switch
                            checked={hasActivities}
                            onChange={(checked) => setHasActivities(checked)}
                            className="bg-gray-300"
                        />
                    </Form.Item>
                </div>

                {
                    hasActivities && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4" >
                            <p className="text-sm text-gray-500 mb-4" >
                                Add contestants or elements for your action
                            </p>
                            < Form.List name="activities" >
                                {(fields, { add, remove }) => (
                                    <>
                                        {
                                            fields.map(({ key, name, ...restField }) => (
                                                <Form.Item
                                                    key={key}
                                                    label={`Contestant ${name + 1}`}
                                                    required={false}
                                                    className="mb-2"
                                                >
                                                    <div className="flex items-center" >
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "activity"]}
                                                            noStyle
                                                            rules={[{ required: true, message: 'Please input contestant name' }]}
                                                        >
                                                            <Input
                                                                placeholder="Contestant Name"
                                                                className="rounded-md"
                                                            />
                                                        </Form.Item>
                                                        {
                                                            fields.length > 1 && (
                                                                <MinusCircleOutlined
                                                                    className="ml-2 text-red-500 cursor-pointer"
                                                                    onClick={() => remove(name)
                                                                    }
                                                                />
                                                            )
                                                        }
                                                    </div>
                                                </Form.Item>
                                            ))}
                                        <Form.Item className="mb-0 mt-2" >
                                            <Button
                                                type="dashed"
                                                onClick={() => add()}
                                                block
                                                icon={< PlusOutlined />}
                                                className="border-emerald-500 text-emerald-600"
                                            >
                                                Add Contestant
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </div>
                    )}

                <div className="bg-gray-50 p-4 rounded-lg mb-4" >
                    <Form.Item
                        label={
                            <span className="font-medium flex items-center" >
                                <CalendarOutlined className="mr-2" />
                                Does your action have limited duration ?
                            </span>
                        }
                        valuePropName="checked"
                        className="mb-0"
                    >
                        <Switch
                            checked={limitedDuration}
                            onChange={(checked) => setLimitedDuration(checked)}
                            className="bg-gray-300"
                        />
                    </Form.Item>
                </div>

                {
                    limitedDuration && (
                        <Form.Item name="duration" label="Specify Duration" >
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                style={{ width: '100%' }
                                }
                                className="rounded-md"
                            />
                        </Form.Item>
                    )}

                <div className="bg-gray-50 p-4 rounded-lg mb-4" >
                    <Form.Item
                        label={
                            <span className="font-medium" >
                                Is your action free ?
                            </span>
                        }
                        valuePropName="checked"
                        className="mb-0"
                    >
                        <Switch
                            checked={isFree}
                            onChange={(checked) => setIsFree(checked)}
                            className="bg-gray-300"
                        />
                    </Form.Item>
                </div>

                {
                    isFree && (
                        <Form.Item name="freeDescription" label="Specify Free Description" >
                            <Input
                                placeholder="Describe why it's free"
                                className="rounded-md"
                            />
                        </Form.Item>
                    )
                }

                <div className="bg-gray-50 p-4 rounded-lg mb-4" >
                    <Form.Item
                        label={
                            <span className="font-medium flex items-center" >
                                <DollarOutlined className="mr-2" />
                                Does your action have amount to achieve ?
                            </span>
                        }
                        valuePropName="checked"
                        className="mb-0"
                    >
                        <Switch
                            checked={hasAmount}
                            onChange={(checked) => setHasAmount(checked)}
                            className="bg-gray-300"
                        />
                    </Form.Item>
                </div>

                {
                    hasAmount && (
                        <Form.Item name="targetAmount" label="Specify Target Amount" >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }
                                }
                                placeholder="Enter target amount"
                                className="rounded-md"
                                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            // parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                    )}

                <Form.Item className="mt-6" >
                    <div className="flex gap-3" >
                        <Button
                            onClick={handleCancel}
                            className="flex-1 border-gray-300"
                        >
                            Cancel
                        </Button>
                        < Button
                            type="primary"
                            htmlType="submit"
                            className="flex-1 bg-[#00B512] hover:bg-[#39ac44] border-none"
                        >
                            Create Action
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddActionModal;