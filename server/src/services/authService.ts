import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { User, UserResponse } from '../types/index.js';

class AuthService {
  /**
   * Register a new user
   */
  public async register(email: string, password: string, name?: string): Promise<{ user: UserResponse; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Valid email address is required.');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    // Check existing
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      throw new Error('A user with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertRes = await db.query(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING id, email, name, created_at`,
      [cleanEmail, passwordHash, name?.trim() || cleanEmail.split('@')[0]]
    );

    const user: UserResponse = insertRes.rows[0];
    const token = this.generateToken(user.id, user.email);

    return { user, token };
  }

  /**
   * Log in an existing user
   */
  public async login(email: string, password: string): Promise<{ user: UserResponse; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Email and password are required.');
    }

    const res = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    const userRow: User = res.rows[0];

    if (!userRow) {
      throw new Error('Invalid email or password.');
    }

    const isValid = await bcrypt.compare(password, userRow.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const user: UserResponse = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      created_at: userRow.created_at,
    };

    const token = this.generateToken(user.id, user.email);
    return { user, token };
  }

  /**
   * Get current user by ID
   */
  public async getUserById(userId: number): Promise<UserResponse> {
    const res = await db.query('SELECT id, email, name, created_at FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) {
      throw new Error('User not found.');
    }
    return res.rows[0];
  }

  /**
   * Quick Demo Account Initializer
   * Creates or retrieves a ready-to-test reviewer account
   */
  public async getOrCreateDemoUser(): Promise<{ user: UserResponse; token: string }> {
    const demoEmail = 'demo@stackpulse.dev';
    const demoPass = 'stackpulse123';

    const existing = await db.query('SELECT * FROM users WHERE email = $1', [demoEmail]);
    if (existing.rows.length > 0) {
      const u = existing.rows[0];
      const user: UserResponse = { id: u.id, email: u.email, name: u.name, created_at: u.created_at };
      return { user, token: this.generateToken(user.id, user.email) };
    }

    return this.register(demoEmail, demoPass, 'Demo Reviewer');
  }

  /**
   * Generate signed JWT
   */
  private generateToken(userId: number, email: string): string {
    return jwt.sign(
      { userId, email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify JWT
   */
  public verifyToken(token: string): { userId: number; email: string } {
    try {
      return jwt.verify(token, config.jwtSecret) as { userId: number; email: string };
    } catch (err) {
      throw new Error('Invalid or expired authentication token.');
    }
  }
}

export const authService = new AuthService();
