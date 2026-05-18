"use client"

import { useState, useRef, useEffect } from "react"
import { Download, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDuration, formatFileSize, getFileIcon } from "@/services/mediaService"
import type { MediaData } from "@/types/chat.types"

interface MediaMessageContentProps extends MediaData {
    content: string
}

export default function MediaMessageContent({
    content,
    mediaUrl,
    mediaType,
    thumbnailUrl,
    fileName,
    fileSize,
    duration,
    mimeType
}: MediaMessageContentProps) {
    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    // Image rendering
    if (mediaType === 'image' && mediaUrl) {
        return (
            <div className="space-y-2">
                <div className="relative group rounded-lg overflow-hidden max-w-sm">
                    <img
                        src={mediaUrl}
                        alt={fileName || "Image"}
                        className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(mediaUrl, '_blank')}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(mediaUrl, fileName || 'image.jpg');
                            }}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                {content && content !== `Sent a ${mediaType}` && (
                    <p className="text-sm">{content}</p>
                )}
            </div>
        )
    }

    // Video rendering
    if (mediaType === 'video' && mediaUrl) {
        return (
            <div className="space-y-2">
                <div className="relative group rounded-lg overflow-hidden max-w-sm">
                    <video
                        src={mediaUrl}
                        controls
                        poster={thumbnailUrl}
                        className="w-full h-auto"
                        preload="metadata"
                    >
                        Your browser does not support the video tag.
                    </video>
                    <div className="absolute top-2 right-2">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(mediaUrl, fileName || 'video.mp4');
                            }}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                {content && content !== `Sent a ${mediaType}` && (
                    <p className="text-sm">{content}</p>
                )}
                {duration && (
                    <p className="text-xs opacity-70">Duration: {formatDuration(duration)}</p>
                )}
            </div>
        )
    }

    // Audio rendering
    if (mediaType === 'audio' && mediaUrl) {
        return (
            <AudioPlayer 
                mediaUrl={mediaUrl} 
                duration={duration} 
                content={content} 
                mediaType={mediaType}
                fileName={fileName}
                onDownload={() => handleDownload(mediaUrl, fileName || 'audio.mp3')}
            />
        )
    }

    // Document rendering
    if (mediaType === 'document' && mediaUrl) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-white/10 rounded-lg max-w-sm">
                    <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-3xl flex-shrink-0"
                    >{getFileIcon(fileName || '')}</a>
                    <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    >
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{fileName || 'Document'}</p>
                        {fileSize && (
                            <p className="text-xs text-gray-500 dark:text-gray-300">{formatFileSize(fileSize)}</p>
                        )}
                    </a>
                    <button
                        onClick={() => handleDownload(mediaUrl, fileName || 'document')}
                        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                        title="Download"
                    >
                        <Download className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                {content && content !== `Sent a ${mediaType}` && (
                    <p className="text-sm">{content}</p>
                )}
            </div>
        )
    }

    // Fallback for unsupported or file type
    if (mediaUrl) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-white/10 rounded-lg max-w-sm">
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-3xl flex-shrink-0">📎</a>
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{fileName || 'File'}</p>
                        {fileSize && (
                            <p className="text-xs text-gray-500 dark:text-gray-300">{formatFileSize(fileSize)}</p>
                        )}
                    </a>
                    <button
                        onClick={() => handleDownload(mediaUrl, fileName || 'file')}
                        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                        title="Download"
                    >
                        <Download className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                {content && (
                    <p className="text-sm">{content}</p>
                )}
            </div>
        )
    }

    // Default text content
    return <p>{content}</p>
}

// Audio Player Component
function AudioPlayer({
    mediaUrl,
    duration,
    content,
    mediaType,
    fileName,
    onDownload
}: {
    mediaUrl: string
    duration?: number
    content: string
    mediaType?: string
    fileName?: string
    onDownload?: () => void
}) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [totalDuration, setTotalDuration] = useState(duration || 0)
    const [isMuted, setIsMuted] = useState(false)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setTotalDuration(audio.duration)
        const handleEnded = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const toggleMute = () => {
        const audio = audioRef.current
        if (!audio) return
        audio.muted = !isMuted
        setIsMuted(!isMuted)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current
        if (!audio) return
        const time = parseFloat(e.target.value)
        audio.currentTime = time
        setCurrentTime(time)
    }

    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg max-w-sm">
                <audio ref={audioRef} src={mediaUrl} preload="metadata" />
                
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={togglePlay}
                    className="h-10 w-10 flex-shrink-0"
                >
                    {isPlaying ? (
                        <Pause className="h-5 w-5" />
                    ) : (
                        <Play className="h-5 w-5" />
                    )}
                </Button>

                <div className="flex-1 space-y-1">
                    <input
                        type="range"
                        min="0"
                        max={totalDuration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #00B512 0%, #00B512 ${progress}%, #d1d5db ${progress}%, #d1d5db 100%)`
                        }}
                    />
                    <div className="flex justify-between text-xs opacity-70">
                        <span>{formatDuration(currentTime)}</span>
                        <span>{formatDuration(totalDuration)}</span>
                    </div>
                </div>

                <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleMute}
                    className="h-8 w-8 flex-shrink-0"
                >
                    {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                    ) : (
                        <Volume2 className="h-4 w-4" />
                    )}
                </Button>

                {onDownload && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onDownload}
                        className="h-8 w-8 flex-shrink-0"
                        title="Download audio"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {content && content !== `Sent a ${mediaType}` && (
                <p className="text-sm">{content}</p>
            )}
        </div>
    )
}
