'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ConfigProvider,
    theme as antdTheme,
    Form,
    Input,
    Select,
    InputNumber,
    Switch,
    DatePicker,
    Button,
    message,
    Tag,
    Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { X, Loader2, Check } from 'lucide-react';
import dayjs from 'dayjs';
import { Upload } from 'antd';
import {
    createActionStepA,
    createActionStepAWithFormData,
    updateActionStepB,
    createSubAction,
    updateActionStepD,
    updateActionStepE,
    updateActionStepF,
    updateActionStepG,
    updateActionStepH,
    publishAction,
    getSubActions,
    deleteSubAction,
    getActionById,
    updateAction,
    updateActionWithFormData,
} from '@/helpers/api';
import type { SubActionSummary } from '@/types/action.types';

const { TextArea } = Input;

interface ActionWizardModalProps {
    open: boolean;
    onClose: () => void;
    organizationId: string;
    onCompleted: () => void;
    editingActionId?: string | null;
    preSelectedType?: string | null;
}

const allStepItems = [
    { key: 'stepA', title: 'Identity', description: 'Type & basics' },
    { key: 'stepB', title: 'Pricing', description: 'Currency & price' },
    { key: 'subActions', title: 'Sub-actions', description: 'Sub-actions' },
    { key: 'configuration', title: 'Configuration', description: 'Schedule, policies & settings' },
    { key: 'publish', title: 'Review & Publish', description: 'Review & go live' },
];

const validTypes = [
    'ticket',
    'transport',
    'service',
    'vote',
    'booking',
    'membership',
];

// Dynamic form configuration based on action type
const actionTypeConfig: Record<string, {
    label: string;
    showFields: string[];
    placeholders: Record<string, string>;
}> = {
    ticket: {
        label: 'Ticket',
        showFields: ['slug', 'shortDescription', 'description', 'coverImage', 'dedicatedQrCode'],
        placeholders: {
            name: 'Concert, Film, Conference...',
            shortDescription: 'What event is this ticket for?',
            description: 'Provide full details about the event',
        },
    },
    transport: {
        label: 'Transport',
        showFields: ['slug', 'shortDescription', 'description', 'coverImage'],
        placeholders: {
            name: 'Bus, Train, Flight Route...',
            shortDescription: 'Route or service name',
            description: 'Departure, arrival, duration details',
        },
    },
    service: {
        label: 'Service',
        showFields: ['slug', 'shortDescription', 'description', 'coverImage'],
        placeholders: {
            name: 'Consulting, Repair, Design...',
            shortDescription: 'What service do you offer?',
            description: 'Service details, duration, deliverables',
        },
    },
    subscription: {
        label: 'Subscription',
        showFields: ['slug', 'shortDescription', 'description', 'coverImage'],
        placeholders: {
            name: 'Monthly Plan, Annual Plan...',
            shortDescription: 'Subscription plan name',
            description: 'What is included in this plan?',
        },
    },
    payment: {
        label: 'Payment',
        showFields: ['shortDescription', 'description'],
        placeholders: {
            name: 'Donation, Contribution...',
            shortDescription: 'What is this payment for?',
            description: 'Additional details about the payment',
        },
    },
    donation: {
        label: 'Donation',
        showFields: ['shortDescription', 'description', 'coverImage'],
        placeholders: {
            name: 'Charity, Cause...',
            shortDescription: 'What is the cause?',
            description: 'Tell donors why you need support',
        },
    },
    vote: {
        label: 'Vote',
        showFields: ['shortDescription', 'coverImage'],
        placeholders: {
            name: 'Poll, Referendum, Election...',
            shortDescription: 'What are you voting on?',
            description: '',
        },
    },
    booking: {
        label: 'Booking',
        showFields: ['slug', 'shortDescription', 'description', 'coverImage'],
        placeholders: {
            name: 'Hotel, Restaurant, Activity...',
            shortDescription: 'What can be booked?',
            description: 'Booking conditions and details',
        },
    },
    license: {
        label: 'License',
        showFields: ['slug', 'shortDescription', 'description'],
        placeholders: {
            name: 'Software, Content License...',
            shortDescription: 'License name',
            description: 'License terms and conditions',
        },
    },
    membership: {
        label: 'Membership',
        showFields: ['slug', 'shortDescription', 'description', 'coverImage'],
        placeholders: {
            name: 'Club, Association, Platform...',
            shortDescription: 'Membership benefits',
            description: 'Full membership details',
        },
    },
    rental: {
        label: 'Rental',
        showFields: ['slug', 'shortDescription', 'description', 'coverImage'],
        placeholders: {
            name: 'Equipment, Property, Vehicle...',
            shortDescription: 'What can be rented?',
            description: 'Rental terms, pricing, conditions',
        },
    },
    group: {
        label: 'Group',
        showFields: ['slug', 'shortDescription', 'description', 'coverImage'],
        placeholders: {
            name: 'Community, Team, Organization...',
            shortDescription: 'Group description',
            description: 'About the group and its purpose',
        },
    },
};

const defaultLabels = {
    builderTitle: 'Action Builder',
    wizardTitle: 'Multi-step Action Wizard',
    wizardDescription: 'Guide your organization through every detail, from basics to publish.',
    nameLabel: 'Action Name',
    shortDescLabel: 'Short Description',
    descLabel: 'Full Description',
    subAction: { singular: 'Sub-action', plural: 'Sub-actions' },
    stepA: { title: 'Identity', description: 'Type & basics' },
    stepB: { title: 'Pricing', description: 'Currency & price' },
};

const actionTypeLabels: Record<string, Partial<typeof defaultLabels>> = {
    ticket: {
        builderTitle: 'Ticket Builder',
        wizardTitle: 'Create a Ticket',
        wizardDescription: 'Set up your event ticket — name, pricing tiers, availability, and more.',
        nameLabel: 'Event Name',
        shortDescLabel: 'Event Tagline',
        descLabel: 'Full Event Details',
        subAction: { singular: 'Ticket Tier', plural: 'Ticket Tiers' },
        stepA: { title: 'Event Details', description: 'Name & media' },
        stepB: { title: 'Ticket Pricing', description: 'Price & tiers' },
    },
    transport: {
        builderTitle: 'Transport Builder',
        wizardTitle: 'Create a Transport Route',
        wizardDescription: 'Define your route, fare structure, and seat classes.',
        nameLabel: 'Route Name',
        shortDescLabel: 'Route Summary',
        descLabel: 'Route Details',
        subAction: { singular: 'Seat Class', plural: 'Seat Classes' },
        stepA: { title: 'Route Info', description: 'Name & media' },
        stepB: { title: 'Fare Details', description: 'Currency & fare' },
    },
    service: {
        builderTitle: 'Service Builder',
        wizardTitle: 'Create a Service',
        wizardDescription: 'Describe your service, packages, and how clients can book or pay.',
        nameLabel: 'Service Name',
        shortDescLabel: 'Service Tagline',
        descLabel: 'Service Details',
        subAction: { singular: 'Service Package', plural: 'Service Packages' },
        stepA: { title: 'Service Details', description: 'Name & media' },
        stepB: { title: 'Service Pricing', description: 'Currency & price' },
    },
    subscription: {
        builderTitle: 'Subscription Builder',
        wizardTitle: 'Create a Subscription Plan',
        wizardDescription: "Set up recurring plans — define tiers, benefits, and billing details.",
        nameLabel: 'Plan Name',
        shortDescLabel: 'Plan Summary',
        descLabel: "What's Included",
        subAction: { singular: 'Subscription Tier', plural: 'Subscription Tiers' },
        stepA: { title: 'Plan Details', description: 'Name & media' },
        stepB: { title: 'Plan Pricing', description: 'Currency & tiers' },
    },
    payment: {
        builderTitle: 'Payment Builder',
        wizardTitle: 'Create a Payment',
        wizardDescription: 'Configure a payment link — purpose, amount, and collection details.',
        nameLabel: 'Payment Title',
        shortDescLabel: 'Payment Purpose',
        descLabel: 'Additional Details',
        subAction: { singular: 'Payment Option', plural: 'Payment Options' },
        stepA: { title: 'Payment Details', description: 'Title & purpose' },
        stepB: { title: 'Payment Config', description: 'Currency & amount' },
    },
    donation: {
        builderTitle: 'Donation Builder',
        wizardTitle: 'Create a Donation Campaign',
        wizardDescription: 'Tell your story, set giving levels, and start collecting donations.',
        nameLabel: 'Campaign Name',
        shortDescLabel: 'Campaign Tagline',
        descLabel: 'Campaign Story',
        subAction: { singular: 'Giving Level', plural: 'Giving Levels' },
        stepA: { title: 'Campaign Details', description: 'Name & media' },
        stepB: { title: 'Donation Config', description: 'Currency & amounts' },
    },
    vote: {
        builderTitle: 'Vote Builder',
        wizardTitle: 'Create a Vote',
        wizardDescription: 'Set up a poll or election — add contestants and configure voting rules.',
        nameLabel: 'Vote Title',
        shortDescLabel: 'What Are People Voting On?',
        descLabel: 'Vote Details',
        subAction: { singular: 'Contestant', plural: 'Contestants' },
        stepA: { title: 'Vote Details', description: 'Title & context' },
        stepB: { title: 'Voting Cost', description: 'Currency & price' },
    },
    booking: {
        builderTitle: 'Booking Builder',
        wizardTitle: 'Create a Booking',
        wizardDescription: 'Configure what can be booked, availability windows, and pricing.',
        nameLabel: 'Booking Name',
        shortDescLabel: 'What Can Be Booked?',
        descLabel: 'Booking Conditions',
        subAction: { singular: 'Booking Option', plural: 'Booking Options' },
        stepA: { title: 'Booking Details', description: 'Name & media' },
        stepB: { title: 'Booking Pricing', description: 'Currency & price' },
    },
    license: {
        builderTitle: 'License Builder',
        wizardTitle: 'Create a License',
        wizardDescription: 'Define license tiers, terms, and how they are issued to buyers.',
        nameLabel: 'License Name',
        shortDescLabel: 'License Summary',
        descLabel: 'Terms & Conditions',
        subAction: { singular: 'License Tier', plural: 'License Tiers' },
        stepA: { title: 'License Details', description: 'Name & terms' },
        stepB: { title: 'License Pricing', description: 'Currency & price' },
    },
    membership: {
        builderTitle: 'Membership Builder',
        wizardTitle: 'Create a Membership',
        wizardDescription: 'Build membership plans with benefits, tiers, and renewal settings.',
        nameLabel: 'Membership Name',
        shortDescLabel: 'Member Benefits',
        descLabel: 'Full Membership Details',
        subAction: { singular: 'Membership Plan', plural: 'Membership Plans' },
        stepA: { title: 'Membership Details', description: 'Name & media' },
        stepB: { title: 'Membership Pricing', description: 'Currency & tiers' },
    },
    rental: {
        builderTitle: 'Rental Builder',
        wizardTitle: 'Create a Rental',
        wizardDescription: 'List what can be rented, set pricing options, and define rental terms.',
        nameLabel: 'Rental Name',
        shortDescLabel: 'What Can Be Rented?',
        descLabel: 'Rental Terms',
        subAction: { singular: 'Rental Option', plural: 'Rental Options' },
        stepA: { title: 'Rental Details', description: 'Name & media' },
        stepB: { title: 'Rental Pricing', description: 'Currency & price' },
    },
    group: {
        builderTitle: 'Group Builder',
        wizardTitle: 'Create a Group',
        wizardDescription: 'Set up a community group — membership tiers, fees, and group details.',
        nameLabel: 'Group Name',
        shortDescLabel: 'Group Summary',
        descLabel: 'About the Group',
        subAction: { singular: 'Membership Tier', plural: 'Membership Tiers' },
        stepA: { title: 'Group Details', description: 'Name & media' },
        stepB: { title: 'Group Pricing', description: 'Currency & fees' },
    },
};

// const visibilityOptions = [
//     { label: 'Public', value: 'public' },
//     { label: 'Private', value: 'private' },
//     { label: 'Unlisted', value: 'unlisted' },
// ];

const buyerFieldOptions = [
    { label: 'Full Name', value: 'fullName' },
    { label: 'Email', value: 'email' },
    { label: 'Phone Number', value: 'phone' },
    { label: 'National ID', value: 'nationalId' },
];

interface KeyValuePair {
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'array';
}

interface KeyValueInputProps {
    value?: string; // JSON string
    onChange?: (value: string) => void;
    placeholder?: string;
}

const KeyValueInput: React.FC<KeyValueInputProps> = ({ value, onChange, placeholder }) => {
    const [pairs, setPairs] = useState<KeyValuePair[]>([]);
    const [showJsonEditor, setShowJsonEditor] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [jsonText, setJsonText] = useState<string>('');

    // Parse value and update pairs
    useEffect(() => {
        if (value) {
            try {
                const parsed = JSON.parse(value);
                const entries = Object.entries(parsed).map(([key, val]) => {
                    let type: 'string' | 'number' | 'boolean' | 'array' = 'string';
                    if (typeof val === 'boolean') type = 'boolean';
                    else if (typeof val === 'number') type = 'number';
                    else if (Array.isArray(val)) type = 'array';
                    
                    return {
                        key,
                        value: Array.isArray(val) ? val.join(', ') : String(val),
                        type,
                    };
                });
                setPairs(entries.length > 0 ? entries : [{ key: '', value: '', type: 'string' }]);
                setJsonText(value);
                setJsonError(null);
            } catch (err) {
                setPairs([{ key: '', value: '', type: 'string' }]);
                setJsonError('Invalid JSON format');
            }
        } else {
            setPairs([{ key: '', value: '', type: 'string' }]);
            setJsonText('{}');
        }
    }, [value]);

    const updatePairs = (newPairs: KeyValuePair[]) => {
        // Filter out empty pairs, but always keep at least one empty pair if all are empty
        const validPairs = newPairs.filter(p => p.key.trim() !== '');
        const finalPairs: KeyValuePair[] = validPairs.length > 0 ? validPairs : [{ key: '', value: '', type: 'string' as const }];
        
        setPairs(finalPairs);
        const obj: Record<string, any> = {};
        validPairs.forEach(({ key, value: val, type }) => {
            if (!key.trim()) return;
            try {
                if (type === 'boolean') {
                    obj[key] = val === 'true';
                } else if (type === 'number') {
                    const num = Number(val);
                    if (isNaN(num)) return; // Skip invalid numbers
                    obj[key] = num;
                } else if (type === 'array') {
                    obj[key] = val.split(',').map((v) => v.trim()).filter(Boolean);
                } else {
                    obj[key] = val;
                }
            } catch (err) {
                // Skip invalid entries
            }
        });
        const jsonString = JSON.stringify(obj);
        onChange?.(jsonString);
        setJsonText(jsonString);
        setJsonError(null);
    };

    const addPair = () => {
        updatePairs([...pairs, { key: '', value: '', type: 'string' }]);
    };

    const removePair = (index: number) => {
        const newPairs = pairs.filter((_, i) => i !== index);
        // If removing the last pair, add an empty one
        if (newPairs.length === 0) {
            updatePairs([{ key: '', value: '', type: 'string' }]);
        } else {
            updatePairs(newPairs);
        }
    };

    const updatePair = (index: number, field: keyof KeyValuePair, newValue: any) => {
        const newPairs = [...pairs];
        newPairs[index] = { ...newPairs[index], [field]: newValue };
        updatePairs(newPairs);
    };

    const handleJsonEditorChange = (text: string) => {
        setJsonText(text);
        try {
            const parsed = JSON.parse(text);
            onChange?.(text);
            setJsonError(null);
            // Update pairs from JSON
            const entries = Object.entries(parsed).map(([key, val]) => {
                let type: 'string' | 'number' | 'boolean' | 'array' = 'string';
                if (typeof val === 'boolean') type = 'boolean';
                else if (typeof val === 'number') type = 'number';
                else if (Array.isArray(val)) type = 'array';
                
                return {
                    key,
                    value: Array.isArray(val) ? val.join(', ') : String(val),
                    type,
                };
            });
            setPairs(entries.length > 0 ? entries : [{ key: '', value: '', type: 'string' }]);
        } catch (err) {
            setJsonError('Invalid JSON: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const validPairs = pairs.filter(p => p.key.trim() !== '');

    return (
        <div className="space-y-3">
            {/* Toggle between visual and JSON editor */}
            <div className="flex justify-end">
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        setShowJsonEditor(!showJsonEditor);
                        if (!showJsonEditor) {
                            setJsonText(JSON.stringify(
                                validPairs.reduce((acc, { key, value: val, type }) => {
                                    if (!key.trim()) return acc;
                                    if (type === 'boolean') acc[key] = val === 'true';
                                    else if (type === 'number') acc[key] = Number(val);
                                    else if (type === 'array') acc[key] = val.split(',').map(v => v.trim()).filter(Boolean);
                                    else acc[key] = val;
                                    return acc;
                                }, {} as Record<string, any>),
                                null,
                                2
                            ));
                        }
                    }}
                    className="text-xs"
                >
                    {showJsonEditor ? 'Switch to Visual Editor' : 'Switch to JSON Editor'}
                </Button>
            </div>

            {showJsonEditor ? (
                <div className="space-y-2">
                    <TextArea
                        value={jsonText}
                        onChange={(e) => handleJsonEditorChange(e.target.value)}
                        rows={8}
                        placeholder='{"key": "value", "number": 123, "boolean": true, "array": ["item1", "item2"]}'
                        className={jsonError ? 'border-red-500' : ''}
                    />
                    {jsonError && (
                        <p className="text-sm text-red-500">{jsonError}</p>
                    )}
                    {!jsonError && validPairs.length > 0 && (
                        <p className="text-xs text-green-600">✓ Valid JSON</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {pairs.map((pair, index) => (
                        <div key={index} className="border border-gray-200 dark:border-darkBorder-light rounded-lg p-3 bg-gray-50 dark:bg-darkBg-interactive space-y-2">
                            <div className="flex gap-2 items-center">
                                <Input
                                    placeholder="Field name (e.g., vipOnly, benefits)"
                                    value={pair.key}
                                    onChange={(e) => updatePair(index, 'key', e.target.value)}
                                    className="flex-1"
                                />
                                <Select
                                    value={pair.type}
                                    onChange={(val) => updatePair(index, 'type', val)}
                                    style={{ width: 120 }}
                                    options={[
                                        { label: '📝 Text', value: 'string' },
                                        { label: '🔢 Number', value: 'number' },
                                        { label: '✓/✗ Boolean', value: 'boolean' },
                                        { label: '📋 Array', value: 'array' },
                                    ]}
                                />
                                <Button
                                    icon={<DeleteOutlined />}
                                    danger
                                    size="small"
                                    onClick={() => removePair(index)}
                                >
                                    Remove
                                </Button>
                            </div>
                            <div>
                                {pair.type === 'boolean' ? (
                                    <Select
                                        value={pair.value || 'true'}
                                        onChange={(val) => updatePair(index, 'value', val)}
                                        className="w-full"
                                        options={[
                                            { label: 'True', value: 'true' },
                                            { label: 'False', value: 'false' },
                                        ]}
                                    />
                                ) : pair.type === 'array' ? (
                                    <div className="space-y-1">
                                        <Input
                                            placeholder="Enter values separated by commas (e.g., VIP lounge, Early access, Reserved parking)"
                                            value={pair.value}
                                            onChange={(e) => updatePair(index, 'value', e.target.value)}
                                            className="w-full"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Separate multiple values with commas</p>
                                    </div>
                                ) : (
                                    <Input
                                        placeholder={pair.type === 'number' ? 'Enter a number (e.g., 123)' : 'Enter value'}
                                        value={pair.value}
                                        onChange={(e) => updatePair(index, 'value', e.target.value)}
                                        className="w-full"
                                        type={pair.type === 'number' ? 'number' : 'text'}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                    <Button icon={<PlusOutlined />} onClick={addPair} type="dashed" block>
                        Add Field
                    </Button>
                    {validPairs.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                            <strong>Preview:</strong> {JSON.stringify(
                                validPairs.reduce((acc, { key, value: val, type }) => {
                                    if (!key.trim()) return acc;
                                    if (type === 'boolean') acc[key] = val === 'true';
                                    else if (type === 'number') acc[key] = Number(val);
                                    else if (type === 'array') acc[key] = val.split(',').map(v => v.trim()).filter(Boolean);
                                    else acc[key] = val;
                                    return acc;
                                }, {} as Record<string, any>),
                                null,
                                2
                            )}
                        </div>
                    )}
                    {pairs.length === 0 && placeholder && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">{placeholder}</p>
                    )}
                </div>
            )}
        </div>
    );
};

const ActionWizardModal: React.FC<ActionWizardModalProps> = ({ open, onClose, organizationId, onCompleted, editingActionId, preSelectedType }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [subActionForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);
    const [subActions, setSubActions] = useState<SubActionSummary[]>([]);
    const [subActionsLoading, setSubActionsLoading] = useState(false);
    const [showFixedMetadata, setShowFixedMetadata] = useState(false);
    const [showSubActionMetadata, setShowSubActionMetadata] = useState(false);
    const [showPolicies, setShowPolicies] = useState(false);
    const [existingAction, setExistingAction] = useState<any | null>(null);
    const [isEditingExisting, setIsEditingExisting] = useState(false);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [subActionCoverImageFile, setSubActionCoverImageFile] = useState<File | null>(null);
    const [subActionCoverImagePreview, setSubActionCoverImagePreview] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
    const [actionNameForSubActions, setActionNameForSubActions] = useState<string>('');
    const [pricingMode, setPricingMode] = useState<string>('fixed');
    const [availabilityMode, setAvailabilityMode] = useState<string>('always');

    const currentLabels = useMemo(() => {
        const overrides = selectedType ? (actionTypeLabels[selectedType] ?? {}) : {};
        return { ...defaultLabels, ...overrides };
    }, [selectedType]);

    const subActionLabel = useMemo(() => currentLabels.subAction, [currentLabels]);

    // Filter steps based on pricing mode - show subActions for tiered and pay_what_you_want pricing
    const stepItems = useMemo(() => {
        return allStepItems
            .filter(step => {
                if (step.key === 'subActions' && !['tiered', 'pay_what_you_want'].includes(pricingMode)) {
                    return false;
                }
                return true;
            })
            .map(step => {
                if (step.key === 'subActions') {
                    return { ...step, title: subActionLabel.plural, description: subActionLabel.plural };
                }
                if (step.key === 'stepA') {
                    return { ...step, title: currentLabels.stepA.title, description: currentLabels.stepA.description };
                }
                if (step.key === 'stepB') {
                    return { ...step, title: currentLabels.stepB.title, description: currentLabels.stepB.description };
                }
                return step;
            });
    }, [pricingMode, subActionLabel, currentLabels]);

    const stepKey = useMemo(() => stepItems[currentStep]?.key, [currentStep, stepItems]);
    const isLastStep = currentStep === stepItems.length - 1;
    const shouldAskStock = !['service', 'donation', 'vote'].includes(selectedType || '');
    const isVoteTieredPricing = selectedType === 'vote' && pricingMode === 'tiered';
    const nextSubActionSortOrder = useMemo(() => {
        const currentMaxSortOrder = subActions.reduce((max, item) => {
            const itemSortOrder = Number((item as any).sortOrder);
            return Number.isFinite(itemSortOrder) ? Math.max(max, itemSortOrder) : max;
        }, 0);
        return currentMaxSortOrder + 1;
    }, [subActions]);

    const resetState = useCallback(() => {
        setCurrentStep(0);
        setActionId(null);
        setSubActions([]);
        form.resetFields();
        subActionForm.resetFields();
        setLoading(false);
        setSubActionsLoading(false);
        setExistingAction(null);
        setIsEditingExisting(false);
        setCoverImageFile(null);
        setCoverImagePreview(null);
        setSubActionCoverImageFile(null);
        setSubActionCoverImagePreview(null);
        setSelectedType(undefined);
        setActionNameForSubActions('');
        setPricingMode('fixed');
        setAvailabilityMode('always');
    }, [form, subActionForm]);

    useEffect(() => {
        if (!open) {
            resetState();
        }
    }, [open, resetState]);

    useEffect(() => {
        if (stepKey === 'subActions') {
            subActionForm.resetFields();
            if (pricingMode === 'pay_what_you_want' && actionNameForSubActions) {
                subActionForm.setFieldValue('name', actionNameForSubActions);
            }
            return;
        }
        form.resetFields();
        if (stepKey === 'stepA') {
            if (existingAction) {
                setSelectedType(existingAction.type);
                setActionNameForSubActions(existingAction.name || '');
                form.setFieldsValue({
                    type: existingAction.type,
                    name: existingAction.name,
                    slug: existingAction.slug,
                    displayLayout: existingAction.displayLayout || 'card',
                    coverImage: existingAction.coverImage || '',
                    shortDescription: existingAction.shortDescription || '',
                    description: existingAction.description || '',
                    dedicatedQrCode: existingAction.dedicatedQrCode || '',
                });
                if (existingAction.coverImage) {
                    setCoverImagePreview(existingAction.coverImage);
                }
            } else if (preSelectedType) {
                setSelectedType(preSelectedType);
                form.setFieldValue('type', preSelectedType);
            } else {
                setSelectedType(undefined);
            }
        } else if (stepKey === 'stepB') {
            const mode = selectedType === 'vote' ? 'tiered' : (existingAction?.pricing?.mode || 'fixed');
            setPricingMode(mode);
            form.setFieldsValue({
                pricingMode: mode,
                currency: existingAction?.currency || 'RWF',
                amount: existingAction?.pricing?.amount ?? 0,
                taxProfileId: existingAction?.taxProfileId || '',
            });
        } else if (stepKey === 'configuration') {
            const mode = existingAction?.availability?.mode || 'always';
            const starts = existingAction?.availability?.startDate ? dayjs(existingAction.availability.startDate) : null;
            const ends = existingAction?.availability?.endDate ? dayjs(existingAction.availability.endDate) : null;
            setAvailabilityMode(mode);
            form.setFieldsValue({
                availabilityMode: mode,
                eventWindow: starts && ends ? [starts, ends] : starts ? [starts] : undefined,
                startDateOnly: starts && !ends ? starts : undefined,
                timezone: existingAction?.availability?.timezone || 'Africa/Kigali',
                userVoteLimit: existingAction?.availability?.userQuota ?? null,
                // visibilityMode: existingAction?.visibility?.mode || 'public',
                buyerFields: existingAction?.buyerFields || [],
                refundPolicy: existingAction?.policy?.refund || '',
                cancellationPolicy: existingAction?.policy?.cancellation || '',
                tosUrl: existingAction?.policy?.tosUrl || '',
                storeOnBuyerQR: existingAction?.fulfillment?.storeOnBuyerQR ?? true,
                postPurchaseMessage: existingAction?.fulfillment?.postPurchaseMessage || '',
            });
        } else if (stepKey === 'publish') {
            form.setFieldsValue({
                status: existingAction?.status || 'published',
            });
        }
    }, [currentStep, existingAction, form, stepKey, subActionForm]);
    useEffect(() => {
        if (open && editingActionId) {
            setIsEditingExisting(true);
            setActionId(editingActionId);
            const fetchExisting = async () => {
                try {
                    setLoading(true);
                    const response = await getActionById(editingActionId);
                    const actionData = response.data?.data ?? response.data;
                    setExistingAction(actionData);
                } catch (err) {
                    console.error(err);
                    message.error('Failed to load action details');
                } finally {
                    setLoading(false);
                }
            };
            fetchExisting();
        } else if (open && !editingActionId) {
            setIsEditingExisting(false);
            setExistingAction(null);
            setActionId(null);
            setActionNameForSubActions('');
            if (preSelectedType) {
                setSelectedType(preSelectedType);
            }
        }
    }, [editingActionId, open, preSelectedType]);

    const loadSubActions = useCallback(async () => {
        if (!actionId) return;
        try {
            setSubActionsLoading(true);
            const response = await getSubActions(actionId);
            const data = response.data?.data ?? response.data ?? [];
            setSubActions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            message.error('Failed to load sub-actions');
        } finally {
            setSubActionsLoading(false);
        }
    }, [actionId]);

    useEffect(() => {
        if (actionId) {
            loadSubActions();
        }
    }, [actionId, loadSubActions]);

    const handleAddSubAction = async (): Promise<boolean> => {
        if (!actionId) {
            message.error(`Complete steps A & B before adding ${subActionLabel.plural.toLowerCase()}.`);
            return false;
        }
        try {
            const values = await subActionForm.validateFields();
            
            // Validate required fields
            if (!values.name || !values.name.trim()) {
                message.error('Sub-action name is required');
                return false;
            }
            
            if (pricingMode !== 'pay_what_you_want' && pricingMode !== 'free' && !isVoteTieredPricing) {
                if (values.price === null || values.price === undefined || values.price === '') {
                    message.error('Price is required');
                    return false;
                }
            }
            
            setLoading(true);
            
            // Sanitize ALL numeric inputs from form
            const rawStock = values.stock;
            const rawPrice = pricingMode !== 'pay_what_you_want' && !isVoteTieredPricing ? values.price : undefined;
            const minimumTieredAmount = Number(form.getFieldValue('amount') ?? existingAction?.pricing?.amount ?? 0);
            
            // Handle price - sanitize NaN values
            let price: number;
            if (pricingMode === 'pay_what_you_want') {
                price = 0;
            } else if (pricingMode === 'free') {
                price = 0;
            } else if (isVoteTieredPricing) {
                if (isNaN(minimumTieredAmount)) {
                    throw new Error('Minimum amount is required for vote tiered pricing');
                }
                price = minimumTieredAmount;
            } else {
                // For tiered and fixed modes, price must be a valid number
                if (rawPrice === null || rawPrice === undefined || isNaN(rawPrice)) {
                    throw new Error('Price is required and must be a valid number');
                }
                price = parseFloat(rawPrice);
            }
            
            // Handle stock - ensure it's either null or a valid integer
            const stock = (rawStock === null || rawStock === undefined || rawStock === '' || isNaN(rawStock))
                ? null 
                : parseInt(String(rawStock), 10);
            
            // Handle metadata
            let metadataObj: Record<string, any> = {};
            if (values.seatType) {
                metadataObj.seatType = values.seatType;
            }

            

            // Parse custom metadata if provided
            if (values.metadata) {
                const metadataStr = typeof values.metadata === 'string' ? values.metadata : JSON.stringify(values.metadata);
                if (metadataStr && metadataStr.trim().length > 0) {
                    try {
                        metadataObj = { ...metadataObj, ...JSON.parse(metadataStr) };
                    } catch {
                        message.warning('Custom metadata must be valid JSON. Using only standard fields.');
                    }
                }
            }
            
            const payload = {
                name: values.name,
                description: values.description || null,
                price,
                stock,
                metadata: Object.keys(metadataObj).length > 0 ? metadataObj : {},
                sortOrder: nextSubActionSortOrder,
            };
            
            // Final validation - ensure no NaN values in numeric fields
            if (isNaN(payload.price)) {
                throw new Error('Invalid numeric values detected');
            }
            
            // Clean payload - remove any undefined or NaN values
            const cleanPayload: Record<string, any> = {};
            Object.keys(payload).forEach(key => {
                const value = payload[key as keyof typeof payload];
                // Skip undefined values, but allow null and 0
                if (value !== undefined) {
                    // For numeric fields, ensure they're not NaN
                    if (typeof value === 'number') {
                        if (!isNaN(value)) {
                            cleanPayload[key] = value;
                        }
                    } else {
                        cleanPayload[key] = value;
                    }
                }
            });

            // Add cover image if present
            if (values.coverImage && !subActionCoverImageFile) {
                // It's a URL string
                cleanPayload.coverImage = values.coverImage;
            }
                        
            // If there's a file, use FormData, otherwise use regular payload
            if (subActionCoverImageFile) {
                const formData = new FormData();
                Object.keys(cleanPayload).forEach(key => {
                    const value = cleanPayload[key];
                    if (value !== null && value !== undefined) {
                        if (typeof value === 'object' && !(value instanceof File)) {
                            formData.append(key, JSON.stringify(value));
                        } else {
                            formData.append(key, value);
                        }
                    }
                });
                formData.append('coverImage', subActionCoverImageFile);
                
                await createSubAction(actionId, formData);
            } else {
                await createSubAction(actionId, cleanPayload);
            }
            
            message.success(`${subActionLabel.singular} added`);
            subActionForm.resetFields();
            if (pricingMode === 'pay_what_you_want' && actionNameForSubActions) {
                subActionForm.setFieldValue('name', actionNameForSubActions);
            }
            setSubActionCoverImageFile(null);
            setSubActionCoverImagePreview(null);
            await loadSubActions();
            return true;
        } catch (err: any) {
            if (err?.errorFields) {
                return false;
            }
            console.error(err);
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to add sub-action';
            message.error(errorMsg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubAction = async (subActionId: string) => {
        try {
            setLoading(true);
            await deleteSubAction(subActionId);
            message.success(`${subActionLabel.singular} removed`);
            loadSubActions();
        } catch (err) {
            console.error(err);
            message.error(`Unable to delete ${subActionLabel.singular.toLowerCase()}`);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        const key = stepItems[currentStep].key;

        if (key !== 'stepA' && key !== 'publish' && !actionId) {
            message.error('Please complete Step A first.');
            return;
        }

        try {
        if (key === 'stepA') {
            const values = await form.validateFields();
            setLoading(true);
            
            // If there's a file, use FormData; otherwise use JSON
            if (coverImageFile) {
                const formData = new FormData();
                formData.append('type', values.type);
                formData.append('name', values.name);
                if (values.slug) formData.append('slug', values.slug);
                formData.append('displayLayout', values.displayLayout);
                formData.append('coverImage', coverImageFile);
                if (values.shortDescription) formData.append('shortDescription', values.shortDescription);
                if (values.description) formData.append('description', values.description);
                if (values.dedicatedQrCode) formData.append('dedicatedQrCode', values.dedicatedQrCode);
                

                if (actionId) {
                    await updateActionWithFormData(actionId, formData);
                    setActionNameForSubActions(values.name);
                    message.success('Action details updated');
                    setCurrentStep((prev) => prev + 1);
                    return;
                }
                const response = await createActionStepAWithFormData(organizationId, formData);
                const created = response.data?.data;
                const newActionId = created?.id || created?.actionId || created?.action?.id;
                if (!newActionId) {
                    throw new Error('Failed to retrieve new action ID');
                }
                setActionId(newActionId);
                setActionNameForSubActions(values.name);
                // Clear file after successful upload
                setCoverImageFile(null);
                message.success('Step A completed');
                setCurrentStep((prev) => prev + 1);
                return;
            } else {
                // No file, use JSON payload
              
                const payload = {
                    type: values.type,
                    name: values.name,
                    slug: values.slug,
                    displayLayout: values.displayLayout,
                    coverImage: values.coverImage || null,
                    shortDescription: values.shortDescription,
                    description: values.description,
                    dedicatedQrCode: values.dedicatedQrCode,
                };
                if (actionId) {
                    await updateAction(actionId, payload);
                    setActionNameForSubActions(values.name);
                    message.success('Action details updated');
                    setCurrentStep((prev) => prev + 1);
                    return;
                }
                const response = await createActionStepA(organizationId, payload);
                const created = response.data?.data;
                const newActionId = created?.id || created?.actionId || created?.action?.id;
                if (!newActionId) {
                    throw new Error('Failed to retrieve new action ID');
                }
                setActionId(newActionId);
                setActionNameForSubActions(values.name);
                message.success('Step A completed');
                setCurrentStep((prev) => prev + 1);
                return;
            }
        }

            if (key === 'stepB') {
                const values = await form.validateFields();
                setLoading(true);
                const effectivePricingMode = selectedType === 'vote' ? 'tiered' : values.pricingMode;
                
                // Store pricing mode for step 3
                setPricingMode(effectivePricingMode);
                
                await updateActionStepB(actionId as string, {
                    pricing: {
                        mode: effectivePricingMode,
                        amount: values.amount ?? 0,
                    },
                    currency: values.currency,
                    taxProfileId: values.taxProfileId || null,
                });
                
                // Auto-create sub-action for Fixed pricing
                if (effectivePricingMode === 'fixed' || effectivePricingMode === 'free') {
                    const actionName = actionNameForSubActions || form.getFieldValue('name');
                    const autoSubActionPayload = {
                        name: actionName,
                        description: values.subActionDescription || null,
                        price: effectivePricingMode === 'fixed' ? (values.amount ?? 0) : 0,
                        stock: values.subActionStock ?? null,
                        metadata: {
                            seatType: values.subActionSeatType || undefined,
                            ...((values.subActionMetadata && values.subActionMetadata.trim().length)
                                ? (() => {
                                      try {
                                          return JSON.parse(values.subActionMetadata);
                                      } catch {
                                          return {};
                                      }
                                  })()
                                : {}),
                        },
                        sortOrder: nextSubActionSortOrder,
                    };
                    try {
                        await createSubAction(actionId as string, autoSubActionPayload);
                        await loadSubActions();
                    } catch (err) {
                        console.error('Failed to create auto sub-action:', err);
                    }
                }
                
                // For all pricing modes, proceed to next step (Configuration for Fixed/Free, Sub-actions for Tiered/Pay-what-you-want)
                message.success('Pricing updated');
                setCurrentStep((prev) => prev + 1);
                return;
            }

            if (key === 'subActions') {
                const pendingSubActionName = subActionForm.getFieldValue('name');
                if (pendingSubActionName && String(pendingSubActionName).trim().length > 0) {
                    const added = await handleAddSubAction();
                    if (!added) {
                        return;
                    }
                    setCurrentStep((prev) => prev + 1);
                    return;
                }
                if (subActions.length === 0) {
                    message.warning(`Add at least one ${subActionLabel.singular.toLowerCase()} before continuing.`);
                    return;
                }
                setCurrentStep((prev) => prev + 1);
                return;
            }

            if (key === 'configuration') {
                const values = await form.validateFields();
                setLoading(true);
                
                // Build availability object based on mode
                let availability: any;
                if (values.availabilityMode === 'always') {
                    availability = { mode: 'always' };
                } else if (values.availabilityMode === 'scheduled') {
                    const [start, end] = values.eventWindow || [];
                    availability = {
                        mode: 'scheduled',
                        startDate: start ? dayjs(start).toISOString() : null,
                        endDate: end ? dayjs(end).toISOString() : null,
                        timezone: values.timezone || 'Africa/Kigali',
                    };
                } else {
                    // Empty object for unrestricted
                    availability = {};
                }
                
                // Add vote-specific quota to availability
                if (selectedType === 'vote' && values.userVoteLimit) {
                    availability.userQuota = values.userVoteLimit;
                }

                // Update availability
                await updateActionStepD(actionId as string, {
                    availability,
                });
                
                // Update visibility
                // await updateActionStepE(actionId as string, {
                //     visibility: {
                //         mode: values.visibilityMode,
                //     },
                //     buyerFields: values.buyerFields || [],
                // });
                
                // Update buyer fields
                await updateActionStepE(actionId as string, {
                    buyerFields: values.buyerFields || [],
                });
                
                // Update policies
                await updateActionStepF(actionId as string, {
                    policy: {
                        refund: values.refundPolicy || null,
                        cancellation: values.cancellationPolicy || null,
                        tosUrl: values.tosUrl || null,
                    },
                });
                
                // Update fulfillment
                await updateActionStepG(actionId as string, {
                    fulfillment: {
                        storeOnBuyerQR: values.storeOnBuyerQR ?? false,
                        postPurchaseMessage: values.postPurchaseMessage || null,
                    },
                });
                
                message.success('Configuration saved');
                setCurrentStep((prev) => prev + 1);
                return;
            }

            if (key === 'publish') {
                const values = await form.validateFields();
                setLoading(true);
                await publishAction(actionId as string, { status: values.status });
                message.success(values.status === 'published' ? 'Action published!' : 'Action saved as draft');
                onCompleted();
                handleClose();
            }
        } catch (err: any) {
            if (err?.errorFields) {
                return;
            }
            console.error(err);
            message.error(err?.response?.data?.message || err?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        resetState();
    };

    // Auto-generate slug from name
    const generateSlug = (name: string): string => {
        if (!name) return '';
        return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Watch name field and auto-generate slug
    useEffect(() => {
        const subscription = form.getFieldValue('name');
        if (stepKey === 'stepA' && subscription) {
            const nameValue = form.getFieldValue('name');
            if (nameValue && !coverImageFile && selectedType && actionTypeConfig[selectedType]?.showFields?.includes('slug')) {
                form.setFieldValue('slug', generateSlug(nameValue));
            }
        }
    }, [form.getFieldValue('name'), stepKey, selectedType, coverImageFile]);

    const renderStepContent = () => {
        switch (stepKey) {
            case 'stepA':
                return (
                    <Form form={form} layout="vertical" className="grid gap-4 md:grid-cols-2">
                        {(preSelectedType && !editingActionId) ? (
                            <div className="md:col-span-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type:</span>
                                <span className="font-semibold text-[#00313A] dark:text-white capitalize">{actionTypeConfig[preSelectedType]?.label || preSelectedType}</span>
                                <Form.Item name="type" hidden initialValue={preSelectedType}><Input /></Form.Item>
                            </div>
                        ) : (
                            <Form.Item name="type" label="Action Type" rules={[{ required: true, message: 'Select an action type' }]}>
                                <Select
                                    placeholder="Select type"
                                    onChange={(value) => setSelectedType(value)}
                                    options={validTypes.map((type) => ({
                                        label: actionTypeConfig[type].label,
                                        value: type
                                    }))}
                                />
                            </Form.Item>
                        )}
                        <Form.Item
                            name="name"
                            label={currentLabels.nameLabel}
                            rules={[{ required: true, message: `Provide a ${currentLabels.nameLabel.toLowerCase()}` }]}
                        >
                            <Input 
                                placeholder={selectedType ? actionTypeConfig[selectedType]?.placeholders?.name || 'Enter action name' : 'Enter action name'}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    if (selectedType && actionTypeConfig[selectedType]?.showFields?.includes('slug')) {
                                        form.setFieldValue('slug', generateSlug(name));
                                    }
                                }}
                            />
                        </Form.Item>
                        
                        {selectedType && actionTypeConfig[selectedType]?.showFields?.includes('slug') && (
                            <Form.Item name="slug" label="Slug (auto-generated)">
                                <Input placeholder="auto-generated from name" disabled />
                            </Form.Item>
                        )}
                        
                        <Form.Item name="displayLayout" label="Display Layout" initialValue="card">
                            <Select
                                options={[
                                    { label: 'Card', value: 'card' },
                                    { label: 'List', value: 'list' },
                                    { label: 'Spotlight', value: 'spotlight' },
                                ]}
                            />
                        </Form.Item>
                        
                        {selectedType && actionTypeConfig[selectedType]?.showFields?.includes('coverImage') && (
                            <Form.Item name="coverImage" label="Cover Image" className="md:col-span-2">
                                <div className="space-y-3">
                                    <Upload
                                        accept="image/*"
                                        beforeUpload={(file) => {
                                            setCoverImageFile(file);
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setCoverImagePreview(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                            form.setFieldValue('coverImage', file.name);
                                            return false;
                                        }}
                                        onRemove={() => {
                                            setCoverImageFile(null);
                                            setCoverImagePreview(null);
                                            form.setFieldValue('coverImage', '');
                                            return true;
                                        }}
                                        maxCount={1}
                                        fileList={coverImageFile ? [{
                                            uid: '-1',
                                            name: coverImageFile.name,
                                            status: 'done',
                                        }] : []}
                                    >
                                        <Button icon={<UploadOutlined />}>Click to Upload</Button>
                                    </Upload>
                                    {coverImagePreview && (
                                        <div className="mt-2">
                                            <img 
                                                src={coverImagePreview} 
                                                alt="Cover preview" 
                                                className="max-w-full h-48 object-cover rounded-lg border border-gray-200"
                                            />
                                        </div>
                                    )}
                                    {!coverImageFile && (
                                        <Input 
                                            placeholder="Or enter image URL (https://...)" 
                                            value={form.getFieldValue('coverImage') || ''}
                                            onChange={(e) => {
                                                const url = e.target.value;
                                                form.setFieldValue('coverImage', url);
                                                if (url && url.startsWith('http')) {
                                                    setCoverImagePreview(url);
                                                } else if (!url) {
                                                    setCoverImagePreview(null);
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </Form.Item>
                        )}
                        
                        {selectedType && actionTypeConfig[selectedType]?.showFields?.includes('shortDescription') && (
                            <Form.Item name="shortDescription" label={currentLabels.shortDescLabel} className="md:col-span-2">
                                <Input placeholder={actionTypeConfig[selectedType]?.placeholders?.shortDescription || 'Quick headline for this action'} />
                            </Form.Item>
                        )}

                        {selectedType && actionTypeConfig[selectedType]?.showFields?.includes('description') && (
                            <Form.Item name="description" label={currentLabels.descLabel} className="md:col-span-2">
                                <TextArea rows={4} placeholder={actionTypeConfig[selectedType]?.placeholders?.description || 'Tell supporters what this action is about'} />
                            </Form.Item>
                        )}

                    </Form>
                );
            case 'stepB':
                return (
                    <Form form={form} layout="vertical" className="grid gap-4 md:grid-cols-2">
                        <Form.Item name="pricingMode" label="Pricing Mode" rules={[{ required: true, message: 'Select a pricing mode' }]}>
                            <Select
                                onChange={(value) => setPricingMode(value)}
                                disabled={selectedType === 'vote'}
                                options={selectedType === 'vote'
                                    ? [{ label: 'Tiered - Create multiple sub-actions', value: 'tiered' }]
                                    : [
                                        { label: 'Fixed - Creates one sub-action automatically', value: 'fixed' },
                                        { label: 'Tiered - Create multiple sub-actions', value: 'tiered' },
                                        { label: 'Free - No charge required', value: 'free' },
                                        { label: 'Pay what you want - Let buyers decide', value: 'pay_what_you_want' },
                                    ]}
                            />
                        </Form.Item>
                        {(pricingMode === 'fixed' || pricingMode === 'tiered' || pricingMode === 'pay_what_you_want') && (
                            <Form.Item
                                name="amount"
                                label={
                                    pricingMode === 'fixed'
                                        ? 'Default Amount'
                                        : pricingMode === 'tiered'
                                          ? (selectedType === 'vote' ? 'Voting Price' : 'Minimum Amount')
                                          : 'Suggested Amount'
                                }
                                rules={[{ required: pricingMode === 'fixed' || pricingMode === 'tiered' ? true : false }]}
                                tooltip={pricingMode === 'fixed' ? 'Fixed price for this action' : pricingMode === 'tiered' ? 'Base price for sub-action options' : 'Suggested price (optional)'}
                            >
                                <InputNumber min={0} className="w-full" prefix="RWF" />
                            </Form.Item>
                        )}
                        {pricingMode !== 'free' && (
                            <Form.Item name="currency" label="Currency" rules={[{ required: true, message: 'Select a currency' }]}>
                                <Select
                                    options={[
                                        { label: 'RWF', value: 'RWF' },
                                        { label: 'USD', value: 'USD' },
                                        { label: 'EUR', value: 'EUR' },
                                    ]}
                                />
                            </Form.Item>
                        )}
                        <Form.Item name="taxProfileId" label="Tax Profile ID">
                            <Input placeholder="Optional tax profile reference" />
                        </Form.Item>

                        {/* Show sub-action fields for Fixed or Free pricing */}
                        {(pricingMode === 'fixed' || pricingMode === 'free') && (
                            <>
                                <div className="md:col-span-2 border-t pt-4 mt-4">
                                    {/* <h4 className="text-base font-semibold mb-4">Sub-action Details</h4> */}
                                </div>
                                {shouldAskStock && (
                                    <Form.Item name="subActionStock" label="Stock">
                                        <InputNumber min={0} className="w-full" placeholder="Unlimited if empty" />
                                    </Form.Item>
                                )}
                                {selectedType && (selectedType === 'ticket' || selectedType === 'transport' || selectedType === 'booking') && (
                                    <Form.Item name="subActionSeatType" label="Seat / Zone">
                                        <Input placeholder="Front-row, Balcony ..." />
                                    </Form.Item>
                                )}
                                <div className="md:col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowFixedMetadata(!showFixedMetadata)}
                                        className="flex items-center gap-2 text-xs font-semibold text-[#4a6278] hover:text-[#8da0b3] uppercase tracking-wide mb-3 transition-colors"
                                    >
                                        <span>{showFixedMetadata ? '▼' : '▶'}</span>
                                        Extra Metadata (Optional)
                                    </button>
                                    {showFixedMetadata && (
                                        <Form.Item 
                                            name="subActionMetadata" 
                                            label="" 
                                            tooltip="Add custom key-value pairs (e.g., benefits, features)"
                                        >
                                            <KeyValueInput placeholder='e.g., benefits: VIP lounge, early access' />
                                        </Form.Item>
                                    )}
                                </div>
                                <Form.Item name="subActionDescription" label="Description" className="md:col-span-2">
                                    <TextArea rows={3} placeholder="What makes this sub-action special?" />
                                </Form.Item>
                            </>
                        )}
                    </Form>
                );
            case 'subActions':
                return (
                    <div className="space-y-4">
                        <Form form={subActionForm} layout="vertical" className="grid gap-4 md:grid-cols-2">
                            <Form.Item name="name" label={`${subActionLabel.singular} Name`} rules={[{ required: true, message: 'Provide a name' }]}>
                                <Input placeholder={selectedType && actionTypeConfig[selectedType]?.placeholders?.name ? `e.g., ${actionTypeConfig[selectedType]?.placeholders?.name}` : "VIP Ticket"} />
                            </Form.Item>
                            {pricingMode !== 'pay_what_you_want' && !isVoteTieredPricing && (
                                <Form.Item 
                                    name="price" 
                                    label={pricingMode === 'free' ? 'Price (Free)' : 'Price'} 
                                    rules={[
                                        { 
                                            required: pricingMode !== 'free', 
                                            message: 'Price is required' 
                                        },
                                        {
                                            validator: (_, value) => {
                                                if (pricingMode === 'free') return Promise.resolve();
                                                if (value === null || value === undefined || value === '' || isNaN(value)) {
                                                    return Promise.reject(new Error('Price must be a valid number'));
                                                }
                                                return Promise.resolve();
                                            }
                                        }
                                    ]}
                                >
                                    <InputNumber min={0} className="w-full" prefix="RWF" disabled={pricingMode === 'free'} placeholder={pricingMode === 'free' ? '0 (Free)' : 'Enter price'} />
                                </Form.Item>
                            )}
                            {shouldAskStock && (
                                <Form.Item name="stock" label="Stock">
                                    <InputNumber min={0} className="w-full" placeholder="Unlimited if empty" />
                                </Form.Item>
                            )}
                            {selectedType && (selectedType === 'ticket' || selectedType === 'transport' || selectedType === 'booking') && (
                                <Form.Item name="seatType" label="Seat / Zone">
                                    <Input placeholder="Front-row, Balcony ..." />
                                </Form.Item>
                            )}
                            <Form.Item name="coverImage" label="Cover Image (Optional)" className="md:col-span-2">
                                <div className="space-y-3">
                                    <Upload
                                        accept="image/*"
                                        beforeUpload={(file) => {
                                            setSubActionCoverImageFile(file);
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setSubActionCoverImagePreview(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                            subActionForm.setFieldValue('coverImage', file.name);
                                            return false;
                                        }}
                                        onRemove={() => {
                                            setSubActionCoverImageFile(null);
                                            setSubActionCoverImagePreview(null);
                                            subActionForm.setFieldValue('coverImage', '');
                                            return true;
                                        }}
                                        maxCount={1}
                                        fileList={subActionCoverImageFile ? [{
                                            uid: '-1',
                                            name: subActionCoverImageFile.name,
                                            status: 'done',
                                        }] : []}
                                    >
                                        <Button icon={<UploadOutlined />}>Click to Upload</Button>
                                    </Upload>
                                    {subActionCoverImagePreview && (
                                        <div className="mt-2">
                                            <img 
                                                src={subActionCoverImagePreview} 
                                                alt="Cover preview" 
                                                className="max-w-full h-40 object-cover rounded-lg border border-gray-200"
                                            />
                                        </div>
                                    )}
                                    {!subActionCoverImageFile && (
                                        <Input 
                                            placeholder="Or enter image URL (https://...)" 
                                            value={subActionForm.getFieldValue('coverImage') || ''}
                                            onChange={(e) => {
                                                const url = e.target.value;
                                                subActionForm.setFieldValue('coverImage', url);
                                                if (url && url.startsWith('http')) {
                                                    setSubActionCoverImagePreview(url);
                                                } else if (!url) {
                                                    setSubActionCoverImagePreview(null);
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </Form.Item>

                            <div className="md:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowSubActionMetadata(!showSubActionMetadata)}
                                    className="flex items-center gap-2 text-xs font-semibold text-[#4a6278] hover:text-[#8da0b3] uppercase tracking-wide mb-3 transition-colors"
                                >
                                    <span>{showSubActionMetadata ? '▼' : '▶'}</span>
                                    Extra Metadata (Optional)
                                </button>
                                {showSubActionMetadata && (
                                    <Form.Item
                                        name="metadata"
                                        label=""
                                        tooltip="Add custom key-value pairs (e.g., benefits, features)"
                                    >
                                        <KeyValueInput placeholder='e.g., benefits: VIP lounge, early access' />
                                    </Form.Item>
                                )}
                            </div>
                            <Form.Item name="description" label="Description" className="md:col-span-2">
                                <TextArea rows={3} placeholder="What makes this tier special?" />
                            </Form.Item>
                        </Form>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleAddSubAction}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white text-sm font-bold transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusOutlined />}
                                Add {subActionLabel.singular}
                            </button>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[11px] font-bold text-[#4a6278] uppercase tracking-widest">
                                Added {subActionLabel.plural} ({subActions.length})
                            </p>
                            {subActions.length > 0 ? (
                                <div className="space-y-2">
                                    {subActions.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="bg-[#111927] border border-[#1e2d40] rounded-xl p-4 flex items-start gap-3"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-[#1a3a5c] border border-[#3b82f6]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-[11px] font-bold text-[#60a5fa]">{index + 1}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[#f0f4f8] font-semibold text-sm truncate">{item.name}</p>
                                                {item.description && (
                                                    <p className="text-[#8da0b3] text-xs mt-0.5 line-clamp-1">{item.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {pricingMode !== 'pay_what_you_want' && (
                                                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-900/20 border border-emerald-700/30 px-2 py-0.5 rounded-full">
                                                            {Number(item.price).toLocaleString()} RWF
                                                        </span>
                                                    )}
                                                    {shouldAskStock && item.stock != null && (
                                                        <span className="text-[11px] text-[#8da0b3] bg-[#0d1117] border border-[#1e2d40] px-2 py-0.5 rounded-full">
                                                            {item.stock} in stock
                                                        </span>
                                                    )}
                                                    {item.metadata?.seatType && (
                                                        <span className="text-[11px] text-[#8da0b3] bg-[#0d1117] border border-[#1e2d40] px-2 py-0.5 rounded-full capitalize">
                                                            {item.metadata.seatType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSubAction(item.id)}
                                                className="w-7 h-7 rounded-lg bg-[#0d1117] border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                                            >
                                                <DeleteOutlined style={{ fontSize: 12 }} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-[#111927] border border-dashed border-[#1e2d40] rounded-xl">
                                    <p className="text-[#4a6278] text-sm">No {subActionLabel.plural.toLowerCase()} yet — add one above.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'configuration':
                return (
                    <Form form={form} layout="vertical" className="space-y-5">
                        {/* Availability Section */}
                        <div className="border-b border-[#1e2d40] pb-5">
                            <h3 className="text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3">Availability</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Form.Item 
                                    name="availabilityMode" 
                                    label="Availability Mode"
                                    initialValue="always"
                                    className="md:col-span-2"
                                >
                                    <Select
                                        onChange={(value) => {
                                            setAvailabilityMode(value);
                                            form.setFieldValue('availabilityMode', value);
                                        }}
                                        options={[
                                            { label: '🌐 Always Available (No restrictions)', value: 'unrestricted' },
                                            { label: '✓ Always Available (Explicit)', value: 'always' },
                                            { label: '📅 Scheduled (Set start and optional end date)', value: 'scheduled' },
                                        ]}
                                    />
                                </Form.Item>
                                {availabilityMode === 'scheduled' && (
                                    <>
                                        <Form.Item 
                                            name="eventWindow" 
                                            label="Schedule" 
                                            tooltip="Set start date (required) and optionally end date. Leave end date empty for indefinite availability from start date."
                                            className="md:col-span-2"
                                            rules={[
                                                {
                                                    validator: (_, value) => {
                                                        if (!value || !value[0]) {
                                                            return Promise.reject('Start date is required for scheduled availability');
                                                        }
                                                        return Promise.resolve();
                                                    }
                                                }
                                            ]}
                                        >
                                            <DatePicker.RangePicker
                                                showTime
                                                format="YYYY-MM-DD HH:mm"
                                                className="w-full"
                                                placeholder={['Start Date (Required)', 'End Date (Optional)']}
                                            />
                                        </Form.Item>
                                        <Form.Item name="timezone" label="Timezone" initialValue="Africa/Kigali">
                                            <Select
                                                showSearch
                                                options={[
                                                    { label: 'Africa/Kigali (GMT+2)', value: 'Africa/Kigali' },
                                                    { label: 'Africa/Nairobi (EAT)', value: 'Africa/Nairobi' },
                                                    { label: 'UTC', value: 'UTC' },
                                                    { label: 'America/New_York (EST)', value: 'America/New_York' },
                                                    { label: 'Europe/London (GMT)', value: 'Europe/London' },
                                                    { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
                                                ]}
                                            />
                                        </Form.Item>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Vote Limits Section */}
                        {selectedType === 'vote' && (
                            <div className="border-b border-[#1e2d40] pb-5">
                                <h3 className="text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3">Voting Rules</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Form.Item
                                        name="userVoteLimit"
                                        label="Max Votes Per User"
                                        tooltip="Maximum number of times a single user can vote. Leave empty for unlimited."
                                    >
                                        <InputNumber
                                            min={1}
                                            className="w-full"
                                            placeholder="Unlimited if empty"
                                        />
                                    </Form.Item>
                                </div>
                            </div>
                        )}

                        {/* Visibility Section */}
                        {/* <div className="border-b pb-6">
                            <h3 className="text-base font-semibold mb-4">Visibility</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Form.Item name="visibilityMode" label="Visibility Mode">
                                    <Select options={visibilityOptions} />
                                </Form.Item>
                            </div>
                        </div> */}

                        {/* Buyer Information Section */}
                        <div className="border-b border-[#1e2d40] pb-5">
                            <h3 className="text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3">Buyer Information</h3>
                            <Form.Item name="buyerFields" label="Collect Buyer Fields">
                                <Select mode="multiple" options={buyerFieldOptions} placeholder="Select required fields" />
                            </Form.Item>
                        </div>

                        {/* Policies Section */}
                        <div className="border-b border-[#1e2d40] pb-5">
                            <button
                                type="button"
                                onClick={() => setShowPolicies(!showPolicies)}
                                className="flex items-center gap-2 text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3 hover:text-[#8da0b3] transition-colors"
                            >
                                <span>{showPolicies ? '▼' : '▶'}</span>
                                Policies (Optional)
                            </button>
                            {showPolicies && (
                                <div className="space-y-4">
                                    <Form.Item name="refundPolicy" label="Refund Policy">
                                        <TextArea rows={3} placeholder="Describe refund conditions" />
                                    </Form.Item>
                                    <Form.Item name="cancellationPolicy" label="Cancellation Policy">
                                        <TextArea rows={3} placeholder="Describe cancellation terms" />
                                    </Form.Item>
                                    <Form.Item name="tosUrl" label="Terms of Service URL">
                                        <Input placeholder="https://..." />
                                    </Form.Item>
                                </div>
                            )}
                        </div>

                        {/* Fulfillment Section */}
                        <div>
                            <h3 className="text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3">Fulfillment</h3>
                            <div className="space-y-4">
                                <Form.Item name="postPurchaseMessage" label="Post Purchase Message">
                                    <TextArea rows={3} placeholder="Message shown after successful purchase" />
                                </Form.Item>
                            </div>
                        </div>
                    </Form>
                );
            case 'publish':
                return (
                    <Form form={form} layout="vertical" className="space-y-5">
                        <div className="bg-[#1a3a5c]/30 border border-[#3b82f6]/30 rounded-xl p-4">
                            <p className="text-sm text-[#60a5fa]">
                                Review your action details before publishing. You can publish now or save as draft.
                            </p>
                        </div>

                        {/* Identity Review */}
                        <div className="border-b border-[#1e2d40] pb-5">
                            <h3 className="text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3">{currentLabels.stepA.title}</h3>
                            <div className="grid grid-cols-2 gap-px bg-[#1e2d40] rounded-xl overflow-hidden text-sm">
                                <div className="bg-[#111927] px-4 py-3">
                                    <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">Type</p>
                                    <p className="font-semibold text-[#f0f4f8] capitalize">{actionTypeLabels[form.getFieldValue('type') || existingAction?.type || '']?.builderTitle?.replace(' Builder', '') || form.getFieldValue('type') || existingAction?.type || '-'}</p>
                                </div>
                                <div className="bg-[#111927] px-4 py-3">
                                    <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">{currentLabels.nameLabel}</p>
                                    <p className="font-semibold text-[#f0f4f8]">{form.getFieldValue('name') || existingAction?.name || '-'}</p>
                                </div>
                                {(form.getFieldValue('displayLayout') || existingAction?.displayLayout) && (
                                    <div className="bg-[#111927] px-4 py-3">
                                        <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">Layout</p>
                                        <p className="font-semibold text-[#f0f4f8] capitalize">{form.getFieldValue('displayLayout') || existingAction?.displayLayout}</p>
                                    </div>
                                )}
                                {(form.getFieldValue('shortDescription') || existingAction?.shortDescription) && (
                                    <div className="bg-[#111927] px-4 py-3 col-span-2">
                                        <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">{currentLabels.shortDescLabel}</p>
                                        <p className="text-[#8da0b3] text-sm">{form.getFieldValue('shortDescription') || existingAction?.shortDescription}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pricing Review */}
                        <div className="border-b border-[#1e2d40] pb-5">
                            <h3 className="text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3">{currentLabels.stepB.title}</h3>
                            <div className="grid grid-cols-2 gap-px bg-[#1e2d40] rounded-xl overflow-hidden text-sm">
                                <div className="bg-[#111927] px-4 py-3">
                                    <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">Pricing Mode</p>
                                    <p className="font-semibold text-[#f0f4f8] capitalize">{form.getFieldValue('pricingMode') || existingAction?.pricing?.mode || '-'}</p>
                                </div>
                                <div className="bg-[#111927] px-4 py-3">
                                    <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">Currency</p>
                                    <p className="font-semibold text-[#f0f4f8]">{form.getFieldValue('currency') || existingAction?.currency || '-'}</p>
                                </div>
                                {((form.getFieldValue('amount') !== undefined && form.getFieldValue('amount') !== 0) || existingAction?.pricing?.amount) && (
                                    <div className="bg-[#111927] px-4 py-3 col-span-2">
                                        <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">Amount</p>
                                        <p className="font-bold text-emerald-400">{Number(form.getFieldValue('amount') ?? existingAction?.pricing?.amount).toLocaleString()} {form.getFieldValue('currency') || existingAction?.currency}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sub-actions Review */}
                        {subActions.length > 0 && (
                            <div className="border-b border-[#1e2d40] pb-5">
                                <h3 className="text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3">{subActionLabel.plural} ({subActions.length})</h3>
                                <div className="space-y-2">
                                    {subActions.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-[#111927] border border-[#1e2d40] rounded-xl">
                                            <span className="text-[11px] font-bold text-[#4a6278] w-5">{idx + 1}</span>
                                            <span className="text-[#f0f4f8] text-sm font-semibold flex-1 truncate">{item.name}</span>
                                            <span className="text-emerald-400 text-xs font-semibold">{Number(item.price).toLocaleString()} RWF</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Configuration Review */}
                        <div className="border-b border-[#1e2d40] pb-5">
                            <h3 className="text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3">Configuration</h3>
                            <div className="space-y-2 text-sm">
                                {(form.getFieldValue('eventWindow') || (existingAction?.availability?.startsAt && existingAction?.availability?.endsAt)) && (
                                    <div className="px-4 py-3 bg-[#111927] border border-[#1e2d40] rounded-xl">
                                        <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">Event Window</p>
                                        <p className="text-[#f0f4f8] font-semibold text-xs">
                                            {form.getFieldValue('eventWindow')?.[0]?.format('MMM DD, YYYY HH:mm') || dayjs(existingAction?.availability?.startsAt).format('MMM DD, YYYY HH:mm')}
                                            {' → '}
                                            {form.getFieldValue('eventWindow')?.[1]?.format('MMM DD, YYYY HH:mm') || dayjs(existingAction?.availability?.endsAt).format('MMM DD, YYYY HH:mm')}
                                        </p>
                                    </div>
                                )}
                                {selectedType === 'vote' && (form.getFieldValue('userVoteLimit') || existingAction?.availability?.userQuota) && (
                                    <div className="px-4 py-3 bg-[#111927] border border-[#1e2d40] rounded-xl">
                                        <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">Max Votes / User</p>
                                        <p className="text-[#f0f4f8] font-semibold">{form.getFieldValue('userVoteLimit') || existingAction?.availability?.userQuota}</p>
                                    </div>
                                )}
                                {((form.getFieldValue('buyerFields')?.length > 0) || existingAction?.buyerFields?.length > 0) && (
                                    <div className="px-4 py-3 bg-[#111927] border border-[#1e2d40] rounded-xl">
                                        <p className="text-[10px] text-[#4a6278] uppercase tracking-wide mb-1">Buyer Fields</p>
                                        <p className="text-[#f0f4f8] font-semibold">{(form.getFieldValue('buyerFields') || existingAction?.buyerFields || []).join(', ')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Publish Status */}
                        <div>
                            <h3 className="text-sm font-bold text-[#4a6278] uppercase tracking-widest mb-3">Publish Status</h3>
                            <Form.Item name="status" rules={[{ required: true, message: 'Choose a status' }]}>
                                <Select
                                    options={[
                                        { label: '🟢 Publish now — go live immediately', value: 'published' },
                                        { label: '📝 Save as draft — finish later', value: 'draft' },
                                    ]}
                                />
                            </Form.Item>
                        </div>
                    </Form>
                );
            default:
                return null;
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <ConfigProvider
                theme={{
                    algorithm: antdTheme.darkAlgorithm,
                    token: {
                        colorBgContainer: '#111927',
                        colorBgElevated: '#1e2d40',
                        colorBorder: '#1e2d40',
                        colorText: '#f0f4f8',
                        colorTextSecondary: '#8da0b3',
                        colorTextPlaceholder: '#4a6278',
                        colorPrimary: '#3b82f6',
                        borderRadius: 10,
                    },
                }}
            >
                <div className="relative bg-[#0d1117] border border-[#1e2d40] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/60 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-start justify-between px-6 py-5 border-b border-[#1e2d40] flex-shrink-0">
                        <div>
                            <p className="text-[11px] font-bold text-[#3b82f6] uppercase tracking-widest mb-1">{currentLabels.builderTitle}</p>
                            <h2 className="text-xl font-bold text-[#f0f4f8] leading-tight">{currentLabels.wizardTitle}</h2>
                            <p className="text-[#8da0b3] text-sm mt-0.5">{currentLabels.wizardDescription}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-lg bg-[#111927] border border-[#1e2d40] flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] transition-colors flex-shrink-0 mt-0.5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="px-6 py-3 border-b border-[#1e2d40] flex-shrink-0 overflow-x-auto">
                        <div className="flex items-center gap-1 min-w-max">
                            {stepItems.map((step, index) => (
                                <React.Fragment key={step.key}>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0 border transition-colors ${
                                        index === currentStep
                                            ? 'bg-[#1a3a5c] border-[#3b82f6]/60'
                                            : index < currentStep
                                            ? 'bg-emerald-900/20 border-emerald-700/30'
                                            : 'bg-[#111927] border-[#1e2d40]'
                                    }`}>
                                        <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                                            index < currentStep
                                                ? 'bg-emerald-500 text-white'
                                                : index === currentStep
                                                ? 'bg-[#3b82f6] text-white'
                                                : 'bg-[#1e2d40] text-[#4a6278]'
                                        }`}>
                                            {index < currentStep ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : index + 1}
                                        </span>
                                        <span className={`text-[11px] font-semibold ${
                                            index === currentStep ? 'text-[#60a5fa]' :
                                            index < currentStep ? 'text-emerald-400' : 'text-[#4a6278]'
                                        }`}>{step.title}</span>
                                    </div>
                                    {index < stepItems.length - 1 && (
                                        <div className={`h-px w-3 flex-shrink-0 ${index < currentStep ? 'bg-emerald-600/50' : 'bg-[#1e2d40]'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable form content */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
                        {renderStepContent()}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e2d40] bg-[#0d1117] flex-shrink-0">
                        <button
                            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
                            disabled={currentStep === 0}
                            className="px-4 py-2 rounded-xl bg-[#111927] border border-[#1e2d40] text-[#8da0b3] text-sm font-semibold disabled:opacity-30 hover:text-[#f0f4f8] hover:border-[#2a3d54] transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/30"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLastStep ? 'Publish' : 'Save & Continue →'}
                        </button>
                    </div>
                </div>
            </ConfigProvider>
        </div>
    );
};

export default ActionWizardModal;

