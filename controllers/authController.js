import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/model.js';
import transporter from '../config/nodemailer.js';

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

        //Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        //Sending welcome Email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'ยินดีต้อนรับ คุณลงทะเบียนสำเร็จแล้ว 🎉',
            html: `<html>
                            <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
                            <h2>สวัสดีคุณ ${name},</h2>
                            <p>ตอนนี้คุณสามารถเข้าสู่ระบบและเริ่มใช้งานระบบของเราได้ทันที</p></body></html>`
        }

        await transporter.sendMail(mailOptions);

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
        //Check user for login
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Invalid Email" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" })
        }

        //Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.cookie('token', token, {
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

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
        })

        return res.json({ success: true, message: "Logged Out" })

    } catch (err) {
        return res.json({ success: false, message: err.message })
    }
}

//Send Verifitaion OTP to the User's Email
export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account already verified" })
        }

        //Create OTP number 6 digits
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'การสมัครสมาชิก - กรุณายืนยันรหัส OTP',
            text: `รหัส OTP ของคุณคือ ${otp} โปรดนำรหัสนี้ยืนยันบนระบบสมัครสมาชิก`
        }
        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'ระบบได้ส่งรหัสยืนยัน OTP ไปยัง Email ของคุณแล้ว' })

    } catch (err) {
        return res.json({ success: false, message: err.message })
    }
}

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.json({ success: false, message: 'Missing details' });
    }

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP' });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP Expired' });
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: 'Email verified successfully' })

    } catch (err) {
        return res.json({ success: false, message: err.message });
    }
}