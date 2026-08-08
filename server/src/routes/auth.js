import { Router } from 'express';
import User from '../models/User.js';
import Room from '../models/Room.js';
import { generateToken } from '../utils/generateToken.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role === 'manager' ? 'manager' : 'employee',
    });

    // Real teams don't start empty — every new signup lands in a shared
    // default channel automatically, the way Slack/Discord drop new
    // members into #general. Created on first signup if it doesn't exist.
    await Room.findOneAndUpdate(
      { type: 'team', name: 'General' },
      {
        $setOnInsert: { type: 'team', name: 'General', colorTag: '#5DCAA5', isDefault: true },
        $addToSet: { members: user._id },
      },
      { upsert: true, new: true }
    );

    const token = generateToken(user);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Could not create account.', detail: err.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = generateToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Could not sign in.', detail: err.message });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

// Update profile — name and avatar only. Email is intentionally left
// unchangeable here to avoid the added complexity of re-verifying a new
// address; that's a reasonable follow-up if it's ever needed.
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty.' });
      }
      req.user.name = name.trim();
    }
    if (avatarUrl !== undefined) {
      req.user.avatarUrl = avatarUrl;
    }

    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Could not update profile.', detail: err.message });
  }
});

// Change password while signed in — requires the current password. Also
// clears mustChangePassword, which a manager's reset-password action sets
// (see routes/users.js) to force a fresh sign-in through this route.
router.patch('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    req.user.passwordHash = await User.hashPassword(newPassword);
    req.user.mustChangePassword = false;
    await req.user.save();

    res.json({ message: 'Password updated successfully.', user: req.user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Could not update password.', detail: err.message });
  }
});

export default router;