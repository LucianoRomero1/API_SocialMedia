const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("../services/jwt");
const pagination = require("mongoose-pagination");

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

const profile = (req, res) => {
  const id = req.params.id;

  User.findById(id)
    //ignore password and role
    .select({ password: 0, role: 0 })
    .exec((error, userProfile) => {
      if (error || !userProfile) {
        return res.status(404).send({
          status: "error",
          message: "User doesnt exist",
        });
      }

      return res.status(200).json({
        status: "success",
        user: userProfile,
      });
    });
};

const list = (req, res) => {
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }
  page = parseInt(page);

  let itemsPerPage = 5;

  User.find()
    .sort("_id")
    .paginate(page, itemsPerPage, (error, users, total) => {
      if (error || !users) {
        return res.status(404).send({
          status: "error",
          message: "No users available",
          error,
        });
      }

      return res.status(200).send({
        status: "success",
        users,
        page,
        itemsPerPage,
        total,
        pages: Math.ceil(total, itemsPerPage),
      });
    });
};

module.exports = {
  testUser,
  register,
  login,
  profile,
  list,
};
