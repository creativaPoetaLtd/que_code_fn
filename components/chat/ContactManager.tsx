// import React, { useState } from "react";
// import { Modal, Input, Button, List, Avatar, Checkbox } from "antd";
// import { UserAdd, Users } from "lucide-react";

// const ContactsManager = ({ contacts, onAddContact, onCreateGroup }) => {
//     const [isModalVisible, setIsModalVisible] = useState(false);
//     const [newContactName, setNewContactName] = useState("");
//     const [newContactAvatar, setNewContactAvatar] = useState("");
//     const [selectedContacts, setSelectedContacts] = useState([]);
//     const [groupName, setGroupName] = useState("");

//     const showModal = () => {
//         setIsModalVisible(true);
//     };

//     const handleOk = () => {
//         if (newContactName) {
//             onAddContact({ name: newContactName, avatar: newContactAvatar });
//             setNewContactName("");
//             setNewContactAvatar("");
//         }
//         setIsModalVisible(false);
//     };

//     const handleCancel = () => {
//         setIsModalVisible(false);
//     };

//     const handleCreateGroup = () => {
//         if (groupName && selectedContacts.length > 0) {
//             onCreateGroup(groupName, selectedContacts);
//             setGroupName("");
//             setSelectedContacts([]);
//         }
//     };

//     return (
//         <div className="p-4">
//             <Button type="primary" icon={<UserAdd size={16} />} onClick={showModal}>
//                 Add Contact
//             </Button>
//             <Button type="default" icon={<Users size={16} />} onClick={showModal} className="ml-2">
//                 Create Group
//             </Button>

//             <Modal title="Add Contact" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
//                 <Input
//                     placeholder="Contact Name"
//                     value={newContactName}
//                     onChange={(e) => setNewContactName(e.target.value)}
//                     className="mb-2"
//                 />
//                 <Input
//                     placeholder="Avatar URL"
//                     value={newContactAvatar}
//                     onChange={(e) => setNewContactAvatar(e.target.value)}
//                 />
//             </Modal>

//             <Modal title="Create Group" visible={isModalVisible} onOk={handleCreateGroup} onCancel={handleCancel}>
//                 <Input
//                     placeholder="Group Name"
//                     value={groupName}
//                     onChange={(e) => setGroupName(e.target.value)}
//                     className="mb-2"
//                 />
//                 <List
//                     dataSource={contacts}
//                     renderItem={(contact) => (
//                         <List.Item>
//                             <Checkbox
//                                 checked={selectedContacts.includes(contact.id)}
//                                 onChange={(e) => {
//                                     if (e.target.checked) {
//                                         setSelectedContacts([...selectedContacts, contact.id]);
//                                     } else {
//                                         setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
//                                     }
//                                 }}
//                             >
//                                 <Avatar src={contact.avatar} size={24} className="mr-2" />
//                                 {contact.name}
//                             </Checkbox>
//                         </List.Item>
//                     )}
//                 />
//             </Modal>
//         </div>
//     );
// };

// export default ContactsManager;