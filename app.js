/*
 * Starter Project for WhatsApp Echo Bot Tutorial
 *
 * Remix this as the starting point for following the WhatsApp Echo Bot tutorial
 *
 */

"use strict";

// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
const token = process.env.WHATSAPP_TOKEN;

// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json()),
  qs = require("qs"),
  session = require('express-session');

const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "localhost",
  database: "DB"
});

connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected to MySQL!");
});


// connect to the database

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

// Accepts POST requests at /webhook endpoint
app.post("/webhook", (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
      let captain_name =
        req.body.entry[0].changes[0].value.contacts[0].profile.name;
      let return_msg = "";
      let open_flag = 0;

      let sql = "INSERT INTO messages (phone_number_id, from, msg_body, captain_name) VALUES ?";
      let values = [[phone_number_id, from, msg_body, captain_name]];
      connection.query(sql, [values], function (err, result) {
        if (err) throw err;
        console.log("Message saved to database");
      });


      const myArray = msg_body.toLowerCase().split(" ");

      if (myArray[0] == "open") {
        // open request
        var config = {
          method: "get",
          url:
            "https://new.chotu.app/wp-json/api/v3/captain/open?captain_mobile_number=" +
            from.slice(-10),
          headers: {
            "chotu-smatbot-key": process.env.CHOTU_SECRET_KEY,
          },
        };

        axios(config)
          .then(function (response) {
            let return_msg = "";
            if (response.data.result != 100) {
              return_msg = JSON.stringify(response.data.message_detail);
            } else {
              return_msg =
                JSON.stringify(response.data.message_detail) +
                "\nYour Shop URL: " +
                JSON.stringify(response.data.data.shop_url) +
                "\nYour Open URL: " +
                JSON.stringify(response.data.data.open_url);
            }
            axios({
              method: "POST", // Required, HTTP method, a string, e.g. POST, GET
              url:
                "https://graph.facebook.com/v12.0/" +
                phone_number_id +
                "/messages?access_token=" +
                token,
              data: {
                messaging_product: "whatsapp",
                to: from,
                text: { body: return_msg },
              },
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + process.env.WHATSAPP_TOKEN,
              },
            }).catch(function (error) {
              console.log(error);
            });
          })
          .catch(function (error) {
            console.log(error);
          });


      } else if (myArray[0] == "start") {
        // start

        axios(config)
          .then(function (response) {
            console.log(JSON.stringify(response.data));
            let return_msg = "";
            if (response.data.result != 100) {
              return_msg = JSON.stringify(response.data.message_detail);
            } else {
              return_msg =
                JSON.stringify(response.data.message_detail) +
                "\nYour Shop URL: " +
                JSON.stringify(response.data.data.shop_url) +
                "\nYour Open URL: " +
                JSON.stringify(response.data.data.open_url);
            }
            axios({
              method: "POST", // Required, HTTP method, a string, e.g. POST, GET
              url:
                "https://graph.facebook.com/v12.0/" +
                phone_number_id +
                "/messages?access_token=" +
                token,
              data: {
                messaging_product: "whatsapp",
                to: from,
                text: { body: return_msg + "change" },
              },
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + process.env.WHATSAPP_TOKEN,
              },
            }).catch(function (error) {
              console.log(error);
            });
          })
          .catch(function (error) {
            console.log(error);
          });
      } else {
        return_msg = "Invalid Command";
        axios({
          method: "POST", // Required, HTTP method, a string, e.g. POST, GET
          url:
            "https://graph.facebook.com/v12.0/" +
            phone_number_id +
            "/messages?access_token=" +
            token,
          data: {
            messaging_product: "whatsapp",
            to: from,
            text: { body: return_msg },
          },
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.WHATSAPP_TOKEN,
          },
        }).catch(function (error) {
          console.log(error);
        });
      }


      var data = qs.stringify({
        captain_name: captain_name,
        captain_rootshop: myArray[1],
        captain_mobile_number: from.slice(-10),
        captain_language: myArray[2],
      });
      var config = {
        method: "post",
        url: "https://new.chotu.app/wp-json/api/v3/captain",
        headers: {
          "chotu-smatbot-key": "xEsnzR4P4Vj8",
        },
        data: data,
      };
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
