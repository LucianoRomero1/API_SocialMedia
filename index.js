const { connection } = require("./database/connection");
const express = require("express");
const cors = require("cors");

//Welcome msg
console.log("API to social media is running");

//Connect to db
connection();

//Create node server
const app = express();
const port = 3900;

//Configure cors
app.use(cors());

//Decode data from body to object js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
const UserRoutes = require("./routes/user");
const PublicationRoutes = require("./routes/publication");
const FollowRoutes = require("./routes/follow");

app.use("/api/user/", UserRoutes);
app.use("/api/publication/", PublicationRoutes);
app.use("/api/follow/", FollowRoutes);

//Put the server to listen http requests
app.listen(port, () => {
  console.log("Node server is running in port: ", port);
});
