import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { thumbnailUpload, mediaUpload } from '../middleware/upload.middleware';

import * as auth from '../controllers/auth.controller';
import * as user from '../controllers/user.controller';
import * as family from '../controllers/family.controller';
import * as announcement from '../controllers/announcement.controller';
import * as message from '../controllers/message.controller';

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────
router.post('/auth/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
  ],
  validate,
  auth.register
);

router.get('/auth/verify-email', auth.verifyEmail);

router.post('/auth/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  auth.login
);

router.post('/auth/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  auth.forgotPassword
);

router.post('/auth/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  validate,
  auth.resetPassword
);

// ── Users ─────────────────────────────────────────────────────────
router.get('/users/me', authenticate, user.getMe);
router.put('/users/me', authenticate, thumbnailUpload.single('thumbnail'), user.updateProfile);
router.get('/users/search', authenticate, [query('q').optional().isString()], user.searchUsers);
router.get('/users/:id', authenticate, user.getUserById);

// ── Family ────────────────────────────────────────────────────────
router.get('/family', authenticate, family.getFamilyMembers);
router.post('/family',
  authenticate,
  thumbnailUpload.single('thumbnail'),
  [body('name').trim().notEmpty(), body('age').isInt({ min: 0, max: 120 })],
  validate,
  family.addFamilyMember
);
router.put('/family/:id', authenticate, thumbnailUpload.single('thumbnail'), family.updateFamilyMember);
router.delete('/family/:id', authenticate, family.deleteFamilyMember);

// ── Announcements ─────────────────────────────────────────────────
router.get('/announcements', authenticate, announcement.getAnnouncements);
router.post('/announcements',
  authenticate,
  mediaUpload.single('media'),
  [body('content').trim().notEmpty()],
  validate,
  announcement.createAnnouncement
);
router.put('/announcements/:id', authenticate, [body('content').trim().notEmpty()], validate, announcement.updateAnnouncement);
router.delete('/announcements/:id', authenticate, announcement.deleteAnnouncement);

// Comments
router.get('/announcements/:id/comments', authenticate, announcement.getComments);
router.post('/announcements/:id/comments',
  authenticate,
  [body('content').trim().notEmpty()],
  validate,
  announcement.addComment
);
router.delete('/announcements/:id/comments/:commentId', authenticate, announcement.deleteComment);

// Reactions
router.post('/announcements/:id/reactions',
  authenticate,
  [body('type').isIn(['like', 'love', 'hug', 'celebrate', 'support'])],
  validate,
  announcement.toggleReaction
);

// ── Messages ──────────────────────────────────────────────────────
router.get('/messages', authenticate, message.getConversations);
router.get('/messages/:partnerId', authenticate, message.getMessages);
router.post('/messages',
  authenticate,
  [body('receiverId').notEmpty(), body('content').trim().notEmpty()],
  validate,
  message.sendMessage
);
router.get('/messages/unread/count', authenticate, message.getUnreadCount);

export default router;
