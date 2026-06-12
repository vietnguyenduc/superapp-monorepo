// Sample data for cash flow with realistic ups and downs
export const generateSampleCashFlowData = () => {
  const today = new Date();
  const dailyData = [];
  
  // Generate data for past 90 days with realistic fluctuations
  let previousDayInflow = 5000000;
  let previousDayOutflow = 4000000;
  
  for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setDate(today.getDate() - dayOffset);
    
    const month = date.getMonth();
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();
    
    // Create realistic daily fluctuations based on previous day
    const inflowChange = (Math.random() - 0.5) * 0.4; // ±20% change
    const outflowChange = (Math.random() - 0.5) * 0.4; // ±20% change
    
    let inflow = Math.floor(previousDayInflow * (1 + inflowChange));
    let outflow = Math.floor(previousDayOutflow * (1 + outflowChange));
    
    // Weekend effects (less business activity)
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday/Saturday
      inflow = Math.floor(inflow * 0.3); // 70% less inflow
      outflow = Math.floor(outflow * 0.5); // 50% less outflow
    }
    
    // Monthly patterns
    if (dayOfMonth <= 5) { // Beginning of month - payment collections
      inflow = Math.floor(inflow * 1.8); // 80% more inflow
      outflow = Math.floor(outflow * 0.7); // 30% less outflow
    } else if (dayOfMonth >= 25) { // End of month - bill payments
      inflow = Math.floor(inflow * 0.6); // 40% less inflow
      outflow = Math.floor(outflow * 1.5); // 50% more outflow
    }
    
    // Seasonal patterns
    if (month === 11) { // December - holiday season
      inflow = Math.floor(inflow * 1.4); // 40% more income
      outflow = Math.floor(outflow * 1.3); // 30% more expenses
    } else if (month === 0) { // January - slow start
      inflow = Math.floor(inflow * 0.7); // 30% less income
      outflow = Math.floor(outflow * 0.8); // 20% less expenses
    } else if (month === 6 || month === 7) { // Summer - vacation season
      inflow = Math.floor(inflow * 0.8); // 20% less income
      outflow = Math.floor(outflow * 0.9); // 10% less expenses
    }
    
    // Random spikes and dips (10% chance)
    if (Math.random() < 0.1) {
      if (Math.random() < 0.5) {
        // Big inflow spike (large payment received)
        inflow = Math.floor(inflow * 2.5);
      } else {
        // Big outflow spike (large expense)
        outflow = Math.floor(outflow * 2.2);
      }
    }
    
    // Ensure minimum values
    inflow = Math.max(inflow, 500000);
    outflow = Math.max(outflow, 300000);
    
    // Update previous day values for next iteration
    previousDayInflow = inflow;
    previousDayOutflow = outflow;
    
    dailyData.push({
      date: date.toISOString(),
      inflow,
      outflow,
      netFlow: inflow - outflow
    });
  }
  
  // Generate weekly data for past 104 weeks (2 years) with realistic fluctuations
  const weeklyData = [];
  let previousWeekInflow = 20000000;
  let previousWeekOutflow = 18000000;
  
  for (let week = 103; week >= 0; week--) {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - (week * 7));
    
    const month = weekDate.getMonth();
    const weekOfMonth = Math.floor(weekDate.getDate() / 7);
    
    // Create realistic weekly fluctuations based on previous week
    const inflowChange = (Math.random() - 0.5) * 0.3; // ±15% change
    const outflowChange = (Math.random() - 0.5) * 0.3; // ±15% change
    
    let baseInflow = Math.floor(previousWeekInflow * (1 + inflowChange));
    let baseOutflow = Math.floor(previousWeekOutflow * (1 + outflowChange));
    
    // Monthly patterns for weeks
    if (weekOfMonth === 0) { // First week of month - strong collections
      baseInflow = Math.floor(baseInflow * 1.6); // 60% more inflow
      baseOutflow = Math.floor(baseOutflow * 0.8); // 20% less outflow
    } else if (weekOfMonth >= 4) { // Last weeks of month - heavy payments
      baseInflow = Math.floor(baseInflow * 0.7); // 30% less inflow
      baseOutflow = Math.floor(baseOutflow * 1.4); // 40% more outflow
    }
    
    // Seasonal patterns
    if (month === 11) { // December - holiday rush
      baseInflow = Math.floor(baseInflow * 1.5); // 50% more income
      baseOutflow = Math.floor(baseOutflow * 1.3); // 30% more expenses
    } else if (month === 0) { // January - post-holiday slowdown
      baseInflow = Math.floor(baseInflow * 0.6); // 40% less income
      baseOutflow = Math.floor(baseOutflow * 0.7); // 30% less expenses
    } else if (month === 6 || month === 7) { // Summer slowdown
      baseInflow = Math.floor(baseInflow * 0.75); // 25% less income
      baseOutflow = Math.floor(baseOutflow * 0.85); // 15% less expenses
    } else if (month >= 2 && month <= 5) { // Spring growth
      baseInflow = Math.floor(baseInflow * 1.2); // 20% more income
      baseOutflow = Math.floor(baseOutflow * 1.1); // 10% more expenses
    }
    
    // Random quarterly events (5% chance)
    if (Math.random() < 0.05) {
      if (Math.random() < 0.5) {
        // Major client payment
        baseInflow = Math.floor(baseInflow * 3.0);
      } else {
        // Large expense (tax, equipment, etc.)
        baseOutflow = Math.floor(baseOutflow * 2.5);
      }
    }
    
    // Year-over-year growth for previous year
    if (week >= 52) { // First year data
      baseInflow = Math.floor(baseInflow * 0.82); // 18% less income in previous year
      baseOutflow = Math.floor(baseOutflow * 0.88); // 12% less expenses in previous year
    }
    
    // Ensure minimum values
    baseInflow = Math.max(baseInflow, 5000000);
    baseOutflow = Math.max(baseOutflow, 4000000);
    
    // Update previous week values
    previousWeekInflow = baseInflow;
    previousWeekOutflow = baseOutflow;
    
    weeklyData.push({
      date: weekDate.toISOString(),
      inflow: baseInflow,
      outflow: baseOutflow,
      netFlow: baseInflow - baseOutflow
    });
  }
  
  // Generate monthly data for past 24 months (2 years) with realistic fluctuations
  const monthlyData = [];
  let previousMonthInflow = 45000000;
  let previousMonthOutflow = 42000000;
  
  for (let month = 23; month >= 0; month--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - month);
    
    const currentMonth = monthDate.getMonth();
    
    // Create realistic monthly fluctuations based on previous month
    const inflowChange = (Math.random() - 0.5) * 0.25; // ±12.5% change
    const outflowChange = (Math.random() - 0.5) * 0.25; // ±12.5% change
    
    let baseInflow = Math.floor(previousMonthInflow * (1 + inflowChange));
    let baseOutflow = Math.floor(previousMonthOutflow * (1 + outflowChange));
    
    // Strong seasonal patterns
    if (currentMonth === 11) { // December - holiday season peak
      baseInflow = Math.floor(baseInflow * 2.1); // 110% more income
      baseOutflow = Math.floor(baseOutflow * 1.8); // 80% more expenses
    } else if (currentMonth === 0) { // January - post-holiday recovery
      baseInflow = Math.floor(baseInflow * 0.4); // 60% less income
      baseOutflow = Math.floor(baseOutflow * 0.5); // 50% less expenses
    } else if (currentMonth === 1) { // February - slow month
      baseInflow = Math.floor(baseInflow * 0.7); // 30% less income
      baseOutflow = Math.floor(baseOutflow * 0.8); // 20% less expenses
    } else if (currentMonth >= 3 && currentMonth <= 5) { // Spring growth
      baseInflow = Math.floor(baseInflow * 1.4); // 40% more income
      baseOutflow = Math.floor(baseOutflow * 1.2); // 20% more expenses
    } else if (currentMonth === 6) { // July - summer vacation
      baseInflow = Math.floor(baseInflow * 0.6); // 40% less income
      baseOutflow = Math.floor(baseOutflow * 0.7); // 30% less expenses
    } else if (currentMonth === 8) { // August - back to school
      baseInflow = Math.floor(baseInflow * 1.3); // 30% more income
      baseOutflow = Math.floor(baseOutflow * 1.1); // 10% more expenses
    } else if (currentMonth >= 9 && currentMonth <= 10) { // Fall harvest
      baseInflow = Math.floor(baseInflow * 1.2); // 20% more income
      baseOutflow = Math.floor(baseOutflow * 1.15); // 15% more expenses
    }
    
    // Random major events (8% chance)
    if (Math.random() < 0.08) {
      if (Math.random() < 0.6) {
        // Major contract or client acquisition
        baseInflow = Math.floor(baseInflow * 2.8);
      } else {
        // Major expense (equipment purchase, expansion, etc.)
        baseOutflow = Math.floor(baseOutflow * 2.2);
      }
    }
    
    // Year-over-year growth for previous year
    if (month >= 12) { // First year data
      baseInflow = Math.floor(baseInflow * 0.78); // 22% less income in previous year
      baseOutflow = Math.floor(baseOutflow * 0.85); // 15% less expenses in previous year
    }
    
    // Add some realistic noise
    const noiseFactor = 0.9 + Math.random() * 0.2; // ±10% noise
    baseInflow = Math.floor(baseInflow * noiseFactor);
    baseOutflow = Math.floor(baseOutflow * noiseFactor);
    
    // Ensure minimum values
    baseInflow = Math.max(baseInflow, 15000000);
    baseOutflow = Math.max(baseOutflow, 12000000);
    
    // Update previous month values
    previousMonthInflow = baseInflow;
    previousMonthOutflow = baseOutflow;
    
    monthlyData.push({
      date: monthDate.toISOString(),
      inflow: baseInflow,
      outflow: baseOutflow,
      netFlow: baseInflow - baseOutflow
    });
  }
  
  // Generate quarterly data for past 8 quarters (2 years) with realistic fluctuations
  const quarterlyData = [];
  let previousQuarterInflow = 150000000;
  let previousQuarterOutflow = 135000000;
  
  for (let quarter = 7; quarter >= 0; quarter--) {
    const quarterDate = new Date();
    quarterDate.setMonth(quarterDate.getMonth() - (quarter * 3));
    
    const currentMonth = quarterDate.getMonth();
    const quarterNumber = Math.floor(currentMonth / 3);
    
    // Create realistic quarterly fluctuations based on previous quarter
    const inflowChange = (Math.random() - 0.5) * 0.2; // ±10% change
    const outflowChange = (Math.random() - 0.5) * 0.2; // ±10% change
    
    let baseInflow = Math.floor(previousQuarterInflow * (1 + inflowChange));
    let baseOutflow = Math.floor(previousQuarterOutflow * (1 + outflowChange));
    
    // Strong quarterly seasonal patterns
    if (quarterNumber === 0) { // Q1 (Jan-Mar) - post-holiday recovery
      baseInflow = Math.floor(baseInflow * 0.6); // 40% less income
      baseOutflow = Math.floor(baseOutflow * 0.7); // 30% less expenses
    } else if (quarterNumber === 1) { // Q2 (Apr-Jun) - spring growth
      baseInflow = Math.floor(baseInflow * 1.3); // 30% more income
      baseOutflow = Math.floor(baseOutflow * 1.2); // 20% more expenses
    } else if (quarterNumber === 2) { // Q3 (Jul-Sep) - summer slowdown
      baseInflow = Math.floor(baseInflow * 0.7); // 30% less income
      baseOutflow = Math.floor(baseOutflow * 0.8); // 20% less expenses
    } else if (quarterNumber === 3) { // Q4 (Oct-Dec) - holiday peak
      baseInflow = Math.floor(baseInflow * 1.8); // 80% more income
      baseOutflow = Math.floor(baseOutflow * 1.6); // 60% more expenses
    }
    
    // Random major business events (15% chance)
    if (Math.random() < 0.15) {
      if (Math.random() < 0.7) {
        // Major business expansion or large contract
        baseInflow = Math.floor(baseInflow * 2.5);
      } else {
        // Major capital expenditure or restructuring
        baseOutflow = Math.floor(baseOutflow * 2.0);
      }
    }
    
    // Year-over-year growth for previous year
    if (quarter >= 4) { // First year data
      baseInflow = Math.floor(baseInflow * 0.75); // 25% less income in previous year
      baseOutflow = Math.floor(baseOutflow * 0.82); // 18% less expenses in previous year
    }
    
    // Add quarterly noise
    const noiseFactor = 0.92 + Math.random() * 0.16; // ±8% noise
    baseInflow = Math.floor(baseInflow * noiseFactor);
    baseOutflow = Math.floor(baseOutflow * noiseFactor);
    
    // Ensure minimum values
    baseInflow = Math.max(baseInflow, 50000000);
    baseOutflow = Math.max(baseOutflow, 45000000);
    
    // Update previous quarter values
    previousQuarterInflow = baseInflow;
    previousQuarterOutflow = baseOutflow;
    
    quarterlyData.push({
      date: quarterDate.toISOString(),
      inflow: baseInflow,
      outflow: baseOutflow,
      netFlow: baseInflow - baseOutflow
    });
  }
  
  // Generate yearly data for past 5 years
  const yearlyData = [];
  let previousYearInflow = 600000000;
  let previousYearOutflow = 550000000;
  
  for (let year = 4; year >= 0; year--) {
    const yearDate = new Date();
    yearDate.setFullYear(yearDate.getFullYear() - year);
    
    // Create realistic yearly fluctuations
    const inflowChange = (Math.random() - 0.5) * 0.15; // ±7.5% change
    const outflowChange = (Math.random() - 0.5) * 0.15; // ±7.5% change
    
    let baseInflow = Math.floor(previousYearInflow * (1 + inflowChange));
    let baseOutflow = Math.floor(previousYearOutflow * (1 + outflowChange));
    
    // Add business growth trend
    if (year > 0) { // Previous years
      baseInflow = Math.floor(baseInflow * (0.85 - (year * 0.03))); // Progressive growth
      baseOutflow = Math.floor(baseOutflow * (0.88 - (year * 0.02)));
    }
    
    // Random major business events (20% chance)
    if (Math.random() < 0.2) {
      if (Math.random() < 0.6) {
        // Major expansion year
        baseInflow = Math.floor(baseInflow * 1.8);
      } else {
        // Major investment year
        baseOutflow = Math.floor(baseOutflow * 1.6);
      }
    }
    
    // Ensure minimum values
    baseInflow = Math.max(baseInflow, 200000000);
    baseOutflow = Math.max(baseOutflow, 180000000);
    
    // Update previous year values
    previousYearInflow = baseInflow;
    previousYearOutflow = baseOutflow;
    
    yearlyData.push({
      date: yearDate.toISOString(),
      inflow: baseInflow,
      outflow: baseOutflow,
      netFlow: baseInflow - baseOutflow
    });
  }

  return {
    dailyData,
    weeklyData,
    monthlyData,
    quarterlyData,
    yearlyData
  };
};
