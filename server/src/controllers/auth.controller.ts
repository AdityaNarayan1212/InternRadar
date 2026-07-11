import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { asyncHandler } from '../lib/asyncHandler';
import { RegisterInput, LoginInput } from '../validators/auth.validators';

const signToken = (userId: string, email: string) =>
  jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: '7d' });

// REGISTER  (req.body is already validated + typed by validateBody(registerSchema))
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, college, branch, year } = req.body as RegisterInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      college: college || null,
      branch: branch || null,
      year: year ?? null,
      skills: [],
    },
  });

  const token = signToken(user.id, user.email);

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
      },
    },
  });
});

// LOGIN
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user.id, user.email);

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
      },
    },
  });
});

// GET CURRENT USER
export const getMe = asyncHandler(async (req: Request, res: Response) => {
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
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, data: user });
});
