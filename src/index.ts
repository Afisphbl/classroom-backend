import express from "express";
import cors from "cors";
import subjectsRoutes from "./routes/Subjects";

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not defined");
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/subjects", subjectsRoutes);

app.get("/", (req, res) => {
  res.send("Hello, welcome to classroom backend");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
