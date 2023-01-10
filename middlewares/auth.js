const jwt = require("jwt-simple");
const moment = require("moment");

const libjwt = require("../services/jwt");
const secretKey = libjwt.secretKey;

exports.auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "The request does not have the authentication header",
    });
  }

  //Clean simples and dobule quotes from token
  let token = req.headers.authorization.replace(/['"]+/g, "");

  try {
    let payload = jwt.decode(token, secretKey);

    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        status: "error",
        message: "Token has expired",
        error,
      });
    }

    req.user = payload;
  } catch (error) {
    return res.status(404).send({
      status: "error",
      message: "Invalid Token",
      error,
    });
  }

  next();
};
