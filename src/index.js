import "dotenv/config";
import { connectDb } from "./db/index.js";
import { app } from "./app.js";
const PORT = process.env.PORT || 5000;

try {
  connectDb().then(() => {
    app.on("error", (error) => console.log(error));
    app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
  });
} catch (error) {}
