import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/emailService.js";

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  // Check if user exists
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Check if OAuth user without password is trying to login with password
  if (user.isOAuthUser && !user.hasSetPassword) {
    res.status(401);
    const providerName = user.authProvider
      ? user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1)
      : "OAuth";
    throw new Error(
      `This account uses ${providerName} sign-in. Please use ${providerName} to login, or set a password first from your profile.`
    );
  }

  // Verify password
  if (await user.matchPassword(password)) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      employee_role: user.employee_role,
      addresses: user.addresses || [],
      isOAuthUser: user.isOAuthUser || false,
      authProvider: user.authProvider || "local",
      hasSetPassword: user.hasSetPassword || true,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, employee_role } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    // Provide helpful message if OAuth user tries to register with email/password
    if (userExists.isOAuthUser && !userExists.hasSetPassword) {
      const providerName = userExists.authProvider
        ? userExists.authProvider.charAt(0).toUpperCase() +
          userExists.authProvider.slice(1)
        : "OAuth";
      throw new Error(
        `This email is already registered with ${providerName}. Please sign in with ${providerName}, or set a password from your profile to use email/password login.`
      );
    }
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    employee_role: role === "employee" ? employee_role : null,
    addresses: [],
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      employee_role: user.employee_role,
      addresses: user.addresses,
      isOAuthUser: user.isOAuthUser || false,
      authProvider: user.authProvider || "local",
      hasSetPassword: user.hasSetPassword || true,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      employee_role: user.employee_role,
      addresses: user.addresses || [],
      isOAuthUser: user.isOAuthUser || false,
      authProvider: user.authProvider || "local",
      hasSetPassword: user.hasSetPassword || true,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// @desc    OAuth authentication (Google/GitHub)
// @route   POST /api/auth/oauth
// @access  Public
const oauthAuthentication = async (req, res) => {
  const { name, email, avatar, authProvider, authUid, isOAuthUser } = req.body;

  console.log("OAuth authentication request:", {
    email,
    authProvider,
    hasAvatar: !!avatar,
    avatarLength: avatar ? avatar.length : 0,
  });

  // Validate required fields
  if (!email || !authProvider || !authUid) {
    return res.status(400).json({
      success: false,
      message: "Email, auth provider, and auth UID are required",
    });
  }

  // Check if provider is supported
  if (!["google", "github"].includes(authProvider)) {
    return res.status(400).json({
      success: false,
      message: "Unsupported authentication provider",
    });
  }

  try {
    // Check if user already exists with this email
    let user = await User.findOne({ email });

    if (user) {
      // User exists - check if it's the same OAuth account
      if (
        user.isOAuthUser &&
        user.authProvider === authProvider &&
        user.authUid === authUid
      ) {
        // Same OAuth account - update user info and log them in
        user.name = name || user.name;
        // Update avatar if provided, otherwise keep existing (don't overwrite with empty)
        if (avatar && avatar.trim() !== "") {
          user.avatar = avatar;
        }
        await user.save();

        res.json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            addresses: user.addresses || [],
            isOAuthUser: user.isOAuthUser,
            authProvider: user.authProvider,
            hasSetPassword: user.hasSetPassword,
            token: generateToken(user._id),
          },
        });
        return;
      } else if (user.isOAuthUser && user.authProvider !== authProvider) {
        // Different OAuth provider - not allowed for security
        return res.status(409).json({
          success: false,
          message: `This email is already registered using ${
            user.authProvider.charAt(0).toUpperCase() +
            user.authProvider.slice(1)
          }. Please sign in with ${
            user.authProvider.charAt(0).toUpperCase() +
            user.authProvider.slice(1)
          } instead.`,
        });
      } else if (!user.isOAuthUser) {
        // Regular account exists - link OAuth to existing account
        console.log(
          `Linking ${authProvider} OAuth to existing password-based account:`,
          email
        );

        // Update user to support both password and OAuth login
        user.isOAuthUser = true; // Mark as OAuth enabled
        user.authProvider = authProvider;
        user.authUid = authUid;
        user.hasSetPassword = true; // User already has a password (preserve it)
        // Note: user.password is preserved - not modified

        // Update name if OAuth provides a different name
        if (name && name.trim() !== "") {
          user.name = name;
        }

        // Update avatar if provided and not empty
        if (avatar && avatar.trim() !== "") {
          user.avatar = avatar;
        }

        await user.save();

        res.json({
          success: true,
          message: `Your ${
            authProvider.charAt(0).toUpperCase() + authProvider.slice(1)
          } account has been linked to your existing account. You can now sign in using either your password or ${
            authProvider.charAt(0).toUpperCase() + authProvider.slice(1)
          }.`,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            addresses: user.addresses || [],
            isOAuthUser: user.isOAuthUser,
            authProvider: user.authProvider,
            hasSetPassword: user.hasSetPassword,
            token: generateToken(user._id),
          },
        });
        return;
      } else {
        // Same email but different OAuth UID
        // This can happen when web uses Firebase Auth and mobile uses native Google Sign-In
        // They return different user IDs for the same Google account

        // If it's the same provider (both Google), update the UID to the new one
        if (user.authProvider === authProvider && authProvider === "google") {
          console.log(
            `ℹ️ Updating Google OAuth UID for ${email}: ${user.authUid} -> ${authUid}`
          );

          user.authUid = authUid;

          // Update name if OAuth provides a different name
          if (name && name.trim() !== "") {
            user.name = name;
          }

          // Update avatar if provided and not empty
          if (avatar && avatar.trim() !== "") {
            user.avatar = avatar;
          }

          await user.save();

          return res.json({
            success: true,
            message: `Google account UID updated successfully.`,
            data: {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              role: user.role,
              addresses: user.addresses || [],
              isOAuthUser: user.isOAuthUser,
              authProvider: user.authProvider,
              hasSetPassword: user.hasSetPassword,
              token: generateToken(user._id),
            },
          });
        }

        // Different provider or non-Google - not allowed
        return res.status(409).json({
          success: false,
          message: "Authentication mismatch. Please contact support",
        });
      }
    } else {
      // New user - create OAuth account
      // Determine avatar: use OAuth photo if available, otherwise use default
      const defaultAvatar =
        process.env.DEFAULT_USER_IMAGE ||
        "https://res.cloudinary.com/dcs9nphcp/image/upload/v1759859570/defaultUserImage_dzrcwx.png";

      const userAvatar =
        avatar && avatar.trim() !== "" ? avatar : defaultAvatar;

      user = await User.create({
        name: name || email.split("@")[0],
        email,
        avatar: userAvatar,
        role: "user",
        isOAuthUser: true,
        authProvider,
        authUid,
        hasSetPassword: false,
        addresses: [],
      });

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          addresses: user.addresses,
          isOAuthUser: user.isOAuthUser,
          authProvider: user.authProvider,
          hasSetPassword: user.hasSetPassword,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    console.error("OAuth authentication error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return res.status(500).json({
      success: false,
      message: error.message || "OAuth authentication failed",
    });
  }
};

// @desc    Set password for OAuth user
// @route   POST /api/auth/set-password
// @access  Private
const setPasswordForOAuthUser = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Allow both OAuth users to add password AND regular users to update password
  // No restriction - any authenticated user can set/update their password

  // Set password and mark as set
  user.password = password;
  user.hasSetPassword = true;
  await user.save();

  res.json({
    success: true,
    message: "Password set successfully",
    data: {
      hasSetPassword: user.hasSetPassword,
    },
  });
});

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("No user found with this email address");
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (1 hour)
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

  try {
    // Send email
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
      data: {
        message: `Email sent to ${user.email}`,
      },
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error("Email could not be sent");
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error("Please provide token and password");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  // Hash token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.hasSetPassword = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful",
    data: {
      message: "Password has been reset successfully",
    },
  });
});

export {
  loginUser,
  registerUser,
  getUserProfile,
  logoutUser,
  oauthAuthentication,
  setPasswordForOAuthUser,
  forgotPassword,
  resetPassword,
};
