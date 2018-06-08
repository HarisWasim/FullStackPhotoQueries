var url = require("url");
var http = require("http");
var sizeOf = require("image-size");
var sqlite3 = require("sqlite3").verbose();
var fs = require("fs");
var APIrequest = require('request');
var apiLink = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBRchRNmt4L6pEgjIxsugrOJEpGT3a4CjM';
var db = new sqlite3.Database("PhotoQ.db");
var imgList = JSON.parse(fs.readFileSync("photoList.json")).photoURLs;
var globalIndex = 0;
var image = imgList[globalIndex];
image = image.replace(/\s/g, "%20");

for (let i = 0; i < 989; i++) {
        var imgURL = imgList[i];
        var landmark = "";
        var tags = "";
        var fileName = getFileName(imgURL); //gets end of link for image
        http.get(url.parse(imgURL), function (response) {
                var chunks = [];
                response.on('data', function (chunk) {
                        chunks.push(chunk);
                }).on('end', function () {
                        var buffer = Buffer.concat(chunks);
                        var dims = sizeOf(buffer);
                        enqueueCallback(i, fileName, dims.width, dims.height, landmark, tags);
                });
        });
};

enqueue(globalIndex, image);

// dumpDB();

function enqueue(index, imgURL) {
        var fileName = getFileName(imgURL); //gets end of link for image
        var requestObject = {
                "requests": [
                        {
                                "image": {
                                        "source": {
                                                "imageUri": imgURL
                                        }
                                },
                                "features": [
                                        {
                                                "type": "LANDMARK_DETECTION",
                                                "maxResults": 1
                                        },
                                        {
                                                "type": "LABEL_DETECTION",
                                                "maxResults": 6
                                        }
                                ]
                        }
                ]
        };
        APIrequest({
                url: apiLink,
                method: "POST",
                headers: { "content-type": "application/json" },
                // will turn the given object into JSON
                json: requestObject
        },
                // callback function for API request
                APIcallback
        );


        // callback function, called when data is received from API
        function APIcallback(err, APIresponse, body) {
                var tags = [];
                var landmark = " ";
                this.APIresponseJSON = body.responses[0];
                if ((err) || (APIresponse.statusCode != 200)) {
                        console.log("Got API error");
                        console.log(body);
                } else {
                        if (this.APIresponseJSON) {
                                if (this.APIresponseJSON.landmarkAnnotations && typeof (this.APIresponseJSON.landmarkAnnotations[0].description) != 'undefined') {
                                        landmark = this.APIresponseJSON.landmarkAnnotations[0].description;
                                }
                                if (this.APIresponseJSON.labelAnnotations) {
                                        for (let i = 0; i < this.APIresponseJSON.labelAnnotations.length; i++) {
                                                tags.push(this.APIresponseJSON.labelAnnotations[i].description)
                                        }
                                }
                                // console.log(tags);
                        }
                        //update database with tags and landmark
                        tags = tags.toString();

                        var cmd = "UPDATE photoTags SET locationTag = '" + landmark + "', listTags = '" + tags + "' WHERE idNum = " + globalIndex + ";";
                        cmd = cmd.toString();
                        // console.log(cmd);
                        db.run(cmd, insertionCallback2);

                        function insertionCallback2(err) {
                                if (err) {
                                        console.log(" UPDATE Row insertion error: ", err);
                                } else {
                                        console.log("Command success: ", cmd);
                                }
                        }
                }
                if (globalIndex + 1 < 989) {
                        globalIndex += 1;
                        enqueue(globalIndex, imgList[globalIndex]);
                }

        }
} // end callback function}

//function to get end of file name for link
function getFileName(url) {
        var i = url.length - 1;
        while (url[i] != "/") { --i; }
        return url.substring(i + 1);
}

function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > milliseconds) {
                        break;
                }
        }
}

function dumpDB() {
        db.all('SELECT * FROM photoTags', dataCallback);
        function dataCallback(err, data) {
                console.log(data);
        }
}

function enqueueCallback(index, fileName, width, height, landmark, tags) {
        var cmd = 'INSERT INTO photoTags VALUES ( _IDX, "_FILENAME", _WIDTH, _HEIGHT, "_LANDMARK", "_TAGS" )';
        cmd = cmd.replace("_IDX", index.toString());
        cmd = cmd.replace("_FILENAME", fileName);
        cmd = cmd.replace("_WIDTH", width.toString());
        cmd = cmd.replace("_HEIGHT", height.toString());
        // cmd = cmd.replace("_LANDMARK", " ");
        // cmd = cmd.replace("_TAGS", " ");
        cmd = cmd.replace("_LANDMARK", landmark);
        cmd = cmd.replace("_TAGS", tags.toString());
        // console.log("Running command: ", cmd);
        db.run(cmd, insertionCallback);

        function insertionCallback(err) {
                if (err) {
                        console.log("Row insertion error: ", err);
                } else {
                        // console.log("Command success: ", cmd);
                }
        }
}

//function to get end of file name for link
function getFileName(url) {
        var i = url.length - 1;
        while (url[i] != "/") { --i; }
        return url.substring(i + 1);
}

function dumpDB() {
        db.all('SELECT * FROM photoTags', dataCallback);
        function dataCallback(err, data) {
                console.log(data);
        }
}







 // oReq.open("POST", apiLink, !0);
        // oReq.onload = function(){console.log("this is another element response \n\n", oReq.responseText)};
        // oReq.addEventListener("load", callbackFunction);
        // oReq.send(requestObject);

        // function callbackFunction(){

        //         // if(i === 1){
        //         //         console.log(this);
        //         //         i++;
        //         // }

        // }



        // var cmd = "UPDATE photoTags SET locationTag = '" + this.landmark + "', listTags = '" + this.tags + "' WHERE idNum = " + this.index + ";";
                // index++
                // cmd = cmd.toString();
                // // console.log(cmd);
                // db.run(cmd, insertionCallback);

                // function insertionCallback2(err) {
                //         if (err) {
                //                 console.log(" UPDATE Row insertion error: ", err);
                //         } else {
                //                 console.log("Command success: ", cmd);
                //         }
                // }