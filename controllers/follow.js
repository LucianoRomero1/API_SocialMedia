const Follow = require("../models/follow");
const User = require("../models/user");

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

module.exports = {
  save,
  unfollow,
};
