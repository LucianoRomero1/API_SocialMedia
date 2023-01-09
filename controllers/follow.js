const testFollow = (req, res) => {
  return res.status(200).send({
    message: "Message sended from: controllers/follow.js",
  });
};

module.exports = {
  testFollow,
};
