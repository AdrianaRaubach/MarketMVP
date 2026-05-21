import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';

declare module 'express-session' {
    interface SessionData {
        urls: string[];
        returnTo?: string;
        pendingVerificationPersonId?: number;
        user?: {
            id: number;
            name: string;
            email: string;
            type: PersonType;
            blocked: boolean;
            verified_email: boolean;
        };
    }
}

import * as PersonController from './controllers/PersonController';
import * as AuthController from './controllers/AuthController';
import * as VerificationController from './controllers/VerificationController';
import * as AdminController from './controllers/AdminController';
import * as ProfileController from './controllers/ProfileController';
import * as CommentController from './controllers/CommentController';
import { isAdmin } from './middleware/isAdmin';
import { isNotBlocked } from './middleware/isNotBloqued';
import { isVerified } from './middleware/isVerified';
import { PersonType } from './enums/PersonType';
import { logRequests } from './middleware/logger';
import * as LogController from './controllers/LogController';
import { errorHandler } from './middleware/errorHandler';
import { isSeller } from './middleware/isSeller';
import * as ProductController from './controllers/ProductController';
import { commentImageUpload } from './config/upload';
import path from 'node:path';

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.use(
    session({
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 24 },
    })
);

app.use((req, res, next) => {
    req.session.urls = req.session.urls || [];
    req.session.urls.push(req.url);
    next();
});

app.use(logRequests);

app.get('/login', AuthController.showLoginForm);
app.post('/login', AuthController.login);
app.get('/logout', AuthController.logout);
app.get('/signup', PersonController.showRegisterForm);
app.post('/signup', PersonController.create);
app.get('/', ProductController.listAllProducts);
app.get('/product-details/:id', ProductController.getProductDetails);
app.get('/profile-seller-public/:id', ProfileController.showProfileSellerPublic);

app.get('/check-email', VerificationController.showCheckEmailPage);
app.post('/resend-verification', VerificationController.resendVerification);
app.post('/verify-email', VerificationController.verifyEmail);

app.get('/auth', isVerified, isNotBlocked, ProductController.listAllProducts);
app.get('/admin-dashboard', isAdmin, isNotBlocked, isVerified, AdminController.showAdminDashboard);
app.post('/admin-dashboard', isAdmin, isNotBlocked, isVerified, AdminController.searchUsers);
app.post('/block-user/:id', isAdmin, isNotBlocked, isVerified, AdminController.blockUser);
app.get('/admin-logs', isAdmin, isNotBlocked, isVerified, LogController.showLogs);
app.get('/seller-dashboard', isSeller, isNotBlocked, isVerified, ProductController.showSellerDashboard);
app.post('/product-details/:id/comment', isNotBlocked, isVerified, commentImageUpload.array('comment_images', 5), CommentController.addComment);
app.delete('/product-details/:id/comment', isNotBlocked, isVerified, CommentController.deleteComment);
app.post('/products', isSeller, isNotBlocked, isVerified, ProductController.uploadMultipleProductImages, ProductController.createProduct);
app.get('/profile', isNotBlocked, isVerified, ProfileController.showProfile);
app.post('/profile/update', isNotBlocked, isVerified, ProfileController.updateProfile);
app.post('/profile/address', isNotBlocked, isVerified, ProfileController.updateAddress);
app.post('/profile/change-password', isNotBlocked, isVerified, ProfileController.changePassword);
app.post('/product-details/:id/like', isNotBlocked, isVerified, ProductController.toggleLike);
app.post('/product-details/commentlike/:id', isNotBlocked, isVerified, CommentController.toggleLike);


app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
