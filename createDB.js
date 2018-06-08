// Globals
var sqlite3 = require("sqlite3").verbose();  // use sqlite
var fs = require("fs");

var dbFileName = "PhotoQ.db";
// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFileName);

// Initialize table.
// If the table already exists, causes an error.
// Fix the error by removing or renaming PhotoQ.db
var cmdStr = "CREATE TABLE photoTags (idNum INTEGER UNIQUE NOT NULL PRIMARY KEY, fileName TEXT, width INTEGER, height INTEGER, locationTag TEXT, listTags TEXT)";
db.run(cmdStr,tableCreationCallback);

// Always use the callback for database operations and print out any
// error messages you get.
function tableCreationCallback(err) {
    if (err) {
        console.log("There was an error with creating the database",err);
    } else {
        console.log("Database created");
        db.close();
    }
}