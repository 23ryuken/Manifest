import bcrypt from 'bcrypt';
import User from '../models/User.js';

// Helper function to create an HTTP error with a status code and message
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Helper function to check if a value is a non-empty string
const isFilled = (value) => typeof value === 'string' && value.trim() !== '';

export async function registerUser({ fullname, email, password }) {
  if (!isFilled(fullname) || !isFilled(email) || !isFilled(password)) {
    throw httpError(400, 'All fields are required');
  }

  if (password.length < 8 || password.length > 72) {
    throw httpError(400, 'Password must be between 8 and 72 characters');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    throw httpError(400, 'Invalid email format');
    }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await User.create({ fullname, email, passwordHash });

    return {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      createdAt: user.createdAt,
    };
  } catch (error) {
    if (error.code === 11000) {
      throw httpError(409, 'An account with this email already exists');
    }
    if (error.name === 'ValidationError') {
      throw httpError(400, error.message);
    }
    throw error;
  }
}