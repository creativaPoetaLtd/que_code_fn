"use client";

import React, { useState } from "react";
import { useAuthToken } from "@/hooks/use-auth-token";
import { 
  useGetContactsEnhancedQuery, 
  useSearchUsersQuery, 
  useSendContactInvitationMutation,
  useGetPendingInvitationsUnifiedQuery,
  useGetSentInvitationsUnifiedQuery,
  useRespondToInvitationEnhancedMutation,
  useCancelInvitationMutation,
  useRemoveContactMutation,
  useUpdateContactStatusMutation,
} from "@/states/contactSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  UserPlus, 
  Users, 
  Clock, 
  Check, 
  X, 
  Trash2, 
  Ban, 
  Unlock,
  QrCode,
  Copy,
  Mail,
  MessageSquare
} from "lucide-react";

const ContactsPage = () => {
  const authHook = useAuthToken();
  const token = authHook.getToken();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("contacts");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [invitationMessage, setInvitationMessage] = useState("");

  // API hooks
  const { data: contactsData, isLoading: contactsLoading } = useGetContactsEnhancedQuery(
    { token: token || "", status: "active" },
    { skip: !token }
  );

  const { data: searchResults, isLoading: searchLoading } = useSearchUsersQuery(
    { query: searchQuery, token: token || "" },
    { skip: !token || searchQuery.length < 2 }
  );

  const { data: receivedInvitations, isLoading: receivedLoading } = useGetPendingInvitationsUnifiedQuery(
    { token: token || "", page: 1, limit: 20 },
    { skip: !token }
  );

  const { data: sentInvitations, isLoading: sentLoading } = useGetSentInvitationsUnifiedQuery(
    { token: token || "", page: 1, limit: 20 },
    { skip: !token }
  );

  // Mutations
  const [sendInvitation, { isLoading: sendingInvitation }] = useSendContactInvitationMutation();
  const [respondToInvitation] = useRespondToInvitationEnhancedMutation();
  const [cancelInvitation] = useCancelInvitationMutation();
  const [removeContact] = useRemoveContactMutation();
  const [updateContactStatus] = useUpdateContactStatusMutation();

  const handleSendInvitation = async () => {
    if (!selectedUser || !token) return;

    try {
      const result = await sendInvitation({
        inviteeId: selectedUser.id,
        message: invitationMessage,
        token,
      }).unwrap();

      toast({
        title: "Invitation sent!",
        description: `Contact invitation sent to ${selectedUser.firstName} ${selectedUser.lastName}`,
      });

      setShowInviteDialog(false);
      setSelectedUser(null);
      setInvitationMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.data?.message || "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const handleRespondToInvitation = async (invitationId: string, action: "accept" | "decline") => {
    if (!token) return;

    try {
      const result = await respondToInvitation({
        invitationId,
        action,
        token,
      }).unwrap();

      toast({
        title: action === "accept" ? "Invitation accepted!" : "Invitation declined",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.data?.message || `Failed to ${action} invitation`,
        variant: "destructive",
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!token) return;

    try {
      await cancelInvitation({ invitationId, token }).unwrap();
      toast({
        title: "Invitation cancelled",
        description: "The contact invitation has been cancelled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.data?.message || "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!token) return;

    try {
      await removeContact({ contactId, token }).unwrap();
      toast({
        title: "Contact removed",
        description: "The contact has been removed from your contacts",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.data?.message || "Failed to remove contact",
        variant: "destructive",
      });
    }
  };

  const handleBlockContact = async (contactId: string, block: boolean) => {
    if (!token) return;

    try {
      await updateContactStatus({
        contactId,
        status: block ? "blocked" : "active",
        token,
      }).unwrap();

      toast({
        title: block ? "Contact blocked" : "Contact unblocked",
        description: `The contact has been ${block ? "blocked" : "unblocked"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.data?.message || `Failed to ${block ? "block" : "unblock"} contact`,
        variant: "destructive",
      });
    }
  };

  const copyInvitationLink = (invitationUrl?: string) => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      toast({
        title: "Link copied!",
        description: "Invitation link copied to clipboard",
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const EmptyState = ({ 
    icon: Icon, 
    title, 
    description, 
    action 
  }: { 
    icon: any; 
    title: string; 
    description: string; 
    action?: React.ReactNode;
  }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view your contacts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600">Manage your contacts and invitations</p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Search for users and send them a contact invitation.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              )}

              {searchResults && searchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant={
                        user.relationshipStatus === "active" ? "default" :
                        user.relationshipStatus === "pending_invitation" ? "secondary" :
                        user.relationshipStatus === "blocked" ? "destructive" : "outline"
                      }>
                        {user.relationshipStatus === "active" ? "Contact" :
                         user.relationshipStatus === "pending_invitation" ? "Pending" :
                         user.relationshipStatus === "blocked" ? "Blocked" : "None"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching "{searchQuery}"
                </div>
              )}

              {selectedUser && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(selectedUser.firstName, selectedUser.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Message (optional)
                    </label>
                    <Textarea
                      placeholder="Add a personal message to your invitation..."
                      value={invitationMessage}
                      onChange={(e) => setInvitationMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendInvitation}
                      disabled={sendingInvitation || selectedUser.relationshipStatus !== "none"}
                      className="flex-1"
                    >
                      {sendingInvitation ? "Sending..." : "Send Invitation"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(null);
                        setInvitationMessage("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Contacts
            {contactsData?.totalCount ? (
              <Badge variant="secondary" className="ml-1">
                {contactsData.totalCount}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Received
            {receivedInvitations?.totalCount ? (
              <Badge variant="destructive" className="ml-1">
                {receivedInvitations.totalCount}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Sent
            {sentInvitations?.totalCount ? (
              <Badge variant="secondary" className="ml-1">
                {sentInvitations.totalCount}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-6">
          {contactsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : contactsData?.contacts && contactsData.contacts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contactsData.contacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {getInitials(contact.otherUser.firstName, contact.otherUser.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {contact.otherUser.firstName} {contact.otherUser.lastName}
                          </CardTitle>
                          <CardDescription>{contact.otherUser.email}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={contact.status === "active" ? "default" : "destructive"}>
                        {contact.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBlockContact(contact.id, contact.status === "active")}
                      >
                        {contact.status === "active" ? (
                          <Ban className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No contacts yet"
              description="Start building your network by adding contacts. Search for people you know and send them invitations."
              action={
                <Button onClick={() => setShowInviteDialog(true)} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Your First Contact
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          {receivedLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : receivedInvitations?.invitations && receivedInvitations.invitations.length > 0 ? (
            <div className="space-y-4">
              {receivedInvitations.invitations.map((invitation) => (
                <Card key={invitation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {invitation.inviter ? getInitials(invitation.inviter.firstName, invitation.inviter.lastName) : "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {invitation.inviter?.firstName} {invitation.inviter?.lastName}
                          </CardTitle>
                          <CardDescription>{invitation.inviter?.email}</CardDescription>
                          <p className="text-sm text-gray-500 mt-1">
                            Invited {new Date(invitation.invitedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{invitation.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRespondToInvitation(invitation.id, "accept")}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRespondToInvitation(invitation.id, "decline")}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No pending invitations"
              description="You don't have any pending contact invitations at the moment."
            />
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {sentLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : sentInvitations?.invitations && sentInvitations.invitations.length > 0 ? (
            <div className="space-y-4">
              {sentInvitations.invitations.map((invitation) => (
                <Card key={invitation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {invitation.invitee ? getInitials(invitation.invitee.firstName, invitation.invitee.lastName) : "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {invitation.invitee?.firstName} {invitation.invitee?.lastName}
                          </CardTitle>
                          <CardDescription>{invitation.invitee?.email}</CardDescription>
                          <p className="text-sm text-gray-500 mt-1">
                            Sent {new Date(invitation.invitedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{invitation.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => copyInvitationLink(`${process.env.NEXT_PUBLIC_BASE_URL}/contacts/invitation/${invitation.invitationToken}`)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Mail}
              title="No sent invitations"
              description="You haven't sent any contact invitations yet."
              action={
                <Button onClick={() => setShowInviteDialog(true)} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Send Your First Invitation
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchLoading && (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            user.relationshipStatus === "active" ? "default" :
                            user.relationshipStatus === "pending_invitation" ? "secondary" :
                            user.relationshipStatus === "blocked" ? "destructive" : "outline"
                          }>
                            {user.relationshipStatus === "active" ? "Contact" :
                             user.relationshipStatus === "pending_invitation" ? "Pending" :
                             user.relationshipStatus === "blocked" ? "Blocked" : "None"}
                          </Badge>
                          {user.relationshipStatus === "none" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowInviteDialog(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <UserPlus className="h-4 w-4" />
                              Invite
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults && searchResults.length === 0 && (
              <EmptyState
                icon={Search}
                title="No users found"
                description={`No users found matching "${searchQuery}". Try a different search term.`}
              />
            )}

            {searchQuery.length < 2 && (
              <EmptyState
                icon={Search}
                title="Search for people"
                description="Enter at least 2 characters to search for users by name or email."
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactsPage;