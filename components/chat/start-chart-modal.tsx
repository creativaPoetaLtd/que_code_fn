"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, MessageCircle, Users, Loader2, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useGetAcceptedContactsQuery } from "@/states/contactSlice"
import { useAuthToken } from "@/hooks/use-auth-token"
import type { Conversation } from "@/types/chat.types"

interface StartChatModalProps {
  isOpen: boolean
  onClose: () => void
  onStartChat: (contact: any) => void
  existingConversations: Conversation[]
}

export default function StartChatModal({ isOpen, onClose, onStartChat, existingConversations }: StartChatModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { getToken } = useAuthToken()
  const token = getToken()

  const {
    data: acceptedContacts,
    isLoading,
    error,
    refetch,
  } = useGetAcceptedContactsQuery(token as string, {
    skip: !token,
  })
  const contacts = acceptedContacts?.contacts || []

  // Filter out contacts that already have conversations
  const availableContacts = contacts.filter((contact: any) => {
    const contactName = `${contact.otherUser.firstName} ${contact.otherUser.lastName}`
    return !existingConversations.some((conv) => !conv.isGroup && conv.name === contactName)
  })

  // Filter contacts based on search term
  const filteredContacts = availableContacts.filter((contact: any) => {
    const fullName = `${contact.otherUser.firstName} ${contact.otherUser.lastName}`.toLowerCase()
    const email = contact.otherUser.email.toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || email.includes(search)
  })

  const handleStartChat = (contact: any) => {
    onStartChat(contact)
    onClose()
    setSearchTerm("")
    toast({
      title: "Chat Started",
      description: `Started a new conversation with ${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
    })
  }

  const handleClose = () => {
    onClose()
    setSearchTerm("")
  }

  if (!token) {
    return (
      <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <MessageCircle size={20} className='text-brand-green dark:text-brand-gold' />
              Start New Chat
            </DialogTitle>
          </DialogHeader>
          <div className='py-8 text-center'>
            <AlertCircle size={40} className='mx-auto mb-2 text-gray-400' />
            <p className='text-gray-500'>
              Please log in to start new chats
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className='sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-gray-900 dark:text-white text-xl font-semibold'>
            <MessageCircle size={20} className='text-brand-green dark:text-brand-gold' />
            Start New Chat
            {availableContacts.length > 0 && (
              <span className='ml-2 text-sm font-normal text-gray-500 dark:text-gray-400'>
                ({availableContacts.length} contacts)
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
            Choose a contact to start a new conversation
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-hidden flex flex-col'>
          {/* Search Bar */}
          <div className='relative mb-4'>
            <Search
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
              size={16}
            />
            <Input
              placeholder='Search contacts...'
              className='pl-10'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Contacts List */}
          <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
              <div className='text-center py-8'>
                <Loader2
                  size={40}
                  className='mx-auto mb-2 animate-spin text-gray-400'
                />
                <p className='text-gray-500'>Loading contacts...</p>
              </div>
            ) : error ? (
              <div className='text-center py-8'>
                <AlertCircle
                  size={40}
                  className='mx-auto mb-2 text-red-400'
                />
                <p className='text-red-500 mb-2'>Failed to load contacts</p>
                <Button onClick={() => refetch()} variant='outline' size='sm'>
                  Retry
                </Button>
              </div>
            ) : filteredContacts.length > 0 ? (
              <div className='space-y-2'>
                {filteredContacts.map((contact: any) => (
                  <div
                    key={contact.id}
                    className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group'
                    onClick={() => handleStartChat(contact)}
                  >
                    <div className='flex items-center flex-1'>
                      <Avatar className='h-12 w-12 mr-3'>
                        <AvatarImage
                          src={`/placeholder.svg?height=48&width=48`}
                          alt={`${contact.otherUser.firstName} ${contact.otherUser.lastName}`}
                        />
                        <AvatarFallback className='bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold'>
                          {contact.otherUser.firstName?.charAt(0)}
                          {contact.otherUser.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1'>
                        <p className='font-medium text-gray-900'>
                          {contact.otherUser.firstName}{' '}
                          {contact.otherUser.lastName}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {contact.otherUser.email}
                        </p>
                        <p className='text-xs text-gray-400'>
                          Connected{' '}
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={e => {
                        e.stopPropagation();
                        handleStartChat(contact);
                      }}
                    >
                      <MessageCircle size={16} className='mr-2' />
                      Chat
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className='text-center py-8'>
                <Search size={40} className='mx-auto mb-2 text-gray-400' />
                <p className='text-gray-500'>
                  No contacts found matching "{searchTerm}"
                </p>
              </div>
            ) : availableContacts.length === 0 ? (
              <div className='text-center py-8'>
                <Users size={40} className='mx-auto mb-2 text-gray-400' />
                <p className='text-gray-500 mb-2'>
                  No available contacts to chat with
                </p>
                <p className='text-sm text-gray-400 mb-4'>
                  All your contacts already have active conversations
                </p>
              </div>
            ) : (
              <div className='text-center py-8'>
                <Users size={40} className='mx-auto mb-2 text-gray-400' />
                <p className='text-gray-500'>No contacts available</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
