import userModel from "../models/model.js";

export const getUserData = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        res.json({
            success: true,
            userDate: {
                name: user.name,
                isAccountVerified: user.isAccountVerified
            }
        });

    } catch (err) {
        res.json({ success: false, message: err.message })
    }

}