const mongodb = require("mongodb");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const port = process.env.PORT || 3001;
const mongoClient = mongodb.MongoClient;
const objectId = mongodb.ObjectID;
const DB_URL = process.env.DBURL || "mongodb://127.0.0.1:27017";

app.post("/shorturl", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("shortURLs");
    const randomStr = Math.random().toString(36).substring(4).toUpperCase();

    const data = {
      userKey: req.body.userkey || "default",
      longUrl: req.body.url,
      shortUrl: `${req.protocol}://${req.get("host")}/${randomStr}`,
    };
    const output = await db.collection("shortUrls").insertOne(data);
    res.send(output.ops[0].shortUrl);
    client.close();
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/:id", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("shortURLs");
    const params = req.params.id;
    const shorturl = `${req.protocol}://${req.get("host")}/${params}`;

    const result = await db
      .collection("shortUrls")
      .find({ shortUrl: shorturl })
      .project({ _id: 0, shortUrl: 0, userKey: 0 })
      .toArray();
    if (result.length != 0) {
      res.redirect(result[0].longUrl);
    } else res.send("incorrect short url!!!");
    client.close();
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/listByKey/:key", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("shortURLs");
    const params = req.params.key;

    const result = await db
      .collection("shortUrls")
      .find({ userKey: params })
      .project({ _id: 0, userKey: 0 })
      .toArray();
    if (result.length != 0) {
      res.send(result);
    } else {
      res.send([{ message: "No Url's found with given key" }]);
    }

    client.close();
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.delete("/deleteurl", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("shortURLs");
    const key = req.body.key;
    const shorturl = req.body.url;

    const result = await db
      .collection("shortUrls")
      .findOneAndDelete({ userKey: key, shortUrl: shorturl });

    if (result.value)
      res.status(200).json({ message: "The url is deleted!!!" });
    else res.status(500).json({ message: "Url not exist!!!" });

    client.close();
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.listen(port, () =>
  console.log(`::::  Server started and running on port ${port} ::::`)
);
