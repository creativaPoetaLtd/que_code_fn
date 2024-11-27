'use client'
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Tag, Dropdown, Menu, Space, Select } from 'antd';
import { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { 
  DeleteOutlined, 
  CheckOutlined, 
  StopOutlined, 
  EyeOutlined,
  MoreOutlined 
} from '@ant-design/icons';

// Define TypeScript interface for User
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  approvalStatus: boolean;
  isVerified: boolean;
  province: string;
  district: string;
  createdAt: string;
}

const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Filter states
  const [approvalFilter, setApprovalFilter] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5500/api/v1/users');
      setUsers(response.data);
      setFilteredUsers(response.data);
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch users');
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (data: User[]) => {
    return data.filter(user => 
      (approvalFilter === null || 
        (approvalFilter === 'approved' && user.approvalStatus) || 
        (approvalFilter === 'pending' && !user.approvalStatus)) &&
      (genderFilter === null || user.gender === genderFilter)
    );
  };

  // Update filtered users when filters or main users list changes
  useEffect(() => {
    const filtered = applyFilters(users);
    setFilteredUsers(filtered);
  }, [users, approvalFilter, genderFilter]);

  // Delete user handler
  const handleDelete = (userId: number) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this user?',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:5500/api/v1/users/${userId}`);
          message.success('User deleted successfully');
          fetchUsers();
        } catch (error) {
          message.error('Failed to delete user');
        }
      }
    });
  };

  // Approve user handler
  const handleApprove = async (userId: number, currentStatus: boolean) => {
    try {
      await axios.put(`http://localhost:5500/api/v1/users/${userId}/approve`);
      message.success(`User ${currentStatus ? 'unapproved' : 'approved'} successfully`);
      fetchUsers();
    } catch (error) {
      message.error('Failed to update user approval status');
    }
  };

  // View user details
  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
  };

  // Close user details modal
  const handleCloseDetails = () => {
    setSelectedUser(null);
  };

  // Dropdown menu for row actions
  const getRowActionMenu = (record: User) => (
    <Menu>
      <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
        View Details
      </Menu.Item>
      <Menu.Item 
        key="approve" 
        icon={record.approvalStatus ? <StopOutlined /> : <CheckOutlined />}
        onClick={() => handleApprove(record.id, record.approvalStatus)}
      >
        {record.approvalStatus ? 'Unapprove' : 'Approve'}
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>
        Delete
      </Menu.Item>
    </Menu>
  );

  // Table columns configuration
  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      filters: [
        { text: 'Male', value: 'male' },
        { text: 'Female', value: 'female' },
        { text: 'Other', value: 'other' },
      ],
      onFilter: (value, record) => record.gender === value,
    },
    {
      title: 'Verification',
      key: 'verification',
      render: (_, record) => (
        <div>
          <div>Verified: {record.isVerified ? 'Yes' : 'No'}</div>
          <Tag color={record.approvalStatus ? 'green' : 'red'}>
            {record.approvalStatus ? 'Approved' : 'Pending'}
          </Tag>
        </div>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown overlay={getRowActionMenu(record)} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      {/* Filters */}
      <div className="mb-4 flex space-x-4">
        <div>
          <label className="mr-2">Approval Status:</label>
          <Select
            style={{ width: 200 }}
            placeholder="Filter by Approval Status"
            allowClear
            onChange={(value) => setApprovalFilter(value)}
          >
            <Select.Option value="approved">Approved</Select.Option>
            <Select.Option value="pending">Pending</Select.Option>
          </Select>
        </div>
        
        <div>
          <label className="mr-2">Gender:</label>
          <Select
            style={{ width: 200 }}
            placeholder="Filter by Gender"
            allowClear
            onChange={(value) => setGenderFilter(value)}
          >
            <Select.Option value="male">Male</Select.Option>
            <Select.Option value="female">Female</Select.Option>
            {/* <Select.Option value="other">Other</Select.Option> */}
          </Select>
        </div>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredUsers} 
        rowKey="id"
        loading={loading}
        pagination={{ 
          showSizeChanger: true, 
          showQuickJumper: true 
        }}
      />

      {/* User Details Modal */}
      <Modal
        title="User Details"
        visible={!!selectedUser}
        onCancel={handleCloseDetails}
        footer={null}
        width={600}
      >
        {selectedUser && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>First Name:</strong> {selectedUser.firstName}
            </div>
            <div>
              <strong>Last Name:</strong> {selectedUser.lastName}
            </div>
            <div>
              <strong>Email:</strong> {selectedUser.email}
            </div>
            <div>
              <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
            </div>
            <div>
              <strong>Gender:</strong> {selectedUser.gender}
            </div>
            <div>
              <strong>Province:</strong> {selectedUser.province || 'N/A'}
            </div>
            <div>
              <strong>District:</strong> {selectedUser.district || 'N/A'}
            </div>
            <div>
              <strong>Verification Status:</strong> 
              <Tag color={selectedUser.isVerified ? 'green' : 'red'}>
                {selectedUser.isVerified ? 'Verified' : 'Not Verified'}
              </Tag>
            </div>
            <div>
              <strong>Approval Status:</strong> 
              <Tag color={selectedUser.approvalStatus ? 'green' : 'red'}>
                {selectedUser.approvalStatus ? 'Approved' : 'Pending'}
              </Tag>
            </div>
            <div>
              <strong>Created At:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersManagementPage;