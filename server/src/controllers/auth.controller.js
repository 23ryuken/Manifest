import { registerUser, loginUser } from '../services/auth.service.js';
import { signToken } from '../utils/token.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: SEVEN_DAYS_MS,
};

export async function register(req, res) {
  try {
    const { fullname, email, password } = req.body ?? {};

    const user = await registerUser({ fullname, email, password });

    return res.status(201).json(user);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    console.error('Registration failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    const user = await loginUser({ email, password });

    const token = signToken(user.id);
    res.cookie('token', token, cookieOptions);

    return res.status(200).json(user);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}