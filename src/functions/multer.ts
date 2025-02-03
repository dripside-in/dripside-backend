import { Request, Express } from "express";
import multer, { FileFilterCallback } from "multer";
import { config } from "../config";
import fs from "fs";

const { SERVER_UPLOADS_PATH } = config.SERVER;

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const storage = multer.diskStorage({
    destination: function (
        req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) {
        cb(null, SERVER_UPLOADS_PATH);
    },
    filename: function (
        req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "|" + file.originalname);
    },
});

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    // !file.originalname.match(/\.(JPG|jpg|jpeg|png|gif)$/)
    if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/png"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: fileFilter,
}).single("image");

export const removeImage = (filename: string) => {
    fs.unlinkSync(SERVER_UPLOADS_PATH + filename);
};

export const checkImageExist = (filename: string) => {
    return fs.existsSync(SERVER_UPLOADS_PATH + filename);
};

export default upload;
