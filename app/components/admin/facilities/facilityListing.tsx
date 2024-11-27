'use client'
// pages/organizations/index.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { 
  DeleteOutlined, 
  CheckOutlined, 
  StopOutlined, 
  EyeOutlined 
} from '@ant-design/icons';

// Define TypeScript interface for Organization
interface Organization {
  id: number;
  name: string;
  type: string;
  email: string;
  ownerPhone: string;
  ownerEmail: string;
  province: string;
  district: string;
  tinNumber: string;
  approvalStatus: boolean;
  logo: string;
  createdAt: string;
}

const OrganizationsManagementPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5500/api/v1/organizations');
      setOrganizations(response.data.organizations);
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch organizations');
      setLoading(false);
    }
  };

  // Delete organization handler
  const handleDelete = (orgId: number) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this organization?',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:5500/api/v1/organizations/${orgId}`);
          message.success('Organization deleted successfully');
          fetchOrganizations();
        } catch (error) {
          message.error('Failed to delete organization');
        }
      }
    });
  };

  // Approve organization handler
  const handleApprove = async (orgId: number, currentStatus: boolean) => {
    try {
      await axios.put(`http://localhost:5500/api/v1/organizations/${orgId}/approve`);
      message.success(`Organization ${currentStatus ? 'unapproved' : 'approved'} successfully`);
      fetchOrganizations();
    } catch (error) {
      message.error('Failed to update organization approval status');
    }
  };

  // View organization details
  const handleViewDetails = (organization: Organization) => {
    setSelectedOrganization(organization);
  };

  // Close organization details modal
  const handleCloseDetails = () => {
    setSelectedOrganization(null);
  };

  // Table columns configuration
  const columns: ColumnsType<Organization> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex items-center">
          {record.logo && (
            <img 
              src={record.logo} 
              alt={`${name} logo`} 
              className="w-10 h-10 mr-2 rounded-full object-cover"
            />
          )}
          {name}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type || 'N/A'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Owner Phone',
      dataIndex: 'ownerPhone',
      key: 'ownerPhone',
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => `${record.province}, ${record.district}`
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status) => (
        <Tag color={status ? 'green' : 'red'}>
          {status ? 'Approved' : 'Pending'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
          <Button 
            icon={record.approvalStatus ? <StopOutlined /> : <CheckOutlined />}
            onClick={() => handleApprove(record.id, record.approvalStatus)}
          >
            {record.approvalStatus ? 'Unapprove' : 'Approve'}
          </Button>
        </div>
      ),
    },
  ];

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Organization Management</h1>
      <Table 
        columns={columns} 
        dataSource={organizations} 
        rowKey="id"
        loading={loading}
        pagination={{ 
          showSizeChanger: true, 
          showQuickJumper: true 
        }}
      />

      {/* Organization Details Modal */}
      <Modal
        title="Organization Details"
        visible={!!selectedOrganization}
        onCancel={handleCloseDetails}
        footer={null}
        width={600}
      >
        {selectedOrganization && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Name:</strong> {selectedOrganization.name}
            </div>
            <div>
              <strong>Type:</strong> {selectedOrganization.type || 'N/A'}
            </div>
            <div>
              <strong>Email:</strong> {selectedOrganization.email}
            </div>
            <div>
              <strong>Owner Phone:</strong> {selectedOrganization.ownerPhone}
            </div>
            <div>
              <strong>Owner Email:</strong> {selectedOrganization.ownerEmail}
            </div>
            <div>
              <strong>TIN Number:</strong> {selectedOrganization.tinNumber}
            </div>
            <div>
              <strong>Province:</strong> {selectedOrganization.province}
            </div>
            <div>
              <strong>District:</strong> {selectedOrganization.district}
            </div>
            <div>
              <strong>Status:</strong> 
              <Tag color={selectedOrganization.approvalStatus ? 'green' : 'red'}>
                {selectedOrganization.approvalStatus ? 'Approved' : 'Pending'}
              </Tag>
            </div>
            <div>
              <strong>Created At:</strong> {new Date(selectedOrganization.createdAt).toLocaleString()}
            </div>
            {selectedOrganization.logo && (
              <div className="col-span-2">
                <strong>Logo:</strong>
                <img 
                  src={selectedOrganization.logo} 
                  alt="Organization Logo" 
                  className="mt-2 max-w-full h-auto rounded"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrganizationsManagementPage;