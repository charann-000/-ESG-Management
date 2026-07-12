const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

/**
 * Generate a JWT Session Token.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

/**
 * Generate a strong temporary password meeting the policy criteria:
 * Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.
 */
const generateTempPassword = () => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*";

  // Guarantee at least one character from each required set
  let pwd = [
    lowercase[crypto.randomInt(0, lowercase.length)],
    uppercase[crypto.randomInt(0, uppercase.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    special[crypto.randomInt(0, special.length)],
  ];

  // Fill up the rest to 12 characters to ensure high entropy
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    pwd.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Shuffle array using Fisher-Yates or secure sort
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }

  return pwd.join("");
};

module.exports = {
  generateToken,
  generateTempPassword,
};
