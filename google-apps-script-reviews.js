/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: LIVE DATABASE FOR SUDIP GHOSH STUDENT REVIEWS
 * ============================================================================
 * 
 * SPREADSHEET LINKED:
 * https://docs.google.com/spreadsheets/d/1sbIY4YXl4Z2QF8WREC5_MC5ncE4JOH14Fz7qCM0Tuqw/edit
 * 
 * EASY SETUP INSTRUCTIONS (~1-2 minutes):
 * 1. Open your Apps Script tab.
 * 2. Delete existing code and paste THIS ENTIRE FILE.
 * 3. Click Save (Ctrl+S).
 * 4. Click Deploy -> Manage deployments -> Click the pencil icon next to active deployment.
 * 5. Under "Version", choose "New version" -> Click "Deploy".
 * ============================================================================
 */

const TARGET_SPREADSHEET_ID = '1sbIY4YXl4Z2QF8WREC5_MC5ncE4JOH14Fz7qCM0Tuqw';

function getSheet() {
  if (TARGET_SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID).getActiveSheet();
    } catch (e) {
      Logger.log("openById error: " + e.toString());
      throw new Error("Could not open spreadsheet with ID " + TARGET_SPREADSHEET_ID + ": " + e.message);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

function doGet(e) {
  try {
    const sheet = getSheet();
    ensureHeaders(sheet);
    
    const rows = sheet.getDataRange().getValues();
    
    // If only header row exists
    if (rows.length <= 1) {
      return jsonResponse({ status: 'success', data: [] });
    }
    
    // Columns: [0: Timestamp, 1: Name, 2: Email, 3: Program, 4: Badge, 5: Rating, 6: Text, 7: Approved]
    const reviews = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const approved = row[7];
      
      // Included if Approved is TRUE, 'TRUE', 'yes', or true boolean
      const isApproved = (approved === true || approved === 'TRUE' || approved === 'true' || approved === 'Yes' || approved === 'yes');
      
      if (isApproved && row[1] && row[6]) {
        reviews.push({
          timestamp: row[0],
          name: String(row[1]),
          email: String(row[2]),
          program: String(row[3]),
          badge: String(row[4]),
          rating: Number(row[5]) || 5,
          text: String(row[6])
        });
      }
    }
    
    // Most recent reviews first
    reviews.reverse();
    
    return jsonResponse({ status: 'success', data: reviews });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const sheet = getSheet();
    ensureHeaders(sheet);
    
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }
    
    const timestamp = new Date();
    const name = data.name || 'Anonymous Student';
    const email = data.email || '';
    const program = data.program || 'Competitive Exams';
    const badge = data.badge || 'Verified Student';
    const rating = Number(data.rating) || 5;
    const text = data.text || '';
    
    // Auto-approve so it immediately shows up for everyone:
    // To hide any review later, simply open your Google Sheet and change TRUE to FALSE in that row!
    const approved = true;
    
    sheet.appendRow([timestamp, name, email, program, badge, rating, text, approved]);
    
    return jsonResponse({ status: 'success', message: 'Review successfully recorded' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Student Name',
      'Email (Verification)',
      'Program / Exam',
      'Role / College / Rank',
      'Star Rating (1-5)',
      'Review Testimonial',
      'Approved (TRUE/FALSE)'
    ]);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f4f6');
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

