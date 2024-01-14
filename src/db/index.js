import { mongoose } from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDb = async () => {
  try {
    const instanceCreate = await mongoose.connect(`${process.env.MONGODB_URI}`);
    console.log`MongoDB Instance is connected to ${instanceCreate.connection.host}`;
  } catch (error) {
    console.error("Error Ocurred in connecting to databases", error);
    process.exit(1);
  }
};
