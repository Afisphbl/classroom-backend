import express from "express";
import cors from "cors";
import subjectsRoutes from "./routes/Subjects";

const app = express();
const PORT = 8000;

const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: frontendOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/subjects", subjectsRoutes);

app.get("/", (_req, res) => {
  res.send({ message: "Classroom backend is running." });
});

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
