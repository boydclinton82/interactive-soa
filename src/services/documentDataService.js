// Document Data Service - Maps React state to Word template data

/**
 * Formats currency values for display
 */
export const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = value.replace(/[^0-9]/g, '');
  const number = parseInt(numericValue);
  if (isNaN(number) || number === 0) return '';
  return '$' + number.toLocaleString('en-US');
};

/**
 * Handles variable substitution in bullet point text for loan strategy
 */
export const formatBulletText = (bullet, interactiveValues = {}) => {
  if (bullet.id === 'loan-benefit-4') {
    // "This will free up cash flow of $XXX p/frequency of which can be used..."
    const amount = formatCurrency(interactiveValues['benefit4-amount'] || '');
    const frequency = interactiveValues['benefit4-frequency'] || 'frequency';
    
    return `This will free up cash flow of ${amount || '$XXX'} p/${frequency} which can be used to meet your expenditure and other objectives.`;
  } 
  
  if (bullet.id === 'loan-benefit-5') {
    // "Altering the repayment frequency on your mortgage from monthly to fortnightly/weekly..."
    const frequency = interactiveValues['benefit5-frequency'] || 'fortnightly/weekly';
    
    return `Altering the repayment frequency on your mortgage from monthly to ${frequency} will increase the number of repayments you make each year which may help reduce the amount of interest paid over the life of the loan and repay your loan sooner.`;
  }
  
  // Return original text for all other bullets
  return bullet.text;
};

/**
 * Builds the subtitle text for loan repayment strategy
 */
export const buildLoanSubtitle = (interactiveValues = {}) => {
  const amount = formatCurrency(interactiveValues['subtitle-amount'] || '');
  const frequency = interactiveValues['subtitle-frequency'] || 'month/fortnight/week';
  const loanType = interactiveValues['subtitle-loan-type'] || 'XXX loan';
  
  return `After reviewing your cashflow position, we recommend you reduce your debt repayments to ${amount || '$XXX'} per ${frequency} into your ${loanType}.`;
};

/**
 * Prepares ordered benefits data for Word template
 */
export const getOrderedApprovedBenefits = (benefitsStates, benefitsOrder, interactiveValues) => {
  return benefitsOrder
    .map(id => benefitsStates.find(b => b.id === id))
    .filter(b => b && b.status === 'approved')
    .map(b => ({
      id: b.id,
      summary: b.summary || '',
      text: formatBulletText(b, interactiveValues),
      hasSummary: !!b.summary
    }));
};

/**
 * Prepares ordered considerations data for Word template
 */
export const getOrderedApprovedConsiderations = (considerationsStates, considerationsOrder, interactiveValues) => {
  return considerationsOrder
    .map(id => considerationsStates.find(c => c.id === id))
    .filter(c => c && c.status === 'approved')
    .map(c => ({
      id: c.id,
      summary: c.summary || '',
      text: formatBulletText(c, interactiveValues),
      hasSummary: !!c.summary
    }));
};

/**
 * Main function to prepare document data from React app state
 */
export const prepareDocumentData = ({
  activeStrategy,
  superTableRows = [],
  alignedGoal = '',
  loanAlignedGoal = '',
  benefitsStates = [],
  considerationsStates = [],
  loanBenefitsStates = [],
  loanConsiderationsStates = [],
  benefitsOrder = [],
  considerationsOrder = [],
  loanBenefitsOrder = [],
  loanConsiderationsOrder = [],
  interactiveValues = {}
}) => {
  
  // Determine which data sets to use based on strategy
  const currentBenefitsStates = activeStrategy === 'loanRepayment' ? loanBenefitsStates : benefitsStates;
  const currentConsiderationsStates = activeStrategy === 'loanRepayment' ? loanConsiderationsStates : considerationsStates;
  const currentBenefitsOrder = activeStrategy === 'loanRepayment' ? loanBenefitsOrder : benefitsOrder;
  const currentConsiderationsOrder = activeStrategy === 'loanRepayment' ? loanConsiderationsOrder : considerationsOrder;
  const currentAlignedGoal = activeStrategy === 'loanRepayment' ? loanAlignedGoal : alignedGoal;
  
  // Get ordered and approved items
  const approvedBenefits = getOrderedApprovedBenefits(
    currentBenefitsStates, 
    currentBenefitsOrder, 
    interactiveValues
  );
  
  const approvedConsiderations = getOrderedApprovedConsiderations(
    currentConsiderationsStates, 
    currentConsiderationsOrder, 
    interactiveValues
  );
  
  // Filter table rows to only populated ones
  const populatedTableRows = superTableRows.filter(row => 
    row.fundName && row.fundName.trim() !== ''
  );
  
  // Base document data
  const documentData = {
    // Strategy-specific title
    title: activeStrategy === 'consolidation' 
      ? 'Consolidate your superannuation funds'
      : 'Alter your loan repayments',
    
    // Strategy-specific subtitle
    subtitle: activeStrategy === 'loanRepayment'
      ? buildLoanSubtitle(interactiveValues)
      : 'We recommend you consolidate your superannuation funds as listed below.',
    
    // Aligned goal section
    hasAlignedGoal: !!currentAlignedGoal,
    alignedGoal: currentAlignedGoal || '',
    
    // Benefits section
    hasBenefits: approvedBenefits.length > 0,
    approvedBenefits: approvedBenefits,
    
    // Considerations section
    hasConsiderations: approvedConsiderations.length > 0,
    approvedConsiderations: approvedConsiderations,
    
    // Strategy type for conditional logic
    isConsolidation: activeStrategy === 'consolidation',
    isLoanRepayment: activeStrategy === 'loanRepayment'
  };
  
  // Add consolidation-specific data
  if (activeStrategy === 'consolidation') {
    documentData.hasTable = populatedTableRows.length > 0;
    documentData.tableRows = populatedTableRows.map(row => ({
      fundName: row.fundName || '',
      owner: row.owner || '',
      typeOfRollover: row.typeOfRollover || ''
    }));
  }
  
  return documentData;
};

/**
 * Helper function to get current timestamp for filename
 */
export const generateFilename = (activeStrategy) => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const strategyName = activeStrategy === 'consolidation' ? 'Consolidation' : 'LoanRepayment';
  return `SOA-${strategyName}-${timestamp}.docx`;
};