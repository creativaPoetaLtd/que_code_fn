import React, { FC, useState, useEffect } from "react";
import { Modal, Input, Button, Avatar, Select, InputNumber, Divider } from "antd";
import { DollarSign, X, ArrowRight, CreditCard, Landmark, Send, Users, Search } from "lucide-react";

interface SendMoneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: SendMoneyData) => void;
}

export interface SendMoneyData {
    amount: number;
    recipient: string;
    paymentMethod: string;
    note: string;
}

const { Option } = Select;

const SendMoneyModal: FC<SendMoneyModalProps> = ({ isOpen, onClose, onSend }) => {
    // State for form fields
    const [amount, setAmount] = useState<number>(0);
    const [recipient, setRecipient] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("card");
    const [note, setNote] = useState<string>("");
    const [step, setStep] = useState<number>(1);
    const [searching, setSearching] = useState<boolean>(false);
    const [animateAmount, setAnimateAmount] = useState<boolean>(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setAnimateAmount(false);
        }
    }, [isOpen]);

    // Animation trigger for amount input
    useEffect(() => {
        if (step === 1 && isOpen) {
            setTimeout(() => setAnimateAmount(true), 300);
        }
    }, [step, isOpen]);

    // Mock contacts data
    const contacts = [
        { id: 1, name: "Alex Johnson", avatar: "A", recent: true },
        { id: 2, name: "Maya Rodriguez", avatar: "M", recent: true },
        { id: 3, name: "Sam Taylor", avatar: "S", recent: true },
        { id: 4, name: "Jordan Lee", avatar: "J", recent: false }
    ];

    const recentContacts = contacts.filter(contact => contact.recent);

    const handleSearch = (value: string) => {
        setSearching(value.length > 0);
        // In a real app, you would search contacts here
    };

    const handleNext = () => {
        if (step === 1 && amount > 0) {
            setStep(2);
        } else if (step === 2 && recipient) {
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = () => {
        onSend({
            amount,
            recipient,
            paymentMethod,
            note
        });
        onClose();
    };

    const renderStep1 = () => (
        <div className="flex flex-col items-center py-6">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">How much do you want to send?</h3>
                <p className="text-gray-500">Enter the amount you want to transfer</p>
            </div>

            <div className={`relative mt-4 mb-6 transition-all duration-500 transform ${animateAmount ? 'scale-110 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <DollarSign size={20} className="text-gray-500" />
                </div>
                <InputNumber
                    size="large"
                    min={0}
                    style={{ width: '200px', height: '60px' }}
                    className="pl-10 text-2xl font-bold rounded-lg"
                    value={amount}
                    onChange={(value) => setAmount(Number(value))}
                    precision={2}
                    placeholder="0.00"
                />
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4">
                {[10, 25, 50, 100, 200, 500].map(quickAmount => (
                    <Button
                        key={quickAmount}
                        shape="round"
                        size="large"
                        className={`transition-all ${amount === quickAmount ? 'bg-green-50 border-green-500 text-green-600' : 'text-gray-700'}`}
                        onClick={() => setAmount(quickAmount)}
                    >
                        ${quickAmount}
                    </Button>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="flex flex-col py-4">
            <div className="text-center mb-4">
                <h3 className="text-xl font-semibold mb-1">Who are you sending to?</h3>
                <p className="text-gray-500">Select or search for a recipient</p>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search size={18} className="text-gray-500" />
                </div>
                <Input
                    placeholder="Search name or email"
                    className="pl-10 py-2 rounded-lg"
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            {!searching && (
                <>
                    <div className="flex items-center mb-3">
                        <Users size={16} className="mr-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Recent contacts</span>
                    </div>

                    <div className="space-y-2 mb-6 animate-fadeIn">
                        {recentContacts.map(contact => (
                            <div
                                key={contact.id}
                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${recipient === contact.name ? 'bg-green-50 border-green-500' : 'border border-gray-200'}`}
                                onClick={() => setRecipient(contact.name)}
                            >
                                <Avatar className="bg-blue-500 mr-3">{contact.avatar}</Avatar>
                                <span className="font-medium">{contact.name}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {searching && (
                <div className="space-y-2 animate-fadeIn">
                    {contacts.map(contact => (
                        <div
                            key={contact.id}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${recipient === contact.name ? 'bg-green-50 border-green-500' : 'border border-gray-200'}`}
                            onClick={() => setRecipient(contact.name)}
                        >
                            <Avatar className="bg-blue-500 mr-3">{contact.avatar}</Avatar>
                            <span className="font-medium">{contact.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="flex flex-col py-4">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">Review and complete</h3>
                <p className="text-gray-500">Confirm the details below</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">From</span>
                    <span className="font-medium">Your Account</span>
                </div>
                <div className="flex justify-center my-3">
                    <ArrowRight size={24} className="text-gray-500" />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">To</span>
                    <span className="font-medium">{recipient || "No recipient selected"}</span>
                </div>
            </div>

            <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-800">${amount.toFixed(2)}</div>
            </div>

            <div className="mb-4">
                <p className="text-sm font-medium mb-1 text-gray-700">Payment Method</p>
                <Select
                    size="large"
                    className="w-full"
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                >
                    <Option value="card">
                        <div className="flex items-center">
                            <CreditCard size={16} className="mr-2 text-blue-500" />
                            <span>Credit/Debit Card</span>
                        </div>
                    </Option>
                    <Option value="bank">
                        <div className="flex items-center">
                            <Landmark size={16} className="mr-2 text-green-500" />
                            <span>Bank Transfer</span>
                        </div>
                    </Option>
                </Select>
            </div>

            <div className="mb-4">
                <p className="text-sm font-medium mb-1 text-gray-700">Add a note (optional)</p>
                <Input.TextArea
                    rows={2}
                    placeholder="What's this payment for?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full"
                />
            </div>
        </div>
    );

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            closable={false}
            width={420}
            className="send-money-modal"
            destroyOnClose
        >
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                            <DollarSign size={20} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Send Money</h2>
                    </div>
                    <Button
                        type="text"
                        shape="circle"
                        icon={<X size={18} />}
                        onClick={onClose}
                        className="hover:bg-gray-100"
                    />
                </div>

                <Divider className="my-2" />

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                <div className="flex justify-between mt-4">
                    <Button
                        onClick={handleBack}
                        disabled={step === 1}
                        className={step === 1 ? 'opacity-0' : 'opacity-100 transition-opacity'}
                    >
                        Back
                    </Button>

                    {step < 3 ? (
                        <Button
                            type="primary"
                            onClick={handleNext}
                            disabled={step === 1 && amount <= 0 || step === 2 && !recipient}
                            className="bg-green-600 hover:bg-green-700 border-0"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            className="bg-green-600 hover:bg-green-700 border-0 flex items-center"
                            icon={<Send size={16} className="mr-1" />}
                        >
                            Send Money
                        </Button>
                    )}
                </div>
            </div>

            <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .send-money-modal .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
        </Modal>
    );
};

export default SendMoneyModal;