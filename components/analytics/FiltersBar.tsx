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
  interval: 'daily' | 'weekly' | 'monthly';
  onDateRangeChange: (dateRange: DateRange) => void;
  onIntervalChange: (interval: 'daily' | 'weekly' | 'monthly') => void;
}

const FiltersBar: React.FC<FiltersBarProps> = ({ 
  dateRange, 
  interval, 
  onDateRangeChange, 
  onIntervalChange 
}) => {
    const [selectedPeriod, setSelectedPeriod] = useState('30days')

    const periodOptions = [
        { value: '7days', label: 'Last 7 days' },
        { value: '30days', label: 'Last 30 days' },
        { value: '90days', label: 'Last 90 days' },
        { value: 'custom', label: 'Custom range' }
    ]

    const intervalOptions = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
    ]

    const handlePeriodChange = (value: string) => {
        setSelectedPeriod(value)
        const now = new Date()
        
        switch (value) {
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
        <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <Select
                        value={selectedPeriod}
                        onChange={handlePeriodChange}
                        options={periodOptions}
                        className="w-40"
                        placeholder="Select period"
                    />
                    
                    <Select
                        value={interval}
                        onChange={onIntervalChange}
                        options={intervalOptions}
                        className="w-32"
                        placeholder="Interval"
                    />
                    
                    {selectedPeriod === 'custom' && (
                        <RangePicker
                            value={dateRange.startDate && dateRange.endDate ? [
                                dayjs(dateRange.startDate as Date),
                                dayjs(dateRange.endDate as Date)
                            ] as [Dayjs, Dayjs] : undefined}
                            onChange={handleDateRangeChange}
                            format="MMM DD, YYYY"
                            className="w-64"
                        />
                    )}
                    
                    {selectedPeriod !== 'custom' && (
                        <div className="flex items-center text-sm text-gray-600">
                            {dateRange.startDate ? dayjs(dateRange.startDate as Date).format('MMM DD, YYYY') : ''} - 
                            {dateRange.endDate ? dayjs(dateRange.endDate as Date).format('MMM DD, YYYY') : ''}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

export default FiltersBar
