const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("../services/jwt");

const register = (req, res) => {
  let params = req.body;
  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).json({
      status: "error",
      message: "Missing parameters",
    });
  }

  User.find({
    $or: [
      { email: params.email.toLowerCase },
      { nick: params.nick.toLowerCase },
    ],
  }).exec(async (error, users) => {
    if (error) {
      return res.status(500).json({
        status: "error",
        message: "User query error",
      });
    }

    if (users && users.length >= 1) {
      return res.status(200).send({
        status: "success",
        message: "User already exist",
      });
    }

    let pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;

    let userToSave = new User(params);

    userToSave.save((error, userStored) => {
      if (error || !userStored) {
        res.status(500).send({
          status: "error",
          message: "Error saving user",
        });
      }

      if (userStored) {
        return res.status(200).json({
          status: "success",
          message: "Successfully registered user",
          user: userStored,
        });
      }
    });
  });
};

const login = (req, res) => {
  let params = req.body;

  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      message: "Missing params",
    });
  }

  User.findOne({ email: params.email }).exec((error, user) => {
    if (error || !user) {
      return res.status(404).send({
        status: "error",
        message: "User doesnt exist",
      });
    }

    let pwd = bcrypt.compare(params.password, user.password);
    if (!pwd) {
      return res.status(400).send({
        status: "error",
        message: "Invalid password",
        user,
      });
    }

    const token = jwt.createToken(user);

    return res.status(200).send({
      status: "success",
      message: "Login",
      user: {
        id: user._id,
        name: user.name,
        nick: user.nick,
      },
      token,
    });
  });
};

module.exports = {
  testUser,
  register,
  login,
};
