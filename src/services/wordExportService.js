// Word Export Service - Handles document generation using docxtemplater

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import expressions from 'angular-expressions';

// Configure angular-expressions parser for handling template logic
expressions.filters.upper = function(input) {
  return input ? input.toUpperCase() : '';
};

expressions.filters.lower = function(input) {
  return input ? input.toLowerCase() : '';
};

const angularParser = function(tag) {
  return {
    get: tag === '.' ? function(s) { return s; } : expressions.compile(tag)
  };
};

/**
 * Loads a Word template from the public/templates folder
 */
export const loadTemplate = async (templateName) => {
  try {
    const response = await fetch(`/templates/${templateName}`);
    
    if (!response.ok) {
      throw new Error(`Template not found: ${templateName}`);
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error loading template:', error);
    throw new Error(`Failed to load template: ${templateName}`);
  }
};

/**
 * Generates a Word document from template and data
 */
export const generateDocument = async (templateBuffer, documentData) => {
  try {
    // Create PizZip instance from template buffer
    const zip = new PizZip(templateBuffer);
    
    // Create Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      parser: angularParser,
      linebreaks: true,
      paragraphLoop: true,
      nullGetter() { 
        return ''; // Return empty string for missing values
      },
      delimiters: {
        start: '{{',
        end: '}}'
      }
    });
    
    // Render the document with data
    doc.render(documentData);
    
    // Generate the document blob
    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE'
    });
    
    return blob;
    
  } catch (error) {
    console.error('Error generating document:', error);
    
    // Provide more specific error messages
    if (error.properties && error.properties.errors) {
      const templateErrors = error.properties.errors.map(err => 
        `Template error: ${err.message} at ${err.part}`
      ).join('\n');
      throw new Error(`Template processing failed:\n${templateErrors}`);
    }
    
    throw new Error(`Document generation failed: ${error.message}`);
  }
};

/**
 * Main export function that handles the complete flow
 */
export const exportToWord = async (activeStrategy, documentData, filename) => {
  try {
    // Determine template name based on strategy
    const templateName = activeStrategy === 'consolidation' 
      ? 'consolidation-template.docx' 
      : 'loan-repayment-template.docx';
    
    console.log('Starting export process...', {
      strategy: activeStrategy,
      templateName: templateName,
      hasData: !!documentData
    });
    
    // Load the template
    const templateBuffer = await loadTemplate(templateName);
    console.log('Template loaded successfully');
    
    // Generate the document
    const documentBlob = await generateDocument(templateBuffer, documentData);
    console.log('Document generated successfully');
    
    // Save the file
    saveAs(documentBlob, filename);
    console.log('Document saved:', filename);
    
    return { success: true, filename };
    
  } catch (error) {
    console.error('Export failed:', error);
    return { 
      success: false, 
      error: error.message,
      details: error.stack
    };
  }
};

/**
 * Validates document data before export
 */
export const validateDocumentData = (documentData) => {
  const warnings = [];
  const errors = [];
  
  // Check for required fields
  if (!documentData.title) {
    errors.push('Document title is missing');
  }
  
  if (!documentData.subtitle) {
    warnings.push('Document subtitle is missing');
  }
  
  // Strategy-specific validation
  if (documentData.isConsolidation) {
    if (!documentData.hasTable && !documentData.hasBenefits && !documentData.hasConsiderations) {
      warnings.push('Document appears to be empty - no table data or approved bullet points');
    }
  }
  
  if (documentData.isLoanRepayment) {
    if (!documentData.hasBenefits && !documentData.hasConsiderations) {
      warnings.push('Document appears to be empty - no approved bullet points');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Preview function to check what data will be exported (for debugging)
 */
export const previewExportData = (documentData) => {
  console.group('📄 Document Export Preview');
  console.log('Strategy:', documentData.isConsolidation ? 'Consolidation' : 'Loan Repayment');
  console.log('Title:', documentData.title);
  console.log('Subtitle:', documentData.subtitle);
  console.log('Has Aligned Goal:', documentData.hasAlignedGoal);
  
  if (documentData.hasTable) {
    console.log('Table Rows:', documentData.tableRows.length);
  }
  
  console.log('Approved Benefits:', documentData.approvedBenefits?.length || 0);
  console.log('Approved Considerations:', documentData.approvedConsiderations?.length || 0);
  
  console.log('Full Data:', documentData);
  console.groupEnd();
  
  return documentData;
};