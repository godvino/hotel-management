const PricingRule = require('../models/PricingRule');
const { getStayDates, isWeekendNight } = require('./dateUtils');

/**
 * Calculates dynamic pricing for a roomType over a given stay period
 */
const calculateDynamicPricing = async (roomType, checkIn, checkOut) => {
  const stayDates = getStayDates(checkIn, checkOut);
  const nightsCount = stayDates.length;

  if (nightsCount <= 0) {
    throw new Error('Check-out date must be at least one day after check-in date');
  }

  // Fetch active pricing rules for this roomType or hotel
  const activeRules = await PricingRule.find({
    roomTypeId: roomType._id,
    isActive: true
  });

  const nightlyRates = [];
  let roomSubtotal = 0;

  for (const dateStr of stayDates) {
    const nightDate = new Date(dateStr);
    let effectiveMultiplier = 1.0;
    let seasonName = 'Standard Rate';
    const isWeekend = isWeekendNight(nightDate);

    // Find any matching seasonal rule
    const matchingRule = activeRules.find((rule) => {
      const ruleStart = new Date(rule.startDate);
      const ruleEnd = new Date(rule.endDate);
      ruleStart.setUTCHours(0, 0, 0, 0);
      ruleEnd.setUTCHours(23, 59, 59, 999);
      return nightDate >= ruleStart && nightDate <= ruleEnd;
    });

    if (matchingRule) {
      effectiveMultiplier = matchingRule.multiplier;
      seasonName = matchingRule.season;

      if (isWeekend && matchingRule.isWeekendSurge) {
        effectiveMultiplier *= matchingRule.weekendMultiplier || 1.2;
        seasonName += ' (Weekend Surge)';
      }
    } else if (isWeekend) {
      // Default weekend multiplier 1.15
      effectiveMultiplier = 1.15;
      seasonName = 'Weekend Rate';
    }

    const nightlyRate = Math.round(roomType.basePrice * effectiveMultiplier);
    roomSubtotal += nightlyRate;

    nightlyRates.push({
      date: dateStr,
      rate: nightlyRate,
      seasonName,
      multiplierApplied: Number(effectiveMultiplier.toFixed(2)),
      isWeekend
    });
  }

  const taxRatePercentage = 12; // 12% GST / Hospitality tax
  const taxAmount = Math.round((roomSubtotal * taxRatePercentage) / 100);
  const serviceCharges = 0;
  const totalAmount = roomSubtotal + taxAmount + serviceCharges;

  return {
    basePrice: roomType.basePrice,
    nightsCount,
    nightlyRates,
    roomSubtotal,
    taxes: {
      ratePercentage: taxRatePercentage,
      taxAmount
    },
    serviceCharges,
    totalAmount
  };
};

module.exports = { calculateDynamicPricing };
