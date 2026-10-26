import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        // Validate presence AND type
        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res
                .status(400)
                .json({ message: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: 'Password must be at least 6 characters long' });
        }

        // Normalize explicitly so the lookup matches what the schema stores
        const normalizedEmail = email.trim().toLowerCase();

        // Cheap early exit, before the expensive hash
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: 'Email is already in use' });
        }

        // Hash only once we know the request is worth the CPU
        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email: normalizedEmail,
            passwordHash,
        });

        res.status(201).json(newUser);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Email is already in use' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validate presence AND type
        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res
                .status(400)
                .json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail }).select(
            '+passwordHash'
        );

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Minimal payload: just the id (as a string)
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        // toJSON strips passwordHash even though this query loaded it
        res.json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        res.json(user); // toJSON strips passwordHash
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}