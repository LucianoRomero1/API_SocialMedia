const testUser = (req, res) => {
  return res.status(200).send({
    message: "Message sended from: controllers/user.js",
  });
};

const register = (req, res) => {
  return res.status(200).json({
    message: "Register user",
  });
};

module.exports = {
  testUser,
  register
};
