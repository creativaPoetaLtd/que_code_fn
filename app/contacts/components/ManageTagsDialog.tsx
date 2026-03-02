import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { Contact, useManageContactTagsMutation } from "@/states/contactSlice";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useToast } from "@/hooks/use-toast";

interface ManageTagsDialogProps {
    contact: Contact | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageTagsDialog({ contact, open, onOpenChange }: ManageTagsDialogProps) {
    const authHook = useAuthToken();
    const token = authHook.getToken();
    const [manageTags, { isLoading }] = useManageContactTagsMutation();
    const { toast } = useToast();

    const [newTag, setNewTag] = useState("");

    if (!contact) return null;

    const currentTags = contact.tags || [];

    const handleAddTag = async () => {
        if (!newTag.trim()) return;
        if (currentTags.includes(newTag.trim())) {
            toast({
                title: "Error",
                description: "Tag already exists",
                variant: "destructive",
            });
            return;
        }

        try {
            await manageTags({
                contactId: contact.id,
                tags: [newTag.trim()],
                action: "add",
                token: token || "",
            }).unwrap();
            setNewTag("");
            toast({
                title: "Success",
                description: "Tag added successfully",
            });
        } catch (error) {
            console.error("Failed to add tag", error);
            toast({
                title: "Error",
                description: "Failed to add tag",
                variant: "destructive",
            });
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        try {
            await manageTags({
                contactId: contact.id,
                tags: [tagToRemove],
                action: "remove",
                token: token || "",
            }).unwrap();
            toast({
                title: "Success",
                description: "Tag removed successfully",
            });
        } catch (error) {
            console.error("Failed to remove tag", error);
            toast({
                title: "Error",
                description: "Failed to remove tag",
                variant: "destructive",
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Tags</DialogTitle>
                    <DialogDescription>
                        Add or remove tags for {contact.otherUser.firstName} {contact.otherUser.lastName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Add a new tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1"
                        />
                        <Button onClick={handleAddTag} disabled={!newTag.trim() || isLoading} size="icon">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-muted/50 rounded-lg border border-border">
                        {currentTags.length > 0 ? (
                            currentTags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80">
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                                        disabled={isLoading}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground w-full text-center flex items-center justify-center">
                                No tags yet
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
