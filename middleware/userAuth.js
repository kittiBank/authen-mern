import jwt from 'jsonwebtoken';

const userAuth = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.json({ success: false, message: 'Not Authorized. Login Again' })
    }

    try {
        //Code
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if (tokenDecode.id) {
            req.body.userId = tokenDecode.id
        } else {
            return res.json({ success: false, message: 'Not Authorized. Login Again' })
        }

        next();

    } catch (err) {
        console.log(req.body)
        return res.json({ success: false, message: err.message })
    }
}

export default userAuth;