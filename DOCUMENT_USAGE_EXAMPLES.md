# Document Management Center - Usage Examples

## Quick Start Guide

### 1. Access the Page
Navigate to `/documents` in your browser:
```
http://localhost:3000/documents
```

### 2. First Time Setup

When you first visit the page, you'll see an empty state with a prompt to upload your first document.

#### Sample Test Documents to Upload

Here are some example documents you can create for testing:

1. **Invoice Document**
   - Name: `Q4-2025-Invoice.pdf`
   - Type: Invoice
   - Tags: tax, quarterly, vendor-payments
   - Expiry: 2026-12-31
   - Notes: "Q4 invoice for vendor payments and reconciliation"

2. **Certificate Document**
   - Name: `ISO9001-Certificate.pdf`
   - Type: Certificate
   - Tags: quality, iso, certification
   - Expiry: 2026-06-30
   - Notes: "ISO 9001 quality management certification"

3. **Contract Document**
   - Name: `Vendor-A-Contract.pdf`
   - Type: Contract
   - Tags: vendor, legal, procurement
   - Expiry: 2027-01-15
   - Notes: "Annual contract with Vendor A for product supply"

4. **Spec Sheet Document**
   - Name: `Product-X-Specifications.pdf`
   - Type: Specification Sheet
   - Tags: product, specs, technical
   - Notes: "Technical specifications for Product X"

5. **Test Report Document**
   - Name: `QA-Test-Report-Jan2026.pdf`
   - Type: Test Report
   - Tags: qa, testing, quality-assurance
   - Notes: "Monthly quality assurance testing report"

### 3. Creating Folders

Organize your documents with folders:

**Example Folder Structure:**

```
📂 All Documents (24)
📁 Legal Documents (8)
   - Contracts
   - Compliance certificates
   - Legal agreements

📁 Financial Records (12)
   - Invoices
   - Payment receipts
   - Tax documents

📁 Product Documentation (6)
   - Spec sheets
   - Test reports
   - User manuals

📁 Quality Assurance (4)
   - Certificates
   - Test reports
   - Audit documents
```

#### How to Create a Folder:
1. Click "New Folder" button in sidebar
2. Enter folder name: "Legal Documents"
3. Add description: "All legal contracts and compliance documents"
4. Click "Create Folder"

### 4. Uploading Documents

#### Method 1: Drag & Drop
1. Open your file explorer
2. Select one or more files
3. Drag them over the "Drag and drop files here" area
4. Drop the files
5. Fill in the details in the upload dialog
6. Click "Upload Document"

#### Method 2: Browse Files
1. Click "Browse Files" button
2. Select a file from your computer
3. Fill in the details in the upload dialog
4. Click "Upload Document"

### 5. Organizing Documents

#### Add Document to Folder
1. Find the document in the grid/list
2. Click the three-dot menu (⋮)
3. Select "Add to [Folder Name]"
4. Document is now in that folder

#### Remove from Folder
1. Navigate to the folder
2. Find the document
3. Click the three-dot menu (⋮)
4. Select "Remove from Folder"

### 6. Searching Documents

#### Simple Search
```
Search: "invoice"
Results: All documents with "invoice" in name, tags, or notes
```

#### Search by Tag
```
Search: "quality"
Results: All documents tagged with "quality"
```

#### Combined Filters
1. Select a folder: "Legal Documents"
2. Select a type filter: "Contract"
3. Search: "vendor"
4. Result: All vendor contracts in legal documents folder

### 7. Managing Expiry Dates

#### Setting Expiry Dates
When uploading or editing a document:
1. Click "Expiry Date" field
2. Select a date from the calendar
3. Save the document

#### Viewing Expiring Documents
Documents with expiry dates show warning badges:
- 🔴 **Red Alert**: Expired or expires within 7 days
- 🟠 **Orange Warning**: Expires within 30 days
- 🟢 **Green**: Valid (expires after 30 days)

Check the top banner for a summary of all expiring documents.

### 8. Using Tags Effectively

#### Tag Examples by Category

**Financial Documents:**
- tax, quarterly, annual
- invoice, payment, receipt
- budget, forecast, expense

**Legal Documents:**
- contract, agreement, NDA
- compliance, regulatory
- vendor, client, partner

**Quality Documents:**
- qa, testing, audit
- certification, iso, standard
- quality-assurance, inspection

**Product Documents:**
- specs, technical, manual
- product, inventory, SKU
- engineering, design

#### Adding Multiple Tags
In the upload dialog:
1. Type tag name: "quality"
2. Press Enter or click "+"
3. Type next tag: "iso"
4. Press Enter or click "+"
5. Continue for all tags

### 9. Preview and Download

#### Preview Document
1. Click "Preview" button on document card
2. View document details in modal
3. See metadata, tags, expiry, and notes
4. Click "Download" to get the file
5. Click "Close" to exit

#### Quick Download
1. Click "Download" button on document card
2. File downloads immediately

### 10. Editing Document Details

1. Click three-dot menu (⋮) on document
2. Select "Edit Details"
3. Update any field:
   - Name
   - Type
   - Tags
   - Expiry date
   - Notes
4. Click "Save Changes"

### 11. Deleting Documents

1. Click three-dot menu (⋮) on document
2. Select "Delete"
3. Confirm deletion
4. Document is permanently removed

**Note:** Deleting a document removes it from all folders.

## Advanced Use Cases

### Use Case 1: Vendor Onboarding
**Scenario:** Onboarding a new vendor with complete documentation

**Steps:**
1. Create folder: "Vendor-ABC-Onboarding"
2. Upload documents:
   - Business License (Certificate)
   - Tax Registration (Certificate)
   - Contract Agreement (Contract)
   - Product Specifications (Spec Sheet)
   - Quality Test Reports (Test Report)
3. Tag all with: vendor-abc, onboarding, 2026
4. Set expiry dates for certificates and contracts
5. Add notes for each document with relevant details

### Use Case 2: Quarterly Compliance Review
**Scenario:** Reviewing all compliance documents for Q4

**Steps:**
1. Click folder: "Quality Assurance"
2. Filter by type: "Certificate"
3. Check expiry warnings (orange/red badges)
4. Download expiring documents for renewal
5. Upload new certificates when received
6. Update tags: add q4-2025

### Use Case 3: Product Launch Documentation
**Scenario:** Organizing all documents for new product launch

**Steps:**
1. Create folder: "Product-Launch-2026"
2. Upload product documents:
   - Technical specifications (Spec Sheet)
   - Safety certificates (Certificate)
   - Test reports (Test Report)
   - Marketing materials (Other)
3. Tag all with: product-launch, 2026, product-name
4. Set reminders for certificate renewals
5. Add detailed notes for each phase

### Use Case 4: Financial Year-End
**Scenario:** Gathering all financial documents for year-end closing

**Steps:**
1. Navigate to folder: "Financial Records"
2. Filter by type: "Invoice"
3. Search: "2025"
4. Sort by: Date (ascending)
5. Download all documents for accounting review
6. Upload year-end summary (Other)
7. Tag with: year-end, 2025, audit

### Use Case 5: Quality Audit Preparation
**Scenario:** Preparing for ISO audit

**Steps:**
1. Create folder: "ISO-Audit-2026"
2. Search across all folders: "iso"
3. Add relevant documents to audit folder
4. Filter by type: "Certificate" and "Test Report"
5. Check all expiry dates
6. Download audit package
7. Upload audit results when complete

## Tips & Best Practices

### Organization Tips

1. **Use Consistent Naming**
   ```
   Format: [Type]-[Entity]-[Date]
   Examples:
   - Invoice-VendorA-2026-01
   - Certificate-ISO9001-2026
   - Contract-SupplierB-Annual
   ```

2. **Create a Folder Hierarchy**
   ```
   Main Categories:
   - Legal
   - Financial
   - Quality
   - Products
   - Vendors

   Subfolders (using tags):
   - Financial → #q1, #q2, #q3, #q4
   - Vendors → #vendor-a, #vendor-b
   ```

3. **Tag Everything**
   - Use 3-5 relevant tags per document
   - Include year tags: #2026, #2025
   - Add entity tags: #vendor-name, #product-name
   - Use category tags: #quality, #financial

4. **Set Expiry Dates**
   - Always add expiry for certificates
   - Set expiry for contracts
   - Add reminders for renewal documents

5. **Add Detailed Notes**
   - Include context for future reference
   - Note related documents or dependencies
   - Add approval status or next steps

### Search Tips

1. **Use Specific Terms**
   - ❌ Bad: "doc"
   - ✅ Good: "vendor contract"

2. **Combine Filters**
   - Select folder first
   - Then filter by type
   - Finally search by keyword

3. **Search by Date**
   - Use sort by date
   - Filter by year using tags

### Performance Tips

1. **Regular Cleanup**
   - Delete outdated documents monthly
   - Archive old folders (create Archive folder)
   - Remove unused tags

2. **Optimize Uploads**
   - Compress large PDFs
   - Use consistent file formats
   - Batch upload related documents

3. **Review Regularly**
   - Check expiring documents weekly
   - Audit folders monthly
   - Update tags quarterly

## Keyboard Shortcuts (Future Enhancement)

Planned keyboard shortcuts for power users:

```
Ctrl/Cmd + U     : Upload document
Ctrl/Cmd + F     : Focus search
Ctrl/Cmd + N     : New folder
Escape           : Close dialogs
Arrow Keys       : Navigate documents
Enter            : Preview selected document
Delete           : Delete selected document
```

## Integration Examples

### Linking Documents to Orders
```typescript
uploadDocument({
  name: "Purchase Order #12345",
  type: "other",
  relatedTo: {
    type: "order",
    id: "12345",
    name: "Order #12345"
  },
  // ... other fields
})
```

### Linking Documents to Products
```typescript
uploadDocument({
  name: "Product X Specifications",
  type: "spec_sheet",
  relatedTo: {
    type: "product",
    id: "prod-x-123",
    name: "Product X"
  },
  // ... other fields
})
```

### Linking Documents to Vendors
```typescript
uploadDocument({
  name: "Vendor A Contract",
  type: "contract",
  relatedTo: {
    type: "vendor",
    id: "vendor-a-789",
    name: "Vendor A Inc."
  },
  // ... other fields
})
```

## Troubleshooting

### Issue: Document Not Uploading
**Solutions:**
- Check file size (should be < 100MB)
- Verify file format is supported
- Clear browser cache
- Try different browser

### Issue: Can't Find Document
**Solutions:**
- Clear all filters
- Check "All Documents" folder
- Try different search terms
- Sort by date to find recent uploads

### Issue: Expiry Date Not Showing Warning
**Solutions:**
- Verify expiry date is set
- Check if date is within 30 days
- Refresh the page
- Clear browser cache

### Issue: Tags Not Saving
**Solutions:**
- Press Enter after typing tag
- Click the "+" button
- Check for special characters
- Try re-uploading document

## API Integration (Future)

Example of integrating with backend API:

```typescript
// Upload to server
const handleServerUpload = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('metadata', JSON.stringify({
    name: file.name,
    type: selectedType,
    tags: tags,
    expiryDate: expiryDate
  }))

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData
  })

  const data = await response.json()

  // Add to store
  uploadDocument({
    ...data,
    fileUrl: data.url
  })
}
```

---

**Last Updated:** 2026-01-29
**Version:** 1.0
**Status:** Production Ready
