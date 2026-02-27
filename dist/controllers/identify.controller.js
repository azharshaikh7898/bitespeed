"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyController = void 0;
const identify_service_1 = require("../services/identify.service");
const identifyController = async (req, res, next) => {
    try {
        const { email, phoneNumber } = req.body;
        const result = await identify_service_1.identifyService.identify({ email, phoneNumber });
        res.status(200).json({ contact: result });
    }
    catch (error) {
        next(error);
    }
};
exports.identifyController = identifyController;
