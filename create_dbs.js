var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("tipbot-balances");
//  dbo.createCollection("users", function(err, res) {
  //  if (err) throw err;
    //console.log("Users table created!");
    //db.close();
  //});
    var myobj = { name: "null", address: "null", balance: 0, locked: 0 };
  dbo.collection("users").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("1 entry inserted");
    db.close();
  });
     var query = { address: "null" };
  dbo.collection("users").find(query).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
    db.close();
  });
}); 
