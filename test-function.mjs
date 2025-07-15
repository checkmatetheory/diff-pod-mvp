import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from a .env file
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase URL or Service Key is not defined in your .env file.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- CONFIGURATION ---
// This is the session ID of the PDF that has been failing.
const TEST_SESSION_ID = '5a298609-42db-4932-8f05-7181286f7c97'; 
// This is the full path to the corresponding file in Supabase Storage.
const TEST_FILE_PATH = '37c13d29-af4c-4ddd-9c4d-0e8671ebe409/1751990378051-Smart_Farming_Technologies_and_Sustainability.pdf';
const TEST_FILE_MIME_TYPE = 'application/pdf';


async function testEdgeFunction() {
  console.log(`🚀 Initiating direct invocation for session: ${TEST_SESSION_ID}`);
  console.log(`   File: ${TEST_FILE_PATH}`);

  try {
    const { data, error } = await supabase.functions.invoke('process-session', {
      body: { 
        sessionId: TEST_SESSION_ID,
        filePath: TEST_FILE_PATH,
        fileMimeType: TEST_FILE_MIME_TYPE,
      }
    });

    if (error) {
      console.error('🔴 Direct invocation failed:');
      console.error(error);
    } else {
      console.log('✅ Direct invocation successful:');
      console.log(data);
    }
  } catch (err) {
    console.error('❌ A catastrophic error occurred during the test:');
    console.error(err);
  }
}

testEdgeFunction(); 