const testPublication = (req, res) => {
  return res.status(200).send({
    message: "Message sended from: controllers/publication.js",
  });
};

module.exports = {
  testPublication,
};
