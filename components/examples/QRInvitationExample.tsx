"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, QrCode } from "lucide-react"
import AddContactModal from "@/components/chat/add-contact-modal"

/**
 * Example component showing how to integrate the QR Contact Invitation functionality
 * This can be placed anywhere in your app where you want users to be able to add contacts
 */
export default function QRInvitationExample() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div className="p-6">
            <div className="max-w-md mx-auto space-y-4">
                <h2 className="text-2xl font-bold text-center text-gray-800">Add Contacts</h2>
                
                <div className="space-y-3">
                    {/* Primary CTA - Opens enhanced modal with QR tab active */}
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                    >
                        <QrCode size={20} className="mr-2" />
                        Scan QR Code to Add Contact
                    </Button>

                    {/* Alternative CTA */}
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        variant="outline"
                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 h-12"
                    >
                        <UserPlus size={20} className="mr-2" />
                        Add Contact by Link or Search
                    </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Scan someone's profile QR code with your camera</li>
                        <li>• Or paste their profile link manually</li>
                        <li>• We'll send them a contact invitation instantly</li>
                        <li>• Once they accept, you'll be connected!</li>
                    </ul>
                </div>
            </div>

            {/* The enhanced Add Contact Modal */}
            <AddContactModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}