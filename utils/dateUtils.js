/**
 * Normalizes a date to YYYY-MM-DD string or zeroed time Date object
 */
const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns array of date strings (YYYY-MM-DD) for each night of stay
 */
const getStayDates = (checkInDate, checkOutDate) => {
  const dates = [];
  let current = new Date(checkInDate);
  const end = new Date(checkOutDate);

  current.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

/**
 * Checks if a given date string or Date is Friday (5) or Saturday (6)
 */
const isWeekendNight = (dateInput) => {
  const d = new Date(dateInput);
  const day = d.getUTCDay();
  // Friday (5) and Saturday (6) are peak hotel weekend nights
  return day === 5 || day === 6;
};

/**
 * Overlap check logic for MongoDB date ranges
 */
const getOverlapQuery = (checkIn, checkOut) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  return {
    status: { $in: ['Reserved', 'Confirmed', 'Checked-in'] },
    $and: [
      { checkIn: { $lt: checkOutDate } },
      { checkOut: { $gt: checkInDate } }
    ]
  };
};

module.exports = {
  normalizeDate,
  getStayDates,
  isWeekendNight,
  getOverlapQuery
};
