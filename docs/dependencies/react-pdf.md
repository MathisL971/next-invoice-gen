# @react-pdf/renderer Documentation

## Installation

```bash
npm install @react-pdf/renderer
```

## Basic Usage

### Create a PDF Document

```jsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E4',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
});

// Create Document Component
const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text>Section #1</Text>
      </View>
      <View style={styles.section}>
        <Text>Section #2</Text>
      </View>
    </Page>
  </Document>
);
```

## Server-Side Generation

### Render to File (Node.js)

```jsx
import ReactPDF from '@react-pdf/renderer';

ReactPDF.render(<MyDocument />, `${__dirname}/example.pdf`);
```

### Render to Buffer

```javascript
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text } from '@react-pdf/renderer';

const Invoice = ({ invoiceNumber, amount }) => (
  <Document>
    <Page>
      <Text>Invoice #{invoiceNumber}</Text>
      <Text>Total: ${amount}</Text>
    </Page>
  </Document>
);

// Generate buffer for API response or upload
const buffer = await renderToBuffer(
  <Invoice invoiceNumber="INV-001" amount={1250} />
);

// Use buffer in API route
return new Response(buffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="invoice.pdf"',
  },
});
```

### Render to Stream

```javascript
import { renderToStream } from '@react-pdf/renderer';

const stream = await renderToStream(<MyDocument />);
// Use stream for streaming responses
```

### Render to File with Callback

```javascript
import { renderToFile } from '@react-pdf/renderer';
import path from 'path';

await renderToFile(
  <Report data={{ sales: 50000, revenue: 75000 }} />,
  path.join(__dirname, 'output', 'report.pdf'),
  (output, filePath) => {
    console.log(`PDF saved to: ${filePath}`);
  }
);
```

## Client-Side Generation

### PDFViewer Component

Render PDF in browser:

```jsx
import { PDFViewer } from '@react-pdf/renderer';

const App = () => (
  <PDFViewer>
    <MyDocument />
  </PDFViewer>
);
```

### BlobProvider Component

Generate PDF blob for download/preview:

```jsx
import { Document, Page, Text, BlobProvider } from '@react-pdf/renderer';

const Certificate = ({ name, course, date }) => (
  <Document>
    <Page size="A4" style={{ padding: 60, textAlign: 'center' }}>
      <Text style={{ fontSize: 32, marginTop: 100 }}>
        Certificate of Completion
      </Text>
      <Text style={{ fontSize: 20, marginTop: 40 }}>
        This certifies that
      </Text>
      <Text style={{ fontSize: 24, marginTop: 20, fontWeight: 'bold' }}>
        {name}
      </Text>
    </Page>
  </Document>
);

function CertificateGenerator() {
  return (
    <BlobProvider document={<Certificate name="John Doe" course="React" date="2024" />}>
      {({ blob, url, loading, error }) => {
        if (loading) return <div>Loading certificate...</div>;
        if (error) return <div>Error: {error.message}</div>;

        return (
          <div>
            <a href={url} download="certificate.pdf">
              Download Certificate
            </a>
            <iframe src={url} width="100%" height="500px" />
          </div>
        );
      }}
    </BlobProvider>
  );
}
```

### usePDF Hook

Dynamic PDF generation with state:

```jsx
import { Document, Page, Text, usePDF } from '@react-pdf/renderer';

const MyDocument = ({ content }) => (
  <Document>
    <Page>
      <Text>{content}</Text>
    </Page>
  </Document>
);

function PDFGenerator() {
  const [content, setContent] = useState('Initial content');
  const [instance, updateInstance] = usePDF({
    document: <MyDocument content={content} />
  });

  const handleUpdate = () => {
    const newContent = `Updated at ${new Date().toLocaleTimeString()}`;
    setContent(newContent);
    updateInstance(<MyDocument content={newContent} />);
  };

  if (instance.loading) {
    return <div>Generating PDF...</div>;
  }

  if (instance.error) {
    return <div>Error: {instance.error.message}</div>;
  }

  return (
    <div>
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={handleUpdate}>Update PDF</button>

      {instance.url && (
        <div>
          <a href={instance.url} download="document.pdf">
            Download PDF
          </a>
          <iframe
            src={instance.url}
            width="100%"
            height="600px"
            title="PDF Preview"
          />
        </div>
      )}
    </div>
  );
}
```

## Components

### Document

Root component that wraps all pages:

```jsx
<Document>
  <Page>...</Page>
  <Page>...</Page>
</Document>
```

### Page

Represents a single page:

```jsx
<Page size="A4" style={styles.page}>
  {/* Content */}
</Page>
```

Page sizes: `A4`, `A3`, `A5`, `Letter`, `Legal`, etc.

### View

Container component (like `<div>`):

```jsx
<View style={styles.container}>
  <Text>Content</Text>
</View>
```

### Text

Text component:

```jsx
<Text style={styles.title}>Hello World</Text>
```

### StyleSheet

Create styles (similar to React Native):

```jsx
const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  content: {
    fontSize: 12,
  },
});
```

**Important**: Styles must use StyleSheet API - no CSS classes or inline styles as strings.

## Styling

### Supported Styles

Most CSS properties are supported, but use camelCase:

```jsx
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 10,
    border: '1px solid #000000',
    borderRadius: 5,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
});
```

### Flexbox

```jsx
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
});
```

## Next.js API Route Example

```typescript
// app/api/invoices/[id]/pdf/route.ts
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 10 },
});

const InvoicePDF = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Invoice #{invoice.number}</Text>
      <Text>Amount: ${invoice.amount}</Text>
    </Page>
  </Document>
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Fetch invoice data
  const invoice = await getInvoice(id);
  
  // Generate PDF buffer
  const buffer = await renderToBuffer(
    <InvoicePDF invoice={invoice} />
  );
  
  // Return PDF response
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.number}.pdf"`,
    },
  });
}
```

## Key Points

1. **Styles must use StyleSheet.create()** - No CSS classes or string styles
2. **Server-side rendering** - Use `renderToBuffer()` or `renderToStream()` in API routes
3. **Client-side preview** - Use `BlobProvider` or `usePDF` hook
4. **Font support** - May need to register custom fonts for special characters
5. **Page sizes** - Use standard sizes like `A4`, `Letter`, etc.
6. **Styling limitations** - Not all CSS properties are supported, check documentation

