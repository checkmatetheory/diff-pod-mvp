import express from 'express';
import { fromBuffer } from 'pdf2pic';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// PDF to images endpoint
app.post('/process-pdf', upload.single('pdf'), async (req, res) => {
  try {
    console.log('📄 Received PDF processing request');
    
    let pdfBuffer;
    
    // Handle both file upload and base64 input
    if (req.file) {
      pdfBuffer = req.file.buffer;
      console.log('📤 Processing uploaded PDF file:', req.file.originalname);
    } else if (req.body.pdfBase64) {
      pdfBuffer = Buffer.from(req.body.pdfBase64, 'base64');
      console.log('📤 Processing base64 PDF data');
    } else {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    console.log('📊 PDF buffer size:', pdfBuffer.length, 'bytes');

    // Configure pdf2pic options
    const options = {
      density: 300,           // High quality
      saveFilename: "page",
      savePath: "./temp",     // Temporary save path
      format: "png",          // PNG format for better quality
      width: 2048,           // High resolution
      height: 2048,
      preserveAspectRatio: true
    };

    // Initialize pdf2pic converter
    const convert = fromBuffer(pdfBuffer, options);
    
    console.log('🔄 Converting PDF pages to images...');
    
    // Convert all pages (use -1 for all pages)
    const results = await convert.bulk(-1, { responseType: "base64" });
    
    console.log('✅ Converted', results.length, 'pages successfully');
    
    // Extract base64 data from results
    const pageImages = results.map((result, index) => ({
      pageNumber: index + 1,
      base64: result.base64,
      width: result.width || options.width,
      height: result.height || options.height
    }));

    res.json({
      success: true,
      totalPages: pageImages.length,
      pages: pageImages,
      processingTime: Date.now()
    });

  } catch (error) {
    console.error('❌ PDF processing error:', error);
    res.status(500).json({
      error: 'PDF processing failed',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'PDF Processor',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 PDF Processing Service running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});

export default app; 