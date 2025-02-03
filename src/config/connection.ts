import mongoose, { ConnectOptions } from "mongoose";
import config from "./default";
import logger from "./logger";

const { MONGO_HOST, MONGO_PORT, MONGO_USER, MONGO_PASSWORD, MONGO_DATABASE, MONGO_SRV } = config.MONGO;

const MONGOOSE_OPTIONS: ConnectOptions = {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  // useFindAndModify: false,
  // useCreateIndex: true,
};
const NAMESPACE = "MONGODB_CONFIG";

const connect = async () => {
  try {
    const MONGO_URI = ["localhost", "127.0.0.1"].includes(MONGO_HOST)
      ? `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`
      : MONGO_SRV === "YES"
        ? `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DATABASE}?retryWrites=true&w=majority`
        : `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DATABASE}`;

    const conn = await mongoose.connect(MONGO_URI, MONGOOSE_OPTIONS);
    logger.info(
      NAMESPACE,
      `MONGO DB DATABASE [${conn.connection.name}] connected in HOST [${conn.connection.host}] PORT [${conn.connection.port}] by USER [${MONGO_USER}]`
    );
  } catch (error: any) {
    logger.error(NAMESPACE, error.message, error);
    process.exit(1);
  }
};

export default { connect };
