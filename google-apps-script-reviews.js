/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: LIVE DATABASE FOR SUDIP GHOSH STUDENT REVIEWS
 * ============================================================================
 * 
 * SETUP INSTRUCTIONS (Takes ~2 minutes):
 * 1. Open Google Sheets (https://sheets.new) in your browser.
 * 2. Name the spreadsheet: "Sudip Ghosh Student Reviews".
 * 3. In the top menu, click: Extensions -> Apps Script.
 * 4. Delete any existing code in the editor, and paste THIS ENTIRE FILE.
 * 5. Click the "Save" (disk) icon.
 * 6. Click the blue "Deploy" button at the top right -> Choose "New deployment".
 * 7. Click the Gear icon next to "Select type" -> Select "Web app".
 * 8. Set the following settings:
 *      - Description: "Live Student Reviews API"
 *      - Execute as: "Me (your email)"
 *      - Who has access: "Anyone"  <-- CRITICAL: Allows website visitors to submit and view reviews!
 * 9. Click "Deploy" (Google will ask you to authorize permissions -> click "Advanced" -> "Go to Sudip Ghosh Reviews (unsafe)").
 * 10. Copy the "Web app URL" (it starts with https://script.google.com/macros/s/.../exec).
 * 11. Paste that URL into index.html inside the REVIEWS_API_URL constant!
 * ============================================================================
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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
