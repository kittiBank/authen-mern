import userModel from "../models/model.js";

export const getUserData = async (req, res) => {
    try {
        //const { userId } = req.body;
        const userId = req.userId;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        res.json({

            success: true,
            userData: {
                _id: user._id,
                name: user.name,
                isAccountVerified: user.isAccountVerified
            }
        });



    } catch (err) {
        res.json({ success: false, message: err.message })
    }

}