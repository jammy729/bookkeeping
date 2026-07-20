import { useState, useMemo } from 'react';

export function useDateRange() {
  const now = new Date();
  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [fromMonth, setFromMonth] = useState(0);
  const [toYear, setToYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(0);

  const dateRange = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (fromMonth === 0) {
      startDate = new Date(fromYear, 0, 1);
    } else {
      startDate = new Date(fromYear, fromMonth - 1, 1);
    }

    if (toMonth === 0) {
      endDate = new Date(toYear, 11, 31);
    } else {
      endDate = new Date(toYear, toMonth, 0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, [fromYear, fromMonth, toYear, toMonth]);

  return {
    fromYear,
    setFromYear,
    fromMonth,
    setFromMonth,
    toYear,
    setToYear,
    toMonth,
    setToMonth,
    dateRange,
  };
}
