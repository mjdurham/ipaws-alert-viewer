'use client';

import React from 'react';
import { Stack } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface DateRangeSelectorProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ startDate, endDate, onDateChange }) => {
  const minDate = new Date("2012-06-01"); // Start of data set
  const maxDate = new Date(); // Today
  
  const handleStartChange = (newValue: Date | null) => {
    if (newValue) {
      onDateChange(newValue, endDate);
    }
  };
  
  const handleEndChange = (newValue: Date | null) => {
    if (newValue) {
      onDateChange(startDate, newValue);
    }
  };
  
  return (
    <Stack direction="row" spacing={2}>
      <DatePicker
        label="Start Date"
        value={startDate}
        onChange={handleStartChange}
        minDate={minDate}
        maxDate={endDate} // Can't be after end date
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true
          }
        }}
      />
      <DatePicker
        label="End Date"
        value={endDate}
        onChange={handleEndChange}
        minDate={startDate} // Can't be before start date
        maxDate={maxDate}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true
          }
        }}
      />
    </Stack>
  );
};

export default DateRangeSelector;