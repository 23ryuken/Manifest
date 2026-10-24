import jwt from 'jsonwebtoken';

export function signToken(userId) {
  return jwt.sign({ userId: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}