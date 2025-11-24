"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Input from "../ui/Input-ant"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { UserPlus, Search, User, Mail, Phone, QrCode, Link, Loader2, CheckCircle, Camera, Scan } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import QRCodeScanner from "./qr-code-scanner"
import { useSendContactInvitationByPublicIdMutation } from "@/states/contactSlice"
import { useAuthToken } from "@/hooks/use-auth-token"
import { extractPublicIdFromLink, validatePublicId } from "@/utils/profile-link"

interface AddContactModalProps {
    isOpen: boolean
    onClose: () => void
}

interface ContactSearchResult {
    id: number
    name: string
    email: string
    phone: string
}

export default function AddContactModal({ isOpen, onClose }: AddContactModalProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [profileLink, setProfileLink] = useState<string>("")
    const [name, setName] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [phone, setPhone] = useState<string>("")
    const [step, setStep] = useState<number>(1)
    const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([])
    const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false)
    const [extractedPublicId, setExtractedPublicId] = useState<string>("")
    const [activeTab, setActiveTab] = useState<string>("qr")
    const [qrStep, setQrStep] = useState<"input" | "scanning" | "success">("input")
    const [inviteeName, setInviteeName] = useState<string>("")

    // Redux hooks
    const [sendInvitationByPublicId, { isLoading: isInviting }] = useSendContactInvitationByPublicIdMutation()
    const { getToken } = useAuthToken()
    const token = getToken();

    // Mock search function (you can replace this with actual search API)
    const handleSearch = () => {
        if (searchTerm.length < 3) {
            toast({
                title: "Error",
                description: "Please enter at least 3 characters to search",
                variant: "destructive",
            })
            return
        }
        // Simulate search results
        setSearchResults([
            { id: 101, name: "John Smith", email: "john.smith@example.com", phone: "+1 555-123-4567" },
            { id: 102, name: "Jane Doe", email: "jane.doe@example.com", phone: "+1 555-987-6543" },
        ])
    }

    const handleProfileLinkSubmit = () => {
        if (!profileLink.trim()) {
            toast({
                title: "Error",
                description: "Please enter a profile link or public ID",
                variant: "destructive",
            })
            return
        }

        const publicId = extractPublicIdFromLink(profileLink.trim())

        if (!publicId || !validatePublicId(publicId)) {
            toast({
                title: "Invalid Link",
                description: "Please enter a valid profile link or public ID",
                variant: "destructive",
            })
            return
        }

        setExtractedPublicId(publicId)
        handleInviteByPublicId(publicId)
    }

    const handleInviteByPublicId = async (publicId: string) => {
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "Please log in to send invitations",
                variant: "destructive",
            })
            return
        }

        try {
            setQrStep("scanning")
            
            const result = await sendInvitationByPublicId({
                publicId,
                token,
            }).unwrap()

            setInviteeName(result.data.inviteeName)
            setQrStep("success")

            toast({
                title: "Invitation Sent",
                description: `Invitation sent successfully to ${result.data.inviteeName}`,
            })

            // Auto close after 3 seconds
            setTimeout(() => {
                handleClose()
            }, 3000)
        } catch (error: any) {
            setQrStep("input")

            const errorMessage = error?.data?.message || error?.message || "Failed to send invitation"

            toast({
                title: "Invitation Failed",
                description: errorMessage,
                variant: "destructive",
            })
        }
    }

    const selectContact = (contact: ContactSearchResult) => {
        setName(contact.name)
        setEmail(contact.email)
        setPhone(contact.phone)
        setStep(2)
    }

    const handleAddManually = () => {
        setName("")
        setEmail("")
        setPhone("")
        setStep(2)
    }

    const handleSubmit = () => {
        if (!name || (!email && !phone)) {
            toast({
                title: "Error",
                description: "Please provide at least a name and either an email or phone number",
                variant: "destructive",
            })
            return
        }

        // For manual entry, you might want to implement a different endpoint
        // or handle this differently based on your backend requirements
        toast({
            title: "Manual Entry",
            description: "Manual contact entry is not yet implemented. Please use profile links or QR codes.",
            variant: "destructive",
        })
    }

    const handleClose = () => {
        // Reset state when closing
        setSearchTerm("")
        setProfileLink("")
        setName("")
        setEmail("")
        setPhone("")
        setStep(1)
        setSearchResults([])
        setExtractedPublicId("")
        setActiveTab("qr")
        setQrStep("input")
        setInviteeName("")
        onClose()
    }

    const handleScanComplete = (result: string) => {
        setIsQRScannerOpen(false)

        // The QR code should contain a profile link
        const publicId = extractPublicIdFromLink(result)

        if (!publicId || !validatePublicId(publicId)) {
            toast({
                title: "Invalid QR Code",
                description: "The scanned QR code does not contain a valid profile link",
                variant: "destructive",
            })
            return
        }

        setExtractedPublicId(publicId)
        setProfileLink(result)

        // Automatically send invitation
        handleInviteByPublicId(publicId)
    }

    return (
      <>
        <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <div className='flex items-center'>
                <div className='bg-green-100 p-2 rounded-full mr-3'>
                  <UserPlus size={20} className='text-[#00B512]' />
                </div>
                <DialogTitle>Add Contact</DialogTitle>
              </div>
            </DialogHeader>

            <div className='py-4'>
              {/* Profile Link Input Section */}
              <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <div className='flex items-center'>
                    <Link size={16} className='mr-2' />
                    <span>Profile Link or Public ID</span>
                  </div>
                </label>
                <div className='space-y-2'>
                  <Input
                    placeholder='Enter profile link or public ID (e.g., http://localhost:3000/welcome/41317198-27e2-4c65-bbd8-97a92b6b665c)'
                    value={profileLink}
                    onChange={e => setProfileLink(e.target.value)}
                    onKeyDown={e =>
                      e.key === 'Enter' && handleProfileLinkSubmit()
                    }
                  />
                  <Button
                    onClick={handleProfileLinkSubmit}
                    disabled={isInviting || !profileLink.trim()}
                    className='w-full bg-[#00B512] text-white'
                  >
                    {isInviting ? (
                      <>
                        <Loader2 size={16} className='mr-2 animate-spin' />
                        Sending Invitation...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </Button>
                </div>
                {extractedPublicId && (
                  <p className='text-xs text-green-600 mt-1'>
                    Extracted Public ID: {extractedPublicId}
                  </p>
                )}
              </div>

              <Separator className='my-4' />

              {/* QR Code Scanner Section */}
              <div className='text-center mb-6'>
                <p className='text-sm text-gray-500 mb-3'>Or scan a QR code</p>
                <Button
                  onClick={() => setIsQRScannerOpen(true)}
                  variant='outline'
                  disabled={isInviting}
                >
                  <QrCode size={16} className='mr-2' />
                  Scan QR Code
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={handleClose}
                disabled={isInviting}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Scanner Modal */}
        <QRCodeScanner
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanComplete={handleScanComplete}
          title='Scan Contact QR Code'
        />
      </>
    );
}
