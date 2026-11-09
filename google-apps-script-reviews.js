/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: LIVE DATABASE FOR SUDIP GHOSH STUDENT REVIEWS
 * ============================================================================
 * 
 * SPREADSHEET LINKED:
 * https://docs.google.com/spreadsheets/d/1sblY4YXl47ZQFRWRFC5_MC5ncF4JOH14Fz7qCM0Tuqw/edit
 * 
 * EASY SETUP INSTRUCTIONS (~1-2 minutes):
 * 1. Open a new tab and go directly to: https://script.new
 * 2. Delete any existing code in the editor, and paste THIS ENTIRE FILE.
 * 3. Click the "Save" (disk) icon at the top.
 * 4. Click the blue "Deploy" button at the top right -> Choose "New deployment".
 * 5. Click the Gear icon next to "Select type" -> Select "Web app".
 * 6. Set the following:
 *      - Description: "Sudip Ghosh Student Reviews API"
 *      - Execute as: "Me"
 *      - Who has access: "Anyone"  <-- CRITICAL: Allows public visitors to view & post reviews!
 * 7. Click "Deploy".
 *    (If asked to authorize: Click "Authorize Access" -> choose your Google account -> "Advanced" -> "Go to Untitled project (unsafe)" -> "Allow").
 * 8. Copy the "Web app URL" (starts with https://script.google.com/macros/s/.../exec).
 * 9. Send that URL here!
 * ============================================================================
 */

const TARGET_SPREADSHEET_ID = '1sblY4YXl47ZQFRWRFC5_MC5ncF4JOH14Fz7qCM0Tuqw';

function getSheet() {
  if (TARGET_SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID).getActiveSheet();
    } catch (e) {
      // Fallback to active spreadsheet if bound
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

