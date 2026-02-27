"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const identify_route_1 = __importDefault(require("./routes/identify.route"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/', identify_route_1.default);
// Root health check route
app.get('/', (req, res) => {
    res.send('API is running');
});
// Error handler
app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});
exports.default = app;
