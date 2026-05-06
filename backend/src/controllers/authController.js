const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { LenderUser } = require('../models');

const register = async (req, res) => {
  try {
    const { userEmail, userPassword, userFirstName, userLastName } = req.body;

    const existingUser = await LenderUser.findOne({ where: { userEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(userPassword, 12);

    const user = await LenderUser.create({
      userEmail,
      userPassword: hashedPassword,
      userFirstName,
      userLastName,
    });

    const token = jwt.sign(
      { id: user.id, userEmail: user.userEmail },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        userEmail: user.userEmail,
        userFirstName: user.userFirstName,
        userLastName: user.userLastName,
      },
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;

    const user = await LenderUser.findOne({ where: { userEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(userPassword, user.userPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, userEmail: user.userEmail },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        userEmail: user.userEmail,
        userFirstName: user.userFirstName,
        userLastName: user.userLastName,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = await LenderUser.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await user.destroy();

    res.json({ message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    console.error('Error en deleteAccount:', error);
    res.status(500).json({ message: 'Error al eliminar cuenta' });
  }
};

module.exports = {
  register,
  login,
  deleteAccount,
};