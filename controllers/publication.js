const Publication = require("../models/publication");
const fs = require("fs");
const path = require("path");

const followService = require("../services/followService");

const save = (req, res) => {
  const params = req.body;

  console.log(params);

  if (!params.text) {
    return res.status(400).send({
      status: "error",
      message: "You must send the text of the publication",
    });
  }

  let publication = new Publication(params);
  publication.user = req.user.id;

  publication.save((error, publicationStored) => {
    if (error || !publicationStored) {
      return res.status(400).send({
        status: "error",
        message: "An error occurred while trying to save the post",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Publication saved",
      publicationStored,
    });
  });
};

const detail = (req, res) => {
  const publicationId = req.params.id;

  Publication.findById(publicationId, (error, publicationStored) => {
    if (error || !publicationStored) {
      return res.status(404).send({
        status: "error",
        message: "The post doesnt exist",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Show publitacion",
      publication: publicationStored,
    });
  });
};

const remove = (req, res) => {
  let publicationId = req.params.id;

  Publication.find({ user: req.user.id, _id: publicationId }).remove(
    (error) => {
      if (error) {
        return res.status(400).send({
          status: "error",
          message: "The publication could not be delete",
        });
      }

      return res.status(200).send({
        status: "success",
        message: "The post has been deleted",
        publicationId,
      });
    }
  );
};

const user = (req, res) => {
  const userId = req.params.id;

  let page = req.params.page ? req.params.page : 1;

  const itemsPerPage = 5;

  Publication.find({ user: userId })
    .sort("-created_at")
    .populate("user", "-password -__v -role -email")
    .paginate(page, itemsPerPage, (error, publications, total) => {
      if (error || !publications || publications.length <= 0) {
        return res.status(404).send({
          status: "error",
          message: "No posts to show",
        });
      }

      return res.status(200).send({
        status: "success",
        message: "Posts from user",
        user: req.user,
        page,
        total,
        pages: Math.ceil(total / itemsPerPage),
        publications,
      });
    });
};

const upload = (req, res) => {
  const publicationId = req.params.id;

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
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpeg" &&
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
  Publication.findOneAndUpdate(
    { user: req.user.id, _id: publicationId },
    { file: req.file.filename },
    { new: true },
    (error, publicationUpdated) => {
      if (error || !publicationUpdated) {
        const filePath = req.file.path;
        //FileSystem - Borro el archivo
        const fileDeleted = fs.unlinkSync(filePath);
        return res.status(500).send({
          status: "error",
          message: "Error updating image",
        });
      }

      return res.status(200).send({
        status: "success",
        publication: publicationUpdated,
        file: req.file,
      });
    }
  );
};

const media = (req, res) => {
  const file = req.params.file;
  const filePath = "./uploads/publications/" + file;

  //Compruebo si existe con stat
  fs.stat(filePath, (error, exists) => {
    if (error || !exists) {
      return res.status(404).send({
        status: "error",
        message: "File doesnt exist",
      });
    }

    return res.sendFile(path.resolve(filePath));
  });
};

const feed = async (req, res) => {
  let page = req.params.page ? req.params.page : 1;

  const itemsPerPage = 5;

  try {
    const myFollows = await followService.followUserIds(req.user.id);

    const publications = Publication.find({
      user: { $in: myFollows.following },
    })
      .populate("user", "-password -role -__v -email")
      .sort("-created_at")
      .paginate(page, itemsPerPage, (error, publications, total) => {
        if (error || !publications) {
          return res.status(500).send({
            status: "error",
            message: "No posts to show",
          });
        }

        return res.status(200).send({
          status: "success",
          message: "Post feed",
          following: myFollows.following,
          total,
          page,
          pages: Math.ceil(total / itemsPerPage),
          publications,
        });
      });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred listing feed posts",
    });
  }
};

module.exports = {
  save,
  detail,
  remove,
  user,
  upload,
  media,
  feed,
};
