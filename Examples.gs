function bBLogExamples() {

  var firebaseUrl = PropertiesService.getScriptProperties().getProperty('FIREBASE_URL')
  var firebaseSecret = PropertiesService.getScriptProperties().getProperty('FIREBASE_SECRET')  

  var log = BBLog.getLog({
    sheetId: null, 
    firebaseUrl: firebaseUrl,
    firebaseSecret: firebaseSecret})
    
  log.clear();
  
  // Create a logging object just using the default settings
  // -------------------------------------------------------
  // 
  // - Log to the active GSheet that this script is contained in
  //   to a tab called 'Log'
  // - Log at INFO level
  // - Not providing a lock - not recommended when logging to a GSheet
  // - Do not display a user ID
  // - Do not display the function name 
  // - Do not log to native Apps Script Logger

  log = BBLog.getLog();
  log.info('Test log to GSheet at INFO level');
  
  // Create a logging object to a Firebase database
  // ----------------------------------------------
  //
  // - Store log at all levels
  // - Do not log to the GSheet
  // - Display the function name of the calling function (this stops the 
  //   debugger working)
  // - Display a truncated version of the active user's email
  // - Also log to the built-in Logger service
  //
  // Note: Script properties 'FIREBASE_URL' and 'FIREBASE_SECRET'
  // have to have been manually stored in the script editor:
  // (File > Project properties > Script properties)
  
  log = BBLog.getLog({
    level: BBLog.Level.ALL,
    sheetId: null, 
    firebaseUrl: firebaseUrl,
    firebaseSecret: firebaseSecret,
    displayFunctionNames: BBLog.DisplayFunctionNames.YES, 
    displayUserId: BBLog.DisplayUserId.EMAIL_HIDE,
    useNativeLogger: true
  });
  
  log.finest('Test log to Firebase database at FINEST level');
  
  // Catch the error and log the full call stack
  // -------------------------------------------

  log = BBLog.getLog();

  try {
  
    throw new Error('Force an error')
  
  } catch (error) {
  
    var longErrorMessage = 
      'name: ' + error.name + ' - ' +
      'error message: ' + error.message + ' - ' + 
      'fileName: ' + error.fileName + ' - ' + 
      'lineNumber: ' + error.lineNumber + ' - ' +     
      'stack: ' + error.stack;
      
    log.severe(longErrorMessage)
  }

  // Create two logging objects, one to a GSheet, one to Firebase
  // ------------------------------------------------------------
  //
  // This can be useful where you want a basic log to the user's 
  // GSheet and a more comprehensive log for the admin to monitor 
  // all users.

  var userGsheetLog = BBLog.getLog({
    lock: LockService.getUserLock()
  });
  
  userGsheetLog.info('Output some trace to the user\'s GSheet log')
  
  var masterFireBaselog = BBLog.getLog({
    level: BBLog.Level.FINE,
    sheetId: null, 
    firebaseUrl: firebaseUrl,
    firebaseSecret: firebaseSecret,
    displayUserId: BBLog.DisplayUserId.EMAIL_HIDE,
  });
  
  masterFireBaselog.info('Output more detailed trace to the "master" Firebase log')

  // Use different logs for production and debug
  // -------------------------------------------
  //
  // Developing the idea above, it is possible to use a single log
  // object rather than defining the two, and using a flag to switch
  // between then. 

  var PRODUCTION_VERSION = false
  log = getLog(); 
  log.clear();

  // In "debug/developement" mode all trace is output to the user's GSheet log

  log.info(
    'Debug version - First string: %s, Second String: %s, First Number: %u, first object %s', 
    'a', 
    'b', 
    99,
    {a: 1, b: 2})
    
  log.finest('Debug version - log FINEST')

  PRODUCTION_VERSION = true
  log = getLog(); 

  // In "production mode" just INFO, WARNING or SEVERE trace with no user ID 
  // is output to the user's GSheet log, and trace with the users' ID is output 
  // to the Firebase DB log

  log.info(
    'Production version - First string: %s, Second String: %s, First Number: %u, first object %s', 
    'a', 
    'b', 
    99,
    {a: 1, b: 2})
    
  log.finest('Production version - log FINEST')
      
  return;
  
  // Private Functions
  // -----------------

  /**
   * Get different log objects for production and debug
   *
   * @return {BBLog}
   */

  function getLog() {
  
    var log

    if (PRODUCTION_VERSION) {
  
      var userLog = BBLog.getLog({sheetName: 'User Log'}); 
  
      var masterLog = BBLog.getLog({
        sheetId: null,
        displayUserId: BBLog.DisplayUserId.USER_KEY_FULL,
        firebaseUrl: firebaseUrl,
        firebaseSecret: firebaseSecret,      
      })
      
      log = {
      
        clear: function() {
          userLog.clear();
          masterLog.clear();      
        },
        
        info: function() {
          userLog.info.apply(userLog, arguments);
          masterLog.info.apply(masterLog, arguments);          
        } ,      
        
        warning: function() {
          userLog.warning.apply(userLog, arguments);
          masterLog.warning.apply(masterLog, arguments);          
        },
  
        severe: function() {
          userLog.severe.apply(userLog, arguments);
          masterLog.severe.apply(masterLog, arguments);          
        },
        
        functionEntryPoint: function() {},
        fine: function() {},
        finer: function() {},
        finest: function() {},     
      }
      
    } else { // !PRODUCTION_VERSION
    
      log = BBLog.getLog({
        sheetName: 'User Log',
        level: BBLog.Level.ALL,
      }); 
    }
    
    return log;
    
  } // bBLogExamples.getLog()

} // bBLogExamples()