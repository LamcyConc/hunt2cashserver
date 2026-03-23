const UserModel = require("../models/userModel");
const AdminMessageModel = require("../models/adminMessageModel")


const getAlluser = async (req, res) => {
  try {
    const user = req.user.roles;

    if (user !== 'admin') {
      return res.status(403).send({
        message: "Access denied. Admin privileges required."
      });
    }

    let users = await UserModel.find().select("-password -roles");
    
    res.status(200).send({
      message: "Users retrieved successfully",
      data: users
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error fetching users",
      error: error.message
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const userRole = req.user.roles;
    
    if (userRole !== 'admin') {
      return res.status(403).send({
        message: "Access denied. Admin privileges required."
      });
    }

    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).send({
        message: "User not found"
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).send({
      message: `User account has been ${user.isActive ? "activated" : "suspended"}`,
      data: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error updating user status",
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userRole = req.user.roles;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }

    const user = await UserModel.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.roles === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin accounts'
      });
    }

    await UserModel.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const activeUsers = await UserModel.countDocuments({ isActive: true });
    const inactiveUsers = await UserModel.countDocuments({ isActive: false });
    const adminUsers = await UserModel.countDocuments({ roles: 'admin' });
    

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await UserModel.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
        recentUsers,
        userGrowth: {
          lastWeek: recentUsers
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const sendAdminMessage = async (req, res) => {
    const { message, context = "general" } = req.body

    try {
        if (!message || message.trim() === "") {
            return res.status(400).send({
                message: "Message cannot be empty"
            })
        }

        const adminMessage = await AdminMessageModel.findOneAndUpdate(
            { context },
            { message, context, createdBy: req.user.id },
            { upsert: true, new: true }
        )

        res.status(200).send({
            message: "Admin message updated successfully",
            data:    adminMessage
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}

const getAdminMessage = async (req, res) => {
    const { context = "general" } = req.query

    try {
        const adminMessage = await AdminMessageModel.findOne({ context }).sort({ createdAt: -1 })

        if (!adminMessage) {
            return res.status(404).send({
                message: "No admin message found"
            })
        }

        res.status(200).send({
            message: "Admin message fetched successfully",
            data:    adminMessage
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}

module.exports = {
  getAlluser,
  toggleUserStatus,
  deleteUser,
  getDashboardStats,
  getAdminMessage,
  sendAdminMessage
};