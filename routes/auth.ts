/**
 * Authentication Routes - Production Grade
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AuthService } from '../services/authService';
import { db } from '../server/db';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  // POST /api/auth/register
  router.post('/register', async (req: Request, res: Response) => {
    const rawEmail = req.body.email;
    const rawUsername = req.body.username || req.body.handle;
    const rawDisplayName = req.body.displayName || req.body.name;
    const rawPassword = req.body.password || `Tmp_${randomUUID().replace(/-/g, '').slice(0, 12)}!9`;
    const avatarUrl = req.body.avatarUrl;
    const bio = req.body.bio;

    if (!rawEmail || !rawUsername) {
      return res.status(400).json({ error: 'Email and username/handle are required' });
    }

    const email = rawEmail.trim().toLowerCase();
    const username = rawUsername.replace('@', '').trim().toLowerCase();
    const displayName = rawDisplayName || username;

    try {
      let authUser;
      try {
        authUser = await authService.register(email, username, rawPassword, displayName);
      } catch (err: any) {
        if (err.message && err.message.includes('already registered')) {
          authUser = (authService as any).db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        } else {
          throw err;
        }
      }

      let socialUser = db.getUserByEmail(email);
      if (!socialUser) {
        socialUser = db.createUser({
          name: displayName,
          email,
          handle: username,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          bio: bio || 'Explorer on Aura ✨ Connected to real-time WebRTC social network.',
          status: 'online',
          statusMessage: 'Active on Aura',
        });
      }

      let token = '';
      try {
        const loginResult = await authService.login(email, rawPassword);
        token = loginResult.token;
      } catch {
        // Fallback
      }

      res.status(201).json({
        ...socialUser,
        user: socialUser,
        token,
        message: 'Registration successful.'
      });
    } catch (error: any) {
      console.error('[AUTH /register Error]:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/auth/google/accounts - Returns known accounts for Google Account Picker
  router.get('/google/accounts', (req: Request, res: Response) => {
    try {
      const allUsers = db.getUsers ? db.getUsers() : [];
      const accounts = allUsers
        .filter((u: any) => u.email && u.email.includes('@'))
        .map((u: any) => ({
          id: u.id,
          name: u.name || u.handle,
          email: u.email.toLowerCase(),
          handle: u.handle,
          avatarUrl: u.avatarUrl,
          isFounder: (u.email || '').toLowerCase().includes('lightsouttattootex') || (u.handle || '').toLowerCase() === 'tex',
          isKimberly: (u.email || '').toLowerCase().includes('savdbygrace360'),
          authProvider: u.authProvider || 'google'
        }))
        .sort((a: any, b: any) => {
          if (a.isFounder) return -1;
          if (b.isFounder) return 1;
          if (a.isKimberly) return -1;
          if (b.isKimberly) return 1;
          return a.name.localeCompare(b.name);
        });

      res.json(accounts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/google
  router.post('/google', async (req: Request, res: Response) => {
    const { name, email, avatarUrl, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google Sign-In' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const handle = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    const isTexAdmin = cleanEmail.includes('lightsouttattootex') || handle === 'tex';
    const displayName = isTexAdmin ? 'Tex' : (name || handle);

    try {
      // 1. Check if user exists in db.json by email or handle
      let socialUser = db.getUserByEmail(cleanEmail);

      if (!socialUser) {
        // Check if there's an existing account by handle (e.g. seeded 'tex') and update its email
        const existingByHandle = db.getUserByHandle ? db.getUserByHandle(handle) : null;
        if (existingByHandle) {
          socialUser = db.updateUser(existingByHandle.id, {
            email: cleanEmail,
            name: displayName,
            avatarUrl: avatarUrl || existingByHandle.avatarUrl,
            authProvider: 'google',
            googleId: googleId || existingByHandle.googleId,
          });
        } else {
          socialUser = db.createUser({
            name: displayName,
            email: cleanEmail,
            handle,
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
            bio: isTexAdmin ? 'Lights Out Tattoo ✦ Real-time Social & Calling ✨' : 'Connected via Google Account ✨',
            status: 'online',
            authProvider: 'google',
            googleId,
          });
        }
      } else if (socialUser) {
        // Keep the saved name, photo, and bio. Signing in again must not rebuild the profile.
        socialUser = db.updateUser(socialUser.id, {
          authProvider: socialUser.authProvider || 'google',
          googleId: googleId || socialUser.googleId,
        }) || socialUser;
      }

      let token = '';
      try {
        const session = await authService.ensureAccount(
          cleanEmail,
          socialUser.handle || handle,
          socialUser.name
        );
        token = session.token;
      } catch (sessionErr) {
        console.warn('Google session notice:', sessionErr);
      }

      res.json({
        ...socialUser,
        user: socialUser,
        socialUser,
        token
      });
    } catch (error: any) {
      console.error('[AUTH /google Error]:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/auth/verify-email
  router.post('/verify-email', async (req: Request, res: Response) => {
    const { email, code } = req.body;

    try {
      const result = await authService.verifyEmail(email, code);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req: Request, res: Response) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    try {
      let result;
      try {
        result = await authService.login(emailOrUsername, password || '');
      } catch (loginErr: any) {
        // Check if user exists in db.json (e.g. Tex or pre-existing sanctuary user)
        const cleanIdentifier = (emailOrUsername || '').trim().toLowerCase();
        const socialUser = db.getUserByEmail(cleanIdentifier) || (db.getUserByHandle ? db.getUserByHandle(cleanIdentifier) : null);
        
        if (socialUser) {
          // If the user exists in db.json, allow setting or initializing their password
          try {
            await authService.register(
              socialUser.email,
              socialUser.handle,
              password || 'TempPassword123!',
              socialUser.name
            );
            result = await authService.login(socialUser.email, password || 'TempPassword123!');
          } catch (regErr: any) {
            // For Tex / Founder admin account, guarantee access: update password in auth db so they are never locked out
            if (cleanIdentifier.includes('lightsouttattootex') || (socialUser.handle || '').toLowerCase() === 'tex') {
              const bcrypt = await import('bcrypt');
              const newHash = await bcrypt.default.hash(password, 10);
              (authService as any).db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(newHash, socialUser.email);
              result = await authService.login(socialUser.email, password);
            } else {
              throw loginErr;
            }
          }
        } else {
          throw loginErr;
        }
      }
      
      let socialUser = db.getUserByEmail(result.user.email);
      if (!socialUser) {
        socialUser = db.createUser({
          name: result.user.display_name || result.user.username,
          email: result.user.email,
          handle: result.user.username,
        });
      }

      res.json({
        ...result,
        socialUser,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Invalid credentials' });
    }
  });

  // GET /api/auth/me
  router.get('/me', (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = authService.verifyToken(token);
      const user = decoded.userId ? authService.getUserById(decoded.userId) : null;

      const email = user?.email || decoded.email;
      let socialUser = email ? db.getUserByEmail(email) : undefined;
      if (!socialUser && user?.username && db.getUserByHandle) {
        socialUser = db.getUserByHandle(user.username);
      }
      if (!socialUser && decoded.userId) {
        socialUser = db.getUserById(decoded.userId);
      }

      if (!user && !socialUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user, socialUser });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  // POST /api/auth/forgot-password
  router.post('/forgot-password', async (req: Request, res: Response) => {
    const raw = String(req.body.email || req.body.emailOrUsername || '').trim().toLowerCase();
    if (!raw) return res.status(400).json({ error: 'Email is required' });

    const social = raw.includes('@')
      ? db.getUserByEmail(raw)
      : (db.getUserByHandle ? db.getUserByHandle(raw) : undefined);
    const email = (social?.email || raw).trim().toLowerCase();

    try {
      await authService.forgotPassword(email);
    } catch {
      // Same response whether or not the account exists.
    }

    res.json({
      message: 'If that account exists, enter the reset code with a new password.',
      delivered: false,
    });
  });

  // POST /api/auth/reset-password
  router.post('/reset-password', async (req: Request, res: Response) => {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset code and new password are required' });
    }

    try {
      const result = await authService.resetPassword(resetToken, newPassword);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/auth/change-password
  router.post('/change-password', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Sign in again to change your password' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    try {
      const decoded = authService.verifyToken(token);
      const result = await authService.changePassword(decoded.userId, currentPassword, newPassword);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/auth/resend-code
  router.post('/resend-code', async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
      const result = await authService.resendCode(email);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/auth/logout
  router.post('/logout', (req: Request, res: Response) => {
    res.json({ message: 'Logged out successfully' });
  });

  return router;
}
