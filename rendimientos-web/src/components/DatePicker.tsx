import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM format or YYYY-MM to YYYY-MM for range
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  mode?: 'single' | 'range'; // New prop to choose between single month or range
}

export function DatePicker({ value, onChange, placeholder = "YYYY-MM", className = "", disabled = false, mode = 'single' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const [year, month] = value.split('-');
      return new Date(parseInt(year), parseInt(month) - 1);
    }
    return new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (value && mode === 'single') {
      const [year, month] = value.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    return null;
  });

  // New state for range selection
  const [startDate, setStartDate] = useState<Date | null>(() => {
    if (value && mode === 'range' && value.includes(' to ')) {
      const [start] = value.split(' to ');
      const [year, month] = start.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    return null;
  });

  const [endDate, setEndDate] = useState<Date | null>(() => {
    if (value && mode === 'range' && value.includes(' to ')) {
      const [, end] = value.split(' to ');
      const [year, month] = end.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    return null;
  });

  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    if (mode === 'single') {
      setSelectedDate(date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const formattedDate = `${year}-${month}`;
      onChange(formattedDate);
      setIsOpen(false);
    } else if (mode === 'range') {
      // Range selection logic
      if (!tempStartDate || (tempStartDate && tempEndDate)) {
        // Start new selection
        setTempStartDate(date);
        setTempEndDate(null);
      } else if (tempStartDate && !tempEndDate) {
        // Complete the range
        if (date < tempStartDate) {
          // If selected date is before start date, swap them
          setTempEndDate(tempStartDate);
          setTempStartDate(date);
        } else {
          setTempEndDate(date);
        }
        
        // Apply the range
        const startYear = tempStartDate.getFullYear();
        const startMonth = String(tempStartDate.getMonth() + 1).padStart(2, '0');
        const endYear = date < tempStartDate ? tempStartDate.getFullYear() : date.getFullYear();
        const endMonth = String((date < tempStartDate ? tempStartDate.getMonth() : date.getMonth()) + 1).padStart(2, '0');
        
        const formattedRange = `${startYear}-${startMonth} to ${endYear}-${endMonth}`;
        onChange(formattedRange);
        
        setStartDate(tempStartDate);
        setEndDate(date < tempStartDate ? tempStartDate : date);
        setTempStartDate(null);
        setTempEndDate(null);
        setIsOpen(false);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    onChange(`${year}-${month}`);
    setIsOpen(false);
  };

  const goToThisMonth = () => {
    const today = new Date();
    setCurrentMonth(today);
    setTempStartDate(today);
    setTempEndDate(null);
  };

  const clearRange = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setStartDate(null);
    setEndDate(null);
    onChange('');
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="relative" ref={calendarRef}>
      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={mode === 'range' ? 'YYYY-MM to YYYY-MM' : placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${className}`}
      />
      
      {/* Calendar Icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatMonthYear(currentMonth)}
              </h3>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
              >
                Hoy
              </button>
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-8"></div>;
              }
              
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              
              let dayClasses = 'h-8 w-8 text-sm rounded-lg transition-colors ';
              let isInRange = false;
              let isRangeStart = false;
              let isRangeEnd = false;
              let isTempRangeStart = false;
              let isTempRangeEnd = false;
              
              if (mode === 'single') {
                const isSelected = selectedDate && 
                  day.getFullYear() === selectedDate.getFullYear() &&
                  day.getMonth() === selectedDate.getMonth() &&
                  day.getDate() === selectedDate.getDate();
                
                if (isSelected) {
                  dayClasses += 'bg-blue-600 text-white';
                } else if (isToday) {
                  dayClasses += 'bg-blue-100 text-blue-600 font-semibold';
                } else if (isCurrentMonth) {
                  dayClasses += 'text-gray-900 hover:bg-gray-100';
                } else {
                  dayClasses += 'text-gray-400 hover:bg-gray-50';
                }
              } else if (mode === 'range') {
                // Check if day is in the selected range
                if (startDate && endDate) {
                  isRangeStart = day.toDateString() === startDate.toDateString();
                  isRangeEnd = day.toDateString() === endDate.toDateString();
                  isInRange = day >= startDate && day <= endDate;
                }
                
                // Check if day is in the temporary range being selected
                if (tempStartDate) {
                  isTempRangeStart = day.toDateString() === tempStartDate.toDateString();
                  if (tempEndDate) {
                    isTempRangeEnd = day.toDateString() === tempEndDate.toDateString();
                    isInRange = day >= tempStartDate && day <= tempEndDate;
                  }
                }
                
                if (isRangeStart || isTempRangeStart) {
                  dayClasses += 'bg-blue-600 text-white rounded-l-lg';
                } else if (isRangeEnd || isTempRangeEnd) {
                  dayClasses += 'bg-blue-600 text-white rounded-r-lg';
                } else if (isInRange) {
                  dayClasses += 'bg-blue-200 text-blue-800';
                } else if (isToday) {
                  dayClasses += 'bg-blue-100 text-blue-600 font-semibold hover:bg-blue-200';
                } else if (isCurrentMonth) {
                  dayClasses += 'text-gray-900 hover:bg-gray-100';
                } else {
                  dayClasses += 'text-gray-400 hover:bg-gray-50';
                }
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day)}
                  className={dayClasses}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            {mode === 'single' ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const lastMonth = new Date(currentMonth);
                    lastMonth.setMonth(currentMonth.getMonth() - 1);
                    setCurrentMonth(lastMonth);
                    handleDateSelect(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1));
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Mes Anterior
                </button>
                <button
                  onClick={() => {
                    const nextMonth = new Date(currentMonth);
                    nextMonth.setMonth(currentMonth.getMonth() + 1);
                    setCurrentMonth(nextMonth);
                    handleDateSelect(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Mes Siguiente
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={goToThisMonth}
                    className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Mes Actual
                  </button>
                  <button
                    onClick={clearRange}
                    className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
                {tempStartDate && !tempEndDate && (
                  <div className="text-center text-sm text-gray-600 bg-green-50 p-2 rounded-lg">
                    Selecciona la fecha final para completar el rango
                  </div>
                )}
                {value && value.includes(' to ') && (
                  <div className="text-center text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                    Rango seleccionado: {value}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
