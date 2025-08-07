import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VariableBox from './VariableBox';

interface TableRow {
  id: string;
  fundName: string;
  owner: string;
  typeOfRollover: string;
}

interface BulletPointState {
  id: string;
  text: string;
  summary?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ComplianceIssue {
  id: string;
  type: 'table' | 'benefit' | 'consideration' | 'general';
  targetId?: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface PreviewModalProps {
  tableRows: TableRow[];
  alignedGoal: string;
  benefitsStates: BulletPointState[];
  considerationsStates: BulletPointState[];
  benefitsOrder: string[];
  considerationsOrder: string[];
  activeStrategy: 'consolidation' | 'loanRepayment';
  interactiveValues?: {[key: string]: string};
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  tableRows,
  alignedGoal,
  benefitsStates,
  considerationsStates,
  benefitsOrder,
  considerationsOrder,
  activeStrategy,
  interactiveValues = {},
  onClose
}) => {
  const [showComplianceIssues, setShowComplianceIssues] = useState(false);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);

  // Function to render text with interactive elements for loan repayment strategy
  const renderTextWithInteractive = (text: string, id: string) => {
    if (activeStrategy !== 'loanRepayment') return text;

    if (id === 'loan-benefit-4') {
      // This will free up cash flow of $XXX p/frequency of which can be used to meet your expenditure and other objectives.
      return (
        <>
          This will free up cash flow of{' '}
          <VariableBox
            number={4}
            value={interactiveValues['benefit4-amount'] || ''}
            type="currency"
            placeholder="$XXX"
          />
          {' '}p/
          <VariableBox
            number={5}
            value={interactiveValues['benefit4-frequency'] || ''}
            type="frequency"
            placeholder="frequency"
          />
          {' of which can be used to meet your expenditure and other objectives.'}
        </>
      );
    } else if (id === 'loan-benefit-5') {
      // Altering the repayment frequency on your mortgage from monthly to fortnightly/weekly will increase...
      return (
        <>
          Altering the repayment frequency on your mortgage from monthly to{' '}
          <VariableBox
            number={5}
            value={interactiveValues['benefit5-frequency'] || ''}
            type="frequency"
            placeholder="fortnightly/weekly"
          />
          {' will increase the number of repayments you make each year which may help reduce the amount of interest paid over the life of the loan and repay your loan sooner.'}
        </>
      );
    }
    
    // Default text rendering
    return text;
  };
  // Helper functions for ordered items (same as in App.tsx)
  const getOrderedBenefits = () => {
    const orderedItems = benefitsOrder
      .map(id => benefitsStates.find(item => item.id === id))
      .filter((item): item is BulletPointState => item !== undefined);
    
    // Add any new items that aren't in the order array yet
    const unorderedItems = benefitsStates.filter(item => !benefitsOrder.includes(item.id));
    return [...orderedItems, ...unorderedItems];
  };

  const getOrderedConsiderations = () => {
    const orderedItems = considerationsOrder
      .map(id => considerationsStates.find(item => item.id === id))
      .filter((item): item is BulletPointState => item !== undefined);
    
    // Add any new items that aren't in the order array yet
    const unorderedItems = considerationsStates.filter(item => !considerationsOrder.includes(item.id));
    return [...orderedItems, ...unorderedItems];
  };

  // Filter to show only approved and pending items (no rejected) with ordering
  const visibleBenefits = getOrderedBenefits().filter(b => b.status !== 'rejected');
  const visibleConsiderations = getOrderedConsiderations().filter(c => c.status !== 'rejected');
  
  // Filter table rows that have data
  const populatedRows = tableRows.filter(row => 
    row.fundName.trim() || row.owner.trim() || row.typeOfRollover.trim()
  );

  // Simulated compliance checker
  const runComplianceCheck = () => {
    console.log('Running compliance check...');
    console.log('Populated rows:', populatedRows);
    console.log('Visible benefits:', visibleBenefits);
    console.log('Visible considerations:', visibleConsiderations);
    
    const issues: ComplianceIssue[] = [];

    // Always add a demo issue for testing
    if (visibleBenefits.length > 0 || visibleConsiderations.length > 0 || populatedRows.length > 0) {
      issues.push({
        id: 'demo-issue',
        type: 'general',
        title: 'Demo Compliance Check',
        description: 'This is a demonstration of the compliance checker. In a real implementation, this would analyze the document content for regulatory compliance, consistency, and quality issues.',
        severity: 'medium'
      });
    }

    // Check for rollover vs retention disconnect
    const hasFullRollover = populatedRows.some(row => 
      row.typeOfRollover.toLowerCase().includes('full') || 
      row.typeOfRollover.toLowerCase().includes('complete')
    );
    
    const hasRetentionMention = [
      ...visibleBenefits.map(b => b.text),
      ...visibleConsiderations.map(c => c.text)
    ].some(text => 
      text.toLowerCase().includes('portion') && 
      (text.toLowerCase().includes('retain') || text.toLowerCase().includes('keep'))
    );

    console.log('Has full rollover:', hasFullRollover);
    console.log('Has retention mention:', hasRetentionMention);

    if (hasFullRollover && hasRetentionMention) {
      // Find the specific benefit/consideration that mentions retention
      const retentionBenefit = visibleBenefits.find(b => 
        b.text.toLowerCase().includes('portion') && 
        (b.text.toLowerCase().includes('retain') || b.text.toLowerCase().includes('keep'))
      );
      
      const retentionConsideration = visibleConsiderations.find(c => 
        c.text.toLowerCase().includes('portion') && 
        (c.text.toLowerCase().includes('retain') || c.text.toLowerCase().includes('keep'))
      );

      issues.push({
        id: 'rollover-retention-disconnect',
        type: retentionBenefit ? 'benefit' : 'consideration',
        targetId: retentionBenefit?.id || retentionConsideration?.id,
        title: 'Rollover Strategy Disconnect',
        description: 'There appears to be a disconnect between recommending a full rollover in the table and mentioning fund retention in the bullet points. This could confuse clients about the actual recommendation.',
        severity: 'high'
      });
    }

    // Check for missing insurance considerations
    const hasInsuranceConsideration = visibleConsiderations.some(c => 
      c.text.toLowerCase().includes('insurance')
    );
    
    if (!hasInsuranceConsideration && populatedRows.length > 0) {
      issues.push({
        id: 'missing-insurance-consideration',
        type: 'general',
        title: 'Missing Insurance Consideration',
        description: 'When recommending fund consolidation, insurance implications should typically be addressed to ensure clients understand potential impacts on their coverage.',
        severity: 'medium'
      });
    }

    // Check for existing content that matches default patterns
    const partialRetentionBenefit = visibleBenefits.find(b => 
      b.text.includes('portion will be retained')
    );

    if (partialRetentionBenefit) {
      issues.push({
        id: 'partial-retention-found',
        type: 'benefit',
        targetId: partialRetentionBenefit.id,
        title: 'Partial Fund Retention Detected',
        description: 'This benefit mentions retaining a portion of existing funds. Ensure this aligns with the rollover strategy outlined in the recommendation table.',
        severity: 'medium'
      });
    }

    // Check for vague language in default benefits
    const simplificationBenefit = visibleBenefits.find(b => 
      b.text.includes('simplify') || b.text.includes('easier')
    );

    if (simplificationBenefit) {
      issues.push({
        id: 'quantify-benefits',
        type: 'benefit',
        targetId: simplificationBenefit.id,
        title: 'Consider Quantifying Benefits',
        description: 'While simplification is valuable, consider adding specific examples or metrics to strengthen this benefit statement.',
        severity: 'low'
      });
    }

    console.log('Final issues array:', issues);
    setComplianceIssues(issues);
    setShowComplianceIssues(true);
  };

  const toggleComplianceView = () => {
    if (!showComplianceIssues) {
      runComplianceCheck();
    } else {
      setShowComplianceIssues(false);
      setComplianceIssues([]);
    }
  };

  const hasIssueForItem = (type: string, itemId: string) => {
    return complianceIssues.some(issue => issue.type === type && issue.targetId === itemId);
  };

  const getIssueForItem = (type: string, itemId: string) => {
    return complianceIssues.find(issue => issue.type === type && issue.targetId === itemId);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="font-tahoma text-lg font-bold text-black">
                Document Preview
              </h2>
              {showComplianceIssues && complianceIssues.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-tahoma text-xs text-red-700">
                    {complianceIssues.length} issue{complianceIssues.length !== 1 ? 's' : ''} found
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleComplianceView}
                className={`px-4 py-2 rounded font-tahoma text-xs transition-colors duration-200 ${
                  showComplianceIssues 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {showComplianceIssues ? 'Hide Issues' : 'Compliance Check'}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-8 bg-white">
            {/* Main Heading */}
            <h1 className="font-tahoma text-lg font-normal text-black mb-4">
              {activeStrategy === 'consolidation' 
                ? 'Consolidate your superannuation funds' 
                : 'Alter your loan repayments'}
            </h1>

            {/* Subtitle */}
            <p className="font-tahoma text-sm text-black mb-6">
              {activeStrategy === 'consolidation'
                ? 'We recommend you consolidate your superannuation funds as listed below.'
                : (
                  <>
                    After reviewing your cashflow position, we recommend you reduce your debt repayments to{' '}
                    <VariableBox
                      number={1}
                      value={interactiveValues['subtitle-amount'] || ''}
                      type="currency"
                      placeholder="$XXX"
                    />
                    {' '}per{' '}
                    <VariableBox
                      number={2}
                      value={interactiveValues['subtitle-frequency'] || ''}
                      type="frequency"
                      placeholder="month/fortnight/week"
                    />
                    {' '}into your{' '}
                    <VariableBox
                      number={3}
                      value={interactiveValues['subtitle-loan-type'] || ''}
                      type="text"
                      placeholder="XXX loan"
                    />
                    .
                  </>
                )}
            </p>

            {/* Table Preview - only show for consolidation strategy */}
            {activeStrategy === 'consolidation' && populatedRows.length > 0 && (
              <div className="mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-teal-600 text-white font-tahoma text-xs font-normal px-3 py-2 text-center border border-gray-300">
                        Fund Name
                      </th>
                      <th className="bg-teal-600 text-white font-tahoma text-xs font-normal px-3 py-2 text-center border border-gray-300">
                        Owner
                      </th>
                      <th className="bg-teal-600 text-white font-tahoma text-xs font-normal px-3 py-2 text-center border border-gray-300">
                        Type of rollover
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {populatedRows.map((row) => (
                      <tr key={row.id}>
                        <td className="border border-gray-300 px-3 py-2 font-tahoma text-xs text-center">
                          {row.fundName || '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 font-tahoma text-xs text-center">
                          {row.owner || '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 font-tahoma text-xs text-center">
                          {row.typeOfRollover || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Aligned Goal Preview */}
            {alignedGoal && (
              <div className="mb-6">
                <h2 className="font-tahoma text-sm font-bold text-black mb-3">
                  Aligned Goal
                </h2>
                <p className="font-tahoma text-sm text-black">
                  {alignedGoal}
                </p>
              </div>
            )}

            {/* Benefits Preview */}
            {visibleBenefits.length > 0 && (
              <div className="mb-6">
                <h2 className="font-tahoma text-sm font-bold text-black mb-4">
                  Why this benefits you
                </h2>
                <div className="space-y-2">
                  {visibleBenefits.map((benefit) => {
                    const hasIssue = showComplianceIssues && hasIssueForItem('benefit', benefit.id);
                    const issue = hasIssue ? getIssueForItem('benefit', benefit.id) : null;
                    
                    return (
                      <div key={benefit.id} className="relative">
                        <div className={`flex items-start gap-2 ${
                          hasIssue ? 'border-2 border-red-500 bg-red-50 p-3 rounded' : ''
                        }`}>
                          <span className="font-tahoma text-sm text-black mt-0.5">•</span>
                          <p className="font-tahoma text-sm text-black leading-relaxed">
                            {renderTextWithInteractive(benefit.text, benefit.id)}
                          </p>
                        </div>
                        {hasIssue && issue && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 p-3 bg-red-100 border-l-4 border-red-500 rounded-r"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <h4 className="font-tahoma text-xs font-bold text-red-800">
                                {issue.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-xs font-tahoma ${
                                issue.severity === 'high' ? 'bg-red-200 text-red-800' :
                                issue.severity === 'medium' ? 'bg-orange-200 text-orange-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>
                                {issue.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="font-tahoma text-xs text-red-700">
                              {issue.description}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Considerations Preview */}
            {visibleConsiderations.length > 0 && (
              <div className="mb-6">
                <h2 className="font-tahoma text-sm font-bold text-black mb-4">
                  Things you should consider
                </h2>
                <div className="space-y-2">
                  {visibleConsiderations.map((consideration) => {
                    const hasIssue = showComplianceIssues && hasIssueForItem('consideration', consideration.id);
                    const issue = hasIssue ? getIssueForItem('consideration', consideration.id) : null;
                    
                    return (
                      <div key={consideration.id} className="relative">
                        <div className={`flex items-start gap-2 ${
                          hasIssue ? 'border-2 border-red-500 bg-red-50 p-3 rounded' : ''
                        }`}>
                          <span className="font-tahoma text-sm text-black mt-0.5">•</span>
                          <p className="font-tahoma text-sm text-black leading-relaxed">
                            {renderTextWithInteractive(consideration.text, consideration.id)}
                          </p>
                        </div>
                        {hasIssue && issue && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 p-3 bg-red-100 border-l-4 border-red-500 rounded-r"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <h4 className="font-tahoma text-xs font-bold text-red-800">
                                {issue.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-xs font-tahoma ${
                                issue.severity === 'high' ? 'bg-red-200 text-red-800' :
                                issue.severity === 'medium' ? 'bg-orange-200 text-orange-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>
                                {issue.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="font-tahoma text-xs text-red-700">
                              {issue.description}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Compliance Issues */}
            {showComplianceIssues && complianceIssues.some(issue => issue.type === 'general') && (
              <div className="mb-6">
                <h3 className="font-tahoma text-sm font-bold text-red-800 mb-3">
                  General Compliance Notes
                </h3>
                <div className="space-y-3">
                  {complianceIssues
                    .filter(issue => issue.type === 'general')
                    .map((issue) => (
                      <motion.div
                        key={issue.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="font-tahoma text-sm font-bold text-orange-800">
                            {issue.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-tahoma ${
                            issue.severity === 'high' ? 'bg-red-200 text-red-800' :
                            issue.severity === 'medium' ? 'bg-orange-200 text-orange-800' :
                            'bg-yellow-200 text-yellow-800'
                          }`}>
                            {issue.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-tahoma text-sm text-orange-700">
                          {issue.description}
                        </p>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!alignedGoal && populatedRows.length === 0 && visibleBenefits.length === 0 && visibleConsiderations.length === 0 && (
              <div className="text-center py-12">
                <p className="font-tahoma text-sm text-gray-500">
                  No content to preview. Fill out the form to see your document.
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white font-tahoma text-xs rounded hover:bg-gray-600 transition-colors duration-200"
            >
              Close Preview
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PreviewModal;