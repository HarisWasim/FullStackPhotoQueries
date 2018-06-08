var url = require('url');
var http = require('http');
var static = require('node-static');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');  // file access module
var port = 57641;
var db = new sqlite3.Database("PhotoQ.db");

// Initialize the Server
var fileServer = new static.Server('./public');
var server = http.createServer(handler);
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

function handler(request, response) {
    request.addListener('end', function () {
        var url = request.url;
        if (url.indexOf("/query") == 0) { // if query
            queryHandler(request, response, url);
        } else { // else serve them their file
            fileServer.serve(request, response, function (e, res) {
                if (e && (e.status === 404)) {
                    fileServer.serveFile('/not-found.html', 404, {}, request, response);
                }
            });
        }
    }).resume();
}

function queryHandler(request, response, url) {
    if (url.indexOf("?add")>=0) {
        console.log("add")
        addTag(request, response, url);
        return;
    }
    if (url.indexOf("?delete")>=0) {
        console.log("delete")
        deleteTag(request, response, url);
        return;
    }
    if (url.indexOf("?autocomplete")>=0) {
        console.log("autocomplete")
        autoComplete(request, response, url);
        return;
    } 
    if(url.indexOf("?keyList")>=0){
        var cmd = 'SELECT * FROM photoTags WHERE ';
        var query = url.substr(6); // position 6 thru end
        var type = query.split("=")[0];
        var params = query.split("=")[1];
        var tags = params.split("+");
        // console.log("Query params: ", params);
        // console.log("Query type: ", type);
        // console.log("List of tags: ", tags);

        if (type == "?keyList") {
            keyListQuery();
        } else if (type == "?q") {
            autocompleteQuery();
        } else {
            badQuery(response);
        }
    }

    function keyListQuery() {
        // build the SQL command
        // tags = decodeURIComponent(url);
        for (var i = 0; i < tags.length; ++i) {
            cmd = cmd + '(landmark = "' + tags[i] + '" OR tags LIKE "%' + tags[i] + '%")';
            if (i < tags.length - 1) {
                cmd = cmd + ' OR ';
            }
        }
        cmd = cmd + " LIMIT 6"
        // Run the SQL command
        // console.log(cmd);
        db.all(cmd, function (err, object) {
            if (err) {
                console.log("Error getting item list from DB", err);
            } else {
                response.writeHead(200, {
                    "Content-Type": "text"
                });
                var jsonList = JSON.stringify(object);
                response.write(jsonList);
                response.end();
            }
        });
    }

    function autoComplete(request, response, url) {
        // console.log(url);
        var cmd = 'SELECT tags FROM photoTags WHERE ';
        var query = url.substr(7); // position 6 thru end
        // console.log(query);
        var type = query.split("/")[0];
        var params = query.split("/")[1];
        // console.log("Query params: ", params);
        // console.log("Query type: ", type);

        for(var i = 1; i < params.length; i++ ){
            cmd = cmd + 'tags LIKE "%' + params.substr(0, i+1) + '%"';
            if (i < params.length - 1) {
                cmd = cmd + ' AND ';
            }
        }
        // console.log(cmd);
        db.all(cmd, function (err, object) {
            if (err) {
                console.log("Error getting item list from DB", err);
            } else {
                response.writeHead(200, {
                    "Content-Type": "text"
                });
                var jsonList = object;
                var finalTags = [];
                // console.log(jsonList);
                for(let i = 0; i < jsonList.length; i++){
                    let tags = jsonList[i].tags;
                    // console.log(tags)
                    tags = tags.split(",");
                    for(let j = 0; j < tags.length; j++){
                        if(tags[j].includes(params)){
                            finalTags.push(tags[j]);
                        }
                    }
                }
                // for(let i = 0; i < finalTags.length; i++){
                    
                // }
                finalTags = JSON.stringify(removeDuplicates(finalTags));
                response.write(finalTags);
                response.end();
            }
        });

    }
    function removeDuplicates(arr){
        let unique_array = []
        for(let i = 0;i < arr.length; i++){
            if(unique_array.indexOf(arr[i]) == -1){
                unique_array.push(arr[i])
            }
        }
        return unique_array
    };

    function badQuery() {
        response.writeHead(400, {
            "Content-Type": "text"
        });
        response.write("bad query");
        response.end();
    }
};

function addTag(request, response, url) {
    url = url.replace(/%20/g," ");
    var query = url.split("/")
    var type = query[1].split("?")[1];
    var params = query[3];
    var index = query[2];
    // console.log("Query params: ", params);
    // console.log("Query type: ", type);
    var cmd = "UPDATE photoTags SET tags = '" + params + "' WHERE idNum = " + index + ";";
    // console.log(cmd);
    db.all(cmd, function (err, object) {
        if (err) {
            console.log("Error getting item list from DB", err);
        }
    });

}

function deleteTag(request, response, url) {
    url = url.replace(/%20/g," ");
    // url = url.split("+");
    // let finalUrl = "";
    // for(let i = 0; i < url.length; i++){
    //     finalUrl= finalUrl + url[i];
    //     if(i <url.length - 1){
    //         finalUrl = finalUrl + "+";
    //     }
    // }
    // console.log("Her is    " + url);
    // let numPlusSigns = 0;
    // for(let i = 0; i < url.length; i++){
    //     if(url[i] === "+"){
    //         numPlusSigns += 1;
    //     }
    // }
    // if(numPlusSigns>1){
    //     url = url.replace(/+/g, ",");
    // }

    // url = url.replace(/+/g, ",");

    var query = url.split("/")
    console.log(query);
    var type = query[1].split("?")[1];
    var params = query[3];
    var index = query[2];
    let numPlusSigns = 0;
    for(let i = 0; i < params.length; i++){
        if (params[i] === "+"){
            numPlusSigns++;
        }
    }
    while(numPlusSigns!=0){
        params = params.replace("+", ",");
        numPlusSigns--;
    }
    console.log(params);
    // console.log("Query params: ", params);
    // console.log("Query type: ", type);
    // console.log("ID: ", index);
    var cmd = "UPDATE photoTags SET tags = '" + params + "' WHERE idNum = " + index + ";";
    console.log(cmd);
    db.all(cmd, function (err, object) {
        if (err) {
            console.log("Error getting item list from DB", err);
        }else{
            console.log("command success!");
        }
    }
);
    
    
    var newTag = "kldj";
    var idNum = "jfhkjfn";
    var cmd = 'UPDATE photoTags SET tags = ' + newTag + " WHERE idNum = ";

}
















// var nums = url.substring(14).split("+");
// var numEntries = nums.length;
// var objs = [];
// var ctr = 0;
// response.writeHead(200, { "Content-Type": "text/plain" });
// for (var i = 0; i < nums.length; ++i) {
// 	var cmd = "SELECT fileName, width, height FROM photoTags WHERE idNum = " + nums[i] + ";";
// 	if (nums[i] >= 0 && nums[i] <= 988) {
// 		db.each(cmd, function (err, row) {
// 			if (!err) {
// 				objs[ctr] = row;
// 			}
// 			ctr++;
// 			if (ctr == numEntries) {
// 				var myJSON = JSON.stringify(objs);
// 				response.write(myJSON);
// 				response.end();
// 			}
// 		});
// 	} else {
// 		numEntries--;
// 	}
// }
// 	} else {
// 	request.addListener('end', function () {
// 		function fnf(e, res) {
// 			if (e && (e.status === 404)) {
// 				fileServer.serveFile('./not-found.html', 404, {}, request, response);
// 			}
// 		}
// 		fileServer.serve(request, response, fnf);
// 	}).resume();
// }
// }

// function queryHandler(request, response, url) {
// 	var cmd = 'SELECT * FROM photoTags WHERE ';
// 	var query = url.substr(6); // position 6 thru end
// 	var type = query.split("=")[0];
// 	var params = query.split("=")[1];
// 	var tags = params.split("+");
// 	console.log("Query params: ", params);
// 	console.log("Query type: ", type);
// 	console.log("List of tags: ", tags);

// 	if (type == "?keyList") {
// 		keyListQuery();
// 	} else if (type == "?q") {
// 		autocompleteQuery();
// 	} else {
// 		badQuery(response);
// 	}
// }

// function keyListQuery() {
// 	// build the SQL command
// 	tags = decodeURIComponent(url);
// 	for (var i = 0; i < tags.length; ++i) {
// 		/*
// 		if(/[^a-z ]/.test(tags[i]) == true) {
// 			badQuery(response);
// 		}
// 		*/
// 		cmd = cmd + '(landmark = "' + tags[i] + '" OR tags LIKE "%' + tags[i] + '%")';
// 		if (i < tags.length - 1) {
// 			cmd = cmd + ' AND ';
// 		}
// 	}
// 	// Run the SQL command
// 	console.log(cmd);
// 	db.all(cmd, function (err, object) {
// 		if (err) {
// 			console.log("Error getting item list from DB", err);
// 		} else {
// 			response.writeHead(200, {
// 				"Content-Type": "text"
// 			});
// 			var jsonList = JSON.stringify(object);
// 			response.write(jsonList);
// 			response.end();
// 		}
// 	});
// }

// var server = http.createServer(handler);
// server.listen(port);

