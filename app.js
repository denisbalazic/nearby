const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
	res.send(index.html);
});

app.listen(process.env.PORT || 3000, function() {
	console.log("Nearby has started");
});