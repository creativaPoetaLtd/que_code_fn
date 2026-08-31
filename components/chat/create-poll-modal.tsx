'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2, Plus, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useCreatePollMutation } from '@/states/pollSlice';
import type { Conversation } from '@/types/chat.types';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;
const MAX_QUESTION_LENGTH = 300;
const MAX_OPTION_LENGTH = 120;

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation | null;
}

/** Local datetime string for <input type="datetime-local"> min attribute */
const localNow = () => {
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return now.toISOString().slice(0, 16);
};

export default function CreatePollModal({ isOpen, onClose, conversation }: CreatePollModalProps) {
    const [createPoll, { isLoading: submitting }] = useCreatePollMutation();

    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [closesAt, setClosesAt] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setQuestion('');
        setOptions(['', '']);
        setAllowMultiple(false);
        setIsAnonymous(false);
        setClosesAt('');
    }, [isOpen]);

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const setOption = (index: number, value: string) =>
        setOptions(prev => prev.map((option, i) => (i === index ? value : option)));

    const addOption = () =>
        setOptions(prev => (prev.length >= MAX_OPTIONS ? prev : [...prev, '']));

    const removeOption = (index: number) =>
        setOptions(prev => (prev.length <= MIN_OPTIONS ? prev : prev.filter((_, i) => i !== index)));

    const filledOptions = options.map(option => option.trim()).filter(Boolean);
    const hasDuplicates =
        new Set(filledOptions.map(option => option.toLowerCase())).size !== filledOptions.length;
    const canSubmit =
        Boolean(question.trim()) && filledOptions.length >= MIN_OPTIONS && !hasDuplicates;

    const handleSubmit = async () => {
        if (!conversation?.id || !canSubmit) return;

        try {
            await createPoll({
                chatId: conversation.id,
                question: question.trim(),
                options: filledOptions,
                allowMultiple,
                isAnonymous,
                closesAt: closesAt ? new Date(closesAt).toISOString() : null,
            }).unwrap();

            toast({ title: 'Poll started', description: question.trim() });
            onClose();
        } catch (err: any) {
            toast({
                title: 'Could not start the poll',
                description: err?.data?.message || 'Please try again.',
                variant: 'destructive',
            });
        }
    };

    const toggleClass = (active: boolean) =>
        `flex-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            active
                ? 'border-brand-green dark:border-brand-gold bg-brand-green/5 dark:bg-brand-gold/5'
                : 'border-gray-200 dark:border-darkBorder-light hover:border-gray-300 dark:hover:border-gray-600'
        }`;

    return (
        <Dialog open={isOpen} onOpenChange={next => { if (!next) handleClose(); }}>
            <DialogContent className="bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-2xl w-[calc(100vw-2rem)] max-w-md p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                        <p className="font-bold text-gray-900 dark:text-white text-sm">New poll</p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                        Ask {conversation?.isGroup ? conversation.name || 'the group' : conversation?.name || 'them'} a question
                    </p>
                </div>

                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Question */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Question
                        </label>
                        <textarea
                            value={question}
                            onChange={e => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
                            placeholder="What should we decide?"
                            rows={2}
                            autoFocus
                            className="w-full resize-none px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-brand-green dark:focus:border-brand-gold transition-colors"
                        />
                        <p className="text-[10px] text-gray-400 text-right">
                            {question.length}/{MAX_QUESTION_LENGTH}
                        </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Options
                        </label>
                        <div className="space-y-2">
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="w-5 text-center text-xs font-semibold text-gray-400 flex-shrink-0">
                                        {index + 1}
                                    </span>
                                    <input
                                        value={option}
                                        onChange={e => setOption(index, e.target.value.slice(0, MAX_OPTION_LENGTH))}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && index === options.length - 1) {
                                                e.preventDefault();
                                                addOption();
                                            }
                                        }}
                                        placeholder={`Option ${index + 1}`}
                                        className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-brand-green dark:focus:border-brand-gold transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        disabled={options.length <= MIN_OPTIONS}
                                        aria-label={`Remove option ${index + 1}`}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors flex-shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {options.length < MAX_OPTIONS && (
                            <button
                                type="button"
                                onClick={addOption}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green dark:text-brand-gold hover:opacity-80 transition-opacity pt-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add option
                            </button>
                        )}
                        {hasDuplicates && (
                            <p className="text-[11px] text-red-500">Options must be different from each other.</p>
                        )}
                    </div>

                    {/* Settings */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setAllowMultiple(v => !v)}
                            className={toggleClass(allowMultiple)}
                        >
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Multiple answers</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                {allowMultiple ? 'Pick as many as they like' : 'One choice each'}
                            </p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAnonymous(v => !v)}
                            className={toggleClass(isAnonymous)}
                        >
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Anonymous</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                {isAnonymous ? 'Names stay hidden' : 'Names are visible'}
                            </p>
                        </button>
                    </div>

                    {/* Deadline */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Closes at <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="datetime-local"
                                value={closesAt}
                                min={localNow()}
                                onChange={e => setClosesAt(e.target.value)}
                                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm text-gray-900 dark:text-white outline-none focus:border-brand-green dark:focus:border-brand-gold transition-colors"
                            />
                            {closesAt && (
                                <button
                                    type="button"
                                    onClick={() => setClosesAt('')}
                                    className="px-3 rounded-xl bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-darkBorder-light transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-darkBg-interactive disabled:opacity-40 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit || submitting}
                            className="flex-1 py-2.5 rounded-xl bg-brand-green dark:bg-brand-gold hover:opacity-90 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                            {submitting ? 'Starting...' : 'Start poll'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
