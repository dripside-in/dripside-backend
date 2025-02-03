import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config/index";
import { IRoles } from "../types";

const {
    JWT_ACCESS_TOKEN_SECRET,
    JWT_ACCESS_TOKEN__SECRET,
    JWT_ACCESS_TOKEN_EXPIRE,
    JWT_ACTIVATION_TOKEN_SECRET,
    JWT_ACTIVATION_TOKEN_EXPIRE,
    JWT_REFRESH_TOKEN_SECRET,
    JWT_REFRESH_TOKEN_EXPIRE,
    JWT_RESET_TOKEN_SECRET,
    JWT_RESET_TOKEN_EXPIRE,
    JWT_TOKEN_ISSUER,
} = config.JWT;

type IJwt_Type =
    | "AccessToken"
    | "RefreshToken"
    | "ActivationToken"
    | "ResetToken";

interface IJwt_Meta {
    id: string;
    name: string;
    role: IRoles;
    type: IJwt_Type;
}

/**
 *
 * @param {id, name, role, type} meta
 * @returns {String} token
 */
export const generateToken = (meta: IJwt_Meta) => {
    return new Promise<string>(async (resolve, reject) => {
        try {
            const { id, name, role, type } = meta;
            const token = await jwt.sign(
                { id, role },
                type === "AccessToken"
                    ? JWT_ACCESS_TOKEN_SECRET
                    : type === "RefreshToken"
                        ? JWT_REFRESH_TOKEN_SECRET : type === "ActivationToken" ? JWT_ACTIVATION_TOKEN_SECRET : JWT_RESET_TOKEN_SECRET,
                {
                    audience: name,
                    issuer: JWT_TOKEN_ISSUER,
                    expiresIn:
                        type === "AccessToken"
                            ? JWT_ACCESS_TOKEN_EXPIRE
                            : type === "RefreshToken"
                                ? JWT_REFRESH_TOKEN_EXPIRE : type === "ActivationToken" ? JWT_ACTIVATION_TOKEN_EXPIRE : JWT_RESET_TOKEN_EXPIRE,
                }
            );
            resolve(token);
        } catch (error: any) {
            reject({
                message: error.message,
                code: error.name,
            });
        }
    });
};

export const verifyToken = (token: string, type: IJwt_Type) => {
    return new Promise<JwtPayload>(async (resolve, reject) => {
        try {
            const decoded: string | JwtPayload = await jwt.verify(
                token,
                type === "AccessToken"
                    ? JWT_ACCESS_TOKEN__SECRET
                    : type === "RefreshToken"
                        ? JWT_REFRESH_TOKEN_SECRET : type === "ActivationToken" ? JWT_ACTIVATION_TOKEN_SECRET : JWT_RESET_TOKEN_SECRET,
            );
            if (typeof decoded !== "string")
                resolve(decoded);
        } catch (error: any) {
            reject({
                message: error.message,
                code: error.name,
            });
        }
    });
};