// Sample data for cash flow with configurable ranges (7 days, 8 weeks, 7 months)
export const generateSampleCashFlowData = () => {
  const today = new Date();
  const dailyData = [];
  
  // Generate data for past 7 days
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setDate(today.getDate() - dayOffset);
    
    // Generate random inflow and outflow values
    const inflow = Math.floor(Math.random() * 5000000) + 500000; // 500k to 5.5M
    const outflow = Math.floor(Math.random() * 6000000) + 1000000; // 1M to 7M
    
    dailyData.push({
      date: date.toISOString(),
      inflow,
      outflow,
      netFlow: inflow - outflow
    });
  }
  
  // Generate weekly data for past 8 weeks
  const weeklyData = [];
  for (let week = 7; week >= 0; week--) {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - (week * 7));
    
    const inflow = Math.floor(Math.random() * 10000000) + 2000000; // 2M to 12M
    const outflow = Math.floor(Math.random() * 15000000) + 5000000; // 5M to 20M
    
    weeklyData.push({
      date: weekDate.toISOString(),
      inflow,
      outflow,
      netFlow: inflow - outflow
    });
  }
  
  // Generate monthly data for past 7 months with consistent values
  const monthlyData = [];
  
  // Define specific values for each month to ensure consistency and visual interest
  const monthlyValues = [
    { inflow: 52000000, outflow: 35000000 },  // Jul 2025 (6 months ago)
    { inflow: 38000000, outflow: 42000000 },  // Aug 2025 (5 months ago)
    { inflow: 45000000, outflow: 39000000 },  // Sep 2025 (4 months ago)
    { inflow: 42000000, outflow: 48000000 },  // Oct 2025 (3 months ago)
    { inflow: 39000000, outflow: 36000000 },  // Nov 2025 (2 months ago)
    { inflow: 41000000, outflow: 37000000 },  // Dec 2025 (1 month ago)
    { inflow: 40000000, outflow: 39322274 }   // Jan 2026 (Current month)
  ];
  
  for (let month = 6; month >= 0; month--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - month);
    
    // Use the predefined values for consistency
    const inflow = monthlyValues[6-month].inflow;
    const outflow = monthlyValues[6-month].outflow;
    
    monthlyData.push({
      date: monthDate.toISOString(),
      inflow,
      outflow,
      netFlow: inflow - outflow
    });
  }
  
  // Generate quarterly data for past 4 quarters with consistent values
  const quarterlyData = [];
  
  // Define specific values for each quarter to ensure consistency with monthly data
  const quarterlyValues = [
    { // Q2 2025 (Apr-Jun 2025)
      inflow: 135000000, 
      outflow: 114500000
    },
    { // Q3 2025 (Jul-Sep 2025)
      inflow: 135000000, // Sum of Jul-Sep monthly inflows
      outflow: 116000000  // Sum of Jul-Sep monthly outflows
    },
    { // Q4 2025 (Oct-Dec 2025)
      inflow: 122000000, // Sum of Oct-Dec monthly inflows
      outflow: 121000000  // Sum of Oct-Dec monthly outflows
    },
    { // Q1 2026 (Jan-Mar 2026, though we only have Jan data)
      inflow: 40000000,  // Jan inflow
      outflow: 39322274  // Jan outflow
    }
  ];
  
  for (let quarter = 3; quarter >= 0; quarter--) {
    const quarterDate = new Date();
    quarterDate.setMonth(quarterDate.getMonth() - (quarter * 3));
    
    // Use the predefined values for consistency
    const inflow = quarterlyValues[3-quarter].inflow;
    const outflow = quarterlyValues[3-quarter].outflow;
    
    quarterlyData.push({
      date: quarterDate.toISOString(),
      inflow,
      outflow,
      netFlow: inflow - outflow
    });
  }
  
  // Generate yearly data for past 3 years with consistent values
  const yearlyData = [];
  
  // Define specific values for each year to ensure consistency with quarterly data
  const yearlyValues = [
    { // 2024
      inflow: 520000000,
      outflow: 480000000
    },
    { // 2025
      inflow: 432000000, // Sum of Q2-Q4 2025 inflows
      outflow: 391500000  // Sum of Q2-Q4 2025 outflows
    },
    { // 2026 (only Q1 data so far)
      inflow: 40000000,  // Q1 2026 inflow
      outflow: 39322274  // Q1 2026 outflow
    }
  ];
  
  for (let year = 2; year >= 0; year--) {
    const yearDate = new Date();
    yearDate.setFullYear(yearDate.getFullYear() - year);
    
    // Use the predefined values for consistency
    const inflow = yearlyValues[2-year].inflow;
    const outflow = yearlyValues[2-year].outflow;
    
    yearlyData.push({
      date: yearDate.toISOString(),
      inflow,
      outflow,
      netFlow: inflow - outflow
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
