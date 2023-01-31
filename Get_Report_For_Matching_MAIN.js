// Crating Assets Dictionary for future matching
// F - Sitelink Texts Dictionary
function createDictionary(query, key, value) {
  let dictionary = {};

  const report = AdsApp.report(query);
  const rows = report.rows();

  while (rows.hasNext()) {
    let row = rows.next();
    dictionary[row[key]] = row[value];
  }

  return dictionary;
}

// F - Transform labels data in to a list
function translateLabels(campaignLabels, labelsDictionary) {
  const translatedLabels = [];

  if (campaignLabels !== undefined) {
    for (const oldLabel of campaignLabels) {
      const newLabel = labelsDictionary[oldLabel];
      translatedLabels.push(newLabel);
    }
  }

  return translatedLabels;
}

// F - Matching Report taken by getReport function and Dictionaries. Creating New report format
function transformReport(report) {
  const labelDictionary = createDictionary(QUERY.label, "label.resource_name", "label.name");

  const result = [];

  const rows = report.rows();
  while (rows.hasNext()) {

    let row = rows.next();

    // Replace IDs in report by Names form dictionaries
    const currentLabels = translateLabels(row["campaign.labels"], labelDictionary);

    result.push(
      {
        "Account ID": `${row["customer.id"].substring(0, 3)}-${row["customer.id"].substring(3, 6)}-${row["customer.id"].substring(6)}`,
        "Account Name": row["customer.descriptive_name"],
        "Currency": row["customer.currency_code"],
        "Asset ID": row["asset.id"],
        "Campaign": row["campaign.name"],
        "Campaign ID": row["campaign.id"],
        "Campaign Label Names": currentLabels.join(","),
        "Campaign Status": row["campaign.status"],
        "Clicks": row["metrics.clicks"],
        "Impressions": row["metrics.impressions"],
        "Cost": row["metrics.cost_micros"] / 1000000,
        "Video Views": row["metrics.video_views"]
      }
    );
  }

  prettyPrint(result);
  return result;
}

// F - Exporting New Report into Google Spreadsheet
function exportReport(sheet, reportTable) {
  const report = reportTable;

  // Creating Headline for a report table, if it's empty
  if (!sheet.getLastRow()) {
    sheet.appendRow(Object.keys(report[0]));
  }

  // Transforming Report from Object to Array for fast uploading
  let reportArray = [];
  for (const row of report) {
    reportArray.push(Object.values(row));
  }

  // Set an empty range in Google Spreadsheet for uploading data from Array
  var range = sheet.getRange((sheet.getLastRow() + 1), 1, (reportArray.length), (reportArray[0].length));
  range.setValues(reportArray);

}

// F - Send Email with attached file
function sendEmail(recipient, fileURL) {

  // Getting useful data for the email text
  const currentAccount = AdsApp.currentAccount();
  const accountName = currentAccount.getName();
  const accountID = currentAccount.getCustomerId();
  const attachment = SpreadsheetApp.openByUrl(fileURL);

  // Sending the email
  MailApp.sendEmail({
    to: recipient,
    subject: `Report for Sitelinks Extension is ready for ${accountName} (${accountID}) by "Get_That_F_Links_Report_Script"`,
    htmlBody: `Hi!<br>
              Script "Get_That_F_Links_Report_Script" created report for your ${accountID} <br>

              More information you may find in the attached file:<br>
              ${attachment.getUrl()}`
  });
}

// F - Is needed for debugging some code
function prettyPrint(obj) {
  console.log(JSON.stringify(obj, null, 4));
}

// F - Main function. It's processed for itch account one by one
function runPerAccount(sheet) {

  let report = AdsApp.report(QUERY.campaign);
  let result = transformReport(report);

  prettyPrint(result);

  //  sendEmail(CONFIG.emailRecipient, CONFIG.sheetURL);
  exportReport(sheet, result);
}

// F - Main MCC function
function main() {

  let accountIterator = AdsManagerApp.accounts().get();
  let accountIDs = [];

  for (const account of accountIterator) {
    const accountName = account.getName();
    const accountId = account.getCustomerId();
    const accountImppressions = account.getStatsFor("LAST_7_DAYS").getImpressions();
    console.log(`Account: ${accountName} with ID: ${accountId} has ${accountImppressions} impressions`);

    if (accountImppressions > 0) {
      accountIDs.push(accountId);
    }
  }

  accountIterator = AdsManagerApp.accounts()
    .withIds(accountIDs)
    .get();

  // Getting Spreadsheet and clearing it
  const spreadsheet = SpreadsheetApp.openByUrl(CONFIG.sheetURL);
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  sheet.clearContents();

  while (accountIterator.hasNext()) {
    let account = accountIterator.next();
    AdsManagerApp.select(account);
    runPerAccount(sheet);
  }

}
