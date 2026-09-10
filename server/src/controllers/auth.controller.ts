import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// REGISTER
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, college, branch, year } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    // Hash password — never store plain text passwords
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        college: college || null,
        branch: branch || null,
        year: year ? parseInt(year) : null,
        skills: [],
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          college: user.college,
          branch: user.branch,
          year: user.year,
          skills: user.skills,
          resumeUrl: user.resumeUrl,
          isAdmin: user.isAdmin,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// LOGIN
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          college: user.college,
          branch: user.branch,
          year: user.year,
          skills: user.skills,
          resumeUrl: user.resumeUrl,
          isAdmin: user.isAdmin,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// GET CURRENT USER
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        college: true,
        branch: true,
        year: true,
        skills: true,
        resumeUrl: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
};