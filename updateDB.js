var url = require("url");
var http = require("http");
var sizeOf = require("image-size");
var sqlite3 = require("sqlite3").verbose();
var fs = require("fs");
var APIrequest = require('request');
var apiLink = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBRchRNmt4L6pEgjIxsugrOJEpGT3a4CjM';
var db = new sqlite3.Database("PhotoQ.db");
var imgList = JSON.parse(fs.readFileSync("photoList.json")).photoURLs;
var index = 0;
var imageLink;
var fileName;
var landmark;
var tags = [];


for (var i = 0; i < 20; ++i) {
    var image = imgList[i];
    image = image.replace(/\s/g, "%20");
    enqueue(i, image, enqueueCallback);
}


function enqueue(index, imageURL, callback) {
    imageLink = imgURL;
    console.log(imgURL)
    fileName = getFileName(imgURL); //gets end of link for image
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
    sendRequest();

    function sendRequest() {
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
    }

    // callback function, called when data is received from API
    function APIcallback(err, APIresponse, body) {
        if ((err) || (APIresponse.statusCode != 200)) {
            console.log("Got API error");
            console.log(body);
        } else {
            var APIresponseJSON = body.responses[0];
            if (APIresponseJSON) {
                if (APIresponseJSON.landmarkAnnotations) {
                    landmark = APIresponseJSON.landmarkAnnotations[0].description;
                } else {
                    landmark = "";
                }
                if (APIresponseJSON.labelAnnotations) {
                    for (let i = 0; i < APIresponseJSON.labelAnnotations.length; i++) {
                        tags.push(APIresponseJSON.labelAnnotations[i].description);
                    }
                } else {
                    tags = [];
                }
            }
            //update database with tags and landmark
            tags = tags.toString();
            console.log(tags)
            var cmd = "UPDATE photoTags SET locationTag = '" + landmark + "', listTags = '" + tags + "' WHERE idNum = " + index + ";";
            index++
            tags = [];
            landmark = "";
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
    } // end callback function
}