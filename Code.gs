function getDates(){
  var startDate = new Date('2019-12-01')
  var endDate = new Date(Date.now() - 86400 * 1000)
  var days60 = 60 * 86400 * 1000 // 60 дней переводим в миллисекунды  
  var daysDelta = endDate - startDate //количество миллисекунд между двумя датами
  if (daysDelta > days60){ //если разница между датой окончания и даты начала больше 60 дней
     startDate = new Date(endDate - days60) // от даты конца отнимаем 60 дней     
     var startDateFormatted = Utilities.formatDate(startDate, 'GMT+3', 'yyyy-MM-dd')
     var endDateFormatted = Utilities.formatDate(endDate, 'GMT+3', 'yyyy-MM-dd')
     var dates = [startDateFormatted, endDateFormatted]
     return dates
  }else{
    var startDateFormatted = Utilities.formatDate(startDate, 'GMT+3', 'yyyy-MM-dd')
     var endDateFormatted = Utilities.formatDate(endDate, 'GMT+3', 'yyyy-MM-dd')
     var dates = [startDateFormatted, endDateFormatted]
     return dates
  }
}

//----------------------------------------COST PART -------------------------------------------------


function isCellEmpty(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit(char) {
  return char >= '0' && char <= '9';
}
// http://jsfromhell.com/array/chunk
function chunk(a, s){
    for(var x, i = 0, c = -1, l = a.length, n = []; i < l; i++)
        (x = i % s) ? n[c][x] = a[i] : n[++c] = [a[i]];
    return n;
}


// Normalizes a string, by removing all alphanumeric characters and using mixed case
// to separate words. The output will always start with a lower case letter.
// This function is designed to produce JavaScript object property names.
// Arguments:
//   - header: string to normalize
// Examples:
//   "First Name" -> "firstName"
//   "Market Cap (millions) -> "marketCapMillions
//   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"


function normalizeHeader(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    //if (!isAlnum(letter)) {
    //  continue;
    //}
    if (key.length == 0 && isDigit(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}


// Returns an Array of normalized Strings.
// Arguments:
//   - headers: Array of Strings to normalize
function normalizeHeaders(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    var key = normalizeHeader(headers[i]);
    if (key.length > 0) {
      keys.push(key);
    }
  }
  return keys;
}

 // setRowsData fills in one row of data per object defined in the objects Array.
// For every Column, it checks if data objects define a value for it.
// Arguments:
//   - sheet: the Sheet Object where the data will be written
//   - objects: an Array of Objects, each of which contains data for a row
//   - optHeadersRange: a Range of cells where the column headers are defined. This
//     defaults to the entire first row in sheet.
//   - optFirstDataRowIndex: index of the first row where data should be written. This
//     defaults to the row immediately below the headers.


//STATISTICS 
function setRowsDataStat(sheet, objects, typeExport) {
  var type = typeExport
  var rowsCount = 0 
  if (type == 'campaign'){rowsCount = 16}
  else if (type == 'android' || type == 'ios'){rowsCount = 13}
  else {rowsCount = sheet.getMaxRows()}
  Logger.log(rowsCount)
  var headersRange = sheet.getRange(1, 1, 1, rowsCount);
  var firstDataRowIndex = headersRange.getRowIndex() + 1;
  var headers = normalizeHeaders(headersRange.getValues()[0]);
  var data = [];
  for (var i = 0; i < objects.length; ++i) {
    var values = []
    for (j = 0; j < headers.length; ++j) {
      var header = headers[j];
      values.push(header.length > 0 && objects[i][header] ? objects[i][header] : "");
    }
    data.push(values);
  }
  var destinationRange = sheet.getRange(firstDataRowIndex, headersRange.getColumnIndex(), 
                                        objects.length, headers.length);
  destinationRange.setValues(data);
}

function getByCampaignSheet(){
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('conversions by campaign')
  var lr = ss.getLastRow()
  var lc = ss.getRange(1, 1).getDataRegion().getLastColumn()
  ss.getRange(2,1, lr, lc).clearContent()
  return ss
}


function mtCampaignReportAddQuery(){
var dates = getDates()
Logger.log(dates)
var query = ''
query += 'WITH h AS (\n'
query += 'SELECT campaign_id\n'
query += ', banner_id\n'
query += ', date\n'
query += ', sum(clicks)    AS clicks\n'
query += ', SUM(installs)  AS installs\n'
query += ', SUM(purchases) AS purchases\n'
query += 'FROM (SELECT affiliate_info2::integer AS campaign_id\n'
query += ', affiliate_info1::integer AS banner_id\n'
query += ', date\n'
query += ', clicks\n'
query += ', CASE\n'
query += 'WHEN LOWER(goal) = \'install\'\n'
query += 'THEN conversions\n'
query += 'ELSE 0 END           AS installs\n'
query += ', CASE\n'
query += 'WHEN LOWER(goal) IN (\'new_buyer_purchase\', \'af_purchase\')\n'
query += 'THEN conversions\n'
query += 'ELSE 0 END           AS purchases\n'
query += 'FROM rawdb.hasoffers.affiliate_report_stats\n'
query += 'WHERE 1 = 1\n'
query += 'AND offer_id IN (\n'
query += '1048, 1046)\n'
query += 'AND lower(affiliate_info1) ~ ' + '\'' +'\\d{2,15}' + '\'' + ') AS foo\n'
query += 'GROUP BY campaign_id\n'
query += ', banner_id\n'
query += ', date\n'
query += '), m AS (\n'
query += 'SELECT c.campaign_id\n'
query += ', bs.banner_id         \n'
query += ', c.name         AS campaign_name\n'
query += ', bs.date\n'
query += ', sum(bs.shows)  AS impressions\n'
query += ', sum(bs.clicks) AS clicks\n'
query += ', sum(bs.spent)  AS costs\n'
query += 'FROM rawdb.mytarget.banner_stats bs\n'
query += 'JOIN rawdb.mytarget.banner b ON bs.banner_id = b.banner_id\n'
query += 'JOIN rawdb.mytarget.campaign c ON b.campaign_id = c.campaign_id\n'
query += 'WHERE 1 = 1\n'
query += 'GROUP BY c.campaign_id\n' 
query += ', bs.banner_id\n'
query += ', c.name\n'
query += ', date)\n'
query += 'SELECT CASE\n'
query += 'WHEN LOWER(m.campaign_name) ~ \'ios\'\n'
query += 'THEN \'IOS\'\n'
query += 'ELSE \'Android\' END                                AS platform\n'
query += ', h.date\n'
query += ', h.campaign_id\n'
query += ', COALESCE(m.campaign_name, \'no campaign name\') AS campaign_name\n'
query += ', COALESCE(m.impressions, 0)              AS                              mt_imps\n'
query += ', COALESCE(m.clicks,0)                                              AS mt_clicks\n'
query += ', COALESCE(ROUND(m.clicks::numeric / m.impressions::numeric, 3), 0)  AS CTR\n'
query += ', COALESCE(h.installs, 0) AS installs\n'
query += ', COALESCE(h.purchases, 0) AS purchases\n'
query += ', CASE\n'
query += 'WHEN h.installs = 0\n'
query += 'THEN 0\n'
query += 'ELSE ROUND(h.purchases::numeric / h.installs::numeric, 3) END AS CR_purchases\n'
query += ', COALESCE(m.costs, 0) AS costs\n' 
query += ', CASE WHEN h.date < \'2019-12-26\' THEN COALESCE(h.purchases * 21, 0)\n'
query += ' ELSE CASE WHEN h.date >= \'2019-12-26\'\n'
query += ' THEN COALESCE(h.purchases::numeric * 31, 0) ELSE 0 END END                  AS revenue_usd\n'
query += ',CASE WHEN h.date < \'2019-12-26\' THEN COALESCE(h.purchases::numeric * 21 - m.costs, 0)\n' 
query += ' ELSE CASE WHEN h.date >= \'2019-12-26\' THEN COALESCE(h.purchases::numeric * 31 - m.costs, 0) END END  AS profit\n'
query += ', CASE\n'
query += 'WHEN h.purchases = 0\n'
query += 'THEN 0\n'
query += 'ELSE COALESCE(ROUND(m.costs::numeric / h.purchases, 3), 0) END AS CPA\n'
query += ', CASE\n'
query += 'WHEN h.installs = 0\n'
query += 'THEN 0\n'
query += 'ELSE COALESCE(ROUND(m.costs::numeric / h.installs, 3), 0) END  AS CPI\n'
query += 'FROM h\n'
query += 'LEFT JOIN m ON h.campaign_id = m.campaign_id\n'
query += 'AND h.banner_id = m.banner_id\n'
query += 'AND h.date = m.date\n'
query += 'WHERE h.date BETWEEN ' + '\'' + dates[0] + '\'' + 'AND' + '\'' + dates[1] + '\'' +'\n'
query += 'ORDER BY date ASC;'

var url = "http://diet-secrets.club/api/as_apis/v01/?token=STAryPHaRIFoREfredro&db=rawdb";
  
  var payload = {  
    'query' : query
  }
  var options = {
    'method' : 'post',
    'payload' : payload,
    'muteHttpExceptions' : true
  };
  var request = UrlFetchApp.getRequest(url, options);
  var result = UrlFetchApp.fetch(url, options);
  Logger.log(result)
  Logger.log(options)
  var a = JSON.parse(result.getContentText());
//  Logger.log(a)
  var targetSheet = getByCampaignSheet()
  setRowsDataStat(targetSheet, a, 'campaign')

}
