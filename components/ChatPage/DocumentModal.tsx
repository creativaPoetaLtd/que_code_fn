import React, { FC, useState, useRef } from "react";
import { Modal, Button, Upload, Input, Select, Progress, message } from "antd";
import { X, FileText, Upload as UploadIcon, File, Paperclip, CheckCircle, AlertCircle } from "lucide-react";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

interface DocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: UploadFile[], title: string, category: string) => void;
}

const { Option } = Select;
const { Dragger } = Upload;

export interface DocumentData {
    files: UploadFile[];
    title: string;
    category: string;
}

const DocumentModal: FC<DocumentModalProps> = ({ isOpen, onClose, onUpload }) => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [title, setTitle] = useState<string>("");
    const [category, setCategory] = useState<string>("general");
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadComplete, setUploadComplete] = useState<boolean>(false);

    const uploadRef = useRef<HTMLDivElement>(null);

    // Reset the form when the modal opens
    React.useEffect(() => {
        if (isOpen) {
            setFileList([]);
            setTitle("");
            setCategory("general");
            setCurrentStep(1);
            setUploading(false);
            setUploadProgress(0);
            setUploadComplete(false);
        }
    }, [isOpen]);

    // Simulate upload progress
    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (uploading && uploadProgress < 100) {
            timer = setTimeout(() => {
                const nextProgress = Math.min(uploadProgress + 10, 100);
                setUploadProgress(nextProgress);
                if (nextProgress === 100) {
                    setUploading(false);
                    setUploadComplete(true);
                }
            }, 300);
        }
        return () => clearTimeout(timer);
    }, [uploading, uploadProgress]);

    const handleUploadChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const handleNext = () => {
        if (currentStep === 1 && fileList.length > 0) {
            setCurrentStep(2);
        } else if (currentStep === 2 && title) {
            setCurrentStep(3);
            simulateUpload();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const simulateUpload = () => {
        setUploading(true);
        setUploadProgress(0);
    };

    const handleFinish = () => {
        onUpload(fileList, title, category);
        onClose();
    };

    const fileIcons: Record<string, JSX.Element> = {
        pdf: <File size={40} className="text-red-500" />,
        doc: <File size={40} className="text-blue-500" />,
        docx: <File size={40} className="text-blue-500" />,
        xls: <File size={40} className="text-green-500" />,
        xlsx: <File size={40} className="text-green-500" />,
        ppt: <File size={40} className="text-orange-500" />,
        pptx: <File size={40} className="text-orange-500" />,
        jpg: <File size={40} className="text-purple-500" />,
        jpeg: <File size={40} className="text-purple-500" />,
        png: <File size={40} className="text-purple-500" />,
        default: <File size={40} className="text-gray-500" />
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        return fileIcons[extension] || fileIcons.default;
    };

    const uploadProps: UploadProps = {
        beforeUpload: (file) => {
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('File must be smaller than 10MB!');
            }
            return false; // Prevent actual upload
        },
        fileList,
        onChange: handleUploadChange,
        multiple: true,
        showUploadList: false
    };

    const renderStep1 = () => (
        <div className="flex flex-col items-center py-6">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">Upload Documents</h3>
                <p className="text-gray-500">Select files to share in the conversation</p>
            </div>

            <Dragger
                {...uploadProps}
                className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-600 transition-colors"
                style={{ padding: '20px 10px' }}
            >
                <div className="flex flex-col items-center p-4">
                    <UploadIcon size={48} className="text-green-600 mb-3" />
                    <p className="text-base font-medium">Drag files here or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">Support for PDF, Word, Excel, PowerPoint, and images</p>
                </div>
            </Dragger>

            {fileList.length > 0 && (
                <div className="w-full mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4 animate-fadeIn">
                    <h4 className="font-medium text-gray-700 mb-2">Selected Files ({fileList.length})</h4>
                    <div className="max-h-48 overflow-y-auto">
                        {fileList.map((file, index) => (
                            <div key={index} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                                {getFileIcon(file.name)}
                                <div className="ml-3 flex-1 overflow-hidden">
                                    <p className="font-medium text-gray-800 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{file.size ? (file.size / 1024).toFixed(1) : 'N/A'} KB</p>
                                </div>
                                <Button
                                    type="text"
                                    shape="circle"
                                    icon={<X size={16} />}
                                    onClick={() => {
                                        const newFileList = [...fileList];
                                        newFileList.splice(index, 1);
                                        setFileList(newFileList);
                                    }}
                                    className="text-gray-500 hover:text-red-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="flex flex-col py-6">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">Document Details</h3>
                <p className="text-gray-500">Add information about your documents</p>
            </div>

            <div className="mb-4 animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                <Input
                    placeholder="Enter document title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                />
            </div>

            <div className="mb-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Select
                    value={category}
                    onChange={setCategory}
                    className="w-full"
                >
                    <Option value="general">General</Option>
                    <Option value="contract">Contract</Option>
                    <Option value="report">Report</Option>
                    <Option value="invoice">Invoice</Option>
                    <Option value="presentation">Presentation</Option>
                </Select>
            </div>

            <div className="mt-4 mb-2 bg-gray-50 rounded-lg border border-gray-200 p-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <h4 className="font-medium text-gray-700 mb-2">Files to Upload ({fileList.length})</h4>
                <div className="max-h-32 overflow-y-auto">
                    {fileList.map((file, index) => (
                        <div key={index} className="flex items-center py-1">
                            <Paperclip size={16} className="text-gray-500 mr-2" />
                            <p className="text-sm text-gray-800 truncate">{file.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="flex flex-col items-center py-6">
            {!uploadComplete ? (
                <>
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold mb-1">Uploading Documents</h3>
                        <p className="text-gray-500">Please wait while we upload your files</p>
                    </div>

                    <div className="w-full mb-6 px-4">
                        <Progress
                            percent={uploadProgress}
                            status="active"
                            strokeColor="#3b82f6"
                            className="mt-4"
                        />
                        <p className="text-center text-gray-500 mt-2">
                            Uploading {fileList.length} {fileList.length === 1 ? 'file' : 'files'}...
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-sm">
                        <div className="flex items-start">
                            <AlertCircle size={20} className="text-green-600 mr-2 mt-0.5" />
                            <p className="text-sm text-green-700">
                                Please don't close this dialog until the upload is complete.
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-green-100 p-4 rounded-full mb-4">
                            <CheckCircle size={48} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-1">Upload Complete!</h3>
                        <p className="text-gray-500">Your documents have been successfully uploaded</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 w-full mb-6">
                        <h4 className="font-medium text-gray-700 mb-3">Document Summary</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Title:</span>
                                <span className="font-medium">{title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Category:</span>
                                <span className="font-medium capitalize">{category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Files:</span>
                                <span className="font-medium">{fileList.length}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            closable={false}
            width={420}
            className="document-modal"
            destroyOnClose
        >
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <FileText size={20} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Document Upload</h2>
                    </div>
                    <Button
                        type="text"
                        shape="circle"
                        icon={<X size={18} />}
                        onClick={onClose}
                        className="hover:bg-gray-100"
                        disabled={uploading}
                    />
                </div>

                <div className="border-t border-gray-200 -mx-4 mb-4"></div>

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <div className="flex justify-between mt-4">
                    <Button
                        onClick={handleBack}
                        disabled={currentStep === 1 || uploading}
                        className={currentStep === 1 || uploading ? 'opacity-0' : 'opacity-100 transition-opacity'}
                    >
                        Back
                    </Button>

                    {currentStep < 3 ? (
                        <Button
                            type="primary"
                            onClick={handleNext}
                            disabled={(currentStep === 1 && fileList.length === 0) || (currentStep === 2 && !title)}
                            className="bg-green-600 hover:bg-green-700 border-0"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            onClick={handleFinish}
                            disabled={!uploadComplete}
                            className="bg-green-600 hover:bg-green-700 border-0"
                        >
                            Done
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
        
        .document-modal .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
        </Modal>
    );
};

export default DocumentModal;