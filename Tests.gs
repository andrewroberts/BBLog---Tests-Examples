var SCRIPT_NAME = 'BetterLog library test sheet'
var SCRIPT_VERSION = 'v7'

// TODO
// ----
//
// * Double check I've tested all settings
// * Test with various FB, GS combinations, inc no log.


function onOpen() {

  SpreadsheetApp
    .getUi()
    .createMenu('Test log library')
    .addItem('Run tests' , 'test_log_gs')
    .addToUi();
}

/**
 * Clear the test Sheet Logs
 */

function clearSheetLogs() {

  var lock = LockService.getScriptLock()

  var log = BBLog.getLog({
    level: BBLog.Level.ALL,
    lock: lock,
  });
  
  log.clear();
  
  var log = BBLog.getLog({
    level: BBLog.Level.ALL,  
    sheetName: 'Log2',
    lock: lock
  });
  
  log.clear();  
}

/**
 * Clear the test Firebase Logs
 */

function clearFirebaseLog() {

  var lock = LockService.getScriptLock()

  var firebaseUrl = PropertiesService.getScriptProperties().getProperty('FIREBASE_URL')
  var firebaseSecret = PropertiesService.getScriptProperties().getProperty('FIREBASE_SECRET')
  
  if (firebaseUrl === null || firebaseSecret === null) {
    throw new Error('Manually create a script property')
  }

  var log = BBLog.getLog({
    level: BBLog.Level.ALL,  
    firebaseUrl: firebaseUrl,
    firebaseSecret: firebaseSecret,
    lock: lock,    
  });
  
  log.clear()
}

/** 
 * Check against the Debug log
 */

function test_log_gs() {

  Assert.init({
    handleError:    Assert.HandleError.THROW, 
    sendErrorEmail: false, 
    emailAddress:   '',
    scriptName:     SCRIPT_NAME,
    scriptVersion:  SCRIPT_VERSION, 
  })

  try {

    test_log_sheet()
    test_log_firebase()
    
  } catch (error) {
  
    var fullErrorMessage = 
      'name: ' + error.name + ' - ' +
      'error message: ' + error.message + ' - ' + 
      'fileName: ' + error.fileName + ' - ' + 
      'lineNumber: ' + error.lineNumber + ' - ' +     
      'stack: ' + error.stack
    
    throw new Error(fullErrorMessage)
  }
}

var spreadsheet_ = SpreadsheetApp.getActiveSpreadsheet()
var logSheet1_ = spreadsheet_.getSheetByName('Log')
var logSheet2_ = spreadsheet_.getSheetByName('Log2')  

function test_log_sheet() {

  var result;
  var rowNumber = 2;
  var callingFunction = 'test_log_sheet';

  var lock = LockService.getScriptLock();

  var log2 = BBLog.getLog({
    level: BBLog.Level.ALL,  
    sheetName: 'Log2',
    lock: lock
  });
  
  log2.clear();  

  var log = BBLog.getLog({
    level: BBLog.Level.ALL,
    lock: lock,
  });

  log.clear();
      
  Utilities.sleep(2000)
  SpreadsheetApp.flush()

  // Do the roll-over test first one so the rest of the results are in one sheet
  var log = BBLog.getLog({
    lock: LockService.getScriptLock(),
    maxRows: 5,
    rollerRowCount: 2,
  });

  for (var rowIndex = 0; rowIndex < 7; rowIndex++) {
    log.info('Rollover test - Log line ' + (rowIndex + 1))
  }

  Utilities.sleep(2000)
  SpreadsheetApp.flush()
  var newLogSheetUrl = SpreadsheetApp.getActive().getSheetByName('Log').getRange('A3').getValue()
  
  try {
    var newLogSheet = SpreadsheetApp.openByUrl(newLogSheetUrl)
    log.info('Rolled over to new sheet OK')
  } catch (error) {
    throw new Error('Failed to roll-over to new GSheet on filling the old one')
  }

  var log = BBLog.getLog({
    level: BBLog.Level.ALL,
    lock: lock,
  });

  log.finest('LOG TESTS START - SHEET (AFTER ROLLOVER)');
  sheetAssert_('FINEST LOG TESTS START - SHEET')
    
  // Standard calls

  log.config('The current log level is ' + log.getLevel().name);
  sheetAssert_('CONFIG The current log level is ALL')
  
  log.severe('Severe log');
  sheetAssert_('SEVERE Severe log')
  
  log.warning('Warning log');
  sheetAssert_('WARNING Warning log')
  
  log.info('Info log');
  sheetAssert_('INFO Info log')
  
  log.fine('Fine log');
  sheetAssert_('FINE Fine log')
  
  log.finer('Finer log'); 
  sheetAssert_('FINER Finer log')
  
  log.finest('Finest log');
  sheetAssert_('FINEST Finest log')

  // Design patterns

  var module = (function modulePattern() {
    return {
      foo: function() {
        log.info('BBLog.info() called from within modulePattern.foo()');
      }
    };
  })();

  module.foo();
  sheetAssert_('INFO BBLog.info() called from within modulePattern.foo()')

  var objectLiteral = {
    foo: function() {
      log.info('INFO BBLog.info() called from within objectLiteral.foo()');
    }
  };

  objectLiteral.foo();
  sheetAssert_('INFO BBLog.info() called from within objectLiteral.foo()');

  // Chained calls

  log.info('First chained call').info('Second chained call');
  ++rowNumber;
  sheetAssert_('Second chained call');

  // Change level

  log.setLevel(BBLog.Level.SEVERE);
  log.severe('Severe: Only this one should show');
  log.warning('Warning: TEST FAILED - This should not show');
  sheetAssert_('SEVERE Severe: Only this one should show');
    
  log.setLevel(BBLog.Level.OFF);
  log.severe('Severe: TEST FAILED - This should not show');

  // Disable function names

  log = BBLog.getLog({
    level: BBLog.Level.ALL, 
    displayFunctionNames: BBLog.DisplayFunctionNames.NO,
    lock: lock,        
  });
    
  log.info('This SHOULD NOT be prefixed with a function name')
  sheetAssert_('INFO This SHOULD NOT be prefixed with a function name')

  log = BBLog.getLog({
    level: BBLog.Level.ALL, 
    displayFunctionNames: BBLog.DisplayFunctionNames.YES,
    lock: lock,        
  });

  log.info('This SHOULD be prefixed with a function name')
  sheetAssert_('test_log_sheet')

  log.functionEntryPoint('Display the starting point of a function')
  sheetAssert_('(test_log_sheet) Display the starting point of a function');

  log = BBLog.getLog({
    level: BBLog.Level.ALL, 
    lock: lock,        
  });

  log.info('This SHOULD NOT be prefixed with a function name (return to default)')
  sheetAssert_('This SHOULD NOT be prefixed with a function name (return to default)');

  // Use different sheet name
  
  log2.info('This should be output in sheet Log2')
  sheetAssert_('This should be output in sheet Log2', logSheet2_);

  // From within local function

  log = BBLog.getLog({
    level: BBLog.Level.ALL, 
    sheetName: 'Log', // 'Log' is default but put here for emphasis
    lock: lock,      
  });

  localFunction();
  sheetAssert_('BBLog.info() called from within a local/nested function');

  // Use format string
  
  log.info('%s', 'included in formatted string');
  sheetAssert_('included in formatted string');
  
  log.info(
    'First string: %s, Second String: %s, First Number: %u, first object %s', 
    'a', 
    'b', 
    99,
    {a: 1, b: 2})
    
  sheetAssert_(' INFO First string: a, Second String: b, First Number: 99, first object {"a":1,"b":2}');
    
  log = BBLog.getLog({
    displayUserId: BBLog.DisplayUserId.USER_KEY_HIDE,
    level: BBLog.Level.INFO,
    lock: lock,        
  });
  
  log.info('Display USER_KEY_HIDE')
  sheetAssert_('Display USER_KEY_HIDE');

  log = BBLog.getLog({
    displayUserId: BBLog.DisplayUserId.USER_KEY_FULL,
    level: BBLog.Level.INFO,
    lock: lock,        
  });
  
  log.info('Display USER_KEY_FULL')
  sheetAssert_('Display USER_KEY_FULL');

  log = BBLog.getLog({
    displayUserId: BBLog.DisplayUserId.EMAIL_HIDE,
    level: BBLog.Level.INFO,
    lock: lock,        
  });
  
  log.info('Display EMAIL_HIDE')

  sheetAssert_('Display EMAIL_HIDE');

  log = BBLog.getLog({
    displayUserId: BBLog.DisplayUserId.EMAIL_FULL,
    level: BBLog.Level.INFO,
    lock: lock,        
  });
  
  log.info('Display EMAIL_FULL')

  sheetAssert_('Display EMAIL_FULL');

  log = BBLog.getLog({
    displayUserId: BBLog.DisplayUserId.NONE,
    level: BBLog.Level.INFO,
    lock: lock,        
  });
  
  log.info('No ID should now be displayed')
  sheetAssert_('No ID should now be displayed');
  
  log = BBLog.getLog({
    level: BBLog.Level.INFO,
    lock: lock, 
    useNativeLogger: true,
  });
  
  log.info('Log to native Logger service as well')
  sheetAssert_('Log to native Logger service as well');
  
  var result = Logger.getLog()
  
  Assert.assert(
    result.indexOf(' INFO Log to native Logger service as well') !== -1, 
    callingFunction, 
    'TEST FAILED using Logger');

  log = BBLog.getLog({
    sheetName: 'This Log tab does not exist',
  });

  var newSheet = spreadsheet_.getSheetByName('This Log tab does not exist');
  Assert.assert(newSheet !== null, callingFunction, 'TEST FAILED creating new tab');
  log.info('Writing to new tab');
  sheetAssert_('Writing to new tab', newSheet);
  Utilities.sleep(2000);
  SpreadsheetApp.flush()
  spreadsheet_.deleteSheet(newSheet);
  
  log = BBLog.getLog();
  log.info('Written to log that did not exist already');
  
  log.info('!!!!!! ALL SHEET LOG TESTS PASSED !!!!!!');

  return;
  
  // Private function
  // ----------------
  
  function localFunction() {
    log.info('BBLog.info() called from within a local/nested function');
  }

} // test_log_sheet()

/**
 * Tests for logging to Firebase
 */

function test_log_firebase() {

  var firebaseUrl = PropertiesService.getScriptProperties().getProperty('FIREBASE_URL')
  var firebaseSecret = PropertiesService.getScriptProperties().getProperty('FIREBASE_SECRET')
  var firebaseDb = FirebaseApp.getDatabaseByUrl(firebaseUrl, firebaseSecret);  
  
  if (firebaseUrl === null || firebaseSecret === null) {
    throw new Error('Manually create the script properties: FIREBASE_URL & FIREBASE_SECRET')
  }

  var log = BBLog.getLog({
    level: BBLog.Level.INFO,
    sheetId: null, // Don't use GSheet for logging
    firebaseUrl: firebaseUrl,
    firebaseSecret: firebaseSecret,
  });
  
  log.clear()
  
  log.info('Just logged to Firebase, not sheet (sheetId null)');  
  fbAssert('Just logged to Firebase, not sheet (sheetId null)')

  var lock = LockService.getScriptLock()

  var log = BBLog.getLog({
    level: BBLog.Level.INFO,
    firebaseUrl: firebaseUrl,
    firebaseSecret: firebaseSecret,
    lock: lock,        
  });
  
  log.info('Logged to Firebase & sheet');
  fbAssert('Logged to Firebase & sheet');
  sheetAssert_('Logged to Firebase & sheet');

  var log = BBLog.getLog({
    level: BBLog.Level.INFO, 
    displayFunctionNames: BBLog.DisplayFunctionNames.YES, 
    displayUserId: BBLog.DisplayUserId.EMAIL_FULL,
    firebaseUrl: firebaseUrl,
    firebaseSecret: firebaseSecret,
    lock: lock,        
  });

  log.info('Logged to Firebase & sheet with email & function name');
  fbAssert('Logged to Firebase & sheet with email & function name');
  sheetAssert_(' (test_log_firebase) Logged to Firebase & sheet with email & function name');

  var log = BBLog.getLog({
    level: BBLog.Level.INFO,
    firebaseUrl: firebaseUrl,
    firebaseSecret: firebaseSecret,
    lock: lock,        
  });

  log.info('!!!!!! ALL FIREBASE LOG TESTS PASSED !!!!!!');

  return

  function fbAssert(testString) {  
    var callingfunction = 'test_log_firebase()';
    var data = firebaseDb.getData();
    var keys = Object.keys(data);
    var numberOfEntries = keys.length;
    var lastMessage = data[keys[numberOfEntries - 1]].message;
    Assert.assert(lastMessage.indexOf(testString) !== -1, callingfunction, 'TEST FAILED on "' + testString + '"');
  }
  
} // test_log_firebase()

function sheetAssert_(testString, logSheetArg) {  
  var callingfunction = 'test_log_sheet()';
  var localLogSheet = (typeof logSheetArg === 'undefined') ? logSheet1_ : logSheetArg;
  var data = localLogSheet.getDataRange().getValues();
  var numberOfRows = data.length;
  var result = data[numberOfRows - 1][0];
  
  Assert.assert(
    result.indexOf(testString) !== -1, 
    callingfunction, 
    'TEST FAILED on row ' + numberOfRows + ', string: ' + testString);
}

// 11s to run with Logging on
// 500ms with it off
// 220ms to init Log + 20s to just do loop = 240ms 
//
// => with it off a call to Logging takes 3ms each call.

function time_trials() {

//  log.initialise(BBLog.Level.OFF, '', Log.DisplayFunctionNames.YES);
  
  var index;

  var Log = {info: function() {}};

  for(index = 0; index < 100; index++) {
    Log.info('Test write: ' + index);
  }
  
} // time_trials()

function test_string() {
  
  var s = test_2('First string: %s, Second String: %s, First Number: %u', 'a', 'b', 99)
  return

  function info() {
    var s = Utilities.formatString.apply(null, arguments)
    return s
  }

} // test_string()

function test_top_top() {
  test_top('First string: %s', 'a')
}

function test_top() {
  var a = test_info.apply(null, arguments)
}

function test_info() {
  test_log(arguments, 1)
}

function test_log(newArgs, level) {
  Logger.log('level: ' + JSON.stringify(level))     // level: 1
  Logger.log('newArgs: ' + JSON.stringify(newArgs)) // newArgs: {"0":"First string: %s","1":"a"}
}

function test_objects() {
  var a = 'b'
  var n = 2
  var o = {a: 1, b: 2}
  test_test_objects('%s %s %s', a, n, o)
}

function test_test_objects(a1, a2, a3) {
  test_test_test_objects(arguments)
}