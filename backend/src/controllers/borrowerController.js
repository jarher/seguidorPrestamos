const { Borrower, Loan } = require('../models');

const getAllBorrowers = async (req, res) => {
  try {
    const borrowers = await Borrower.findAll({
      where: { lenderId: req.user.id },
      attributes: [
        'id',
        'borrowerFirstName',
        'borrowerLastName',
        'borrowerEmail',
        'borrowerPhone',
        'createdAt',
      ],
    });

    const borrowersWithCount = await Promise.all(
      borrowers.map(async (borrower) => {
        const activeLoansCount = await Loan.count({
          where: {
            borrowerId: borrower.id,
            status: { [require('sequelize').Op.ne]: 'PAID' },
          },
        });
        return {
          ...borrower.toJSON(),
          activeLoansCount,
        };
      })
    );

    res.json(borrowersWithCount);
  } catch (error) {
    console.error('Error en getAllBorrowers:', error);
    res.status(500).json({ message: 'Error al obtener prestatarios' });
  }
};

const createBorrower = async (req, res) => {
  try {
    const { borrowerFirstName, borrowerLastName, borrowerEmail, borrowerPhone } = req.body;

    const borrower = await Borrower.create({
      lenderId: req.user.id,
      borrowerFirstName,
      borrowerLastName,
      borrowerEmail,
      borrowerPhone,
    });

    res.status(201).json({
      id: borrower.id,
      lenderId: borrower.lenderId,
      borrowerFirstName: borrower.borrowerFirstName,
      borrowerLastName: borrower.borrowerLastName,
      borrowerEmail: borrower.borrowerEmail,
      borrowerPhone: borrower.borrowerPhone,
      createdAt: borrower.createdAt,
    });
  } catch (error) {
    console.error('Error en createBorrower:', error);
    res.status(500).json({ message: 'Error al crear prestatario' });
  }
};

const updateBorrower = async (req, res) => {
  try {
    const { id } = req.params;

    const borrower = await Borrower.findOne({
      where: { id, lenderId: req.user.id },
    });

    if (!borrower) {
      return res.status(404).json({ message: 'Prestatario no encontrado' });
    }

    const { borrowerFirstName, borrowerLastName, borrowerEmail, borrowerPhone } = req.body;

    await borrower.update({
      ...(borrowerFirstName && { borrowerFirstName }),
      ...(borrowerLastName !== undefined && { borrowerLastName }),
      ...(borrowerEmail !== undefined && { borrowerEmail }),
      ...(borrowerPhone !== undefined && { borrowerPhone }),
    });

    res.json(borrower);
  } catch (error) {
    console.error('Error en updateBorrower:', error);
    res.status(500).json({ message: 'Error al actualizar prestatario' });
  }
};

const deleteBorrower = async (req, res) => {
  try {
    const { id } = req.params;

    const borrower = await Borrower.findOne({
      where: { id, lenderId: req.user.id },
    });

    if (!borrower) {
      return res.status(404).json({ message: 'Prestatario no encontrado' });
    }

    await borrower.destroy();

    res.json({ message: 'Prestatario eliminado' });
  } catch (error) {
    console.error('Error en deleteBorrower:', error);
    res.status(500).json({ message: 'Error al eliminar prestatario' });
  }
};

const getBorrowerById = async (req, res) => {
  try {
    const { id } = req.params;

    const borrower = await Borrower.findOne({
      where: { id, lenderId: req.user.id },
    });

    if (!borrower) {
      return res.status(404).json({ message: 'Prestatario no encontrado' });
    }

    const loans = await Loan.findAll({
      where: { borrowerId: id },
      attributes: ['id', 'principalLoan', 'monthlyRate', 'loanScheme', 'totalMonths', 'startDate', 'status'],
    });

    res.json({
      ...borrower.toJSON(),
      loans,
    });
  } catch (error) {
    console.error('Error en getBorrowerById:', error);
    res.status(500).json({ message: 'Error al obtener prestatario' });
  }
};

module.exports = {
  getAllBorrowers,
  getBorrowerById,
  createBorrower,
  updateBorrower,
  deleteBorrower,
};