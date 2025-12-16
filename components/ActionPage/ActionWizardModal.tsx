'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Steps,
    Form,
    Input,
    Select,
    InputNumber,
    Switch,
    DatePicker,
    Button,
    message,
    Tag,
    List,
    Space,
    Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
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
}

const stepItems = [
    { key: 'stepA', title: 'Identity', description: 'Type & basics' },
    { key: 'stepB', title: 'Pricing', description: 'Currency & price' },
    { key: 'subActions', title: 'Sub-actions', description: 'Tickets & tiers' },
    { key: 'availability', title: 'Schedule', description: 'Timing & limits' },
    { key: 'visibility', title: 'Visibility', description: 'Audience & fields' },
    { key: 'policy', title: 'Policies', description: 'Rules & terms' },
    { key: 'fulfillment', title: 'Fulfillment', description: 'Delivery rules' },
    { key: 'advanced', title: 'Advanced', description: 'Custom & webhooks' },
    { key: 'publish', title: 'Publish', description: 'Go live' },
];

const validTypes = [
    'ticket',
    'transport',
    'service',
    'subscription',
    'payment',
    'donation',
    'vote',
    'booking',
    'license',
    'membership',
    'rental',
    'group',
];

const visibilityOptions = [
    { label: 'Public', value: 'public' },
    { label: 'Private', value: 'private' },
    { label: 'Unlisted', value: 'unlisted' },
];

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
        const finalPairs = validPairs.length > 0 ? validPairs : [{ key: '', value: '', type: 'string' }];
        
        setPairs(finalPairs);
        const obj: Record<string, any> = {};
        validPairs.forEach(({ key, value: val, type }) => {
            if (!key.trim()) return;
            try {
                if (type === 'boolean') {
                    obj[key] = val === 'true' || val === true;
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

const ActionWizardModal: React.FC<ActionWizardModalProps> = ({ open, onClose, organizationId, onCompleted, editingActionId }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [subActionForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);
    const [subActions, setSubActions] = useState<SubActionSummary[]>([]);
    const [subActionsLoading, setSubActionsLoading] = useState(false);
    const [existingAction, setExistingAction] = useState<any | null>(null);
    const [isEditingExisting, setIsEditingExisting] = useState(false);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

    const stepKey = useMemo(() => stepItems[currentStep].key, [currentStep]);
    const isLastStep = currentStep === stepItems.length - 1;

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
    }, [form, subActionForm]);

    useEffect(() => {
        if (!open) {
            resetState();
        }
    }, [open, resetState]);

    useEffect(() => {
        if (stepKey === 'subActions') {
            subActionForm.resetFields();
            return;
        }
        form.resetFields();
        if (stepKey === 'stepA') {
            if (existingAction) {
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
                // Set preview if cover image exists
                if (existingAction.coverImage) {
                    setCoverImagePreview(existingAction.coverImage);
                }
            }
        } else if (stepKey === 'stepB') {
            form.setFieldsValue({
                pricingMode: existingAction?.pricing?.mode || 'fixed',
                currency: existingAction?.currency || 'RWF',
                amount: existingAction?.pricing?.amount ?? 0,
                taxProfileId: existingAction?.taxProfileId || '',
            });
        } else if (stepKey === 'visibility') {
            form.setFieldsValue({
                visibilityMode: existingAction?.visibility?.mode || 'public',
                buyerFields: existingAction?.buyerFields || [],
            });
        } else if (stepKey === 'fulfillment') {
            form.setFieldsValue({
                storeOnBuyerQR: existingAction?.fulfillment?.storeOnBuyerQR ?? true,
                postPurchaseMessage: existingAction?.fulfillment?.postPurchaseMessage || '',
            });
        } else if (stepKey === 'publish') {
            form.setFieldsValue({
                status: existingAction?.status || 'published',
            });
        } else if (stepKey === 'availability') {
            const starts = existingAction?.availability?.startsAt ? dayjs(existingAction.availability.startsAt) : null;
            const ends = existingAction?.availability?.endsAt ? dayjs(existingAction.availability.endsAt) : null;
            form.setFieldsValue({
                eventWindow: starts && ends ? [starts, ends] : undefined,
                timezone: existingAction?.availability?.timezone || 'Africa/Kigali',
                userQuota: existingAction?.availability?.userQuota ?? null,
            });
        } else if (stepKey === 'policy') {
            form.setFieldsValue({
                refundPolicy: existingAction?.policy?.refund || '',
                cancellationPolicy: existingAction?.policy?.cancellation || '',
                tosUrl: existingAction?.policy?.tosUrl || '',
            });
        } else if (stepKey === 'advanced') {
            form.setFieldsValue({
                customFields: existingAction?.customFields ? JSON.stringify(existingAction.customFields, null, 2) : '{}',
                webhooks: existingAction?.webhooks ? JSON.stringify(existingAction.webhooks, null, 2) : '{}',
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
        }
    }, [editingActionId, open]);

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

    const handleAddSubAction = async () => {
        if (!actionId) {
            message.error('Complete steps A & B before adding sub-actions.');
            return;
        }
        try {
            const values = await subActionForm.validateFields();
            setLoading(true);
            const payload = {
                name: values.name,
                description: values.description || null,
                price: values.price,
                stock: values.stock ?? null,
                metadata: {
                    seatType: values.seatType || undefined,
                    ...((values.metadata && values.metadata.trim().length)
                        ? (() => {
                              try {
                                  return JSON.parse(values.metadata);
                              } catch {
                                  message.warning('Metadata must be valid JSON. Ignoring metadata.');
                                  return {};
                              }
                          })()
                        : {}),
                },
                sortOrder: values.sortOrder ?? 0,
            };
            await createSubAction(actionId, payload);
            message.success('Sub-action added');
            subActionForm.resetFields();
            loadSubActions();
        } catch (err: any) {
            if (err?.errorFields) {
                return;
            }
            console.error(err);
            message.error(err?.response?.data?.message || 'Failed to add sub-action');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubAction = async (subActionId: string) => {
        try {
            setLoading(true);
            await deleteSubAction(subActionId);
            message.success('Sub-action removed');
            loadSubActions();
        } catch (err) {
            console.error(err);
            message.error('Unable to delete sub-action');
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
                message.success('Step A completed');
                setCurrentStep((prev) => prev + 1);
                return;
            }
        }

            if (key === 'stepB') {
                const values = await form.validateFields();
                setLoading(true);
                await updateActionStepB(actionId as string, {
                    pricing: {
                        mode: values.pricingMode,
                        amount: values.amount ?? 0,
                    },
                    currency: values.currency,
                    taxProfileId: values.taxProfileId || null,
                });
                message.success('Pricing updated');
                setCurrentStep((prev) => prev + 1);
                return;
            }

            if (key === 'subActions') {
                if (subActions.length === 0) {
                    message.warning('Add at least one sub-action before continuing.');
                    return;
                }
                setCurrentStep((prev) => prev + 1);
                return;
            }

            if (key === 'availability') {
                const values = await form.validateFields();
                setLoading(true);
                const [start, end] = values.eventWindow || [];
                await updateActionStepD(actionId as string, {
                    availability: {
                        startsAt: start ? dayjs(start).toISOString() : null,
                        endsAt: end ? dayjs(end).toISOString() : null,
                        timezone: values.timezone || 'Africa/Kigali',
                        userQuota: values.userQuota ?? null,
                    },
                });
                message.success('Availability updated');
                setCurrentStep((prev) => prev + 1);
                return;
            }

            if (key === 'visibility') {
                const values = await form.validateFields();
                setLoading(true);
                await updateActionStepE(actionId as string, {
                    visibility: {
                        mode: values.visibilityMode,
                    },
                    buyerFields: values.buyerFields || [],
                });
                message.success('Visibility updated');
                setCurrentStep((prev) => prev + 1);
                return;
            }

            if (key === 'policy') {
                const values = await form.validateFields();
                setLoading(true);
                await updateActionStepF(actionId as string, {
                    policy: {
                        refund: values.refundPolicy || null,
                        cancellation: values.cancellationPolicy || null,
                        tosUrl: values.tosUrl || null,
                    },
                });
                message.success('Policies saved');
                setCurrentStep((prev) => prev + 1);
                return;
            }

            if (key === 'fulfillment') {
                const values = await form.validateFields();
                setLoading(true);
                await updateActionStepG(actionId as string, {
                    fulfillment: {
                        storeOnBuyerQR: values.storeOnBuyerQR ?? false,
                        postPurchaseMessage: values.postPurchaseMessage || null,
                    },
                });
                message.success('Fulfillment updated');
                setCurrentStep((prev) => prev + 1);
                return;
            }

            if (key === 'advanced') {
                const values = await form.validateFields();
                setLoading(true);
                
                // Parse customFields if it's a JSON string
                let customFields: Record<string, any> = {};
                if (values.customFields) {
                    if (typeof values.customFields === 'string') {
                        try {
                            customFields = JSON.parse(values.customFields);
                        } catch {
                            message.error('Custom fields must be valid JSON');
                            return;
                        }
                    } else {
                        customFields = values.customFields;
                    }
                }

                // Parse webhooks if it's a JSON string
                let webhooks: Record<string, any> = {};
                if (values.webhooks) {
                    if (typeof values.webhooks === 'string') {
                        try {
                            webhooks = JSON.parse(values.webhooks);
                        } catch {
                            message.error('Webhooks must be valid JSON');
                            return;
                        }
                    } else {
                        webhooks = values.webhooks;
                    }
                }

                await updateActionStepH(actionId as string, {
                    customFields,
                    webhooks,
                });
                message.success('Advanced settings saved');
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

    const renderStepContent = () => {
        switch (stepKey) {
            case 'stepA':
                return (
                    <Form form={form} layout="vertical" className="grid gap-4 md:grid-cols-2">
                        <Form.Item name="type" label="Action Type" rules={[{ required: true, message: 'Select an action type' }]}>
                            <Select placeholder="Select type" options={validTypes.map((type) => ({ label: type, value: type }))} />
                        </Form.Item>
                        <Form.Item
                            name="name"
                            label="Action Name"
                            rules={[{ required: true, message: 'Provide an action name' }]}
                        >
                            <Input placeholder="Shaggy Concert – Brussels" />
                        </Form.Item>
                        <Form.Item name="slug" label="Slug">
                            <Input placeholder="auto-generated if empty" />
                        </Form.Item>
                        <Form.Item name="displayLayout" label="Display Layout" initialValue="card">
                            <Select
                                options={[
                                    { label: 'Card', value: 'card' },
                                    { label: 'List', value: 'list' },
                                    { label: 'Spotlight', value: 'spotlight' },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item name="coverImage" label="Cover Image" className="md:col-span-2">
                            <div className="space-y-3">
                                <Upload
                                    accept="image/*"
                                    beforeUpload={(file) => {
                                        // Prevent auto upload
                                        setCoverImageFile(file);
                                        // Create preview
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setCoverImagePreview(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                        // Update form field with file name (will be replaced with URL after upload)
                                        form.setFieldValue('coverImage', file.name);
                                        return false; // Prevent upload
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
                                            // If URL is provided, set it as preview
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
                        <Form.Item name="shortDescription" label="Short Description" className="md:col-span-2">
                            <Input placeholder="Quick headline for this action" />
                        </Form.Item>
                        <Form.Item name="description" label="Full Description" className="md:col-span-2">
                            <TextArea rows={4} placeholder="Tell supporters what this action is about" />
                        </Form.Item>
                        <Form.Item name="dedicatedQrCode" label="Dedicated QR (optional)" className="md:col-span-2">
                            <Input placeholder="Paste QR image URL" />
                        </Form.Item>
                    </Form>
                );
            case 'stepB':
                return (
                    <Form form={form} layout="vertical" className="grid gap-4 md:grid-cols-2">
                        <Form.Item name="pricingMode" label="Pricing Mode" rules={[{ required: true, message: 'Select a pricing mode' }]}>
                            <Select
                                options={[
                                    { label: 'Fixed', value: 'fixed' },
                                    { label: 'Tiered', value: 'tiered' },
                                    { label: 'Free', value: 'free' },
                                    { label: 'Pay what you want', value: 'pay_what_you_want' },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item
                            name="amount"
                            label="Default Amount"
                            rules={[{ required: false }]}
                            tooltip="Applies to fixed pricing"
                        >
                            <InputNumber min={0} className="w-full" prefix="RWF" />
                        </Form.Item>
                        <Form.Item name="currency" label="Currency" rules={[{ required: true, message: 'Select a currency' }]}>
                            <Select
                                options={[
                                    { label: 'RWF', value: 'RWF' },
                                    { label: 'USD', value: 'USD' },
                                    { label: 'EUR', value: 'EUR' },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item name="taxProfileId" label="Tax Profile ID">
                            <Input placeholder="Optional tax profile reference" />
                        </Form.Item>
                    </Form>
                );
            case 'subActions':
                return (
                    <div className="space-y-4">
                        <Form form={subActionForm} layout="vertical" className="grid gap-4 md:grid-cols-2">
                            <Form.Item name="name" label="Sub-action Name" rules={[{ required: true, message: 'Provide a name' }]}>
                                <Input placeholder="VIP Ticket" />
                            </Form.Item>
                            <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Provide a price' }]}>
                                <InputNumber min={0} className="w-full" prefix="RWF" />
                            </Form.Item>
                            <Form.Item name="stock" label="Stock">
                                <InputNumber min={0} className="w-full" placeholder="Unlimited if empty" />
                            </Form.Item>
                            <Form.Item name="seatType" label="Seat / Zone">
                                <Input placeholder="Front-row, Balcony ..." />
                            </Form.Item>
                            <Form.Item name="sortOrder" label="Sort Order">
                                <InputNumber min={0} className="w-full" />
                            </Form.Item>
                            <Form.Item 
                                name="metadata" 
                                label="Extra Metadata" 
                                className="md:col-span-2"
                                tooltip="Add custom key-value pairs (e.g., benefits, features)"
                            >
                                <KeyValueInput placeholder='e.g., benefits: VIP lounge, early access' />
                            </Form.Item>
                            <Form.Item name="description" label="Description" className="md:col-span-2">
                                <TextArea rows={3} placeholder="What makes this tier special?" />
                            </Form.Item>
                        </Form>
                        <div className="flex justify-end">
                            <Button icon={<PlusOutlined />} type="primary" onClick={handleAddSubAction} loading={loading}>
                                Add Sub-action
                            </Button>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <Typography.Title level={5} className="!text-[#00313A]">
                                Added Sub-actions ({subActions.length})
                            </Typography.Title>
                            <List
                                loading={subActionsLoading}
                                dataSource={subActions}
                                locale={{ emptyText: 'No sub-actions yet' }}
                                renderItem={(item) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key="delete"
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleDeleteSubAction(item.id)}
                                            >
                                                Remove
                                            </Button>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <Space size="small">
                                                    <span className="font-semibold text-[#00313A]">{item.name}</span>
                                                    <Tag color="green">{Number(item.price).toLocaleString()} RWF</Tag>
                                                </Space>
                                            }
                                            description={
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    {item.description && <p>{item.description}</p>}
                                                    {item.metadata?.seatType && <p>Seat: {item.metadata.seatType}</p>}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    </div>
                );
            case 'availability':
                return (
                    <Form form={form} layout="vertical" className="grid gap-4 md:grid-cols-2">
                        <Form.Item name="eventWindow" label="Event Window">
                            <DatePicker.RangePicker showTime className="w-full" />
                        </Form.Item>
                        <Form.Item name="timezone" label="Timezone" initialValue="Africa/Kigali">
                            <Select
                                options={[
                                    { label: 'Africa/Kigali', value: 'Africa/Kigali' },
                                    { label: 'Africa/Nairobi', value: 'Africa/Nairobi' },
                                    { label: 'UTC', value: 'UTC' },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item name="userQuota" label="Per-user Limit">
                            <InputNumber min={0} className="w-full" placeholder="Unlimited if empty" />
                        </Form.Item>
                    </Form>
                );
            case 'visibility':
                return (
                    <Form form={form} layout="vertical" className="grid gap-4 md:grid-cols-2">
                        <Form.Item name="visibilityMode" label="Visibility Mode">
                            <Select options={visibilityOptions} />
                        </Form.Item>
                        <Form.Item name="buyerFields" label="Collect Buyer Fields">
                            <Select mode="multiple" options={buyerFieldOptions} placeholder="Select required fields" />
                        </Form.Item>
                    </Form>
                );
            case 'policy':
                return (
                    <Form form={form} layout="vertical" className="space-y-4">
                        <Form.Item name="refundPolicy" label="Refund Policy">
                            <TextArea rows={3} placeholder="Describe refund conditions" />
                        </Form.Item>
                        <Form.Item name="cancellationPolicy" label="Cancellation Policy">
                            <TextArea rows={3} placeholder="Describe cancellation terms" />
                        </Form.Item>
                        <Form.Item name="tosUrl" label="Terms of Service URL">
                            <Input placeholder="https://..." />
                        </Form.Item>
                    </Form>
                );
            case 'fulfillment':
                return (
                    <Form form={form} layout="vertical" className="space-y-4">
                        <Form.Item name="storeOnBuyerQR" label="Store On Buyer QR" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="postPurchaseMessage" label="Post Purchase Message">
                            <TextArea rows={3} placeholder="Message shown after successful purchase" />
                        </Form.Item>
                    </Form>
                );
            case 'advanced':
                return (
                    <Form form={form} layout="vertical" className="space-y-4">
                        <Form.Item 
                            name="customFields" 
                            label="Custom Fields"
                            tooltip="Add custom fields as key-value pairs"
                        >
                            <KeyValueInput placeholder='e.g., vipOnly: true, priorityLevel: 5' />
                        </Form.Item>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>Webhooks:</strong> Enter URLs that will be called when events occur
                            </p>
                        </div>
                        <Form.Item 
                            name="webhooks" 
                            label="Webhook URLs"
                            tooltip="Add webhook URLs for different events (e.g., onCheckout, onScanValid)"
                        >
                            <KeyValueInput placeholder='e.g., onCheckout: https://your-api.com/webhook' />
                        </Form.Item>
                    </Form>
                );
            case 'publish':
                return (
                    <Form form={form} layout="vertical">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4">
                            <p className="text-sm text-emerald-800">
                                You can publish now or keep the action as draft. Drafts stay hidden from the public welcome page.
                            </p>
                        </div>
                        <Form.Item name="status" label="Action Status" rules={[{ required: true, message: 'Choose a status' }]}>
                            <Select
                                options={[
                                    { label: 'Publish now', value: 'published' },
                                    { label: 'Save as draft', value: 'draft' },
                                ]}
                            />
                        </Form.Item>
                    </Form>
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            width={1400}
            destroyOnClose
            className="action-wizard-modal"
        >
            <div className="space-y-6">
                <div>
                    <p className="text-sm font-semibold text-[#00B512] uppercase tracking-[0.2em]">Action Builder</p>
                    <h2 className="text-2xl font-bold text-[#00313A] mt-1">Multi-step Action Wizard</h2>
                    <p className="text-sm text-[#00313A]/70">Guide your organization through every detail, from basics to publish.</p>
                </div>
                <Steps
                    current={currentStep}
                    responsive
                    items={stepItems.map((step, index) => ({
                        key: step.key,
                        title: step.title,
                        description: step.description,
                        status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait',
                    }))}
                />
                <div className="bg-white rounded-3xl border border-gray-100 shadow-inner p-6">{renderStepContent()}</div>
                <div className="flex items-center justify-between">
                    <Button onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))} disabled={currentStep === 0}>
                        Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button type="primary" loading={loading} onClick={handleNext}>
                            {isLastStep ? 'Finish' : 'Save & Continue'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ActionWizardModal;

