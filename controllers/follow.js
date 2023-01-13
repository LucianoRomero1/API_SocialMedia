const Follow = require("../models/follow");
const User = require("../models/user");
const pagination = require("mongoose-pagination");

const followService = require("../services/followService");

const save = (req, res) => {
  const params = req.body;

  const identity = req.user;

  let userToFollow = new Follow({
    user: identity.id,
    followed: params.followed,
  });

  userToFollow.save((error, followStored) => {
    if (error || !followStored) {
      return res.status(500).send({
        status: "error",
        message: "Could not follow user",
      });
    }

    return res.status(200).send({
      status: "success",
      identity: req.user,
      follow: followStored,
    });
  });
};

const unfollow = (req, res) => {
  const userId = req.user.id;

  const followedId = req.params.id;

  Follow.find({
    user: userId,
    followed: followedId,
  }).remove((error, followDeleted) => {
    if (error || !followDeleted) {
      return res.status(500).send({
        status: "error",
        message: "Error when unfollowing user",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "User unfollowed successfully",
      identity: req.user,
      followDeleted,
    });
  });
};

const following = (req, res) => {
  let userId = req.params.id ? req.params.id : req.user.id;
  let page = req.params.page ? req.params.page : 1;

  const itemPerPage = 5;

  //Populate es para obtener los objetos enteros a traves de los id
  Follow.find({ user: userId })
    .populate("user followed", "-password -role -__v -email")
    .paginate(page, itemsPerPage, async(error, follows, total) => {

      let followUserIds = await followService.followUserIds(req.user.id);

      return res.status(200).send({
        status: "success",
        message: "List of users that I am following",
        follows,
        total,
        pages: Math.ceil(total / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers,
      });
    });
};

const followers = (req, res) => {
  let userId = req.params.id ? req.params.id : req.user.id;
  let page = req.params.page ? req.params.page : 1;

  const itemPerPage = 5;

  Follow.find({ followed: userId })
    .populate("user", "-password -role -__v -email")
    .paginate(page, itemsPerPage, async(error, follows, total) => {

    let followUserIds = await followService.followUserIds(req.user.id);

    return res.status(200).send({
      status: "success",
      message: "List of users who follow me",
      follows,
      total,
      pages: Math.ceil(total / itemsPerPage),
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers,
    });
  });

  return res.status(200).send({
    status: "success",
    message: "List of users who follow me",
  });
};

module.exports = {
  save,
  unfollow,
  following,
  followers,
};
