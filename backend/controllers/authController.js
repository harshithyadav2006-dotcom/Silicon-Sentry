const { select, insert } = require("../config/supabase");

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      message: "Email, password, and role are required.",
    });
  }

  try {
    const users = await select(
      "app_users",
      {
        select: "id,name,email,role",
        email: `eq.${email.toLowerCase()}`,
        password: `eq.${password}`,
        role: `eq.${role}`,
        limit: 1,
      },
      {
        Prefer: "count=exact",
      }
    );

    const user = users?.[0];

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials for the selected role.",
      });
    }

    return res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: `Login failed: ${error.message}`,
    });
  }
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email, and password are required.",
    });
  }

  try {
    const existingUsers = await select("app_users", {
      select: "id,email",
      email: `eq.${email.toLowerCase()}`,
      limit: 1,
    });

    if (existingUsers?.length) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const createdUsers = await insert("app_users", {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password,
      role: "user",
    });

    const user = createdUsers?.[0];

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: `Signup failed: ${error.message}`,
    });
  }
};

module.exports = {
  login,
  signup,
};
