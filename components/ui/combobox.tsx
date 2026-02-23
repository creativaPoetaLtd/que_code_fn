"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { UserAvatar } from "@/components/UserAvatar"

interface ComboboxProps {
    options: {
        value: string;
        label: string;
        profileImage?: string;
    }[];
    value?: string;
    onSelect: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
}

export function Combobox({
    options,
    value,
    onSelect,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)

    const selectedOption = options.find((option) => option.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    {selectedOption ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <UserAvatar
                                profileImage={selectedOption.profileImage}
                                firstName={selectedOption.label.split(' ')[0]}
                                lastName={selectedOption.label.split(' ')[1] || ''}
                                className="w-5 h-5"
                            />
                            <span className="truncate">{selectedOption.label}</span>
                        </div>
                    ) : (
                        placeholder
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                    style={{ pointerEvents: 'auto' }}
                                    onSelect={() => {
                                        // Toggle selection: if already selected, clear it; otherwise select it
                                        const newValue = value === option.value ? "" : option.value
                                        onSelect(newValue)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex items-center gap-2 overflow-hidden" style={{ pointerEvents: 'none' }}>
                                        <UserAvatar
                                            profileImage={option.profileImage}
                                            firstName={option.label.split(' ')[0]}
                                            lastName={option.label.split(' ')[1] || ''}
                                            className="w-5 h-5"
                                        />
                                        <span className="truncate">{option.label}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
