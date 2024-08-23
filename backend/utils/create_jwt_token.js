const jwt = require("jsonwebtoken");
const customError = require("./customError");

module.exports = async (res, model, statusCode, next) => {
    try {
        const token = await jwt.sign(
            { id: model._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        if (!token) {
            return next(new customError("Error occurred while generating session token...", 500));
        }

        const expiresInMs = parseInt(process.env.JWT_EXPIRES_IN.split('h')[0], 10) * 3600 * 1000;

        const cookiesOption = {
            maxAge: expiresInMs,
            httpOnly: true,
            signed: false, // Ensure this is set to false
            secure: process.env.NODE_ENV === 'production' // Use secure cookies in production
        };

        res.cookie('auth_token', token, cookiesOption);

        // Remove sensitive fields before sending the response
        model.password = undefined;
        model.role = undefined;
        model.active = undefined;
        model.passwordChangedAt = undefined;
        model.updatedAt = undefined;
        model.profileImageId = undefined;
        model.coverImageId = undefined;

       return res.status(statusCode).json({
            status: "success",
            data: {
                user: model
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: "Internal Server Error"
        });
    }
}