'use client'
import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
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
        <Card className="p-5 bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light transition-colors duration-300">
            <div className="space-y-4">
                {/* Title */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
                </div>

                {/* Filter Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Period Type */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block">Period Type</label>
                        <Select
                            value={selectedPeriod}
                            onChange={handlePeriodChange}
                            options={periodOptions}
                            className="w-full [&_.ant-select-selector]:dark:bg-darkBg-main [&_.ant-select-selector]:dark:border-darkBorder-light [&_.ant-select-selector]:dark:text-white"
                            size="large"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block">Date Range</label>
                        <RangePicker
                            value={dateRange.startDate && dateRange.endDate ? [
                                dayjs(dateRange.startDate as Date),
                                dayjs(dateRange.endDate as Date)
                            ] as [Dayjs, Dayjs] : undefined}
                            onChange={handleDateRangeChange}
                            format="MMM DD, YYYY"
                            className="w-full [&_.ant-picker]:dark:bg-darkBg-main [&_.ant-picker]:dark:border-darkBorder-light [&_.ant-picker-input]:dark:text-white"
                            size="large"
                            placeholder={['Start Date', 'End Date']}
                            allowClear={false}
                            inputReadOnly={false}
                        />
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default FiltersBar
