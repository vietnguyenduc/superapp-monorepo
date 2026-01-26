// Sample data for cash flow with configurable ranges (30 days, 24 weeks, 24 months)
export const generateSampleCashFlowData = () => {
  const today = new Date();
  const dailyData = [];
  
  // Generate data for past 90 days with more distinct values (3 months of daily data)
  for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setDate(today.getDate() - dayOffset);
    
    // Generate more distinct inflow and outflow values
    // Use a pattern to create more visual difference between days
    let inflow, outflow;
    
    // Create seasonal patterns
    const month = date.getMonth();
    const dayOfMonth = date.getDate();
    
    // Beginning of month has higher inflows (payments coming in)
    if (dayOfMonth <= 5) {
      inflow = Math.floor(Math.random() * 5000000) + 8000000; // 8M to 13M
      outflow = Math.floor(Math.random() * 2000000) + 1000000; // 1M to 3M
    } 
    // Middle of month has balanced flows
    else if (dayOfMonth > 5 && dayOfMonth <= 20) {
      inflow = Math.floor(Math.random() * 3000000) + 3000000; // 3M to 6M
      outflow = Math.floor(Math.random() * 3000000) + 3000000; // 3M to 6M
    } 
    // End of month has higher outflows (paying suppliers)
    else {
      inflow = Math.floor(Math.random() * 2000000) + 1000000; // 1M to 3M
      outflow = Math.floor(Math.random() * 5000000) + 7000000; // 7M to 12M
    }
    
    // Add seasonal variations
    if (month === 0 || month === 11) { // January and December (holiday season)
      inflow = Math.floor(inflow * 1.3); // 30% more income
      outflow = Math.floor(outflow * 1.2); // 20% more expenses
    } else if (month === 6 || month === 7) { // July and August (summer season)
      inflow = Math.floor(inflow * 0.8); // 20% less income
      outflow = Math.floor(outflow * 0.9); // 10% less expenses
    }
    
    dailyData.push({
      date: date.toISOString(),
      inflow,
      outflow,
      netFlow: inflow - outflow
    });
  }
  
  // Generate weekly data for past 104 weeks (2 years)
  const weeklyData = [];
  for (let week = 103; week >= 0; week--) {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - (week * 7));
    
    // Create seasonal patterns
    const month = weekDate.getMonth();
    
    // Base values
    let baseInflow = Math.floor(Math.random() * 10000000) + 15000000; // 15M to 25M
    let baseOutflow = Math.floor(Math.random() * 8000000) + 12000000; // 12M to 20M
    
    // Add seasonal variations
    if (month === 0 || month === 11) { // January and December (holiday season)
      baseInflow = Math.floor(baseInflow * 1.3); // 30% more income
      baseOutflow = Math.floor(baseOutflow * 1.2); // 20% more expenses
    } else if (month === 6 || month === 7) { // July and August (summer season)
      baseInflow = Math.floor(baseInflow * 0.8); // 20% less income
      baseOutflow = Math.floor(baseOutflow * 0.9); // 10% less expenses
    }
    
    // Add year-over-year growth
    if (week >= 52) { // First year data
      baseInflow = Math.floor(baseInflow * 0.85); // 15% less income in previous year
      baseOutflow = Math.floor(baseOutflow * 0.9); // 10% less expenses in previous year
    }
    
    weeklyData.push({
      date: weekDate.toISOString(),
      inflow: baseInflow,
      outflow: baseOutflow,
      netFlow: baseInflow - baseOutflow
    });
  }
  
  // Generate monthly data for past 24 months (2 years)
  const monthlyData = [];
  
  // Generate data for 24 months with realistic patterns
  for (let month = 23; month >= 0; month--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - month);
    
    const currentMonth = monthDate.getMonth();
    const currentYear = monthDate.getFullYear();
    
    // Base values with seasonal patterns
    let baseInflow, baseOutflow;
    
    // Seasonal patterns
    if (currentMonth === 0) { // January - slow start
      baseInflow = 38000000 + Math.floor(Math.random() * 5000000);
      baseOutflow = 36000000 + Math.floor(Math.random() * 4000000);
    } else if (currentMonth === 11) { // December - year-end rush
      baseInflow = 58000000 + Math.floor(Math.random() * 7000000);
      baseOutflow = 52000000 + Math.floor(Math.random() * 6000000);
    } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer months
      baseInflow = 45000000 + Math.floor(Math.random() * 8000000);
      baseOutflow = 42000000 + Math.floor(Math.random() * 7000000);
    } else if (currentMonth >= 2 && currentMonth <= 4) { // Spring months
      baseInflow = 48000000 + Math.floor(Math.random() * 6000000);
      baseOutflow = 44000000 + Math.floor(Math.random() * 5000000);
    } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall months
      baseInflow = 50000000 + Math.floor(Math.random() * 7000000);
      baseOutflow = 46000000 + Math.floor(Math.random() * 6000000);
    } else {
      baseInflow = 42000000 + Math.floor(Math.random() * 6000000);
      baseOutflow = 40000000 + Math.floor(Math.random() * 5000000);
    }
    
    // Year-over-year growth
    if (month >= 12) { // First year data
      baseInflow = Math.floor(baseInflow * 0.85); // 15% less income in previous year
      baseOutflow = Math.floor(baseOutflow * 0.9); // 10% less expenses in previous year
    }
    
    // Add some randomness for realistic variation
    const inflow = Math.floor(baseInflow * (0.95 + Math.random() * 0.1)); // ±5% variation
    const outflow = Math.floor(baseOutflow * (0.95 + Math.random() * 0.1)); // ±5% variation
    
    monthlyData.push({
      date: monthDate.toISOString(),
      inflow,
      outflow,
      netFlow: inflow - outflow
    });
  }
  
  // Generate quarterly data for past 8 quarters (2 years)
  const quarterlyData = [];
  
  // Generate data for 8 quarters with realistic patterns
  for (let quarter = 7; quarter >= 0; quarter--) {
    const quarterDate = new Date();
    quarterDate.setMonth(quarterDate.getMonth() - (quarter * 3));
    
    const currentMonth = quarterDate.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    
    // Base values with seasonal patterns
    let baseInflow, baseOutflow;
    
    // Quarterly patterns
    if (currentQuarter === 0) { // Q1 (Jan-Mar)
      baseInflow = 130000000 + Math.floor(Math.random() * 10000000);
      baseOutflow = 120000000 + Math.floor(Math.random() * 8000000);
    } else if (currentQuarter === 1) { // Q2 (Apr-Jun)
      baseInflow = 140000000 + Math.floor(Math.random() * 12000000);
      baseOutflow = 125000000 + Math.floor(Math.random() * 10000000);
    } else if (currentQuarter === 2) { // Q3 (Jul-Sep)
      baseInflow = 135000000 + Math.floor(Math.random() * 15000000);
      baseOutflow = 122000000 + Math.floor(Math.random() * 12000000);
    } else { // Q4 (Oct-Dec)
      baseInflow = 150000000 + Math.floor(Math.random() * 20000000);
      baseOutflow = 135000000 + Math.floor(Math.random() * 15000000);
    }
    
    // Year-over-year growth
    if (quarter >= 4) { // First year data
      baseInflow = Math.floor(baseInflow * 0.85); // 15% less income in previous year
      baseOutflow = Math.floor(baseOutflow * 0.9); // 10% less expenses in previous year
    }
    
    // Calculate quarter total from monthly data for consistency
    // Find the 3 months that correspond to this quarter
    const monthsInQuarter = monthlyData.filter((item) => {
      const itemDate = new Date(item.date);
      const itemQuarter = Math.floor(itemDate.getMonth() / 3);
      const itemYear = itemDate.getFullYear();
      const quarterYear = quarterDate.getFullYear();
      
      return itemQuarter === currentQuarter && itemYear === quarterYear;
    });
    
    // If we have monthly data for this quarter, use the sum
    let inflow, outflow;
    if (monthsInQuarter.length > 0) {
      inflow = monthsInQuarter.reduce((sum, item) => sum + item.inflow, 0);
      outflow = monthsInQuarter.reduce((sum, item) => sum + item.outflow, 0);
    } else {
      // Otherwise use the base values
      inflow = baseInflow;
      outflow = baseOutflow;
    }
    
    quarterlyData.push({
      date: quarterDate.toISOString(),
      inflow,
      outflow,
      netFlow: inflow - outflow
    });
  }
  
  // Generate yearly data based on actual transaction dates (2024 only)
  const yearlyData = [];
  
  // Only use 2024 data to match actual transactions
  const yearDate = new Date();
  yearDate.setFullYear(2024);
  
  // Calculate year total from quarterly data for consistency
  // Find the quarters that correspond to 2024
  const quartersIn2024 = quarterlyData.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate.getFullYear() === 2024;
  });
  
  // Calculate inflow and outflow for 2024
  let inflow, outflow;
  if (quartersIn2024.length > 0) {
    inflow = quartersIn2024.reduce((sum, item) => sum + item.inflow, 0);
    outflow = quartersIn2024.reduce((sum, item) => sum + item.outflow, 0);
  } else {
    // Fallback values if no quarterly data for 2024
    inflow = 40000000; // 40M
    outflow = 35000000; // 35M
  }
  
  // Add only 2024 data
  yearlyData.push({
    date: yearDate.toISOString(),
    inflow,
    outflow,
    netFlow: inflow - outflow
  });
  
  return {
    dailyData,
    weeklyData,
    monthlyData,
    quarterlyData,
    yearlyData
  };
};
