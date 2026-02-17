import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { userRepository } from '../repositories/user.repository.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new Error('E-mail já cadastrado');
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    const token = this.generateToken(user.id, user.email);
    return { user, token };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user?.passwordHash) throw new Error('E-mail ou senha inválidos');
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new Error('E-mail ou senha inválidos');
    const token = this.generateToken(user.id, user.email);
    return {
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      token,
    };
  },

  generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );
  },
};
