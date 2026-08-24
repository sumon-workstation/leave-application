/**
 * Live Corps — leave application recorder.
 * Paste this into Extensions > Apps Script on the Google Sheet that will hold the records,
 * then deploy as a Web App (Execute as: Me, Access: Anyone).
 * Full steps are in README.md.
 */

var SHEET_NAME = 'Leave Records';
var NOTIFY = '';   // e.g. 'hr@livecorps.com' — leave empty to skip email alerts

var HEADERS = [
  'Reference', 'Submitted At', 'Employee ID', 'Employee Name', 'Designation',
  'Department', 'Date of Joining', 'Status', 'Leave Type', 'Compensatory Against',
  'From', 'To', 'Duration', 'Days Applied', 'Signed By', 'Signed On',
  'Approval', 'Approver', 'Decision Date', 'Rejection Reason'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var d = JSON.parse(e.postData.contents);

    // server-side guard: never trust the browser alone
    var required = ['employeeId', 'employeeName', 'leaveType', 'from', 'to', 'signedBy'];
    for (var i = 0; i < required.length; i++) {
      if (!d[required[i]]) return json({ status: 'error', message: 'missing ' + required[i] });
    }
    if (d.to < d.from) return json({ status: 'error', message: 'end date is before start date' });

    var sheet = getSheet();
    var ref = nextReference(sheet);

    sheet.appendRow([
      ref, new Date(), d.employeeId, d.employeeName, d.designation,
      d.department, d.dateOfJoining, d.status, d.leaveType, d.compensatoryAgainst || '',
      d.from, d.to, d.duration, d.appliedDays, d.signedBy, d.signedOn,
      'Pending', '', '', ''
    ]);

    if (NOTIFY) notify(ref, d);
    return json({ status: 'ok', reference: ref });

  } catch (err) {
    return json({ status: 'error', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function doGet() {
  return json({ status: 'ok', message: 'Leave recorder is running. Submit via POST.' });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#f2f2f0');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 130);
    sheet.setColumnWidth(4, 200);
    sheet.setColumnWidth(9, 220);
  }
  return sheet;
}

/** LV-2026-0001, restarting each year */
function nextReference(sheet) {
  var year = new Date().getFullYear();
  var last = sheet.getLastRow();
  var seq = 0;
  if (last > 1) {
    var refs = sheet.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < refs.length; i++) {
      var m = String(refs[i][0]).match(/^LV-(\d{4})-(\d+)$/);
      if (m && Number(m[1]) === year) seq = Math.max(seq, Number(m[2]));
    }
  }
  return 'LV-' + year + '-' + ('0000' + (seq + 1)).slice(-4);
}

function notify(ref, d) {
  var subject = 'Leave application ' + ref + ' — ' + d.employeeName;
  var body = [
    'A new leave application was submitted.',
    '',
    'Reference:   ' + ref,
    'Employee:    ' + d.employeeName + ' (' + d.employeeId + ')',
    'Role:        ' + d.designation + ', ' + d.department,
    'Status:      ' + d.status,
    'Leave type:  ' + d.leaveType,
    'Dates:       ' + d.from + ' to ' + d.to + ' (' + d.duration + ')',
    'Days:        ' + d.appliedDays,
    'Signed:      ' + d.signedBy + ' on ' + d.signedOn,
    '',
    'Open the sheet to record the approval decision:',
    SpreadsheetApp.getActiveSpreadsheet().getUrl()
  ].join('\n');
  MailApp.sendEmail(NOTIFY, subject, body);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to create the sheet and grant permissions. */
function setup() {
  getSheet();
  Logger.log('Sheet ready. Next reference: ' + nextReference(getSheet()));
}
