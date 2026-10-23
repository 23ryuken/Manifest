import { registerUser } from '../services/auth.service.js';

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