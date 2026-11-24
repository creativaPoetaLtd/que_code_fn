'use client'
import React, { useState, useEffect } from 'react'
import { Select, DatePicker } from 'antd'
import { CalendarIcon } from 'lucide-react'
import dayjs, { Dayjs } from 'dayjs'
import { DateRange } from '@/types/analytics.types'

const { RangePicker } = DatePicker

interface FiltersBarProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
}

const FiltersBar: React.FC<FiltersBarProps> = ({ 
  dateRange, 
  onDateRangeChange
}) => {
    const [selectedPeriod, setSelectedPeriod] = useState('30days')
    
    const periodOptions = [
        { value: 'today', label: 'Today' },
        { value: '7days', label: 'This Week' },
        { value: '30days', label: 'This Month' },
        { value: '90days', label: 'Last 90 days' }
    ]

    const handlePeriodChange = (value: string) => {
        setSelectedPeriod(value)
        const now = new Date()
        
        switch (value) {
            case 'today':
                onDateRangeChange({
                    startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    endDate: now
                })
                break
            case '7days':
                onDateRangeChange({
                    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    endDate: now
                })
                break
            case '30days':
                onDateRangeChange({
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    endDate: now
                })
                break
            case '90days':
                onDateRangeChange({
                    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                    endDate: now
                })
                break
            default:
                break
        }
    }

    const handleDateRangeChange = (dates: any) => {
        if (dates && dates.length === 2) {
            onDateRangeChange({
                startDate: dates[0].toDate(),
                endDate: dates[1].toDate()
            })
        }
    }

    return (
        <div className="flex items-center gap-2">
            {/* Period Type */}
            <Select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                options={periodOptions}
                aria-label="Period"
                className="w-32 shrink-0 [&_.ant-select-selector]:dark:bg-darkBg-main [&_.ant-select-selector]:dark:border-darkBorder-light [&_.ant-select-selector]:dark:text-white"
            />

            {/* Date Range */}
            <RangePicker
                value={dateRange.startDate && dateRange.endDate ? [
                    dayjs(dateRange.startDate as Date),
                    dayjs(dateRange.endDate as Date)
                ] as [Dayjs, Dayjs] : undefined}
                onChange={handleDateRangeChange}
                format="MMM DD, YYYY"
                aria-label="Date range"
                className="flex-1 sm:flex-none sm:w-72 min-w-0 [&_.ant-picker]:dark:bg-darkBg-main [&_.ant-picker]:dark:border-darkBorder-light [&_.ant-picker-input]:dark:text-white"
                placeholder={['Start Date', 'End Date']}
                allowClear={false}
                inputReadOnly={false}
            />
        </div>
    )
}

export default FiltersBar
