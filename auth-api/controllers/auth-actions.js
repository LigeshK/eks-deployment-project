// Import bcryptjs for password hashing
const bcrypt = require("bcryptjs");
// Import jsonwebtoken for JWT operations
const jwt = require("jsonwebtoken");
// Import custom error helper
const { createAndThrowError } = require("../helpers/error");

// Hashes a plain password using bcrypt
const createPasswordHash = async (password) => {
  try {
    console.log(password); // Log the raw password (for debugging)
    const hashedPassword = await bcrypt.hash(password, 12); // Hash with salt rounds = 12
    return hashedPassword; // Return hashed password
  } catch (err) {
    createAndThrowError("Failed to create secure password.", 500); // Throw error if hashing fails
  }
};

// Verifies a plain password against a hashed password
const verifyPasswordHash = async (password, hashedPassword) => {
  let passwordIsValid;
  try {
    passwordIsValid = await bcrypt.compare(password, hashedPassword); // Compare passwords
    console.log(passwordIsValid, password, hashedPassword); // Log result and inputs
  } catch (err) {
    createAndThrowError("Failed to verify password.", 500); // Error if bcrypt fails
  }
  if (!passwordIsValid) {
    createAndThrowError("Failed to verify password.", 401); // Error if password is invalid
  }
};

// Creates a JWT token signed with TOKEN_KEY, expires in 1 hour
const createToken = () => {
  return jwt.sign({}, process.env.TOKEN_KEY, {
    expiresIn: "1h",
  });
};

// Verifies a JWT token using TOKEN_KEY
const verifyToken = (token) => {
  try {
    jwt.verify(token, process.env.TOKEN_KEY); // Throws if invalid
  } catch (err) {
    createAndThrowError("Could not verify token.", 401); // Error if verification fails
  }
};

// Express handler: hashes password from request params and returns it
const getHashedPassword = async (req, res, next) => {
  const rawPassword = req.params.password; // Get password from params
  try {
    const hashedPassword = await createPasswordHash(rawPassword); // Hash password
    res.status(200).json({ hashed: hashedPassword }); // Respond with hash
  } catch (err) {
    next(err); // Pass error to next middleware
  }
};

// Express handler: verifies password and returns JWT token
const getToken = async (req, res, next) => {
  const password = req.body.password; // Get password from body
  const hashedPassword = req.body.hashedPassword; // Get hash from body
  try {
    await verifyPasswordHash(password, hashedPassword); // Verify password
  } catch (err) {
    return next(err); // Pass error if verification fails
  }

  const token = createToken(); // Create JWT token

  res.status(200).json({ token }); // Respond with token
};

// Express handler: verifies JWT token from request body
const getTokenConfirmation = (req, res) => {
  const token = req.body.token; // Get token from body

  verifyToken(token); // Verify token

  res.status(200).json({}); // Respond with empty object if valid
};

// Export route handlers for use in Express
exports.getHashedPassword = getHashedPassword;
exports.getToken = getToken;
exports.getTokenConfirmation = getTokenConfirmation;
