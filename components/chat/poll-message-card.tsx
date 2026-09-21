"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux-store";
import { BarChart3, Check, CircleSlash, Clock, EyeOff, Loader2, Users } from "lucide-react";
import {
    pollSlice,
    useClosePollMutation,
    useGetPollQuery,
    useVotePollMutation,
    type PollData,
} from "@/states/pollSlice";
import socketService from "@/services/socketService";
import { toast } from "@/hooks/use-toast";

/** What the chat message itself carries — enough to render before results arrive */
export interface PollMessageData {
    type: "poll";
    pollId: string;
    question: string;
    optionCount?: number;
    allowMultiple?: boolean;
    isAnonymous?: boolean;
    closesAt?: string | null;
    createdBy: string;
    createdByName: string;
    timestamp: string;
}

interface PollMessageCardProps {
    data: PollMessageData;
    isMe: boolean;
}

function fmtTime(ts: string) {
    return new Date(ts).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

/** "closes in 2h" / "closed" — deliberately coarse, it re-renders on the minute */
function closesLabel(closesAt?: string | null) {
    if (!closesAt) return null;
    const ms = new Date(closesAt).getTime() - Date.now();
    if (ms <= 0) return "closed";
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `closes in ${minutes}m`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `closes in ${hours}h`;
    return `closes in ${Math.round(hours / 24)}d`;
}

export const PollMessageCard: React.FC<PollMessageCardProps> = ({ data, isMe }) => {
    const dispatch = useDispatch<AppDispatch>();

    // Socket updates do the real work; the interval is the safety net for a dropped
    // event, and it stops once the poll can no longer change.
    const [pollingInterval, setPollingInterval] = useState(60000);
    const { data: response, isLoading, isError } = useGetPollQuery(
        { pollId: data.pollId },
        { pollingInterval }
    );
    const poll: PollData | undefined = response?.data;

    const [votePoll, { isLoading: voting }] = useVotePollMutation();
    const [closePoll, { isLoading: closing }] = useClosePollMutation();

    // Pending selection, used only for multi-answer polls where voting is confirmed
    const [pending, setPending] = useState<string[]>([]);
    // Re-render so the "closes in" countdown and the auto-close boundary stay honest
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!data.closesAt) return;
        const id = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(id);
    }, [data.closesAt]);

    // Live results: every vote broadcasts a payload built for this viewer
    useEffect(() => {
        const handlePollUpdated = (updated: PollData) => {
            if (updated?.id !== data.pollId) return;
            dispatch(
                pollSlice.util.updateQueryData("getPoll", { pollId: data.pollId }, draft => {
                    draft.data = updated;
                })
            );
        };

        socketService.onPollUpdated(handlePollUpdated);
        return () => socketService.offPollUpdated(handlePollUpdated);
    }, [data.pollId, dispatch]);

    const allowMultiple = poll?.allowMultiple ?? Boolean(data.allowMultiple);
    const isAnonymous = poll?.isAnonymous ?? Boolean(data.isAnonymous);
    const closesAt = poll?.closesAt ?? data.closesAt ?? null;
    const deadlinePassed = Boolean(closesAt && new Date(closesAt).getTime() <= Date.now());
    const isPollClosed = poll?.status === "closed" || deadlinePassed;

    const myVotes = useMemo(() => poll?.myVotes ?? [], [poll]);
    const hasVoted = myVotes.length > 0;
    // Results stay hidden until you've had your say, so the tally can't sway your vote
    const showResults = hasVoted || isPollClosed;

    // Keyed on the contents, not the array identity: a refetch triggered by someone
    // else's vote must not wipe a selection this person is still making.
    const myVotesKey = myVotes.join(",");
    useEffect(() => {
        setPending(myVotesKey ? myVotesKey.split(",") : []);
    }, [myVotesKey]);

    useEffect(() => {
        if (isPollClosed) setPollingInterval(0);
    }, [isPollClosed]);

    const maxVotes = Math.max(1, ...(poll?.options || []).map(option => option.voteCount));

    const submitVote = async (optionIds: string[]) => {
        if (optionIds.length === 0) return;
        try {
            await votePoll({ pollId: data.pollId, optionIds }).unwrap();
        } catch (err: any) {
            toast({
                title: "Vote not counted",
                description: err?.data?.message || "Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleOptionClick = (optionId: string) => {
        if (isPollClosed || voting) return;

        if (!allowMultiple) {
            if (myVotes[0] === optionId) return; // already your choice
            submitVote([optionId]);
            return;
        }

        setPending(prev =>
            prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
        );
    };

    const handleClose = async () => {
        try {
            await closePoll({ pollId: data.pollId }).unwrap();
            toast({ title: "Poll closed", description: "No further votes will be counted." });
        } catch (err: any) {
            toast({
                title: "Could not close the poll",
                description: err?.data?.message || "Please try again.",
                variant: "destructive",
            });
        }
    };

    const pendingDiffers =
        allowMultiple &&
        pending.length > 0 &&
        (pending.length !== myVotes.length || pending.some(id => !myVotes.includes(id)));

    const question = poll?.question || data.question;
    const options = poll?.options;
    const countdown = closesLabel(closesAt);

    return (
        <div
            className={`w-[280px] rounded-2xl overflow-hidden shadow-sm border bg-white dark:bg-darkBg-card ${
                isPollClosed
                    ? "border-gray-200 dark:border-gray-700"
                    : isMe
                        ? "border-brand-green/20 dark:border-brand-gold/20"
                        : "border-gray-100 dark:border-darkBorder-light"
            }`}
        >
            <div className={`h-1 w-full ${isPollClosed ? "bg-gray-400" : "bg-brand-green dark:bg-brand-gold"}`} />

            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <BarChart3 className="w-3.5 h-3.5 text-brand-green dark:text-brand-gold flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
                        {allowMultiple ? "Poll · multiple" : "Poll"}
                    </span>
                </div>
                {isPollClosed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 flex-shrink-0">
                        <CircleSlash className="w-2.5 h-2.5" /> Closed
                    </span>
                ) : countdown ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex-shrink-0">
                        <Clock className="w-2.5 h-2.5" /> {countdown}
                    </span>
                ) : null}
            </div>

            {/* Question */}
            <div className="px-3 pt-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white break-words">{question}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {poll?.createdByName || data.createdByName}
                    {isAnonymous && (
                        <span className="inline-flex items-center gap-1 ml-1.5 text-gray-400">
                            <EyeOff className="w-2.5 h-2.5" /> anonymous
                        </span>
                    )}
                </p>
            </div>

            {/* Options */}
            <div className="px-3 py-2 space-y-1.5">
                {isLoading && !options ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                ) : isError || !options ? (
                    <p className="text-[11px] text-center text-gray-400 py-4">
                        Results are unavailable right now.
                    </p>
                ) : (
                    options.map(option => {
                        const isMine = myVotes.includes(option.id);
                        const isPending = allowMultiple && pending.includes(option.id);
                        const share = poll!.voterCount > 0
                            ? Math.round((option.voteCount / poll!.voterCount) * 100)
                            : 0;
                        const leading = showResults && option.voteCount === maxVotes && option.voteCount > 0;

                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleOptionClick(option.id)}
                                disabled={isPollClosed || voting}
                                className={`relative w-full overflow-hidden rounded-lg border px-2.5 py-2 text-left transition-colors ${
                                    isMine || isPending
                                        ? "border-brand-green dark:border-brand-gold"
                                        : "border-gray-200 dark:border-darkBorder-light"
                                } ${isPollClosed ? "cursor-default" : "hover:border-gray-300 dark:hover:border-gray-600"}`}
                            >
                                {/* Result bar sits behind the label */}
                                {showResults && (
                                    <span
                                        aria-hidden
                                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                                            leading
                                                ? "bg-brand-green/15 dark:bg-brand-gold/15"
                                                : "bg-gray-100 dark:bg-white/5"
                                        }`}
                                        style={{ width: `${share}%` }}
                                    />
                                )}

                                <span className="relative flex items-center gap-2">
                                    <span
                                        className={`w-4 h-4 flex-shrink-0 flex items-center justify-center border transition-colors ${
                                            allowMultiple ? "rounded" : "rounded-full"
                                        } ${
                                            isMine || isPending
                                                ? "bg-brand-green dark:bg-brand-gold border-brand-green dark:border-brand-gold"
                                                : "border-gray-300 dark:border-gray-600"
                                        }`}
                                    >
                                        {(isMine || isPending) && (
                                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                        )}
                                    </span>

                                    <span className="flex-1 min-w-0 text-xs font-medium text-gray-800 dark:text-gray-100 break-words">
                                        {option.text}
                                    </span>

                                    {showResults && (
                                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                                            {share}%
                                        </span>
                                    )}
                                </span>

                                {/* Who picked this — only on named polls, once results are visible */}
                                {showResults && !isAnonymous && option.voters.length > 0 && (
                                    <span className="relative block pl-6 pt-0.5 text-[10px] text-gray-400 truncate">
                                        {option.voters.slice(0, 3).map(voter => voter.name).join(", ")}
                                        {option.voters.length > 3 && ` +${option.voters.length - 3}`}
                                    </span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

            {/* Confirm bar for multi-answer polls */}
            {allowMultiple && !isPollClosed && pendingDiffers && (
                <div className="px-3 pb-2">
                    <button
                        type="button"
                        onClick={() => submitVote(pending)}
                        disabled={voting}
                        className="w-full h-8 rounded-lg bg-brand-green dark:bg-brand-gold hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity"
                    >
                        {voting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        {hasVoted ? "Update vote" : `Vote (${pending.length})`}
                    </button>
                </div>
            )}

            {/* Footer */}
            <div className="px-3 pb-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                        <Users className="w-2.5 h-2.5" />
                        {poll
                            ? poll.voterCount === 0
                                ? "No votes yet"
                                : `${poll.voterCount} ${poll.voterCount === 1 ? "vote" : "votes"}`
                            : " "}
                        {!showResults && poll && poll.voterCount > 0 && " · vote to see results"}
                    </span>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600 flex-shrink-0">
                        {fmtTime(data.timestamp)}
                    </span>
                </div>

                {poll?.canClose && !isPollClosed && (
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={closing}
                        className="w-full h-7 rounded-lg border border-gray-200 dark:border-darkBorder-light text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/40 disabled:opacity-40 transition-colors"
                    >
                        {closing ? "Closing..." : "Close poll"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PollMessageCard;
