# Word Template Structure

## Consolidation Template Structure

```
{{title}}

{{subtitle}}

{{#hasTable}}
| Fund Name | Owner | Type of rollover |
{{#tableRows}}
| {{fundName}} | {{owner}} | {{typeOfRollover}} |
{{/tableRows}}
{{/hasTable}}

{{#hasAlignedGoal}}
{{alignedGoal}}
{{/hasAlignedGoal}}

{{#hasBenefits}}
{{#approvedBenefits}}
• {{text}}
{{/approvedBenefits}}
{{/hasBenefits}}

{{#hasConsiderations}}
{{#approvedConsiderations}}
• {{text}}
{{/approvedConsiderations}}
{{/hasConsiderations}}
```

## Loan Repayment Template Structure

```
{{title}}

{{subtitle}}

{{#hasAlignedGoal}}
{{alignedGoal}}
{{/hasAlignedGoal}}

{{#hasBenefits}}
{{#approvedBenefits}}
• {{text}}
{{/approvedBenefits}}
{{/hasBenefits}}

{{#hasConsiderations}}
{{#approvedConsiderations}}
• {{text}}
{{/approvedConsiderations}}
{{/hasConsiderations}}
```

## Instructions for Creating DOCX Templates

1. Open Microsoft Word
2. Create a new document with the exact formatting you want:
   - Font: Tahoma
   - Headings: Bold, appropriate sizes
   - Table: Teal header with white text
   - Bullets: Standard bullet points
   - Spacing: Match preview modal exactly

3. Replace content with placeholders as shown above
4. Save as .docx format in the public/templates folder
5. Name files:
   - consolidation-template.docx
   - loan-repayment-template.docx