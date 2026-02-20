# Elite Quiz Pro - Setup Instructions

## 📊 Google Sheets Database Setup

To enable the one-time attempt system, leaderboard, and data saving, follow these steps:

1. **Create a Google Sheet**:
   - Create a new Google Sheet.
   - Set the headers in row 1: `Full Name`, `Roll Number`, `Score`, `Percentage`, `Badge`, `Timestamp`.
   - **Important**: The sheet name must be `Sheet1` (default).

2. **Create Apps Script**:
   - In your Google Sheet, go to **Extensions > Apps Script**.
   - Delete any existing code and paste the following:

```javascript
function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (action === 'check') {
    var rollNumber = e.parameter.rollNumber;
    var exists = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString() === rollNumber.toString()) {
        exists = true;
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ exists: exists }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'fetch') {
    var results = [];
    for (var i = 1; i < data.length; i++) {
      results.push({
        name: data[i][0],
        rollNumber: data[i][1],
        score: data[i][2],
        percentage: data[i][3],
        badge: data[i][4]
      });
    }
    return ContentService.createTextOutput(JSON.stringify(results))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  if (data.action === 'append') {
    sheet.appendRow([
      data.fullName,
      data.rollNumber,
      data.score,
      data.percentage,
      data.badge,
      data.timestamp
    ]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }
}
```

3. **Deploy Web App**:
   - Click **Deploy > New Deployment**.
   - Select type: **Web App**.
   - Description: "Elite Quiz Backend v2".
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Click **Deploy**.
   - Copy the **Web App URL**.

4. **Connect to App**:
   - Open `src/App.tsx`.
   - Find `const GOOGLE_SHEETS_WEBHOOK_URL = "";`.
   - Paste your Web App URL between the quotes.

## 🚀 Deployment

1. Run `npm run build`.
2. Upload the `dist` folder to your hosting provider.
