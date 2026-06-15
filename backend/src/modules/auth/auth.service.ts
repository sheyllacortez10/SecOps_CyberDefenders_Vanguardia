import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors/AppError';
import { authRepository } from './auth.repository';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret-key';

const sanitizeUser = (user: { id: string; name: string; email: string; role: 'student' | 'admin'; created_at: Date }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.created_at
});

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await authRepository.findUserByEmail(input.email);

    if (existingUser) {
      throw new AppError(409, 'El correo electrónico ya está en uso.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const createdUser = await authRepository.createUser({
      id: `user-${Date.now()}`,
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'student'
    });

    const token = jwt.sign({ sub: createdUser.id, role: createdUser.role }, getJwtSecret(), { expiresIn: '8h' });

    return {
      token,
      user: sanitizeUser(createdUser)
    };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user) {
      throw new AppError(401, 'Correo o contraseña incorrectos.');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError(401, 'Correo o contraseña incorrectos.');
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), { expiresIn: '8h' });

    return {
      token,
      user: sanitizeUser(user)
    };
  }
};
