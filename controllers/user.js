const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("../services/jwt");
const pagination = require("mongoose-pagination");
const fs = require("fs");
const path = require("path");
const followService = require("../services/followService");

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
    .exec(async(error, userProfile) => {
      if (error || !userProfile) {
        return res.status(404).send({
          status: "error",
          message: "User doesnt exist",
        });
      }

      const followInfo = await followService.followThisUser(req.user.id, id);

      return res.status(200).json({
        status: "success",
        user: userProfile,
        following: followInfo.following,
        follower: followInfo.follower,
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
    .paginate(page, itemsPerPage, async(error, users, total) => {
      if (error || !users) {
        return res.status(404).send({
          status: "error",
          message: "No users available",
          error,
        });
      }

      let followUserIds = await followService.followUserIds(req.user.id);

      return res.status(200).send({
        status: "success",
        users,
        page,
        itemsPerPage,
        total,
        pages: Math.ceil(total, itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers,
      });
    });
};

const update = (req, res) => {
  let userIdentity = req.user;
  let userToUpdate = req.body;

  delete userIdentity.iat;
  delete userIdentity.exp;
  delete userIdentity.role;
  delete userIdentity.image;

  User.find({
    $or: [
      { email: userToUpdate.email.toLowerCase },
      { nick: userToUpdate.nick.toLowerCase },
    ],
  }).exec(async (error, users) => {
    if (error) {
      return res.status(500).json({
        status: "error",
        message: "User query error",
      });
    }

    //Esto es pq si el user que me llega con datos a actualizar es el mismo, su propio correo va a decir que ya existe
    //Entonces se usa esta flag
    let userIsset = false;
    users.forEach((user) => {
      if (user && user._id != userIdentity.id) {
        userIsset = true;
      }
    });

    if (userIsset) {
      return res.status(200).send({
        status: "success",
        message: "User already exist",
      });
    }

    if (userToUpdate.password) {
      let pwd = await bcrypt.hash(userToUpdate.password, 10);
      userToUpdate.password = pwd;
    }

    try {
      let userUpdated = await User.findByIdAndUpdate(
        userIdentity.id,
        userToUpdate,
        { new: true }
      );

      if (!userUpdated) {
        return res.status(400).send({
          status: "error",
          message: "Error updating user",
        });
      }

      return res.status(200).send({
        status: "success",
        message: "User updated",
        user: userUpdated,
      });
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "Error updating user",
      });
    }
  });
};

const upload = (req, res) => {
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "File doesnt exist",
    });
  }

  let image = req.file.originalname;

  const imageSplit = image.split(".");
  const extension = imageSplit[1];

  if (
    extension != "png" ||
    extension != "jpg" ||
    extension != "jpeg" ||
    extension != "gif"
  ) {
    const filePath = req.file.path;
    //FileSystem - Borro el archivo
    const fileDeleted = fs.unlinkSync(filePath);

    return res.status(400).json({
      status: "error",
      message: "Invalid extension",
    });
  }

  //new: true te actualiza el objeto
  User.findOneAndUpdate(
    req.user.id,
    { image: req.file.filename },
    { new: true },
    (error, userUpdated) => {
      if (error || !userUpdated) {
        return res.status(500).send({
          status: "error",
          message: "Error updating image",
        });
      }

      return res.status(200).send({
        status: "success",
        user: userUpdated,
        file: req.file,
      });
    }
  );
};

const avatar = (req, res) => {
  const file = req.params.file;
  const filePath = "./uploads/avatar/" + file;

  //Compruebo si existe con stat
  fs.stat(filePath, (error, exists) => {
    if (error || !exists) {
      return res.status(404).send({
        status: "error",
        message: "Image doesnt exist",
      });
    }

    return res.sendFile(path.resolve(filePath));
  });
};

module.exports = {
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
};
