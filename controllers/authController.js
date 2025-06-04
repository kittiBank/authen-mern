import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/model';

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ success: false, message: "Missing Details" })
    }

    try {
        //Check User and Token
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: true, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.cokie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        return res.json({ success: true });

    } catch (err) {
        res.json({ success: false, message: err.message })
    }

}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: "Email and Password are required" })
    }

    try {
        //Code
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Invalid Email" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.cokie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 3 * 24 * 60 * 60 * 1000
        });
        
        return res.json({ success: true });


    } catch (err) {
        return res.json({ success: false, message: err.message })
    }
}